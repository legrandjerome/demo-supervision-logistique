<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class AuthenticationTest extends ApiTestCase
{
    public function testHealthEndpointIsPublic(): void
    {
        $this->request('GET', '/api/health');

        self::assertResponseIsSuccessful();
        self::assertSame(['status' => 'ok'], $this->json());
    }

    public function testLoginReturnsAToken(): void
    {
        $this->login(self::OPERATOR);

        self::assertResponseIsSuccessful();
        self::assertArrayHasKey('token', $this->json());
    }

    public function testLoginRejectsAWrongPassword(): void
    {
        $this->login(self::OPERATOR, 'mauvais');

        self::assertResponseStatusCodeSame(401);
    }

    public function testProfileRequiresAToken(): void
    {
        $this->request('GET', '/api/me');

        self::assertResponseStatusCodeSame(401);
    }

    public function testProfileExposesEffectiveRolesAndNoPassword(): void
    {
        $this->loginAs(self::ADMIN);
        $this->request('GET', '/api/me');

        self::assertResponseIsSuccessful();
        $profile = $this->json();
        self::assertSame(self::ADMIN, $profile['email']);
        self::assertSame('Alex Admin', $profile['displayName']);
        self::assertEqualsCanonicalizing(
            ['ROLE_ADMIN', 'ROLE_SUPERVISOR', 'ROLE_OPERATOR', 'ROLE_USER'],
            $profile['roles'],
        );
        self::assertArrayNotHasKey('password', $profile);
    }

    public function testUserListIsForbiddenToAnOperator(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/users');

        self::assertResponseStatusCodeSame(403);
    }

    public function testUserListIsAvailableToAnAdmin(): void
    {
        $this->loginAs(self::ADMIN);
        $this->request('GET', '/api/users');

        self::assertResponseIsSuccessful();
        self::assertSame(
            [self::ADMIN, self::OPERATOR, self::SUPERVISOR],
            array_column($this->json(), 'email'),
        );
    }
}
