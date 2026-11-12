<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AuthenticationTest extends WebTestCase
{
    private const string PASSWORD = 'demo';

    private KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = self::createClient();
        $container = self::getContainer();

        $entityManager = $container->get(EntityManagerInterface::class);
        $schemaTool = new SchemaTool($entityManager);
        $metadata = $entityManager->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        $hasher = $container->get(UserPasswordHasherInterface::class);
        $accounts = [
            ['operateur@demo.test', 'Olivia Opératrice', User::ROLE_OPERATOR],
            ['admin@demo.test', 'Alex Admin', User::ROLE_ADMIN],
        ];
        foreach ($accounts as [$email, $displayName, $role]) {
            $user = new User($email, $displayName, [$role]);
            $user->setPassword($hasher->hashPassword($user, self::PASSWORD));
            $entityManager->persist($user);
        }
        $entityManager->flush();
    }

    public function testHealthEndpointIsPublic(): void
    {
        $this->client->request('GET', '/api/health');

        self::assertResponseIsSuccessful();
        self::assertSame(['status' => 'ok'], $this->json());
    }

    public function testLoginReturnsAToken(): void
    {
        $this->login('operateur@demo.test');

        self::assertResponseIsSuccessful();
        self::assertArrayHasKey('token', $this->json());
    }

    public function testLoginRejectsAWrongPassword(): void
    {
        $this->login('operateur@demo.test', 'mauvais');

        self::assertResponseStatusCodeSame(401);
    }

    public function testProfileRequiresAToken(): void
    {
        $this->client->request('GET', '/api/me');

        self::assertResponseStatusCodeSame(401);
    }

    public function testProfileExposesEffectiveRolesAndNoPassword(): void
    {
        $this->get('/api/me', $this->tokenFor('admin@demo.test'));

        self::assertResponseIsSuccessful();
        $profile = $this->json();
        self::assertSame('admin@demo.test', $profile['email']);
        self::assertSame('Alex Admin', $profile['displayName']);
        self::assertEqualsCanonicalizing(
            ['ROLE_ADMIN', 'ROLE_SUPERVISOR', 'ROLE_OPERATOR', 'ROLE_USER'],
            $profile['roles'],
        );
        self::assertArrayNotHasKey('password', $profile);
    }

    public function testUserListIsForbiddenToAnOperator(): void
    {
        $this->get('/api/users', $this->tokenFor('operateur@demo.test'));

        self::assertResponseStatusCodeSame(403);
    }

    public function testUserListIsAvailableToAnAdmin(): void
    {
        $this->get('/api/users', $this->tokenFor('admin@demo.test'));

        self::assertResponseIsSuccessful();
        self::assertSame(
            ['admin@demo.test', 'operateur@demo.test'],
            array_column($this->json(), 'email'),
        );
    }

    private function login(string $email, string $password = self::PASSWORD): void
    {
        $this->client->request(
            'POST',
            '/api/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => $password], \JSON_THROW_ON_ERROR),
        );
    }

    private function tokenFor(string $email): string
    {
        $this->login($email);
        self::assertResponseIsSuccessful();

        return $this->json()['token'];
    }

    private function get(string $uri, string $token): void
    {
        $this->client->request('GET', $uri, server: ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);
    }

    /**
     * @return array<array-key, mixed>
     */
    private function json(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
    }
}
