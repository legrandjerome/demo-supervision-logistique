# Image de développement et de CI : FrankenPHP (PHP 8.4) + extensions + Composer.
FROM dunglas/frankenphp:1-php8.4

RUN install-php-extensions pdo_pgsql intl zip opcache @composer

ENV COMPOSER_ALLOW_SUPERUSER=1
WORKDIR /app
