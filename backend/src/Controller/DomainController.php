<?php

namespace App\Controller;

use App\Entity\Domain;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Security;
use Symfony\Component\String\ByteString;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

#[Route('/api/domains')]
class DomainController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security
    ) {
    }

    #[Route('/{id}/details', name: 'api_domain_details', methods: ['GET'])]
    public function getDomainDetails(int $id): JsonResponse
    {
        $domain = $this->entityManager->getRepository(Domain::class)->find($id);
        
        if (!$domain) {
            error_log("getDomainDetails: Domain with id $id not found");
            return new JsonResponse([
                'success' => false,
                'message' => 'Domain not found'
            ], 404);
        }

        // Check if user has access to this domain
        if ($domain->getOwner() !== $this->getUser()) {
            error_log("getDomainDetails: Access denied for domain id $id");
            return new JsonResponse([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        error_log("getDomainDetails: Returning connection details for domain id $id");
        return new JsonResponse([
            'success' => true,
            'connection_details' => $domain->getConnectionDetails()
        ]);
    }

    #[Route('/{id}/files', name: 'api_domain_files', methods: ['GET'])]
    public function getDomainFiles(int $id, Request $request): JsonResponse
    {
        $domain = $this->entityManager->getRepository(Domain::class)->find($id);
        
        if (!$domain) {
            error_log("getDomainFiles: Domain with id $id not found");
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Domain not found'
            ], 404);
        }

        if ($domain->getOwner() !== $this->getUser()) {
            error_log("getDomainFiles: Access denied for domain id $id");
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Access denied'
            ], 403);
        }

        $connectionDetails = $domain->getConnectionDetails();
        $ftpUser = $connectionDetails['ftp']['user'] ?? null;
        if (!$ftpUser) {
            error_log("getDomainFiles: FTP user not defined for domain id $id");
            return new JsonResponse([
                'status' => 'error',
                'message' => 'FTP user not defined'
            ], 400);
        }
        $ftpHome = $connectionDetails['ftp']['home'] ?? ('/var/www/users/' . $ftpUser);

        if (!is_dir($ftpHome)) {
            error_log("getDomainFiles: FTP home directory not found at $ftpHome");
            return new JsonResponse([
                'status' => 'error',
                'message' => 'FTP home directory not found'
            ], 404);
        }

        $files = scandir($ftpHome);
        $items = [];
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $filePath = $ftpHome . '/' . $file;
            $items[] = [
                'name' => $file,
                'type' => is_dir($filePath) ? 'directory' : 'file',
                'size' => is_file($filePath) ? filesize($filePath) : 0,
                'modified' => date("Y-m-d H:i:s", filemtime($filePath))
            ];
        }

        error_log("getDomainFiles: Found " . count($items) . " items in $ftpHome");
        return new JsonResponse([
            'status' => 'success',
            'items' => $items
        ]);
    }

    #[Route('/buy', name: 'api_domain_buy', methods: ['POST'])]
    public function buyDomain(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        error_log("buyDomain: Received data: " . print_r($data, true));
    
        $conn = $this->entityManager->getConnection();
        $conn->beginTransaction();
        try {
            // Создаем новый объект Domain
            $domain = new Domain();
            $domain->setDomainName($data['domain_name']);
            $domain->setOwner($this->getUser());
            
            // Генерируем FTP-пароль
            $ftpPassword = ByteString::fromRandom(16)->toString();
            $domain->setFtpPassword($ftpPassword);
            
            // Заполняем connection_details (DB, FTP и т.д.)
            $connectionDetails = [
                'domain' => $data['domain_name'],
                'db' => [
                    'host' => 'localhost',
                    'name' => 'db_' . substr(md5($data['domain_name']), 0, 8),
                    'user' => 'user_' . substr(md5($data['domain_name']), 0, 8),
                    'password' => ByteString::fromRandom(16)->toString()
                ],
                'ftp' => [
                    'host' => 'ftp.' . $data['domain_name'],
                    'user' => 'ftp_' . substr(md5($data['domain_name']), 0, 8),
                    'password' => $ftpPassword,
                    'home' => '/var/www/users/' . ('ftp_' . substr(md5($data['domain_name']), 0, 8))
                ]
            ];
            $domain->setConnectionDetails($connectionDetails);
    
            // Сохраняем домен в базе
            $this->entityManager->persist($domain);
            $this->entityManager->flush();
            error_log("buyDomain: Domain persisted with id " . $domain->getId());
    
            $ftpUser = $connectionDetails['ftp']['user'];
            $ftpHome = $connectionDetails['ftp']['home'];
    
            $processes = [];
    
            // 1. Создаем домашний каталог для FTP-пользователя
            $cmd1 = sprintf('mkdir -p %s', escapeshellarg($ftpHome));
            $process1 = Process::fromShellCommandline($cmd1);
            $process1->start();
            $processes[] = $process1;
            error_log("buyDomain: Executing: " . $cmd1);
    
            // 2. Создаем нового FTP-пользователя с установкой пароля через bash (пароль вводится дважды)
            $cmd2 = 'bash -c \'echo -e "' . $ftpPassword . "\n" . $ftpPassword . '" | pure-pw useradd ' . escapeshellarg($ftpUser) . ' -u ftp -d ' . escapeshellarg($ftpHome) . ' -m\'';
            $process2 = Process::fromShellCommandline($cmd2);
            $process2->start();
            $processes[] = $process2;
            error_log("buyDomain: Executing: " . $cmd2);
    
            // 3. Обновляем базу данных Pure-FTPd (puredb)
            $cmd3 = 'pure-pw mkdb';
            $process3 = Process::fromShellCommandline($cmd3);
            $process3->start();
            $processes[] = $process3;
            error_log("buyDomain: Executing: " . $cmd3);
    
            // Дожидаемся завершения всех процессов и логируем их вывод
            foreach ($processes as $process) {
                $process->wait();
                if (!$process->isSuccessful()) {
                    $error = $process->getErrorOutput();
                    error_log("buyDomain: Process error: " . $error);
                    throw new ProcessFailedException($process);
                } else {
                    error_log("buyDomain: Process output: " . $process->getOutput());
                }
            }
    
            error_log("buyDomain: All FTP commands executed successfully");
    
            $conn->commit();
    
            return new JsonResponse([
                'success' => true,
                'message' => 'Domain purchased successfully',
                'connection_details' => $domain->getConnectionDetails()
            ]);
        } catch (\Exception $e) {
            $conn->rollBack();
            error_log("buyDomain: Exception occurred: " . $e->getMessage());
            return new JsonResponse([
                'success' => false,
                'message' => 'Failed to purchase domain: ' . $e->getMessage()
            ], 500);
        }
    }
    
    

    #[Route('/{id}/ftp/reset-password', name: 'api_domain_reset_ftp', methods: ['POST'])]
    public function resetFtpPassword(int $id): JsonResponse
    {
        $domain = $this->entityManager->getRepository(Domain::class)->find($id);
        
        if (!$domain) {
            error_log("resetFtpPassword: Domain id $id not found");
            return new JsonResponse([
                'success' => false,
                'message' => 'Domain not found'
            ], 404);
        }

        if ($domain->getOwner() !== $this->getUser()) {
            error_log("resetFtpPassword: Access denied for domain id $id");
            return new JsonResponse([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        $newPassword = ByteString::fromRandom(16)->toString();
        
        // Обновляем FTP-пароль в connection_details
        $connectionDetails = $domain->getConnectionDetails();
        $connectionDetails['ftp']['password'] = $newPassword;
        $domain->setConnectionDetails($connectionDetails);
        
        $this->entityManager->flush();
        error_log("resetFtpPassword: New FTP password generated");

        // Обновляем пароль FTP-пользователя через pure-pw
        $ftpUser = $connectionDetails['ftp']['user'];
        $updateCmd = sprintf(
            'pure-pw usermod %s -p %s',
            escapeshellarg($ftpUser),
            escapeshellarg($newPassword)
        );
        $updateOutput = shell_exec($updateCmd . ' 2>&1');
        error_log("resetFtpPassword: Executing: " . $updateCmd . " Output: " . $updateOutput);
        $mkdbOutput = shell_exec('pure-pw mkdb 2>&1');
        error_log("resetFtpPassword: pure-pw mkdb output: " . $mkdbOutput);
    
        return new JsonResponse([
            'success' => true,
            'message' => 'FTP password reset successfully',
            'new_password' => $newPassword
        ]);
    }

    #[Route('/{id}', name: 'api_domain_delete', methods: ['DELETE'])]
    public function deleteDomain(int $id): JsonResponse
    {
        $domain = $this->entityManager->getRepository(Domain::class)->find($id);
        
        if (!$domain) {
            error_log("deleteDomain: Domain id $id not found");
            return new JsonResponse([
                'success' => false,
                'message' => 'Domain not found'
            ], 404);
        }

        if ($domain->getOwner() !== $this->getUser()) {
            error_log("deleteDomain: Access denied for domain id $id");
            return new JsonResponse([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        // Перед удалением домена удаляем FTP-пользователя и его домашний каталог
        $connectionDetails = $domain->getConnectionDetails();
        $ftpUser = $connectionDetails['ftp']['user'] ?? null;
        $ftpHome = $connectionDetails['ftp']['home'] ?? ('/var/www/users/' . $ftpUser);
        if ($ftpUser) {
            $deleteCmd = sprintf(
                'pure-pw userdel %s',
                escapeshellarg($ftpUser)
            );
            $deleteOutput = shell_exec($deleteCmd . ' 2>&1');
            error_log("deleteDomain: Executing: " . $deleteCmd . " Output: " . $deleteOutput);
            $mkdbOutput = shell_exec('pure-pw mkdb 2>&1');
            error_log("deleteDomain: pure-pw mkdb output: " . $mkdbOutput);
        }
        if (is_dir($ftpHome)) {
            $rmOutput = shell_exec('rm -rf ' . escapeshellarg($ftpHome) . ' 2>&1');
            error_log("deleteDomain: Removing FTP home ($ftpHome): " . $rmOutput);
        }
    
        $this->entityManager->remove($domain);
        $this->entityManager->flush();
        error_log("deleteDomain: Domain id $id deleted successfully");

        return new JsonResponse([
            'success' => true,
            'message' => 'Domain deleted successfully'
        ]);
    }
}
