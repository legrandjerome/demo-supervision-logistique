<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\UserView;
use App\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Role\RoleHierarchyInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[AsController]
final readonly class MeController
{
    public function __construct(private RoleHierarchyInterface $roleHierarchy)
    {
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function __invoke(#[CurrentUser] User $user): JsonResponse
    {
        return new JsonResponse(UserView::fromEntity($user, $this->roleHierarchy));
    }
}
