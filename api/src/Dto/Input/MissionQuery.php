<?php

declare(strict_types=1);

namespace App\Dto\Input;

use App\Enum\MissionStatus;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Paramètres de la liste des missions (`GET /api/missions?page=&limit=&status=&search=`).
 */
final class MissionQuery
{
    public function __construct(
        #[Assert\Positive]
        public int $page = 1,
        #[Assert\Range(min: 1, max: 100)]
        public int $limit = 20,
        public ?MissionStatus $status = null,
        #[Assert\Length(max: 50)]
        public ?string $search = null,
    ) {
    }
}
