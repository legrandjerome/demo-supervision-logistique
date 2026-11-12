<?php

declare(strict_types=1);

namespace App\Dto\Input;

use App\Enum\EquipmentStatus;

final readonly class ChangeEquipmentStatusInput
{
    public function __construct(
        public EquipmentStatus $status,
    ) {
    }
}
