<?php

declare(strict_types=1);

namespace App\Enum;

enum EquipmentStatus: string
{
    case Running = 'RUNNING';
    case Stopped = 'STOPPED';
    case Fault = 'FAULT';
    case Maintenance = 'MAINTENANCE';
}
