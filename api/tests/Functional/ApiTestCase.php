<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Socle des tests fonctionnels : base vide à chaque test, trois comptes, requêtes JSON authentifiées.
 */
abstract class ApiTestCase extends WebTestCase
{
    protected const string PASSWORD = 'demo';
    protected const string OPERATOR = 'operateur@demo.test';
    protected const string SUPERVISOR = 'superviseur@demo.test';
    protected const string ADMIN = 'admin@demo.test';

    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = self::createClient();

        $entityManager = $this->entityManager();
        $schemaTool = new SchemaTool($entityManager);
        $metadata = $entityManager->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        $hasher = self::getContainer()->get(UserPasswordHasherInterface::class);
        $accounts = [
            [self::OPERATOR, 'Olivia Opératrice', User::ROLE_OPERATOR],
            [self::SUPERVISOR, 'Sam Superviseur', User::ROLE_SUPERVISOR],
            [self::ADMIN, 'Alex Admin', User::ROLE_ADMIN],
        ];
        foreach ($accounts as [$email, $displayName, $role]) {
            $user = new User($email, $displayName, [$role]);
            $user->setPassword($hasher->hashPassword($user, self::PASSWORD));
            $entityManager->persist($user);
        }
        $entityManager->flush();
    }

    /** À n'utiliser qu'avant la première requête : le noyau redémarre ensuite entre deux requêtes. */
    protected function entityManager(): EntityManagerInterface
    {
        return self::getContainer()->get(EntityManagerInterface::class);
    }

    protected function login(string $email, string $password = self::PASSWORD): void
    {
        $this->client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => $password], \JSON_THROW_ON_ERROR),
        );
    }

    /** Authentifie toutes les requêtes suivantes du client. */
    protected function loginAs(string $email): void
    {
        $this->login($email);
        self::assertResponseIsSuccessful();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->json()['token']);
    }

    /**
     * @param array<string, mixed>|null $payload
     */
    protected function request(string $method, string $uri, ?array $payload = null): void
    {
        $this->client->request(
            $method,
            $uri,
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: null === $payload ? null : json_encode($payload, \JSON_THROW_ON_ERROR),
        );
    }

    /**
     * @return array<array-key, mixed>
     */
    protected function json(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
    }
}
