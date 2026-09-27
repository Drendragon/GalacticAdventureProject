# Galactic Spacefarer Adventure

A local SAP CAP Node.js application written in TypeScript for the Galactic Spacefarer interview exercise.

## Current Phase

Phase 5 adds the TypeScript lifecycle handler for trusted planet assignment, deterministic creation defaults, active-record validation, and consistent department/position assignments. CAP still supplies generic CRUD and draft persistence. Row-level planet isolation and welcome-email delivery are added in subsequent phases. There is no Fiori application yet.

Development proceeds one phase at a time on `master`, with a review after every phase. The repository owner handles commits and pushes.

## Prerequisites

- Node.js 24.21.0 LTS and its bundled npm.
- Docker Desktop with Linux containers for MailHog. CAP and the automated tests run without Docker.

The CAP CLI is installed locally as a development dependency. Use the npm scripts below or `npx cds`; a global CLI installation is unnecessary.

With NVM for Windows, select Node with `nvm use 24.21.0`. The `.nvmrc` records the same version for tools that support it.

## Install and Run

```powershell
npm ci
npm run watch
```

Open the [CAP landing page](http://localhost:4004). The service is available at `/odata/v4/galactic`, and its [`$metadata` endpoint](http://localhost:4004/odata/v4/galactic/$metadata) describes the Spacefarers, Departments, and Positions entity sets. The endpoints require one of the configured demo users.

`npm start` runs `cds serve` without watching files. `npm run watch` runs `cds watch`, which restarts the server when project files change. CAP detects `tsconfig.json` and loads TypeScript through the locally installed `tsx` runner. Stop either command with Ctrl+C.

SQLite runs in memory for this local demo. CAP creates the three application tables from `db/schema.cds` and loads the CSV fixtures under `db/data` when the server starts. Data is reset to this seed state when the process restarts.

The model uses UUID keys. `Spacefarers` also use CAP's managed audit fields. Required persisted values, numeric defaults, numeric ranges, and association targets are declared in CDS. A position must belong to a department, while a spacefarer's department and position are optional. The service handler validates that a selected position belongs to the selected department, including the resulting state of partial updates.

The demo data contains six Earth and six Mars Spacefarers so each configured user will have more than one five-row page after planet isolation is implemented. Europa, Titan, Kepler-186f, and Proxima Centauri b provide additional filtering examples. The fixtures include unassigned Spacefarers, department-only assignments, and matching department/position assignments. CAP loads these rows during database initialization, outside service `CREATE` events, so the future welcome-email handler will not run for seed data.

`Spacefarers` is draft-enabled. CAP's generic OData handlers support draft creation, editing, activation, and discard, as well as direct active `POST`, `GET`, `PATCH`, and `DELETE` requests. The TypeScript handler derives `originPlanet` from the authenticated user, prevents reassignment, applies numeric defaults only on creation, and validates active creation and updates. New drafts receive the trusted planet immediately, while incomplete business fields remain editable until activation. The shared `Departments` and `Positions` catalogs allow reads and reject writes.

## TypeScript

Write application handlers, tests, and executable tooling in `.ts` files. CDS models remain `.cds` files. `tsconfig.json` enables strict type checking and source maps; `@cap-js/cds-types` provides CAP API types. CAP's standard `cds-typer` tooling generates model types as models are added. Generated `@cds-models/` files are ignored by Git and Prettier.

`tsx` runs TypeScript without checking types, so run `npm run typecheck` as well as `npm test`. Tests use Vitest's familiar `describe`, `it`, and `expect` API. `test/setup.ts` registers the same CommonJS `tsx` loader as the CAP CLI and enables TypeScript handler discovery when tests start CAP programmatically.

These start commands are for local development. A future production deployment should compile TypeScript to JavaScript and run the built service.

## Debug in VS Code

Open **Run and Debug**, select a configuration, and press **F5**:

| Configuration            | Behavior                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CAP: Debug**           | Type-checks the project and starts the CAP server with the debugger attached. No Docker required.                                                                 |
| **CAP: Debug + MailHog** | Type-checks, starts MailHog and CAP, then opens the application in a debug-enabled Chrome window. Stopping debugging also stops this project's MailHog container. |
| **CAP: Debug tests**     | Type-checks and runs the TypeScript tests with debugging enabled.                                                                                                 |

Set breakpoints in `.ts` files. The integrated MailHog profile opens CAP's reported server URL, which is the landing page until the Fiori application is added. The server profiles run once; restart the debug session after editing handlers. Stop any existing `npm start` or `npm run watch` process first so port `4004` is available.

The MailHog profile requires Docker Desktop to be running in Linux-container mode. It controls the same MailHog container as manual `docker compose` commands, including stopping it if it was already running. MailHog uses in-memory storage, so its inbox is cleared when restarted. If VS Code exits unexpectedly before teardown, run `docker compose stop mailhog` yourself. The debug tasks do not start or stop Docker Desktop.

## Demo Users

The following credentials are public development fixtures, not production accounts:

| Username          | Password          | Role             | Planet                  |
| ----------------- | ----------------- | ---------------- | ----------------------- |
| `earth-user`      | `earth-demo`      | `SpacefarerUser` | Earth                   |
| `mars-user`       | `mars-demo`       | `SpacefarerUser` | Mars                    |
| `planetless-user` | `planetless-demo` | `SpacefarerUser` | None (negative fixture) |

The landing page is public; the OData service requires the role above. CAP's built-in `basic` authentication validates these fixed users without enabling its default sample users. Unknown usernames are rejected. Use separate private browser sessions when switching users because browsers cache Basic authentication credentials.

These settings apply to development and tests. The production profile selects JWT authentication and requires future identity-provider configuration and dependencies; this repository is not a production deployment setup.

The planetless identity exists to prove that lifecycle writes require a valid planet attribute. The agreed security design has no administrator role or cross-planet bypass. At this phase, role-protected reads are not yet filtered by planet; row-level enforcement will be implemented and tested before the backend milestone is complete.

## MailHog

With Docker Desktop running:

```powershell
docker compose up -d mailhog
```

Open the [MailHog inbox](http://localhost:8025). SMTP listens on `127.0.0.1:1025`; both published ports are limited to the local machine. Messages stay in MailHog rather than being sent to external recipients. Its default storage is in memory, so restarting it clears the inbox.

The `.env.example` file documents the settings that the notification service will consume in Phase 6. When configuring that service, copy it to `.env`; local `.env` files are ignored by Git. CAP does not send email yet.

Stop this project's MailHog container with:

```powershell
docker compose down
```

## Checks

```powershell
npm run typecheck
npm test
npm run format:check
docker compose config --quiet
```

The tests start a real CAP server on an automatically selected port. Bootstrap coverage verifies the landing page, SQLite connectivity, OData metadata, and authentication. Domain-model coverage verifies table deployment, required fields, defaults, ranges, association contracts, and real association expansion. Seed-data coverage verifies catalog relationships, numeric boundaries, assignment consistency, planet variety, and pagination volume. Service coverage verifies exposed data, read-only catalogs, active CRUD, and the complete draft lifecycle. Lifecycle coverage verifies trusted planets, defaults, active validation, partial-update integrity, and draft activation boundaries. Tests do not need Docker or MailHog.

Formatting covers supported source, configuration, and documentation files. Plain Prettier does not format CDS files.

## Files to Explore

| File or directory           | Purpose                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `package.json`              | Runtime and development dependencies, commands, and CAP configuration profiles.    |
| `package-lock.json`         | Resolved dependency versions for reproducible installs with `npm ci`.              |
| `srv/galactic-service.cds`  | The protected OData service with draft-enabled Spacefarers and read-only catalogs. |
| `srv/galactic-service.ts`   | Small service entry point that registers the Spacefarer lifecycle handlers.        |
| `srv/lifecycle/`            | Trusted-planet, active-record, assignment, and shared-type modules.                |
| `db/schema.cds`             | The persistence model for Spacefarers and the shared catalogs.                     |
| `db/data/`                  | Deterministic CSV fixtures loaded into the local database at startup.              |
| `test/bootstrap.test.ts`    | TypeScript tests using `cds.test` and Vitest.                                      |
| `test/domain-model.test.ts` | Model compilation and SQLite persistence tests.                                    |
| `test/seed-data.test.ts`    | Seed loading, relationship consistency, and demo-volume tests.                     |
| `test/service.test.ts`      | OData projections, catalog protection, active CRUD, and draft lifecycle tests.     |
| `test/lifecycle.test.ts`    | Focused creation, update, assignment, default, and draft integrity tests.          |
| `vitest.config.mts`         | Vitest setup and serial test-file execution for the shared CAP test server.        |
| `tsconfig.json`             | Strict TypeScript settings, CAP type resolution, and source maps.                  |
| `.vscode/launch.json`       | Debug configurations for the server and tests.                                     |
| `.vscode/tasks.json`        | Type-checking and MailHog lifecycle tasks for debugging.                           |
| `compose.yaml`              | Local MailHog container.                                                           |

## Design and Future Work

See the [assignment](doc/galactic_spacefarer_assignment.md), [backend design](doc/backend-design.md), and [implementation progress](doc/implementation-progress.md).

Future galactic administration could support government reports across planets and controlled planet reassignment. Those features need a separate authorization design and are outside this homework implementation. Real identity-provider integration and durable email retries are also future work.
