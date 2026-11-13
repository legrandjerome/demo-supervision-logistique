<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\AlarmView;
use App\Entity\Alarm;
use App\Entity\User;
use App\Exception\InvalidTransition;
use App\Realtime\LiveUpdates;
use App\Repository\AlarmRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Component\Clock\ClockInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[Route('/api/alarms')]
final readonly class AlarmController
{
    public function __construct(
        private AlarmRepository $alarms,
        private EntityManagerInterface $entityManager,
        private ClockInterface $clock,
        private LiveUpdates $liveUpdates,
    ) {
    }

    #[Route('', name: 'api_alarms_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        return new JsonResponse(array_map(
            AlarmView::fromEntity(...),
            $this->alarms->findAllMostRecentFirst(),
        ));
    }

    #[Route('/{id}/acknowledge', name: 'api_alarms_acknowledge', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[IsGranted(User::ROLE_OPERATOR)]
    public function acknowledge(
        #[MapEntity(id: 'id')] Alarm $alarm,
        #[CurrentUser] User $user,
    ): JsonResponse {
        try {
            $alarm->acknowledge($user, $this->clock->now());
        } catch (InvalidTransition $exception) {
            throw new ConflictHttpException($exception->getMessage(), $exception);
        }
        $this->entityManager->flush();
        $this->liveUpdates->alarmChanged($alarm);

        return new JsonResponse(AlarmView::fromEntity($alarm));
    }
}
