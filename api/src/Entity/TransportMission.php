<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\MissionStatus;
use App\Exception\InvalidTransition;
use App\Repository\TransportMissionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransportMissionRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_transport_mission_reference', fields: ['reference'])]
#[ORM\Index(name: 'idx_transport_mission_status', fields: ['status'])]
#[ORM\Index(name: 'idx_transport_mission_created_at', fields: ['createdAt'])]
class TransportMission
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20)]
    private string $reference;

    #[ORM\Column(length: 20)]
    private string $loadUnit;

    #[ORM\Column(length: 30)]
    private string $source;

    #[ORM\Column(length: 30)]
    private string $destination;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $priority;

    #[ORM\Column(length: 20, enumType: MissionStatus::class)]
    private MissionStatus $status = MissionStatus::Created;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(onDelete: 'SET NULL')]
    private ?Equipment $equipment = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    public function __construct(
        string $reference,
        string $loadUnit,
        string $source,
        string $destination,
        int $priority,
        \DateTimeImmutable $now,
    ) {
        $this->reference = $reference;
        $this->loadUnit = $loadUnit;
        $this->source = $source;
        $this->destination = $destination;
        $this->priority = $priority;
        $this->createdAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReference(): string
    {
        return $this->reference;
    }

    public function getLoadUnit(): string
    {
        return $this->loadUnit;
    }

    public function getSource(): string
    {
        return $this->source;
    }

    public function getDestination(): string
    {
        return $this->destination;
    }

    public function getPriority(): int
    {
        return $this->priority;
    }

    public function getStatus(): MissionStatus
    {
        return $this->status;
    }

    public function getEquipment(): ?Equipment
    {
        return $this->equipment;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getStartedAt(): ?\DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    /** Confie la mission à un équipement. */
    public function start(Equipment $equipment, \DateTimeImmutable $now): void
    {
        if (MissionStatus::Created !== $this->status) {
            throw new InvalidTransition('Seule une mission créée peut démarrer.');
        }

        $this->status = MissionStatus::InProgress;
        $this->equipment = $equipment;
        $this->startedAt = $now;
    }

    public function complete(\DateTimeImmutable $now): void
    {
        $this->finish(MissionStatus::Done, $now);
    }

    public function fail(\DateTimeImmutable $now): void
    {
        $this->finish(MissionStatus::Error, $now);
    }

    /** Annule une mission créée ou en cours. */
    public function cancel(\DateTimeImmutable $now): void
    {
        if ($this->status->isFinal()) {
            throw new InvalidTransition('Une mission terminée, annulée ou en erreur ne peut plus être annulée.');
        }

        $this->status = MissionStatus::Cancelled;
        $this->completedAt = $now;
    }

    private function finish(MissionStatus $status, \DateTimeImmutable $now): void
    {
        if (MissionStatus::InProgress !== $this->status) {
            throw new InvalidTransition('Seule une mission en cours peut se terminer.');
        }

        $this->status = $status;
        $this->completedAt = $now;
    }
}
