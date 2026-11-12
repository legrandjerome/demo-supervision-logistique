<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\AlarmSeverity;
use App\Exception\InvalidTransition;
use App\Repository\AlarmRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AlarmRepository::class)]
#[ORM\Index(name: 'idx_alarm_raised_at', fields: ['raisedAt'])]
class Alarm
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Equipment $equipment;

    #[ORM\Column(length: 20, enumType: AlarmSeverity::class)]
    private AlarmSeverity $severity;

    #[ORM\Column(length: 255)]
    private string $message;

    #[ORM\Column]
    private \DateTimeImmutable $raisedAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $acknowledgedAt = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(onDelete: 'SET NULL')]
    private ?User $acknowledgedBy = null;

    public function __construct(
        Equipment $equipment,
        AlarmSeverity $severity,
        string $message,
        \DateTimeImmutable $now,
    ) {
        $this->equipment = $equipment;
        $this->severity = $severity;
        $this->message = $message;
        $this->raisedAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEquipment(): Equipment
    {
        return $this->equipment;
    }

    public function getSeverity(): AlarmSeverity
    {
        return $this->severity;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function getRaisedAt(): \DateTimeImmutable
    {
        return $this->raisedAt;
    }

    public function getAcknowledgedAt(): ?\DateTimeImmutable
    {
        return $this->acknowledgedAt;
    }

    public function getAcknowledgedBy(): ?User
    {
        return $this->acknowledgedBy;
    }

    public function isActive(): bool
    {
        return null === $this->acknowledgedAt;
    }

    /** Une alarme ne s'acquitte qu'une fois : on garde la trace du premier acquittement. */
    public function acknowledge(User $user, \DateTimeImmutable $now): void
    {
        if (!$this->isActive()) {
            throw new InvalidTransition('Cette alarme est déjà acquittée.');
        }

        $this->acknowledgedAt = $now;
        $this->acknowledgedBy = $user;
    }
}
