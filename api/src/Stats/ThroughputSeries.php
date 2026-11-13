<?php

declare(strict_types=1);

namespace App\Stats;

use App\Enum\MissionStatus;

/**
 * Transforme les comptages bruts par minute en série continue : une entrée par minute, même vide.
 */
final class ThroughputSeries
{
    /**
     * @param iterable<array{minute: string|\DateTimeInterface, status: string, total: int|string}> $rows
     *
     * @return list<array{minute: string, done: int, cancelled: int, error: int}>
     */
    public static function build(iterable $rows, \DateTimeImmutable $since, \DateTimeImmutable $until): array
    {
        $keys = [
            MissionStatus::Done->value => 'done',
            MissionStatus::Cancelled->value => 'cancelled',
            MissionStatus::Error->value => 'error',
        ];

        $buckets = [];
        $last = self::floorToMinute($until);
        for ($minute = self::floorToMinute($since); $minute <= $last; $minute = $minute->modify('+1 minute')) {
            $buckets[$minute->getTimestamp()] = [
                'minute' => $minute->format(\DATE_ATOM),
                'done' => 0,
                'cancelled' => 0,
                'error' => 0,
            ];
        }

        foreach ($rows as $row) {
            $minute = $row['minute'] instanceof \DateTimeInterface
                ? \DateTimeImmutable::createFromInterface($row['minute'])
                : new \DateTimeImmutable($row['minute'], $since->getTimezone());
            $timestamp = self::floorToMinute($minute)->getTimestamp();
            $key = $keys[$row['status']] ?? null;

            if (null !== $key && isset($buckets[$timestamp])) {
                $buckets[$timestamp][$key] += (int) $row['total'];
            }
        }

        return array_values($buckets);
    }

    private static function floorToMinute(\DateTimeImmutable $instant): \DateTimeImmutable
    {
        return $instant->setTime((int) $instant->format('H'), (int) $instant->format('i'));
    }
}
