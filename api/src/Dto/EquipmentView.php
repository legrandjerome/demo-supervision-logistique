<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\Equipment;

final readonly class EquipmentView
{
    public function __construct(
        public int $id,
        public string $code,
        public string $name,
        public string $type,
        public string $zone,
        public string $status,
        public string $statusChangedAt,
    ) {
    }

    public static function fromEntity(Equipment $equipment): self
    {
        return new self(
            id: (int) $equipment->getId(),
            code: $equipment->getCode(),
            name: $equipment->getName(),
            type: $equipment->getType()->value,
            zone: $equipment->getZone(),
            status: $equipment->getStatus()->value,
            statusChangedAt: $equipment->getStatusChangedAt()->format(\DATE_ATOM),
        );
    }
}
