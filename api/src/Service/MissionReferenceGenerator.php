<?php

declare(strict_types=1);

namespace App\Service;

final class MissionReferenceGenerator
{
    /** Référence lisible et non devinable, par exemple « M-9F3A2C1B ». */
    public function generate(): string
    {
        return 'M-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
