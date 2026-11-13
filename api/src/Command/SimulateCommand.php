<?php

declare(strict_types=1);

namespace App\Command;

use App\Realtime\LiveUpdates;
use App\Repository\AlarmRepository;
use App\Repository\EquipmentRepository;
use App\Repository\TransportMissionRepository;
use App\Simulation\WarehouseSimulator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Clock\ClockInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:demo:simulate',
    description: 'Fait vivre l\'entrepôt fictif : missions qui avancent, pannes, alarmes, diffusées en direct.',
)]
final readonly class SimulateCommand
{
    private const int PENDING_BATCH = 20;

    public function __construct(
        private WarehouseSimulator $simulator,
        private EquipmentRepository $equipments,
        private TransportMissionRepository $missions,
        private AlarmRepository $alarms,
        private EntityManagerInterface $entityManager,
        private LiveUpdates $liveUpdates,
        private ClockInterface $clock,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Option(description: 'Secondes entre deux pas de simulation.')]
        int $interval = 2,
        #[Option(description: 'Nombre de pas à exécuter ; 0 pour ne jamais s\'arrêter.')]
        int $ticks = 0,
    ): int {
        if ($interval < 1 || $ticks < 0) {
            $io->error('--interval doit être supérieur ou égal à 1 et --ticks positif ou nul.');

            return Command::INVALID;
        }

        $io->note(\sprintf('Simulation démarrée : un pas toutes les %d s. Ctrl+C pour arrêter.', $interval));

        for ($tick = 1; 0 === $ticks || $tick <= $ticks; ++$tick) {
            $summary = $this->step();
            if (null !== $summary && $io->isVerbose()) {
                $io->writeln(\sprintf('pas %d : %s', $tick, $summary));
            }

            // L'unité de travail est vidée à chaque pas : la mémoire reste stable sur une longue durée.
            $this->entityManager->clear();

            if (0 === $ticks || $tick < $ticks) {
                $this->clock->sleep($interval);
            }
        }

        return Command::SUCCESS;
    }

    private function step(): ?string
    {
        $step = $this->simulator->tick(
            equipments: $this->equipments->findAllOrderedByCode(),
            pending: $this->missions->findPending(self::PENDING_BATCH),
            inProgress: $this->missions->findInProgress(),
            activeAlarmCount: $this->alarms->count(['acknowledgedAt' => null]),
            now: $this->clock->now(),
        );

        if ($step->isEmpty()) {
            return null;
        }

        foreach ([...$step->newMissions, ...$step->newAlarms] as $entity) {
            $this->entityManager->persist($entity);
        }
        $this->entityManager->flush();

        // Diffusion après l'écriture : les abonnés ne voient jamais un état non enregistré.
        foreach ($step->changedEquipments as $equipment) {
            $this->liveUpdates->equipmentChanged($equipment);
        }
        foreach ([...$step->newMissions, ...$step->changedMissions] as $mission) {
            $this->liveUpdates->missionChanged($mission);
        }
        foreach ($step->newAlarms as $alarm) {
            $this->liveUpdates->alarmChanged($alarm);
        }

        return \sprintf(
            '%d mission(s) créée(s), %d mission(s) modifiée(s), %d équipement(s) modifié(s), %d alarme(s)',
            \count($step->newMissions),
            \count($step->changedMissions),
            \count($step->changedEquipments),
            \count($step->newAlarms),
        );
    }
}
