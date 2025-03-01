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
            return new JsonResponse([
                'success' => false,
                'message' => 'Domain not found'
            ], 404);
        }

        // Check if user has access to this domain
        if ($domain->getOwner() !== $this->getUser()) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

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
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Domain not found'
            ], 404);
        }

        if ($domain->getOwner() !== $this->getUser()) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Access denied'
            ], 403);
        }

        // Получаем FTP-пользователя из connection_details
        $connectionDetails = $domain->getConnectionDetails();
        $ftpUser = $connectionDetails['ftp']['user'] ?? null;
        if (!$ftpUser) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'FTP user not defined'
            ], 400);
        }
        // Определяем домашний каталог. Если он задан в connection_details, используем его; иначе — стандартный путь
        $ftpHome = $connectionDetails['ftp']['home'] ?? ('/var/www/users/' . $ftpUser);

        if (!is_dir($ftpHome)) {
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

        return new JsonResponse([
            'status' => 'success',
            'items' => $items
        ]);
    }

    #[Route('/buy', name: 'api_domain_buy', methods: ['POST'])]
    public function buyDomain(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
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
                // Опционально можно задать домашний каталог
                'home' => '/var/www/users/' . ('ftp_' . substr(md5($data['domain_name']), 0, 8))
            ]
        ];
        $domain->setConnectionDetails($connectionDetails);
    
        $this->entityManager->persist($domain);
        $this->entityManager->flush();
    
        // Создаем FTP-пользователя через shell команды
    
        $ftpUser = $connectionDetails['ftp']['user'];
        $ftpHome = $connectionDetails['ftp']['home'];
    
        // 1. Создаем домашний каталог для FTP-пользователя
        shell_exec('mkdir -p ' . escapeshellarg($ftpHome));
    
        // 2. Регистрируем нового FTP-пользователя через pure-pw
        $createUserCmd = sprintf(
            'pure-pw useradd %s -u www-data -d %s',
            escapeshellarg($ftpUser),
            escapeshellarg($ftpHome)
        );
        shell_exec($createUserCmd);
    
        // 3. Обновляем базу данных Pure-FTPd (puredb)
        shell_exec('pure-pw mkdb');
    
        return new JsonResponse([
            'success' => true,
            'message' => 'Domain purchased successfully',
            'connection_details' => $domain->getConnectionDetails()
        ]);
    }

    #[Route('/{id}/ftp/reset-password', name: 'api_domain_reset_ftp', methods: ['POST'])]
    public function resetFtpPassword(int $id): JsonResponse
    {
        $domain = $this->entityManager->getRepository(Domain::class)->find($id);
        
        if (!$domain) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Domain not found'
            ], 404);
        }

        if ($domain->getOwner() !== $this->getUser()) {
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

        // Обновляем пароль FTP-пользователя через pure-pw
        $ftpUser = $connectionDetails['ftp']['user'];
        $updateCmd = sprintf(
            'pure-pw usermod %s -p %s',
            escapeshellarg($ftpUser),
            escapeshellarg($newPassword)
        );
        shell_exec($updateCmd);
        shell_exec('pure-pw mkdb');
    
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
            return new JsonResponse([
                'success' => false,
                'message' => 'Domain not found'
            ], 404);
        }

        if ($domain->getOwner() !== $this->getUser()) {
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
            // Удаляем FTP-пользователя
            $deleteCmd = sprintf(
                'pure-pw userdel %s',
                escapeshellarg($ftpUser)
            );
            shell_exec($deleteCmd);
            shell_exec('pure-pw mkdb');
        }
        // Удаляем домашний каталог (осторожно: rm -rf)
        if (is_dir($ftpHome)) {
            shell_exec('rm -rf ' . escapeshellarg($ftpHome));
        }
    
        // Удаляем домен из базы данных
        $this->entityManager->remove($domain);
        $this->entityManager->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Domain deleted successfully'
        ]);
    }
}
