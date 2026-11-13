<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\Input\MissionQuery;
use App\Entity\TransportMission;
use App\Enum\MissionStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
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

    /**
     * Nombre de missions par état, tous les états présents (zéro compris).
     *
     * @return array<string, int>
     */
    public function countByStatus(): array
    {
        $counts = array_fill_keys(array_column(MissionStatus::cases(), 'value'), 0);

        $rows = $this->createQueryBuilder('mission')
            ->select('mission.status AS status', 'COUNT(mission.id) AS total')
            ->groupBy('mission.status')
            ->getQuery()
            ->getArrayResult();

        foreach ($rows as $row) {
            $status = $row['status'] instanceof MissionStatus ? $row['status']->value : (string) $row['status'];
            $counts[$status] = (int) $row['total'];
        }

        return $counts;
    }

    /**
     * Missions closes (terminées, annulées, en erreur) regroupées par minute.
     * `date_trunc` n'existe pas en DQL : la requête est écrite en SQL.
     *
     * @return list<array{minute: string, status: string, total: int|string}>
     */
    public function closedPerMinuteSince(\DateTimeImmutable $since): array
    {
        $sql = <<<'SQL'
            SELECT date_trunc('minute', completed_at) AS minute, status, COUNT(*) AS total
            FROM transport_mission
            WHERE completed_at >= :since
            GROUP BY 1, 2
            ORDER BY 1
            SQL;

        return $this->getEntityManager()->getConnection()
            ->executeQuery($sql, ['since' => $since], ['since' => Types::DATETIME_IMMUTABLE])
            ->fetchAllAssociative();
    }

    /**
     * Missions en attente, les plus prioritaires puis les plus anciennes d'abord.
     *
     * @return list<TransportMission>
     */
    public function findPending(int $limit): array
    {
        return $this->findBy(['status' => MissionStatus::Created], ['priority' => 'ASC', 'createdAt' => 'ASC'], $limit);
    }

    /**
     * @return list<TransportMission>
     */
    public function findInProgress(): array
    {
        return $this->createQueryBuilder('mission')
            ->leftJoin('mission.equipment', 'equipment')
            ->addSelect('equipment')
            ->where('mission.status = :status')
            ->setParameter('status', MissionStatus::InProgress->value)
            ->getQuery()
            ->getResult();
    }
}
