<?php

declare(strict_types=1);

namespace App\Enum;

enum AlarmSeverity: string
{
    case Info = 'INFO';
    case Warning = 'WARNING';
    case Critical = 'CRITICAL';
}
