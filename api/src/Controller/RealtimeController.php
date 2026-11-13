<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Realtime\LiveUpdates;
use App\Realtime\SubscriberTokenFactory;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[AsController]
final readonly class RealtimeController
{
    public function __construct(private SubscriberTokenFactory $tokens)
    {
    }

    /** Délivre à l'utilisateur connecté un jeton de lecture du flux temps réel. */
    #[Route('/api/realtime/token', name: 'api_realtime_token', methods: ['GET'])]
    public function token(#[CurrentUser] User $user): JsonResponse
    {
        $token = $this->tokens->createFor($user);

        return new JsonResponse([
            'token' => $token['token'],
            'topics' => LiveUpdates::TOPICS,
            'expiresAt' => $token['expiresAt']->format(\DATE_ATOM),
        ]);
    }
}
