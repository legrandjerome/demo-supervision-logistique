<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Enum\AlarmSeverity;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;

final class AlarmApiTest extends ApiTestCase
{
    private int $criticalId;

    protected function setUp(): void
    {
        parent::setUp();

        $entityManager = $this->entityManager();
        $now = new \DateTimeImmutable('2026-11-12 09:30:00');
        $crane = new Equipment('TK-201', 'Transstockeur allée A', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Fault, $now);
        $critical = new Alarm($crane, AlarmSeverity::Critical, 'Défaut variateur de levage', $now);
        $warning = new Alarm($crane, AlarmSeverity::Warning, 'Écart de positionnement', $now->modify('-20 minutes'));
        $entityManager->persist($crane);
        $entityManager->persist($critical);
        $entityManager->persist($warning);
        $entityManager->flush();

        $this->criticalId = (int) $critical->getId();
    }

    public function testListRequiresAuthentication(): void
    {
        $this->request('GET', '/api/alarms');

        self::assertResponseStatusCodeSame(401);
    }

    public function testListIsMostRecentFirstWithItsEquipment(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('GET', '/api/alarms');

        self::assertResponseIsSuccessful();
        $alarms = $this->json();
        self::assertSame(['CRITICAL', 'WARNING'], array_column($alarms, 'severity'));
        self::assertSame('TK-201', $alarms[0]['equipment']['code']);
        self::assertSame('Transstockeur allée A', $alarms[0]['equipment']['name']);
        self::assertNull($alarms[0]['acknowledgedAt']);
        self::assertNull($alarms[0]['acknowledgedBy']);
    }

    public function testOperatorAcknowledgesAnAlarm(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('POST', $this->acknowledgeUri());

        self::assertResponseIsSuccessful();
        $alarm = $this->json();
        self::assertSame('Olivia Opératrice', $alarm['acknowledgedBy']);
        self::assertNotNull($alarm['acknowledgedAt']);
    }

    public function testAnAlarmIsAcknowledgedOnlyOnce(): void
    {
        $this->loginAs(self::OPERATOR);
        $this->request('POST', $this->acknowledgeUri());
        self::assertResponseIsSuccessful();

        $this->loginAs(self::SUPERVISOR);
        $this->request('POST', $this->acknowledgeUri());
        self::assertResponseStatusCodeSame(409);

        $this->request('GET', '/api/alarms');
        self::assertSame('Olivia Opératrice', $this->json()[0]['acknowledgedBy']);
    }

    private function acknowledgeUri(): string
    {
        return \sprintf('/api/alarms/%d/acknowledge', $this->criticalId);
    }
}
