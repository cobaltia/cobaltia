FROM node:20 as base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /bot

COPY --chown=node:node pnpm-lock.yaml .
COPY --chown=node:node package.json .
COPY ./.env ./.env

FROM base as builder

COPY --chown=node:node tsconfig.base.json .
COPY --chown=node:node src/ src/
COPY --chown=node:node prisma/ prisma/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm exec prisma generate
RUN pnpm exec prisma generate --sql
RUN pnpm run build

FROM builder as runner

ENV NODE_ENV="production"
ENV NODe_OPTIONS="--enable-source-maps"

USER node

CMD ["pnpm", "run", "start"]
