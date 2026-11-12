<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Equipment;
use App\Entity\TransportMission;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;
use App\Enum\MissionStatus;
use App\Exception\InvalidTransition;
use PHPUnit\Framework\TestCase;

final class TransportMissionTest extends TestCase
{
    private \DateTimeImmutable $now;

    protected function setUp(): void
    {
        $this->now = new \DateTimeImmutable('2026-11-12 10:00:00');
    }

    public function testNominalLifecycle(): void
    {
        $mission = $this->mission();
        self::assertSame(MissionStatus::Created, $mission->getStatus());

        $equipment = $this->equipment();
        $mission->start($equipment, $this->now->modify('+1 minute'));
        self::assertSame(MissionStatus::InProgress, $mission->getStatus());
        self::assertSame($equipment, $mission->getEquipment());

        $mission->complete($this->now->modify('+5 minutes'));
        self::assertSame(MissionStatus::Done, $mission->getStatus());
        self::assertEquals($this->now->modify('+5 minutes'), $mission->getCompletedAt());
    }

    public function testAPendingMissionCanBeCancelled(): void
    {
        $mission = $this->mission();

        $mission->cancel($this->now);

        self::assertSame(MissionStatus::Cancelled, $mission->getStatus());
    }

    public function testAMissionInProgressCanBeCancelled(): void
    {
        $mission = $this->mission();
        $mission->start($this->equipment(), $this->now);

        $mission->cancel($this->now);

        self::assertSame(MissionStatus::Cancelled, $mission->getStatus());
    }

    public function testAFinishedMissionCannotBeCancelled(): void
    {
        $mission = $this->mission();
        $mission->start($this->equipment(), $this->now);
        $mission->complete($this->now);

        $this->expectException(InvalidTransition::class);
        $mission->cancel($this->now);
    }

    public function testAMissionCannotStartTwice(): void
    {
        $mission = $this->mission();
        $mission->start($this->equipment(), $this->now);

        $this->expectException(InvalidTransition::class);
        $mission->start($this->equipment(), $this->now);
    }

    public function testAMissionMustBeStartedBeforeItCompletes(): void
    {
        $this->expectException(InvalidTransition::class);
        $this->mission()->complete($this->now);
    }

    private function mission(): TransportMission
    {
        return new TransportMission('M-0001', 'UL-0001', 'REC-01', 'STK-A-01-01', 3, $this->now);
    }

    private function equipment(): Equipment
    {
        return new Equipment('TK-202', 'Transstockeur allée B', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Running, $this->now);
    }
}
