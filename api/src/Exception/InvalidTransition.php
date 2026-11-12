<?php

declare(strict_types=1);

namespace App\Exception;

/**
 * Règle métier violée : l'action demandée est incompatible avec l'état courant.
 * Les contrôleurs la traduisent en réponse 409.
 */
final class InvalidTransition extends \DomainException
{
}
