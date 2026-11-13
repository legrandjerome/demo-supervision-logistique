<?php

declare(strict_types=1);

namespace App\Realtime;

use App\Dto\AlarmView;
use App\Dto\EquipmentView;
use App\Dto\MissionView;
use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Entity\TransportMission;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\WhenNot;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

/**
 * Publie chaque changement sur le hub Mercure, en mise à jour privée :
 * seuls les abonnés munis d'un jeton délivré par l'API la reçoivent.
 */
#[WhenNot(env: 'test')]
final readonly class MercureLiveUpdates implements LiveUpdates
{
    public function __construct(
        private HubInterface $hub,
        private LoggerInterface $logger,
    ) {
    }

    public function equipmentChanged(Equipment $equipment): void
    {
        $this->publish(self::TOPIC_EQUIPMENTS, 'equipment', EquipmentView::fromEntity($equipment));
    }

    public function missionChanged(TransportMission $mission): void
    {
        $this->publish(self::TOPIC_MISSIONS, 'mission', MissionView::fromEntity($mission));
    }

    public function alarmChanged(Alarm $alarm): void
    {
        $this->publish(self::TOPIC_ALARMS, 'alarm', AlarmView::fromEntity($alarm));
    }

    private function publish(string $topic, string $type, object $view): void
    {
        try {
            $this->hub->publish(new Update(
                topics: $topic,
                data: json_encode($view, \JSON_THROW_ON_ERROR),
                private: true,
                type: $type,
            ));
        } catch (\Throwable $exception) {
            // Le changement est déjà enregistré : un hub indisponible ne doit pas faire échouer la requête.
            $this->logger->error('Publication Mercure impossible : {message}', [
                'message' => $exception->getMessage(),
                'topic' => $topic,
                'exception' => $exception,
            ]);
        }
    }
}
