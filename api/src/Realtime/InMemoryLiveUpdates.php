<?php

declare(strict_types=1);

namespace App\Realtime;

use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Entity\TransportMission;
use Symfony\Component\DependencyInjection\Attribute\When;

/**
 * Doublure de test : mémorise les diffusions au lieu d'appeler le hub.
 */
#[When(env: 'test')]
final class InMemoryLiveUpdates implements LiveUpdates
{
    /** @var list<array{type: string, id: int}> */
    private array $published = [];

    public function equipmentChanged(Equipment $equipment): void
    {
        $this->published[] = ['type' => 'equipment', 'id' => (int) $equipment->getId()];
    }

    public function missionChanged(TransportMission $mission): void
    {
        $this->published[] = ['type' => 'mission', 'id' => (int) $mission->getId()];
    }

    public function alarmChanged(Alarm $alarm): void
    {
        $this->published[] = ['type' => 'alarm', 'id' => (int) $alarm->getId()];
    }

    /**
     * @return list<array{type: string, id: int}>
     */
    public function published(): array
    {
        return $this->published;
    }
}
