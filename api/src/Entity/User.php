<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'app_user')]
#[ORM\UniqueConstraint(name: 'uniq_app_user_email', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const string ROLE_OPERATOR = 'ROLE_OPERATOR';
    public const string ROLE_SUPERVISOR = 'ROLE_SUPERVISOR';
    public const string ROLE_ADMIN = 'ROLE_ADMIN';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private string $email;

    #[ORM\Column(length: 100)]
    private string $displayName;

    /** @var list<string> */
    #[ORM\Column]
    private array $roles;

    #[ORM\Column]
    private string $password = '';

    /**
     * @param list<string> $roles
     */
    public function __construct(string $email, string $displayName, array $roles = [self::ROLE_OPERATOR])
    {
        $this->email = mb_strtolower(trim($email));
        $this->displayName = $displayName;
        $this->roles = array_values(array_unique($roles));
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getDisplayName(): string
    {
        return $this->displayName;
    }

    /**
     * @return non-empty-string
     */
    public function getUserIdentifier(): string
    {
        \assert('' !== $this->email);

        return $this->email;
    }

    /**
     * Rôles attribués, sans la hiérarchie (résolue par le composant Security).
     *
     * @return list<string>
     */
    public function getRoles(): array
    {
        return array_values(array_unique([...$this->roles, 'ROLE_USER']));
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $hashedPassword): void
    {
        $this->password = $hashedPassword;
    }
}
