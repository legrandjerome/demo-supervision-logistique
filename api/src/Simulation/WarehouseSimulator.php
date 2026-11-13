<?php

declare(strict_types=1);

namespace App\Simulation;

use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Entity\TransportMission;
use App\Enum\AlarmSeverity;
use App\Enum\EquipmentStatus;
use App\Service\MissionReferenceGenerator;
use Random\Randomizer;

/**
 * Fait vivre l'entrepôt fictif, un pas à la fois. Aucune dépendance à la base ni au réseau :
 * la commande lui fournit l'état courant et enregistre ce qu'il renvoie.
 */
final class WarehouseSimulator
{
    private const int MIN_TRANSPORT_SECONDS = 6;
    private const int MIN_FAULT_SECONDS = 20;
    private const int MAX_PENDING_MISSIONS = 6;
    private const int MAX_FAULTS = 2;
    private const int MAX_ACTIVE_ALARMS = 8;

    private const array FAULT_MESSAGES = [
        'Défaut variateur',
        'Arrêt sur détection de bourrage',
        'Perte de communication automate',
        'Écart de positionnement',
    ];

    private readonly Randomizer $randomizer;

    public function __construct(
        private readonly MissionReferenceGenerator $references,
        ?Randomizer $randomizer = null,
    ) {
        $this->randomizer = $randomizer ?? new Randomizer();
    }

    /**
     * @param list<Equipment>        $equipments
     * @param list<TransportMission> $pending          missions créées, dans l'ordre de traitement
     * @param list<TransportMission> $inProgress
     * @param int                    $activeAlarmCount alarmes non acquittées avant ce pas
     */
    public function tick(
        array $equipments,
        array $pending,
        array $inProgress,
        int $activeAlarmCount,
        \DateTimeImmutable $now,
    ): SimulationStep {
        $changedMissions = [];
        $changedEquipments = [];
        $newAlarms = [];
        $busy = [];

        // 1. Les missions en cours avancent, sauf si leur équipement est indisponible.
        foreach ($inProgress as $mission) {
            $carrier = $mission->getEquipment();
            if (null === $carrier) {
                continue;
            }
            $busy[spl_object_id($carrier)] = true;

            $elapsed = $now->getTimestamp() - ($mission->getStartedAt()?->getTimestamp() ?? $now->getTimestamp());
            if (EquipmentStatus::Running !== $carrier->getStatus() || $elapsed < self::MIN_TRANSPORT_SECONDS || !$this->chance(60)) {
                continue;
            }

            if ($this->chance(4)) {
                $mission->fail($now);
            } else {
                $mission->complete($now);
            }
            $changedMissions[] = $mission;
        }

        // 2. Chaque transporteur en marche et libre prend la mission en attente suivante.
        //    Un transporteur libéré à ce pas attend le suivant : une mission à la fois.
        foreach ($equipments as $equipment) {
            if ([] === $pending) {
                break;
            }
            if (!$equipment->isCarrier() || EquipmentStatus::Running !== $equipment->getStatus() || isset($busy[spl_object_id($equipment)])) {
                continue;
            }

            $mission = array_shift($pending);
            $mission->start($equipment, $now);
            $busy[spl_object_id($equipment)] = true;
            $changedMissions[] = $mission;
        }

        // 3. De nouvelles demandes arrivent tant que la file d'attente reste courte.
        $newMissions = [];
        if (\count($pending) < self::MAX_PENDING_MISSIONS && $this->chance(55)) {
            $newMissions[] = $this->newMission($now);
        }

        // 4. Les équipements en défaut depuis assez longtemps repartent.
        $faults = 0;
        foreach ($equipments as $equipment) {
            if (EquipmentStatus::Fault !== $equipment->getStatus()) {
                continue;
            }

            $elapsed = $now->getTimestamp() - $equipment->getStatusChangedAt()->getTimestamp();
            if ($elapsed >= self::MIN_FAULT_SECONDS && $this->chance(30)) {
                $equipment->changeStatus(EquipmentStatus::Running, $now);
                $changedEquipments[] = $equipment;
            } else {
                ++$faults;
            }
        }

        // 5. Une panne survient parfois, sans jamais saturer l'entrepôt ni la liste d'alarmes.
        foreach ($equipments as $equipment) {
            if ($faults >= self::MAX_FAULTS || $activeAlarmCount + \count($newAlarms) >= self::MAX_ACTIVE_ALARMS) {
                break;
            }
            if (EquipmentStatus::Running !== $equipment->getStatus() || \in_array($equipment, $changedEquipments, true) || !$this->chance(1)) {
                continue;
            }

            $equipment->changeStatus(EquipmentStatus::Fault, $now);
            $changedEquipments[] = $equipment;
            $newAlarms[] = new Alarm($equipment, AlarmSeverity::Critical, $this->pick(self::FAULT_MESSAGES), $now);
            ++$faults;
        }

        return new SimulationStep($newMissions, $newAlarms, $changedMissions, $changedEquipments);
    }

    private function newMission(\DateTimeImmutable $now): TransportMission
    {
        $slot = \sprintf('STK-%s-%02d-%02d', $this->pick(['A', 'B', 'C']), $this->randomizer->getInt(1, 24), $this->randomizer->getInt(1, 6));
        $inbound = $this->chance(50);

        return new TransportMission(
            reference: $this->references->generate(),
            loadUnit: \sprintf('UL-%05d', $this->randomizer->getInt(10000, 99999)),
            source: $inbound ? \sprintf('REC-%02d', $this->randomizer->getInt(1, 2)) : $slot,
            destination: $inbound ? $slot : \sprintf('EXP-%02d', $this->randomizer->getInt(1, 4)),
            priority: $this->randomizer->getInt(1, 5),
            now: $now,
        );
    }

    /** Vrai avec une probabilité de `$percent` %. */
    private function chance(int $percent): bool
    {
        return $this->randomizer->getInt(1, 100) <= $percent;
    }

    /**
     * @template T
     *
     * @param non-empty-list<T> $values
     *
     * @return T
     */
    private function pick(array $values): mixed
    {
        return $values[$this->randomizer->getInt(0, \count($values) - 1)];
    }
}
