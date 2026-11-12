<?php

declare(strict_types=1);

namespace App\Dto;

use App\Entity\TransportMission;

final readonly class MissionView
{
    public function __construct(
        public int $id,
        public string $reference,
        public string $loadUnit,
        public string $source,
        public string $destination,
        public int $priority,
        public string $status,
        public ?string $equipmentCode,
        public string $createdAt,
        public ?string $startedAt,
        public ?string $completedAt,
    ) {
    }

    public static function fromEntity(TransportMission $mission): self
    {
        return new self(
            id: (int) $mission->getId(),
            reference: $mission->getReference(),
            loadUnit: $mission->getLoadUnit(),
            source: $mission->getSource(),
            destination: $mission->getDestination(),
            priority: $mission->getPriority(),
            status: $mission->getStatus()->value,
            equipmentCode: $mission->getEquipment()?->getCode(),
            createdAt: $mission->getCreatedAt()->format(\DATE_ATOM),
            startedAt: $mission->getStartedAt()?->format(\DATE_ATOM),
            completedAt: $mission->getCompletedAt()?->format(\DATE_ATOM),
        );
    }
}
