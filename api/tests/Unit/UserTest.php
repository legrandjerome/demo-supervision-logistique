<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    public function testEmailIsNormalised(): void
    {
        $user = new User('  Admin@Demo.TEST ', 'Alex Admin');

        self::assertSame('admin@demo.test', $user->getEmail());
        self::assertSame('admin@demo.test', $user->getUserIdentifier());
    }

    public function testEveryUserHasTheBaseRoleOnce(): void
    {
        $user = new User('a@demo.test', 'A', [User::ROLE_ADMIN, User::ROLE_ADMIN, 'ROLE_USER']);

        self::assertSame([User::ROLE_ADMIN, 'ROLE_USER'], $user->getRoles());
    }

    public function testDefaultRoleIsOperator(): void
    {
        $user = new User('a@demo.test', 'A');

        self::assertSame([User::ROLE_OPERATOR, 'ROLE_USER'], $user->getRoles());
    }
}
