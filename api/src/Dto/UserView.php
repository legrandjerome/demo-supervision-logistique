<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\User;
use Symfony\Component\Security\Core\Role\RoleHierarchyInterface;

/**
 * Représentation d'un utilisateur exposée par l'API : jamais l'entité, jamais le mot de passe.
 */
final readonly class UserView
{
    /**
     * @param list<string> $roles rôles effectifs, hiérarchie résolue
     */
    public function __construct(
        public int $id,
        public string $email,
        public string $displayName,
        public array $roles,
    ) {
    }

    public static function fromEntity(User $user, RoleHierarchyInterface $roleHierarchy): self
    {
        return new self(
            id: (int) $user->getId(),
            email: $user->getEmail(),
            displayName: $user->getDisplayName(),
            roles: array_values($roleHierarchy->getReachableRoleNames($user->getRoles())),
        );
    }
}
