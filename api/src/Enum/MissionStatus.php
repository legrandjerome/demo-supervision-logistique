<?php

declare(strict_types=1);

namespace App\Enum;

enum MissionStatus: string
{
    case Created = 'CREATED';
    case InProgress = 'IN_PROGRESS';
    case Done = 'DONE';
    case Cancelled = 'CANCELLED';
    case Error = 'ERROR';

    /** Une mission terminée, annulée ou en erreur ne change plus d'état. */
    public function isFinal(): bool
    {
        return match ($this) {
            self::Created, self::InProgress => false,
            self::Done, self::Cancelled, self::Error => true,
        };
    }
}
