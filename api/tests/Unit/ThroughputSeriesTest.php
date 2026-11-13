<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Stats\ThroughputSeries;
use PHPUnit\Framework\TestCase;

final class ThroughputSeriesTest extends TestCase
{
    public function testEveryMinuteOfTheWindowIsPresent(): void
    {
        $since = new \DateTimeImmutable('2026-11-12 10:00:30 UTC');
        $until = new \DateTimeImmutable('2026-11-12 10:03:10 UTC');

        $series = ThroughputSeries::build([
            ['minute' => '2026-11-12 10:01:00', 'status' => 'DONE', 'total' => '3'],
            ['minute' => '2026-11-12 10:01:00', 'status' => 'ERROR', 'total' => 1],
            ['minute' => '2026-11-12 10:03:00', 'status' => 'CANCELLED', 'total' => 2],
        ], $since, $until);

        self::assertSame([
            ['minute' => '2026-11-12T10:00:00+00:00', 'done' => 0, 'cancelled' => 0, 'error' => 0],
            ['minute' => '2026-11-12T10:01:00+00:00', 'done' => 3, 'cancelled' => 0, 'error' => 1],
            ['minute' => '2026-11-12T10:02:00+00:00', 'done' => 0, 'cancelled' => 0, 'error' => 0],
            ['minute' => '2026-11-12T10:03:00+00:00', 'done' => 0, 'cancelled' => 2, 'error' => 0],
        ], $series);
    }

    public function testRowsOutsideTheWindowOrWithAnOpenStatusAreIgnored(): void
    {
        $since = new \DateTimeImmutable('2026-11-12 10:00:00 UTC');

        $series = ThroughputSeries::build([
            ['minute' => '2026-11-12 09:59:00', 'status' => 'DONE', 'total' => 5],
            ['minute' => '2026-11-12 10:00:00', 'status' => 'IN_PROGRESS', 'total' => 5],
        ], $since, $since);

        self::assertSame([['minute' => '2026-11-12T10:00:00+00:00', 'done' => 0, 'cancelled' => 0, 'error' => 0]], $series);
    }
}
