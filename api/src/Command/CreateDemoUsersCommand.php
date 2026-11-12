<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:demo:create-users',
    description: 'Crée les trois comptes de démonstration (opérateur, superviseur, administrateur).',
)]
final readonly class CreateDemoUsersCommand
{
    public const string PASSWORD = 'demo';

    private const array ACCOUNTS = [
        ['operateur@demo.test', 'Olivia Opératrice', User::ROLE_OPERATOR],
        ['superviseur@demo.test', 'Sam Superviseur', User::ROLE_SUPERVISOR],
        ['admin@demo.test', 'Alex Admin', User::ROLE_ADMIN],
    ];

    public function __construct(
        private UserRepository $users,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function __invoke(SymfonyStyle $io): int
    {
        $created = 0;

        foreach (self::ACCOUNTS as [$email, $displayName, $role]) {
            if (null !== $this->users->findOneBy(['email' => $email])) {
                continue;
            }

            $user = new User($email, $displayName, [$role]);
            $user->setPassword($this->passwordHasher->hashPassword($user, self::PASSWORD));
            $this->entityManager->persist($user);
            ++$created;
        }

        $this->entityManager->flush();
        $io->success(\sprintf('%d compte(s) créé(s). Mot de passe : « %s ».', $created, self::PASSWORD));

        return Command::SUCCESS;
    }
}
