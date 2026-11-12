<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Entity\TransportMission;
use App\Entity\User;
use App\Enum\AlarmSeverity;
use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;
use App\Repository\EquipmentRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Clock\ClockInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:demo:seed',
    description: 'Charge un jeu de données fictif : équipements, missions de transport et alarmes.',
)]
final readonly class SeedDemoDataCommand
{
    private const int MISSION_COUNT = 60;

    /** Code, nom, type, zone, état. */
    private const array EQUIPMENTS = [
        ['CV-101', 'Convoyeur réception 1', EquipmentType::Conveyor, 'Réception', EquipmentStatus::Running],
        ['CV-102', 'Convoyeur réception 2', EquipmentType::Conveyor, 'Réception', EquipmentStatus::Stopped],
        ['TK-201', 'Transstockeur allée A', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Fault],
        ['TK-202', 'Transstockeur allée B', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Running],
        ['TK-203', 'Transstockeur allée C', EquipmentType::StackerCrane, 'Stockage', EquipmentStatus::Running],
        ['NV-301', 'Navette niveau 1', EquipmentType::Shuttle, 'Stockage', EquipmentStatus::Maintenance],
        ['NV-302', 'Navette niveau 2', EquipmentType::Shuttle, 'Stockage', EquipmentStatus::Running],
        ['PP-401', 'Poste de préparation 1', EquipmentType::PickingStation, 'Préparation', EquipmentStatus::Running],
        ['PP-402', 'Poste de préparation 2', EquipmentType::PickingStation, 'Préparation', EquipmentStatus::Running],
        ['PP-403', 'Poste de préparation 3', EquipmentType::PickingStation, 'Préparation', EquipmentStatus::Stopped],
        ['CV-501', 'Convoyeur expédition 1', EquipmentType::Conveyor, 'Expédition', EquipmentStatus::Running],
        ['CV-502', 'Convoyeur expédition 2', EquipmentType::Conveyor, 'Expédition', EquipmentStatus::Running],
    ];

    /** Code de l'équipement, gravité, message, ancienneté en minutes, acquittée. */
    private const array ALARMS = [
        ['TK-201', AlarmSeverity::Critical, 'Défaut variateur de levage', 12, false],
        ['TK-201', AlarmSeverity::Warning, 'Écart de positionnement en allée', 25, false],
        ['NV-301', AlarmSeverity::Info, 'Maintenance préventive en cours', 95, true],
        ['CV-102', AlarmSeverity::Warning, 'Arrêt sur détection de bourrage', 40, false],
        ['PP-403', AlarmSeverity::Info, 'Poste fermé par l\'opérateur', 130, true],
        ['CV-501', AlarmSeverity::Warning, 'Température moteur élevée', 8, false],
        ['TK-203', AlarmSeverity::Critical, 'Arrêt d\'urgence déclenché', 310, true],
        ['NV-302', AlarmSeverity::Info, 'Niveau de batterie inférieur à 30 %', 55, false],
    ];

    public function __construct(
        private EquipmentRepository $equipments,
        private UserRepository $users,
        private EntityManagerInterface $entityManager,
        private ClockInterface $clock,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Option(description: 'Supprime les équipements, missions et alarmes existants avant de charger le jeu de données.')]
        bool $reset = false,
    ): int {
        if ($reset) {
            $this->purge();
        } elseif ($this->equipments->count() > 0) {
            $io->note('Des équipements existent déjà : rien à faire. Utilisez --reset pour repartir de zéro.');

            return Command::SUCCESS;
        }

        $now = $this->clock->now();
        $equipments = $this->seedEquipments($now);
        $this->seedMissions($equipments, $now);
        $this->seedAlarms($equipments, $now);
        $this->entityManager->flush();

        $io->success(\sprintf(
            '%d équipements, %d missions et %d alarmes chargés.',
            \count(self::EQUIPMENTS),
            self::MISSION_COUNT,
            \count(self::ALARMS),
        ));

        return Command::SUCCESS;
    }

    private function purge(): void
    {
        foreach ([Alarm::class, TransportMission::class, Equipment::class] as $entity) {
            $this->entityManager->createQuery(\sprintf('DELETE FROM %s e', $entity))->execute();
        }
    }

    /**
     * @return array<string, Equipment> équipements indexés par code
     */
    private function seedEquipments(\DateTimeImmutable $now): array
    {
        $equipments = [];
        foreach (self::EQUIPMENTS as $index => [$code, $name, $type, $zone, $status]) {
            $equipment = new Equipment($code, $name, $type, $zone, $status, $now->modify(\sprintf('-%d minutes', 20 + 17 * $index)));
            $this->entityManager->persist($equipment);
            $equipments[$code] = $equipment;
        }

        return $equipments;
    }

    /**
     * Jeu déterministe : la répartition des états dépend du rang de la mission, pas du hasard.
     *
     * @param array<string, Equipment> $equipments
     */
    private function seedMissions(array $equipments, \DateTimeImmutable $now): void
    {
        $carriers = [$equipments['TK-202'], $equipments['TK-203'], $equipments['NV-302']];

        for ($rank = 0; $rank < self::MISSION_COUNT; ++$rank) {
            $createdAt = $now->modify(\sprintf('-%d minutes', 6 * $rank + 2));
            $inbound = 0 === $rank % 2;
            $mission = new TransportMission(
                reference: \sprintf('M-%06d', 240000 - $rank),
                loadUnit: \sprintf('UL-%05d', 48200 - 7 * $rank),
                source: $inbound ? \sprintf('REC-%02d', 1 + $rank % 2) : \sprintf('STK-%s-%02d-%02d', ['A', 'B', 'C'][$rank % 3], 1 + $rank % 24, 1 + $rank % 6),
                destination: $inbound ? \sprintf('STK-%s-%02d-%02d', ['A', 'B', 'C'][$rank % 3], 1 + $rank % 24, 1 + $rank % 6) : \sprintf('EXP-%02d', 1 + $rank % 4),
                priority: 1 + $rank % 5,
                now: $createdAt,
            );

            // Les quatre plus récentes restent à l'état « créée ».
            if ($rank >= 4) {
                $mission->start($carriers[$rank % 3], $createdAt->modify('+1 minute'));

                // Les six suivantes sont encore en cours ; les autres sont closes.
                if ($rank >= 10) {
                    $closedAt = $createdAt->modify('+4 minutes');
                    match (true) {
                        0 === $rank % 13 => $mission->fail($closedAt),
                        0 === $rank % 11 => $mission->cancel($closedAt),
                        default => $mission->complete($closedAt),
                    };
                }
            }

            $this->entityManager->persist($mission);
        }
    }

    /**
     * @param array<string, Equipment> $equipments
     */
    private function seedAlarms(array $equipments, \DateTimeImmutable $now): void
    {
        $supervisor = $this->users->findOneBy(['email' => 'superviseur@demo.test']);

        foreach (self::ALARMS as [$code, $severity, $message, $ageInMinutes, $acknowledged]) {
            $raisedAt = $now->modify(\sprintf('-%d minutes', $ageInMinutes));
            $alarm = new Alarm($equipments[$code], $severity, $message, $raisedAt);

            if ($acknowledged && $supervisor instanceof User) {
                $alarm->acknowledge($supervisor, $raisedAt->modify('+5 minutes'));
            }

            $this->entityManager->persist($alarm);
        }
    }
}
