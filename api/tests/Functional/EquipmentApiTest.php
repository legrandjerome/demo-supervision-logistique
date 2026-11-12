<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Equipment;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;

final class EquipmentApiTest extends ApiTestCase
{
    private int $craneId;

    protected function setUp(): void
    {
        parent::setUp();

        $entityManager = $this->entityManager();
        $now = new \DateTimeImmutable('2026-11-12 08:00:00');
        $crane = new Equipment('TK-201', 'Transstockeur allée A', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Fault, $now);
        $conveyor = new Equipment('CV-101', 'Convoyeur réception 1', EquipmentType::Conveyor, 'Réception', EquipmentStatus::Running, $now);
        $entityManager->persist($crane);
        $entityManager->persist($conveyor);
        $entityManager->flush();

        $this->craneId = (int) $crane->getId();
    }

    public function testListRequiresAuthentication(): void
    {
        $this->request('GET', '/api/equipments');

        self::assertResponseStatusCodeSame(401);
    }

    public function testListIsOrderedByCode(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/equipments');

        self::assertResponseIsSuccessful();
        $equipments = $this->json();
        self::assertSame(['CV-101', 'TK-201'], array_column($equipments, 'code'));
        self::assertSame(
            [
                'code' => 'TK-201',
                'name' => 'Transstockeur allée A',
                'type' => 'STACKER_CRANE',
                'zone' => 'Stockage',
                'status' => 'FAULT',
            ],
            array_intersect_key($equipments[1], array_flip(['code', 'name', 'type', 'zone', 'status'])),
        );
    }

    public function testOperatorCannotChangeAStatus(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('PATCH', $this->statusUri(), ['status' => 'RUNNING']);

        self::assertResponseStatusCodeSame(403);
    }

    public function testSupervisorChangesAStatus(): void
    {
        $this->loginAs(self::SUPERVISOR);
        $this->request('PATCH', $this->statusUri(), ['status' => 'MAINTENANCE']);

        self::assertResponseIsSuccessful();
        $equipment = $this->json();
        self::assertSame('MAINTENANCE', $equipment['status']);
        self::assertNotSame('2026-11-12T08:00:00+00:00', $equipment['statusChangedAt']);

        $this->request('GET', '/api/equipments');
        self::assertSame(['RUNNING', 'MAINTENANCE'], array_column($this->json(), 'status'));
    }

    public function testUnknownStatusIsRejected(): void
    {
        $this->loginAs(self::SUPERVISOR);
        $this->request('PATCH', $this->statusUri(), ['status' => 'EN_VACANCES']);

        self::assertResponseStatusCodeSame(422);
    }

    public function testUnknownEquipmentIsNotFound(): void
    {
        $this->loginAs(self::SUPERVISOR);
        $this->request('PATCH', '/api/equipments/999999/status', ['status' => 'RUNNING']);

        self::assertResponseStatusCodeSame(404);
    }

    private function statusUri(): string
    {
        return \sprintf('/api/equipments/%d/status', $this->craneId);
    }
}
