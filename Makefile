.DEFAULT_GOAL := help
.PHONY: help init up down migration migrate users test test-api test-front front

COMPOSE := docker compose
RUN     := $(COMPOSE) run --rm api
EXEC    := $(COMPOSE) exec api
CONSOLE := $(EXEC) php bin/console

help: ## Liste les commandes disponibles
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

init: ## Première installation : image, dépendances, clés JWT, base, comptes de démo
	$(COMPOSE) build
	$(RUN) composer install
	$(RUN) php bin/console lexik:jwt:generate-keypair --skip-if-exists
	$(COMPOSE) up -d --wait
	@ls api/migrations/Version*.php >/dev/null 2>&1 || $(CONSOLE) doctrine:migrations:diff --no-interaction
	$(CONSOLE) doctrine:migrations:migrate --no-interaction
	$(CONSOLE) app:demo:create-users
	cd front && npm ci

up: ## Démarre l'API et la base
	$(COMPOSE) up -d --wait

down: ## Arrête les conteneurs
	$(COMPOSE) down

migration: ## Génère une migration à partir des entités
	$(CONSOLE) doctrine:migrations:diff

migrate: ## Applique les migrations
	$(CONSOLE) doctrine:migrations:migrate --no-interaction

users: ## Crée les comptes de démonstration
	$(CONSOLE) app:demo:create-users

front: ## Lance le front sur http://localhost:4200 (proxy /api vers l'API)
	cd front && npm start

test: test-api test-front ## Lance tous les tests

test-api: ## Tests PHPUnit (base app_test)
	$(CONSOLE) doctrine:database:create --env=test --if-not-exists
	$(EXEC) vendor/bin/phpunit

test-front: ## Tests Angular (Vitest)
	cd front && npx ng test --watch=false
