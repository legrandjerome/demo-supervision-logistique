<?php

declare(strict_types=1);

namespace App\Dto\Input;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class CreateMissionInput
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 20)]
        public string $loadUnit,
        #[Assert\NotBlank]
        #[Assert\Length(max: 30)]
        public string $source,
        #[Assert\NotBlank]
        #[Assert\Length(max: 30)]
        #[Assert\NotEqualTo(propertyPath: 'source', message: 'La destination doit être différente de l\'origine.')]
        public string $destination,
        #[Assert\Range(min: 1, max: 5)]
        public int $priority = 3,
    ) {
    }
}
