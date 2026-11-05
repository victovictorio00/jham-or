FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3012 HOSTNAME=0.0.0.0 PUBLICATION_FILE=/app/publication/store.json
RUN groupadd -r app && useradd -r -g app app && mkdir -p /app/uploads /app/publication /app/.next/cache/images && chown -R app:app /app/uploads /app/publication /app/.next
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/var/publication.json ./publication-seed.json
COPY --from=build --chown=app:app /app/scripts/start.mjs ./scripts/start.mjs
USER app
EXPOSE 3012
CMD ["node","scripts/start.mjs"]
