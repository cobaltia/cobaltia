# Repository Guidance

## Execution Model

- The README is leftover template prose. This is a single-package Sapphire/discord.js bot with an HTTP API,
  PostgreSQL (Prisma), and Redis-backed scheduled tasks.
- Startup is `src/cobaltia.ts` -> `src/lib/setup/all.ts` side effects -> `CobaltClient` -> login.
  Setup registers plugins and shared services on Sapphire's `container`; service typings use module augmentation.
  Do not import startup/setup modules in unit tests; mock `container` services as in `tests/lib/util/experience.test.ts`.
- Sapphire discovers compiled pieces. Custom `items` and `events` stores are registered in `CobaltClient`;
  `src/events` contains runnable game events, not Discord listeners (those are in `src/listeners`).
- Runtime ESM aliases resolve to `dist` through `package.json#imports`; TypeScript maps them to source in
  `src/tsconfig.json`. `vitest.config.ts` and `tests/tsconfig.json` have separate mappings, currently only
  `#lib`, `#root`, and `#util` (not `#structures`). Keep these mappings aligned when adding aliases.

## Commands

- Run from the repository root. Install with `pnpm install --frozen-lockfile`.
  CI uses pnpm 9 / Node 20; Docker uses Node 24 (the toolchains are not aligned).
- `pnpm build` is the source typecheck and compile (`tsc -b src`), not a root `tsc` invocation.
  `pnpm dev` builds once and starts the bot, with no watcher. `pnpm start` runs existing `dist/cobaltia.js`.
- `pnpm run lint --fix=false` checks without modifying files; plain `pnpm lint` autofixes.
  `pnpm test:format` checks formatting; focused check: `pnpm exec prettier --check <path>`.
- `pnpm test` runs the unit suite without live services; `pnpm test --coverage` matches CI.
  Single file: `pnpm test tests/lib/util/experience.test.ts`; add `-t nextLevel` to select tests by name.

## Prisma And Deployment

- Builds need generated Prisma Client **and TypedSQL** (`@prisma/client/sql`). With a reachable PostgreSQL database
  matching the schema, run `pnpm exec prisma generate` then `pnpm exec prisma generate --sql` before `pnpm build`.
  Plain `pnpm build` does not generate either. SQL sources live in `prisma/sql`; review them alongside schema changes.
- **`pnpm prisma:push` and `pnpm build:ci` modify the database selected by `DATABASE_URL`.**
  `build:ci` runs client generation -> `prisma db push` -> TypedSQL generation -> TypeScript compilation.
  Use a disposable development/CI database, never a shared or production URL for build verification.
- `db push` does not create migrations. Changes under `prisma/migrations/**` pushed to `main` trigger the database
  deployment workflow against its configured secret URL; schema-only changes do not trigger it.

## Runtime Hazards

- **Use a dedicated Redis instance:** `CobaltClient.destroy()` runs `FLUSHALL`, deleting every Redis database,
  not just this bot's keys. Login failure and SIGINT invoke this cleanup.
- `src/config.ts` loads root `.env`; consult its parsers rather than treating `.env.example` as complete.
  Set `NODE_ENV` in the launching environment, since it defaults to `development` before env loading.
  Redis defaults to `redis://localhost:6379`; Discord needs Guild Members and Message Content privileged intents.
- `API_ENABLED=false` only removes API options; the unconditionally registered API plugin still connects on its
  default port 4000. Do not treat this flag as disabling the HTTP server.
- Docker healthchecks expect `/health` on port 8282: configure `API_ENABLED=true` and `API_ORIGIN`.
  `docker-compose.yml` only supplies the bot and Redis; it does not provide PostgreSQL, bot env variables,
  or the Docker build's `DATABASE_URL` argument needed for TypedSQL generation.

## Local Conventions

- ESLint requires `interface` for object type definitions. Formatting rules are in `.prettierrc.json`.
- Pre-commit runs lint-staged (Prettier and ESLint autofixes). Commit messages follow Angular commitlint;
  the allowed types and overrides are in `.commitlintrc.json`.
