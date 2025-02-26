<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Domain;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Security;

#[Route('/api/user')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private Security $security
    ) {
    }

    #[Route('/profile', name: 'api_user_profile', methods: ['GET'])]
    public function getProfile(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        
        if (!$user) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        // Get user's domains
        $domains = $this->entityManager->getRepository(Domain::class)->findBy(['owner' => $user]);
        $domainData = array_map(function(Domain $domain) {
            return [
                'id' => $domain->getId(),
                'name' => $domain->getDomainName(),
                'createdAt' => $domain->getCreatedAt()->format('Y-m-d H:i:s')
            ];
        }, $domains);

        return new JsonResponse([
            'status' => 'success',
            'data' => [
                'id' => $user->getId(),
                'username' => $user->getUsername(),
                'email' => $user->getEmail(),
                'domains' => $domainData
            ]
        ]);
    }
} 