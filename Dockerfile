FROM node:24 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /bot

COPY --chown=node:node pnpm-lock.yaml .
COPY --chown=node:node package.json .

FROM base AS builder

COPY --chown=node:node tsconfig.base.json .
COPY --chown=node:node src/ src/
COPY --chown=node:node prisma/ prisma/

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm exec prisma generate
RUN pnpm exec prisma generate --sql
RUN pnpm run build

FROM builder AS runner

RUN apt-get update && apt-get install -y curl

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps"

USER node

EXPOSE 8282

CMD ["pnpm", "run", "start"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl -f http://localhost:8282/health || exit 1
