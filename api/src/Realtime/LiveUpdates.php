<?php

declare(strict_types=1);

namespace App\Realtime;

use App\Entity\Alarm;
use App\Entity\Equipment;
use App\Entity\TransportMission;

/**
 * Diffusion en direct des changements métier. À appeler après l'écriture en base.
 */
interface LiveUpdates
{
    public const string TOPIC_EQUIPMENTS = 'supervision/equipments';
    public const string TOPIC_MISSIONS = 'supervision/missions';
    public const string TOPIC_ALARMS = 'supervision/alarms';

    public const array TOPICS = [self::TOPIC_EQUIPMENTS, self::TOPIC_MISSIONS, self::TOPIC_ALARMS];

    public function equipmentChanged(Equipment $equipment): void;

    public function missionChanged(TransportMission $mission): void;

    public function alarmChanged(Alarm $alarm): void;
}
