<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\EquipmentStatus;
use App\Enum\EquipmentType;
use App\Repository\EquipmentRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EquipmentRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_equipment_code', fields: ['code'])]
class Equipment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20)]
    private string $code;

    #[ORM\Column(length: 100)]
    private string $name;

    #[ORM\Column(length: 20, enumType: EquipmentType::class)]
    private EquipmentType $type;

    #[ORM\Column(length: 50)]
    private string $zone;

    #[ORM\Column(length: 20, enumType: EquipmentStatus::class)]
    private EquipmentStatus $status;

    #[ORM\Column]
    private \DateTimeImmutable $statusChangedAt;

    public function __construct(
        string $code,
        string $name,
        EquipmentType $type,
        string $zone,
        EquipmentStatus $status,
        \DateTimeImmutable $now,
    ) {
        $this->code = $code;
        $this->name = $name;
        $this->type = $type;
        $this->zone = $zone;
        $this->status = $status;
        $this->statusChangedAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getType(): EquipmentType
    {
        return $this->type;
    }

    public function getZone(): string
    {
        return $this->zone;
    }

    public function getStatus(): EquipmentStatus
    {
        return $this->status;
    }

    public function getStatusChangedAt(): \DateTimeImmutable
    {
        return $this->statusChangedAt;
    }

    /** Change l'état ; la date ne bouge que si l'état change réellement. */
    public function changeStatus(EquipmentStatus $status, \DateTimeImmutable $now): void
    {
        if ($status === $this->status) {
            return;
        }

        $this->status = $status;
        $this->statusChangedAt = $now;
    }
}
