<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\UserView;
use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Role\RoleHierarchyInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
final readonly class UserController
{
    public function __construct(
        private UserRepository $users,
        private RoleHierarchyInterface $roleHierarchy,
    ) {
    }

    #[Route('/api/users', name: 'api_users_list', methods: ['GET'])]
    #[IsGranted(User::ROLE_ADMIN)]
    public function list(): JsonResponse
    {
        return new JsonResponse(array_map(
            fn (User $user): UserView => UserView::fromEntity($user, $this->roleHierarchy),
            $this->users->findAllOrderedByName(),
        ));
    }
}
