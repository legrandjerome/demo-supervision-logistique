<?php

declare(strict_types=1);

namespace App\Enum;

enum EquipmentType: string
{
    case Conveyor = 'CONVEYOR';
    case StackerCrane = 'STACKER_CRANE';
    case Shuttle = 'SHUTTLE';
    case PickingStation = 'PICKING_STATION';
}
