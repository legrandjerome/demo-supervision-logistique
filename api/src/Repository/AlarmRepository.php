<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Alarm;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Alarm>
 */
final class AlarmRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Alarm::class);
    }

    /**
     * Alarmes les plus récentes d'abord, équipement et acquitteur chargés dans la même requête.
     *
     * @return list<Alarm>
     */
    public function findAllMostRecentFirst(): array
    {
        return $this->createQueryBuilder('alarm')
            ->innerJoin('alarm.equipment', 'equipment')
            ->addSelect('equipment')
            ->leftJoin('alarm.acknowledgedBy', 'user')
            ->addSelect('user')
            ->orderBy('alarm.raisedAt', 'DESC')
            ->addOrderBy('alarm.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
