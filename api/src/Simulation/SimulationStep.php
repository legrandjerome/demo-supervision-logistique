<?php

declare(strict_types=1);

namespace App\Simulation;

use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Entity\TransportMission;

/**
 * Résultat d'un pas de simulation : ce qui est nouveau (à enregistrer) et ce qui a changé (à diffuser).
 */
final readonly class SimulationStep
{
    /**
     * @param list<TransportMission> $newMissions
     * @param list<Alarm>            $newAlarms
     * @param list<TransportMission> $changedMissions missions existantes dont l'état a changé
     * @param list<Equipment>        $changedEquipments
     */
    public function __construct(
        public array $newMissions = [],
        public array $newAlarms = [],
        public array $changedMissions = [],
        public array $changedEquipments = [],
    ) {
    }

    public function isEmpty(): bool
    {
        return [] === $this->newMissions && [] === $this->newAlarms
            && [] === $this->changedMissions && [] === $this->changedEquipments;
    }
}
