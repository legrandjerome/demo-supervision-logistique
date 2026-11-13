<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\TransportMissionRepository;
use App\Stats\ThroughputSeries;
use Symfony\Component\Clock\ClockInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;

#[AsController]
final readonly class StatsController
{
    private const int WINDOW_IN_MINUTES = 30;

    public function __construct(
        private TransportMissionRepository $missions,
        private ClockInterface $clock,
    ) {
    }

    /** Activité récente : missions closes par minute sur la fenêtre, et répartition par état. */
    #[Route('/api/stats/activity', name: 'api_stats_activity', methods: ['GET'])]
    public function activity(): JsonResponse
    {
        $now = $this->clock->now();
        $since = $now->modify(\sprintf('-%d minutes', self::WINDOW_IN_MINUTES - 1));

        return new JsonResponse([
            'windowInMinutes' => self::WINDOW_IN_MINUTES,
            'throughput' => ThroughputSeries::build($this->missions->closedPerMinuteSince($since), $since, $now),
            'missionsByStatus' => $this->missions->countByStatus(),
        ]);
    }
}
