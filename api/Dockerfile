# Socle commun : FrankenPHP (PHP 8.4) + extensions + Composer.
FROM dunglas/frankenphp:1-php8.4 AS base

RUN install-php-extensions pdo_pgsql intl zip opcache @composer

ENV COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /app

# Développement et CI : le code est monté en volume, rien n'est copié dans l'image.
FROM base AS dev

# Production : code et dépendances figés dans l'image, cache Symfony préchauffé.
FROM base AS prod

ENV APP_ENV=prod APP_DEBUG=0 SERVER_NAME=":80"
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-progress --no-interaction --prefer-dist

COPY . ./
RUN composer dump-autoload --no-dev --classmap-authoritative \
    && composer dump-env prod \
    && php bin/console cache:warmup
