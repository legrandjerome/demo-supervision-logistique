<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\Alarm;

final readonly class AlarmView
{
    /**
     * @param array{id: int, code: string, name: string} $equipment
     */
    public function __construct(
        public int $id,
        public string $severity,
        public string $message,
        public string $raisedAt,
        public ?string $acknowledgedAt,
        public ?string $acknowledgedBy,
        public array $equipment,
    ) {
    }

    public static function fromEntity(Alarm $alarm): self
    {
        $equipment = $alarm->getEquipment();

        return new self(
            id: (int) $alarm->getId(),
            severity: $alarm->getSeverity()->value,
            message: $alarm->getMessage(),
            raisedAt: $alarm->getRaisedAt()->format(\DATE_ATOM),
            acknowledgedAt: $alarm->getAcknowledgedAt()?->format(\DATE_ATOM),
            acknowledgedBy: $alarm->getAcknowledgedBy()?->getDisplayName(),
            equipment: [
                'id' => (int) $equipment->getId(),
                'code' => $equipment->getCode(),
                'name' => $equipment->getName(),
            ],
        );
    }
}
