<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class PublicController extends AbstractController
{
    #[Route('/about', name: 'api_about', methods: ['GET'])]
    public function getAbout(): JsonResponse
    {
        return new JsonResponse([
            'company' => [
                'name' => 'Your Company Name',
                'mission' => 'To provide exceptional web hosting and domain services',
                'history' => 'Founded in 2024, we have been serving customers worldwide...',
                'values' => [
                    'Customer First',
                    'Innovation',
                    'Security',
                    'Reliability'
                ],
                'contact' => [
                    'email' => 'contact@yourcompany.com',
                    'phone' => '+1-234-567-8900',
                    'address' => '123 Tech Street, Silicon Valley, CA 94025'
                ]
            ]
        ]);
    }

    #[Route('/pricelist', name: 'api_pricelist', methods: ['GET'])]
    public function getPricelist(): JsonResponse
    {
        return new JsonResponse([
            'services' => [
                [
                    'service' => 'Basic Hosting',
                    'price' => '$9.99/month',
                    'features' => [
                        '1 GB Storage',
                        '10 GB Bandwidth',
                        '1 Database',
                        'SSL Certificate'
                    ]
                ],
                [
                    'service' => 'Professional Hosting',
                    'price' => '$24.99/month',
                    'features' => [
                        '5 GB Storage',
                        'Unlimited Bandwidth',
                        '5 Databases',
                        'SSL Certificate',
                        'Daily Backups'
                    ]
                ],
                [
                    'service' => 'Enterprise Hosting',
                    'price' => '$49.99/month',
                    'features' => [
                        '20 GB Storage',
                        'Unlimited Bandwidth',
                        'Unlimited Databases',
                        'SSL Certificate',
                        'Hourly Backups',
                        'Dedicated Support'
                    ]
                ]
            ]
        ]);
    }
} 