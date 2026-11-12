<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Equipment;
use App\Entity\TransportMission;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;

final class MissionApiTest extends ApiTestCase
{
    private int $createdId;
    private int $doneId;

    /**
     * 25 missions : la plus récente (rang 0) est « créée », les rangs 1 à 4 sont en cours, les autres terminées.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $entityManager = $this->entityManager();
        $now = new \DateTimeImmutable('2026-11-12 12:00:00');
        $crane = new Equipment('TK-202', 'Transstockeur allée B', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Running, $now);
        $entityManager->persist($crane);

        $missions = [];
        for ($rank = 0; $rank < 25; ++$rank) {
            $createdAt = $now->modify(\sprintf('-%d minutes', $rank));
            $mission = new TransportMission(\sprintf('M-%04d', 1000 + $rank), \sprintf('UL-%04d', 5000 + $rank), 'REC-01', 'STK-A-01-01', 3, $createdAt);
            if ($rank >= 1) {
                $mission->start($crane, $createdAt);
            }
            if ($rank >= 5) {
                $mission->complete($createdAt);
            }
            $entityManager->persist($mission);
            $missions[] = $mission;
        }
        $entityManager->flush();

        $this->createdId = (int) $missions[0]->getId();
        $this->doneId = (int) $missions[24]->getId();
    }

    public function testListIsPaginatedMostRecentFirst(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/missions?page=2&limit=10');

        self::assertResponseIsSuccessful();
        $page = $this->json();
        self::assertSame(25, $page['total']);
        self::assertSame(2, $page['page']);
        self::assertSame(10, $page['limit']);
        self::assertCount(10, $page['items']);
        self::assertSame('M-1010', $page['items'][0]['reference']);
        self::assertSame('TK-202', $page['items'][0]['equipmentCode']);
    }

    public function testListUsesDefaultsWithoutQueryString(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/missions');

        self::assertResponseIsSuccessful();
        $page = $this->json();
        self::assertSame(1, $page['page']);
        self::assertSame(20, $page['limit']);
        self::assertCount(20, $page['items']);
    }

    public function testListFiltersByStatus(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/missions?status=IN_PROGRESS');

        self::assertResponseIsSuccessful();
        $page = $this->json();
        self::assertSame(4, $page['total']);
        self::assertSame(['IN_PROGRESS'], array_values(array_unique(array_column($page['items'], 'status'))));
    }

    public function testListSearchesReferenceAndLoadUnitCaseInsensitively(): void
    {
        $this->loginAs(self::OPERATOR);

        $this->request('GET', '/api/missions?search=ul-5024');
        self::assertSame(['M-1024'], array_column($this->json()['items'], 'reference'));

        $this->request('GET', '/api/missions?search=m-100');
        self::assertSame(10, $this->json()['total']);
    }

    public function testSearchTreatsWildcardsLiterally(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/missions?search=%25');

        self::assertResponseIsSuccessful();
        self::assertSame(0, $this->json()['total']);
    }

    public function testOutOfRangeLimitIsRejected(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/missions?limit=500');

        self::assertResponseStatusCodeSame(400);
    }

    public function testUnknownStatusFilterIsRejected(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/missions?status=PERDUE');

        self::assertResponseStatusCodeSame(400);
    }

    public function testOperatorCreatesAMission(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('POST', '/api/missions', [
            'loadUnit' => ' UL-9001 ',
            'source' => 'REC-02',
            'destination' => 'EXP-01',
            'priority' => 1,
        ]);

        self::assertResponseStatusCodeSame(201);
        $mission = $this->json();
        self::assertMatchesRegularExpression('/^M-[0-9A-F]{8}$/', $mission['reference']);
        self::assertSame('UL-9001', $mission['loadUnit']);
        self::assertSame('CREATED', $mission['status']);
        self::assertSame(1, $mission['priority']);
        self::assertNull($mission['equipmentCode']);

        $this->request('GET', '/api/missions?search=UL-9001');
        self::assertSame(1, $this->json()['total']);
    }

    public function testCreationRejectsAnEmptyPayload(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('POST', '/api/missions', ['loadUnit' => '', 'source' => '', 'destination' => '']);

        self::assertResponseStatusCodeSame(422);
    }

    public function testCreationRejectsIdenticalSourceAndDestination(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('POST', '/api/missions', [
            'loadUnit' => 'UL-9002',
            'source' => 'REC-01',
            'destination' => 'REC-01',
        ]);

        self::assertResponseStatusCodeSame(422);
    }

    public function testCreationRejectsAnOutOfRangePriority(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('POST', '/api/missions', [
            'loadUnit' => 'UL-9003',
            'source' => 'REC-01',
            'destination' => 'EXP-01',
            'priority' => 9,
        ]);

        self::assertResponseStatusCodeSame(422);
    }

    public function testOperatorCannotCancel(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('POST', \sprintf('/api/missions/%d/cancel', $this->createdId));

        self::assertResponseStatusCodeSame(403);
    }

    public function testSupervisorCancelsAPendingMission(): void
    {
        $this->loginAs(self::SUPERVISOR);
        $this->request('POST', \sprintf('/api/missions/%d/cancel', $this->createdId));

        self::assertResponseIsSuccessful();
        $mission = $this->json();
        self::assertSame('CANCELLED', $mission['status']);
        self::assertNotNull($mission['completedAt']);
    }

    public function testFinishedMissionCannotBeCancelled(): void
    {
        $this->loginAs(self::SUPERVISOR);
        $this->request('POST', \sprintf('/api/missions/%d/cancel', $this->doneId));

        self::assertResponseStatusCodeSame(409);
    }
}
