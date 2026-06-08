# Architecture & Tooling

Concise reference for how the project is structured, built, and deployed.
Ask for expansion on any section.

## Directory structure

A **monorepo** with two kinds of package under `packages/` (libraries) and
`apps/` (deployables):

```
deeptimeline/
├── package.json            # SOURCE  root: workspaces + top-level scripts
├── tsconfig.base.json      # SOURCE  shared compiler options, extended per package
├── package-lock.json       # SOURCE  exact resolved versions of all deps
├── data/                   # SOURCE  authoring data: gts.json, events.json, tags.json (edit here)
├── packages/
│   └── shared/             # @dtl/shared — pure TS: types, time math, GTS colors
│       ├── package.json    # SOURCE  shared's deps + scripts
│       └── src/            # SOURCE  index.ts, types.ts, time.ts, gts-colors.ts, *.test.ts
├── apps/
│   ├── web/                # @dtl/web — the React frontend (Vite)
│   │   ├── package.json    # SOURCE  web's deps + scripts
│   │   ├── vite.config.ts  # SOURCE  bundler config (incl. @dtl/shared alias)
│   │   ├── tsconfig.json   # SOURCE  web's compiler config
│   │   ├── index.html      # SOURCE  app entry HTML
│   │   ├── src/            # SOURCE  components, hooks, data loader, search, util
│   │   ├── public/data/    # GENERATED  published gts.json/events.json (ingest); gitignored
│   │   ├── dist/           # GENERATED  production build output (vite build); gitignored
│   │   └── node_modules/   # DEPENDENCIES  workspace-local bin shims / links; gitignored
│   └── ingest/             # @dtl/ingest — CLI: validate data/ -> publish public/data/
│       ├── package.json    # SOURCE  ingest's deps + scripts
│       └── src/            # SOURCE  index.ts (CLI), validate.ts (schema checks)
├── node_modules/           # DEPENDENCIES  all installed packages (hoisted); gitignored
│                           #   incl. @dtl/shared -> ../packages/shared (symlink)
├── doc/                    # this document
└── reference/              # source texts for mining events (not shipped)
```

### The data pipeline

`data/` is the **authoring source of truth** (edit it here). The ingest CLI
(`apps/ingest`) validates it against the schema and writes the **published
artifacts** to `apps/web/public/data/`, which the app fetches at runtime. So
`public/data/` is generated output (gitignored) — never edit it directly.

```
data/{gts,events}.json  --(npm run ingest: validate)-->  apps/web/public/data/{gts,events}.json
```

`npm run dev` and `npm run build` run ingest first, so the published data is
always regenerated from source. The validators live in
`apps/ingest/src/validate.ts` and enforce the @dtl/shared types at runtime
(enums, id uniqueness, date ordering, GTS parent references, hex colors, …);
a bad record fails the run and nothing is written.

`data/tags.json` is the **controlled tag vocabulary** (grouped; the first group
is geographical regions of the modern Earth). Ingest checks every event tag
against it, so tags stay consistent and typo-free. It is validation input only —
not published — and the tag id format is kebab-case.

`data/gts.json` (the full ICS chart, ~171 intervals down to ages) is **generated**
by `apps/ingest/src/gen-gts.ts` (`npx tsx apps/ingest/src/gen-gts.ts`), which
encodes the ICS boundaries, computes each unit's Wikipedia link, and assigns the
official ICS colour from `apps/ingest/src/ics-colors.json`. That colour table is
extracted from `reference/CGMW_ICS_colour_codes.xlsx` by
`reference/extract-ics-colors.py` (`python3 reference/extract-ics-colors.py`).
Edit the generator and re-run it rather than editing `data/gts.json` by hand;
ingest then validates + publishes it like any other source artifact.

### Three categories of directory

- **Source code** (hand-written; what you edit): `packages/shared/src/`,
  `apps/web/src/`, `apps/ingest/src/`, the authoring data in `data/`, plus the
  config files marked SOURCE above.
- **Dependency packages** (installed third-party code; never edited, gitignored,
  reproducible from `package-lock.json`): the root `node_modules/` holds all
  packages hoisted once for the whole monorepo and contains the
  `@dtl/shared` symlink; per-app `node_modules/` hold only workspace-local
  bin shims / links.
- **Compiled / generated** (never edited, gitignored): `apps/web/dist/` from
  `vite build`, and `apps/web/public/data/` from `npm run ingest`. (No
  `*.tsbuildinfo` — `tsc` runs `--noEmit`.)

### Where dependencies are declared

- **What** each package needs: that package's `package.json` —
  `apps/web/package.json` (`dependencies`: react, react-dom, marked, dompurify,
  `@dtl/shared`; `devDependencies`: vite, typescript, @types/\*,
  @vitejs/plugin-react), `packages/shared/package.json` (`devDependencies`:
  typescript, vitest), and `apps/ingest/package.json` (`devDependencies`: tsx,
  typescript, @types/node). The root `package.json` declares no runtime deps —
  only `workspaces` + aggregate scripts.
- **Exact resolved versions** of the entire tree: the single root
  `package-lock.json`.

## Package management

- **npm workspaces** (npm ships with Node; no pnpm/yarn needed). The root
  `package.json` lists `"workspaces": ["packages/*", "apps/*"]`.
- One `npm install` at the root installs everything into a single hoisted
  `node_modules/`.
- `@dtl/web` depends on `@dtl/shared` as `"*"`; npm **symlinks** it locally, so
  changes to shared are picked up with no publish step.
- Each package keeps its own `package.json` (its deps + scripts). `tsc` and
  `vite` are dev dependencies of the packages that use them.

## TypeScript compilation

Two distinct jobs, deliberately separated:

1. **Type checking** — `tsc --noEmit`. `tsc` never emits JS here; it only
   verifies types. Each package has a `tsconfig.json` that `extends`
   `tsconfig.base.json`. Root script `npm run typecheck` runs it across all
   workspaces.
2. **Transpile + bundle** (web only) — **Vite** (which uses **esbuild** for dev
   transforms and **Rollup** for production bundling). `npm run build` in
   `apps/web` runs `tsc --noEmit && vite build`.

`@dtl/shared` is **never separately compiled**. The web app imports it as TS
source via a path alias (`@dtl/shared` → `packages/shared/src/index.ts`),
declared in both `apps/web/vite.config.ts` (for the bundler) and
`apps/web/tsconfig.json` (for the type checker). Vite/esbuild transpiles
shared's `.ts` on the fly along with the app.

**Tests**: `vitest` runs the unit tests in `packages/shared` (`*.test.ts`).

**The ingest CLI** runs via **tsx** (esbuild-based TS runner) — no build step;
`tsx src/index.ts` executes the TypeScript directly.

### Common commands (from repo root)

| Command | Effect |
|---|---|
| `npm install` | install all workspaces |
| `npm run ingest` | validate `data/` and publish to `apps/web/public/data/` |
| `npm run dev` | ingest, then start the Vite dev server (`apps/web`) |
| `npm run typecheck` | type-check every workspace |
| `npm test` | run tests (currently `packages/shared`) |
| `npm run build` | ingest, then produce the production web bundle |

## Deployment

No backend server. Two independent things get published:

**1. Code (the frontend).** `vite build` produces a static `apps/web/dist/`
(HTML + hashed JS/CSS). Host it on any static host / CDN. Rebuilt and
redeployed only when the *application* changes.

**2. Data (the JSON artifacts).** Authored in `data/`, validated and emitted by
`npm run ingest` to `gts.json` / `events.json`, which the app fetches at runtime
from `/data/`. In production they live in a bucket/CDN and are published
**independently of the frontend** — re-run ingest, upload the JSON, done; no app
redeploy to ship new events. Cache-busting (content-hashed filenames or a
versioned path) ensures clients pick up the new data.

This split is the whole reason the data layer is static JSON: it's DOS-immune,
needs no server or rate limiting, and decouples "publish events" from "deploy
app". The trade-off is that all filtering and search happen client-side over the
loaded dataset (fine at the curated scale of thousands–tens of thousands of
events).

> Status: the production hosting + cache-busted publish pipeline (milestone M6)
> is **not yet implemented**. Today everything runs via `npm run dev`, which
> serves the JSON from `apps/web/public/data/`.
