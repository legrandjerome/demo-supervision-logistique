<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Equipment;
use App\Entity\TransportMission;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;
use App\Realtime\InMemoryLiveUpdates;
use App\Realtime\LiveUpdates;

final class RealtimeAndStatsApiTest extends ApiTestCase
{
    private int $craneId;

    /**
     * Un transstockeur, une mission terminée il y a deux minutes, une annulée à l'instant, une en attente.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $entityManager = $this->entityManager();
        $now = new \DateTimeImmutable();
        $crane = new Equipment('TK-202', 'Transstockeur allée B', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Running, $now);
        $done = new TransportMission('M-0001', 'UL-0001', 'REC-01', 'STK-A-01-01', 3, $now->modify('-5 minutes'));
        $done->start($crane, $now->modify('-4 minutes'));
        $done->complete($now->modify('-2 minutes'));
        $cancelled = new TransportMission('M-0002', 'UL-0002', 'REC-01', 'STK-A-01-02', 3, $now->modify('-1 minute'));
        $cancelled->cancel($now);
        $pending = new TransportMission('M-0003', 'UL-0003', 'REC-01', 'STK-A-01-03', 3, $now);
        foreach ([$crane, $done, $cancelled, $pending] as $entity) {
            $entityManager->persist($entity);
        }
        $entityManager->flush();

        $this->craneId = (int) $crane->getId();
    }

    public function testSubscriberTokenRequiresAuthentication(): void
    {
        $this->request('GET', '/api/realtime/token');

        self::assertResponseStatusCodeSame(401);
    }

    public function testSubscriberTokenOnlyGrantsReadAccessToTheSupervisionTopics(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/realtime/token');

        self::assertResponseIsSuccessful();
        $body = $this->json();
        self::assertSame(LiveUpdates::TOPICS, $body['topics']);

        $segments = explode('.', $body['token']);
        self::assertCount(3, $segments);
        [$header, $claims] = array_map(
            static fn (string $segment): array => json_decode(base64_decode(strtr($segment, '-_', '+/'), true), true, flags: \JSON_THROW_ON_ERROR),
            \array_slice($segments, 0, 2),
        );

        // Jeton d'accès au format du protocole Mercure 1.0 (RFC 9068).
        self::assertSame('at+jwt', $header['typ']);
        self::assertSame(self::OPERATOR, $claims['sub']);
        foreach (['iss', 'aud', 'client_id', 'iat', 'jti'] as $claim) {
            self::assertNotEmpty($claims[$claim] ?? null, \sprintf('Revendication « %s » absente.', $claim));
        }
        self::assertGreaterThan(time(), $claims['exp']);
        self::assertLessThanOrEqual(time() + 3600, $claims['exp']);

        // Un seul droit : lire les trois sujets de supervision, rien à publier.
        self::assertSame(
            [[
                'type' => 'https://mercure.rocks/authorization-detail',
                'actions' => ['subscribe'],
                'topics' => array_map(static fn (string $topic): array => ['match' => $topic], LiveUpdates::TOPICS),
            ]],
            $claims['authorization_details'],
        );
    }

    public function testActivityCoversTheLastThirtyMinutes(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/stats/activity');

        self::assertResponseIsSuccessful();
        $activity = $this->json();
        self::assertSame(30, $activity['windowInMinutes']);
        self::assertCount(30, $activity['throughput']);
        self::assertSame(1, array_sum(array_column($activity['throughput'], 'done')));
        self::assertSame(1, array_sum(array_column($activity['throughput'], 'cancelled')));
        self::assertSame(0, array_sum(array_column($activity['throughput'], 'error')));
        self::assertSame(
            ['CREATED' => 1, 'IN_PROGRESS' => 0, 'DONE' => 1, 'CANCELLED' => 1, 'ERROR' => 0],
            $activity['missionsByStatus'],
        );
    }

    public function testAnAcceptedChangeIsBroadcast(): void
    {
        $this->loginAs(self::SUPERVISOR);
        $this->request('PATCH', \sprintf('/api/equipments/%d/status', $this->craneId), ['status' => 'MAINTENANCE']);
        self::assertResponseIsSuccessful();

        $liveUpdates = self::getContainer()->get(LiveUpdates::class);
        self::assertInstanceOf(InMemoryLiveUpdates::class, $liveUpdates);
        self::assertSame([['type' => 'equipment', 'id' => $this->craneId]], $liveUpdates->published());
    }

    public function testARefusedChangeIsNotBroadcast(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('PATCH', \sprintf('/api/equipments/%d/status', $this->craneId), ['status' => 'MAINTENANCE']);
        self::assertResponseStatusCodeSame(403);

        $liveUpdates = self::getContainer()->get(LiveUpdates::class);
        self::assertInstanceOf(InMemoryLiveUpdates::class, $liveUpdates);
        self::assertSame([], $liveUpdates->published());
    }
}
