<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Equipment;
use App\Entity\TransportMission;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;
use App\Enum\MissionStatus;
use App\Service\MissionReferenceGenerator;
use App\Simulation\WarehouseSimulator;
use PHPUnit\Framework\TestCase;
use Random\Engine\Mt19937;
use Random\Randomizer;

final class WarehouseSimulatorTest extends TestCase
{
    private \DateTimeImmutable $now;

    protected function setUp(): void
    {
        $this->now = new \DateTimeImmutable('2026-11-12 10:00:00');
    }

    public function testAFreeRunningCarrierTakesTheNextPendingMission(): void
    {
        $crane = $this->equipment('TK-202', EquipmentType::StackerCrane, EquipmentStatus::Running);
        $conveyor = $this->equipment('CV-101', EquipmentType::Conveyor, EquipmentStatus::Running);
        $first = $this->mission('M-1');
        $second = $this->mission('M-2');

        $this->simulator()->tick([$conveyor, $crane], [$first, $second], [], 0, $this->now);

        self::assertSame(MissionStatus::InProgress, $first->getStatus());
        self::assertSame($crane, $first->getEquipment());
        self::assertSame(MissionStatus::Created, $second->getStatus(), 'Un transporteur ne prend qu\'une mission à la fois.');
    }

    public function testAStoppedCarrierTakesNothing(): void
    {
        $crane = $this->equipment('TK-202', EquipmentType::StackerCrane, EquipmentStatus::Maintenance);
        $mission = $this->mission('M-1');

        $this->simulator()->tick([$crane], [$mission], [], 0, $this->now);

        self::assertSame(MissionStatus::Created, $mission->getStatus());
    }

    public function testAMissionDoesNotProgressOnAFaultyCarrier(): void
    {
        $crane = $this->equipment('TK-202', EquipmentType::StackerCrane, EquipmentStatus::Running);
        $mission = $this->mission('M-1');
        $mission->start($crane, $this->now);
        // Panne « récente » : le simulateur ne peut pas encore la lever.
        $crane->changeStatus(EquipmentStatus::Fault, $this->now->modify('+10 minutes'));

        $simulator = $this->simulator();
        for ($second = 0; $second < 200; ++$second) {
            $simulator->tick([$crane], [], [$mission], 0, $this->now->modify('+10 minutes'));
        }

        self::assertSame(MissionStatus::InProgress, $mission->getStatus());
    }

    /**
     * Fait tourner l'entrepôt longtemps et vérifie les invariants à chaque pas.
     */
    public function testALongRunKeepsTheWarehouseConsistent(): void
    {
        $equipments = [
            $this->equipment('CV-101', EquipmentType::Conveyor, EquipmentStatus::Running),
            $this->equipment('TK-201', EquipmentType::StackerCrane, EquipmentStatus::Fault),
            $this->equipment('TK-202', EquipmentType::StackerCrane, EquipmentStatus::Running),
            $this->equipment('NV-301', EquipmentType::Shuttle, EquipmentStatus::Running),
        ];
        /** @var list<TransportMission> $missions */
        $missions = [];
        $alarmCount = 0;
        $closed = 0;
        $simulator = $this->simulator();

        for ($tick = 0; $tick < 1500; ++$tick) {
            $now = $this->now->modify(\sprintf('+%d seconds', 2 * $tick));
            $pending = array_values(array_filter($missions, static fn (TransportMission $m) => MissionStatus::Created === $m->getStatus()));
            $inProgress = array_values(array_filter($missions, static fn (TransportMission $m) => MissionStatus::InProgress === $m->getStatus()));

            $step = $simulator->tick($equipments, $pending, $inProgress, $alarmCount, $now);

            $missions = [...$missions, ...$step->newMissions];
            $alarmCount += \count($step->newAlarms);

            $loadByCarrier = [];
            foreach ($missions as $mission) {
                if (MissionStatus::InProgress === $mission->getStatus()) {
                    $code = $mission->getEquipment()?->getCode();
                    self::assertNotNull($code);
                    $loadByCarrier[$code] = ($loadByCarrier[$code] ?? 0) + 1;
                }
            }
            self::assertLessThanOrEqual(1, max([0, ...array_values($loadByCarrier)]), 'Un transporteur porte au plus une mission.');
            self::assertArrayNotHasKey('CV-101', $loadByCarrier, 'Un convoyeur ne transporte pas de mission.');

            $faults = \count(array_filter($equipments, static fn (Equipment $e) => EquipmentStatus::Fault === $e->getStatus()));
            self::assertLessThanOrEqual(2, $faults);
            self::assertLessThanOrEqual(8, $alarmCount);
            self::assertLessThanOrEqual(7, \count(array_filter($missions, static fn (TransportMission $m) => MissionStatus::Created === $m->getStatus())));
        }

        foreach ($missions as $mission) {
            $closed += $mission->getStatus()->isFinal() ? 1 : 0;
        }
        self::assertGreaterThan(100, $closed, 'La simulation doit faire aboutir des missions.');
    }

    private function simulator(): WarehouseSimulator
    {
        return new WarehouseSimulator(new MissionReferenceGenerator(), new Randomizer(new Mt19937(2026)));
    }

    private function equipment(string $code, EquipmentType $type, EquipmentStatus $status): Equipment
    {
        return new Equipment($code, $code, $type, 'Stockage', $status, $this->now);
    }

    private function mission(string $reference): TransportMission
    {
        return new TransportMission($reference, 'UL-0001', 'REC-01', 'STK-A-01-01', 3, $this->now);
    }
}
