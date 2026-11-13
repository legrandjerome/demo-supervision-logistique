<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\EquipmentView;
use App\Dto\Input\ChangeEquipmentStatusInput;
use App\Entity\Equipment;
use App\Entity\User;
use App\Realtime\LiveUpdates;
use App\Repository\EquipmentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Component\Clock\ClockInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[Route('/api/equipments')]
final readonly class EquipmentController
{
    public function __construct(
        private EquipmentRepository $equipments,
        private EntityManagerInterface $entityManager,
        private ClockInterface $clock,
        private LiveUpdates $liveUpdates,
    ) {
    }

    #[Route('', name: 'api_equipments_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        return new JsonResponse(array_map(
            EquipmentView::fromEntity(...),
            $this->equipments->findAllOrderedByCode(),
        ));
    }

    #[Route('/{id}/status', name: 'api_equipments_change_status', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    #[IsGranted(User::ROLE_SUPERVISOR)]
    public function changeStatus(
        #[MapEntity(id: 'id')] Equipment $equipment,
        #[MapRequestPayload] ChangeEquipmentStatusInput $input,
    ): JsonResponse {
        $equipment->changeStatus($input->status, $this->clock->now());
        $this->entityManager->flush();
        $this->liveUpdates->equipmentChanged($equipment);

        return new JsonResponse(EquipmentView::fromEntity($equipment));
    }
}
