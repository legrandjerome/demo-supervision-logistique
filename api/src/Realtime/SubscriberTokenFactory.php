<?php

declare(strict_types=1);

namespace App\Realtime;

use App\Entity\User;
use Symfony\Component\Clock\ClockInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Jwt\Grant;

/**
 * Délivre le jeton d'abonné Mercure d'un utilisateur : un jeton d'accès au format du protocole
 * Mercure 1.0 (RFC 9068), limité à la lecture des sujets de supervision.
 *
 * La signature et les revendications communes (`iss`, `aud`, `client_id`) viennent de la
 * configuration du hub (`config/packages/mercure.yaml`) : une seule source pour les jetons
 * de publication et d'abonnement.
 */
final readonly class SubscriberTokenFactory
{
    public const int LIFETIME_IN_SECONDS = 3600;

    public function __construct(
        private HubInterface $hub,
        private ClockInterface $clock,
    ) {
    }

    /**
     * @return array{token: string, expiresAt: \DateTimeImmutable}
     */
    public function createFor(User $user): array
    {
        $factory = $this->hub->getFactory()
            ?? throw new \LogicException('Le hub Mercure doit être configuré avec un secret JWT (mercure.hubs.default.jwt.secret).');

        // Expiration à la seconde entière : avec des microsecondes, « exp » serait sérialisé en nombre décimal.
        $expiresAt = (new \DateTimeImmutable())->setTimestamp($this->clock->now()->getTimestamp() + self::LIFETIME_IN_SECONDS);

        $token = $factory->create(
            [new Grant([Grant::ACTION_SUBSCRIBE], LiveUpdates::TOPICS)],
            ['sub' => $user->getUserIdentifier(), 'exp' => $expiresAt],
        );

        return ['token' => $token, 'expiresAt' => $expiresAt];
    }
}
