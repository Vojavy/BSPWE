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

        // Check if user has access to this domain
        if ($domain->getOwner() !== $this->getUser()) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Access denied'
            ], 403);
        }

        $path = $request->query->get('path', '/');
        
        // Here you would implement the actual file listing logic
        // This is a placeholder response
        return new JsonResponse([
            'status' => 'success',
            'items' => [
                [
                    'name' => 'index.php',
                    'type' => 'file',
                    'size' => 1024,
                    'modified' => '2024-02-24 12:00:00'
                ]
            ]
        ]);
    }

    #[Route('/buy', name: 'api_domain_buy', methods: ['POST'])]
    public function buyDomain(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        // Here you would implement domain purchase logic
        // This is a simplified version
        $domain = new Domain();
        $domain->setDomainName($data['domain_name']);
        $domain->setOwner($this->getUser());
        
        // Generate FTP password
        $ftpPassword = ByteString::fromRandom(16)->toString();
        $domain->setFtpPassword($ftpPassword);
        
        // Set some default connection details
        $domain->setConnectionDetails([
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
                'password' => $ftpPassword
            ]
        ]);

        $this->entityManager->persist($domain);
        $this->entityManager->flush();

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
        
        // Update the FTP password in the connection details
        $connectionDetails = $domain->getConnectionDetails();
        $connectionDetails['ftp']['password'] = $newPassword;
        $domain->setConnectionDetails($connectionDetails);
        
        $this->entityManager->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'FTP password reset successfully',
            'new_password' => $newPassword
        ]);
    }
} 