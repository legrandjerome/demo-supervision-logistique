<?php

declare(strict_types=1);

namespace App\Dto;

/**
 * Enveloppe des listes paginées.
 *
 * @template T of object
 */
final readonly class PageView
{
    /**
     * @param list<T> $items
     */
    public function __construct(
        public array $items,
        public int $total,
        public int $page,
        public int $limit,
    ) {
    }
}
