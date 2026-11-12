<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\Input\CreateMissionInput;
use App\Dto\Input\MissionQuery;
use App\Dto\MissionView;
use App\Dto\PageView;
use App\Entity\TransportMission;
use App\Entity\User;
use App\Exception\InvalidTransition;
use App\Repository\TransportMissionRepository;
use App\Service\MissionReferenceGenerator;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Component\Clock\ClockInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapQueryString;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[Route('/api/missions')]
final readonly class MissionController
{
    public function __construct(
        private TransportMissionRepository $missions,
        private EntityManagerInterface $entityManager,
        private ClockInterface $clock,
        private MissionReferenceGenerator $references,
    ) {
    }

    #[Route('', name: 'api_missions_list', methods: ['GET'])]
    public function list(
        #[MapQueryString(validationFailedStatusCode: Response::HTTP_BAD_REQUEST)]
        MissionQuery $query = new MissionQuery(),
    ): JsonResponse {
        $result = $this->missions->paginate($query);

        return new JsonResponse(new PageView(
            items: array_map(MissionView::fromEntity(...), $result['items']),
            total: $result['total'],
            page: $query->page,
            limit: $query->limit,
        ));
    }

    #[Route('', name: 'api_missions_create', methods: ['POST'])]
    #[IsGranted(User::ROLE_OPERATOR)]
    public function create(#[MapRequestPayload] CreateMissionInput $input): JsonResponse
    {
        $mission = new TransportMission(
            reference: $this->references->generate(),
            loadUnit: trim($input->loadUnit),
            source: trim($input->source),
            destination: trim($input->destination),
            priority: $input->priority,
            now: $this->clock->now(),
        );
        $this->entityManager->persist($mission);
        $this->entityManager->flush();

        return new JsonResponse(MissionView::fromEntity($mission), Response::HTTP_CREATED);
    }

    #[Route('/{id}/cancel', name: 'api_missions_cancel', requirements: ['id' => '\d+'], methods: ['POST'])]
    #[IsGranted(User::ROLE_SUPERVISOR)]
    public function cancel(#[MapEntity(id: 'id')] TransportMission $mission): JsonResponse
    {
        try {
            $mission->cancel($this->clock->now());
        } catch (InvalidTransition $exception) {
            throw new ConflictHttpException($exception->getMessage(), $exception);
        }
        $this->entityManager->flush();

        return new JsonResponse(MissionView::fromEntity($mission));
    }
}
