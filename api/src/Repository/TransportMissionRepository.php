<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\Input\MissionQuery;
use App\Entity\TransportMission;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TransportMission>
 */
final class TransportMissionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransportMission::class);
    }

    /**
     * Page de missions, les plus récentes d'abord.
     *
     * @return array{items: list<TransportMission>, total: int}
     */
    public function paginate(MissionQuery $query): array
    {
        $builder = $this->createQueryBuilder('mission')
            ->leftJoin('mission.equipment', 'equipment')
            ->addSelect('equipment')
            ->orderBy('mission.createdAt', 'DESC')
            ->addOrderBy('mission.id', 'DESC')
            ->setFirstResult(($query->page - 1) * $query->limit)
            ->setMaxResults($query->limit);

        if (null !== $query->status) {
            $builder
                ->andWhere('mission.status = :status')
                ->setParameter('status', $query->status->value);
        }

        $search = trim((string) $query->search);
        if ('' !== $search) {
            // Les caractères joker saisis par l'utilisateur sont neutralisés.
            $pattern = '%'.addcslashes(mb_strtolower($search), '%_\\').'%';
            $builder
                ->andWhere('(LOWER(mission.reference) LIKE :search OR LOWER(mission.loadUnit) LIKE :search)')
                ->setParameter('search', $pattern);
        }

        // La jointure porte sur une relation « vers un » : pas besoin de la requête de comptage par sous-sélection.
        $paginator = new Paginator($builder->getQuery(), fetchJoinCollection: false);

        return [
            'items' => array_values(iterator_to_array($paginator)),
            'total' => \count($paginator),
        ];
    }
}
