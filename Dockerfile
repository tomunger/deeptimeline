# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching.
# Workspace package manifests are needed for `npm ci` to resolve the workspaces.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/ingest/package.json apps/ingest/
RUN npm ci

# Build the static site (runs ingest, then `vite build` -> apps/web/dist).
# ingest writes into apps/web/public/data/, which is gitignored and absent here.
COPY . .
RUN mkdir -p apps/web/public/data && npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
