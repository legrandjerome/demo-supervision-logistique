<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Entity\User;
use App\Enum\AlarmSeverity;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;
use App\Exception\InvalidTransition;
use PHPUnit\Framework\TestCase;

final class EquipmentAndAlarmTest extends TestCase
{
    private \DateTimeImmutable $now;

    protected function setUp(): void
    {
        $this->now = new \DateTimeImmutable('2026-11-12 10:00:00');
    }

    public function testStatusChangeIsTimestamped(): void
    {
        $equipment = $this->equipment();
        $later = $this->now->modify('+10 minutes');

        $equipment->changeStatus(EquipmentStatus::Fault, $later);

        self::assertSame(EquipmentStatus::Fault, $equipment->getStatus());
        self::assertSame($later, $equipment->getStatusChangedAt());
    }

    public function testSameStatusKeepsTheOriginalTimestamp(): void
    {
        $equipment = $this->equipment();

        $equipment->changeStatus(EquipmentStatus::Running, $this->now->modify('+10 minutes'));

        self::assertSame($this->now, $equipment->getStatusChangedAt());
    }

    public function testAlarmKeepsItsFirstAcknowledgement(): void
    {
        $alarm = new Alarm($this->equipment(), AlarmSeverity::Critical, 'Défaut variateur', $this->now);
        $operator = new User('operateur@demo.test', 'Olivia Opératrice');
        self::assertTrue($alarm->isActive());

        $alarm->acknowledge($operator, $this->now->modify('+2 minutes'));

        self::assertFalse($alarm->isActive());
        self::assertSame($operator, $alarm->getAcknowledgedBy());

        $this->expectException(InvalidTransition::class);
        $alarm->acknowledge(new User('superviseur@demo.test', 'Sam Superviseur'), $this->now->modify('+3 minutes'));
    }

    private function equipment(): Equipment
    {
        return new Equipment('CV-101', 'Convoyeur réception 1', EquipmentType::Conveyor, 'Réception', EquipmentStatus::Running, $this->now);
    }
}
