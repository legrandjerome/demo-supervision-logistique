# Production : build Angular, puis Caddy sert les fichiers statiques et relaie l'API et Mercure.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npx ng build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/front/browser /srv
