# Galactic Spacefarer Adventure

A local SAP CAP Node.js application written in TypeScript for the Galactic Spacefarer interview exercise.

## Current Phase

Phase 17 provides Fiori-compatible validation errors. Required fields, numeric ranges, and association targets use CAP's declarative CDS constraints, which produce standard OData codes and affected-property targets for Fiori. TypeScript remains responsible for authenticated-planet policy, explicit nulls on defaulted numeric fields, and department/position consistency. There is no administrator or cross-planet bypass.

Development proceeds one phase at a time on `master`, with a review after every phase. The repository owner handles commits and pushes.

## Prerequisites

- Node.js 24.21.0 LTS and its bundled npm.
- Docker Desktop with Linux containers for MailHog. CAP and the automated tests run without Docker.

The CAP CLI is installed locally as a development dependency. Use the npm scripts below or `npx cds`; a global CLI installation is unnecessary.

With NVM for Windows, select Node with `nvm use 24.21.0`. The `.nvmrc` records the same version for tools that support it.

## Install and Run

```powershell
npm ci
npm run watch-spacefarer
```

Open the [Spacefarer application](http://localhost:4004/spacefarers/index.html) or the [CAP landing page](http://localhost:4004). The service is available at `/odata/v4/galactic`, and its [`$metadata` endpoint](http://localhost:4004/odata/v4/galactic/$metadata) describes the Spacefarers, Departments, and Positions entity sets. The application and endpoints require one of the configured demo users.

In the Spacefarer application, choose **Create**, complete the required First Name, Last Name, and Email fields, and choose **Create** on the draft page to save it. Origin Planet is filled by the backend from the signed-in user's identity. When MailHog is running, the saved record appears in the list and its welcome message appears in the MailHog inbox.

Fiori derives filter, form, and generated-control labels from the service metadata, including **Origin Planet**, **Stardust Collection**, **Wormhole Navigation Skill**, and **Spacesuit Color**. These annotations use `{@i18n>key}` bindings to the generated app's `@i18n` model and resolve values from `app/spacefarer/webapp/i18n/i18n.properties`, whose root bundle contains the English text. The leading `@` is significant: `{i18n>key}` is CAP's server-side placeholder syntax and cannot resolve this frontend-only bundle. The UI5 bootstrap also defaults to English so standard Fiori buttons and messages do not inherit a different browser language. The Email property uses Fiori's standard email-address semantic behavior.

A future Hungarian translation can be added as `i18n_hu.properties`. At that point, add `hu` to the manifest's supported locales and provide the desired locale-selection mechanism; the CDS annotations will continue using the same resource keys.

`npm start` runs `cds serve` without watching files. `npm run watch` runs `cds watch`, which restarts the server when project files change. CAP detects `tsconfig.json` and loads TypeScript through the locally installed `tsx` runner. Stop either command with Ctrl+C.

SQLite runs in memory for this local demo. CAP creates the three application tables from `db/schema.cds` and loads the CSV fixtures under `db/data` when the server starts. Data is reset to this seed state when the process restarts.

The model uses UUID keys. `Spacefarers` also use CAP's managed audit fields. Required persisted values, numeric defaults, numeric ranges, and association targets are declared in CDS. A position must belong to a department, while a spacefarer's department and position are optional. The service handler validates that a selected position belongs to the selected department, including the resulting state of partial updates.

The demo data contains six Earth and six Mars Spacefarers, so each configured user has more than one five-row page. Europa, Titan, Kepler-186f, and Proxima Centauri b remain invisible to the Earth and Mars users and provide additional isolation fixtures. The fixtures include unassigned Spacefarers, department-only assignments, and matching department/position assignments. CAP loads these rows during database initialization, outside service `CREATE` events, so seed loading does not send welcome emails.

`Spacefarers` is draft-enabled. CAP's generic OData handlers support draft creation, editing, activation, and discard, as well as direct active `POST`, `GET`, `PATCH`, and `DELETE` requests. The TypeScript handler derives `originPlanet` from the authenticated user, prevents reassignment, applies numeric defaults only on creation, and validates active creation and updates. New drafts receive the trusted planet immediately, while incomplete business fields remain editable until activation. The shared `Departments` and `Positions` catalogs allow reads and reject writes.

Validation failures use structured OData errors. CAP's `@mandatory`, `@assert.range`, and `@assert.target` constraints handle ordinary input validation and supply standard codes such as `ASSERT_MANDATORY` and `ASSERT_RANGE`. Messages use field names intended for people, such as **Stardust collection cannot be negative.**, **Navigation skill must be between 0 and 100.**, and **Origin planet must match your assigned planet.** Each editable-field error includes its OData property target, allowing Fiori to present the message in context. Draft activation returns the same structure and leaves the draft available for correction.

## TypeScript

Write application handlers, tests, and executable tooling in `.ts` files. CDS models remain `.cds` files. `tsconfig.json` enables strict type checking and source maps; `@cap-js/cds-types` provides CAP API types. CAP's standard `cds-typer` tooling generates model types as models are added. Generated `@cds-models/` files are ignored by Git and Prettier.

`tsx` runs TypeScript without checking types, so run `npm run typecheck` as well as `npm test`. The root type-check command validates both the CAP backend and the Fiori application. `npm run lint:frontend` applies the Fiori tools ESLint rules, and `npm run build:frontend` creates the optimized UI5 bundle. Tests use Vitest's familiar `describe`, `it`, and `expect` API. `test/setup.ts` registers the same CommonJS `tsx` loader as the CAP CLI, enables TypeScript handler discovery, and disables UI5 middleware only for isolated backend test servers.

These start commands are for local development. A future production deployment should compile TypeScript to JavaScript and run the built service.

## Debug in VS Code

Open **Run and Debug**, select a configuration, and press **F5**:

| Configuration            | Behavior                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CAP: Debug**           | Type-checks the project and starts the CAP server with the debugger attached. No Docker required.                                                                            |
| **CAP: Debug + MailHog** | Type-checks, starts MailHog and CAP, then opens the Spacefarer application in a debug-enabled Chrome window. Stopping debugging also stops this project's MailHog container. |
| **CAP: Debug tests**     | Type-checks and runs the TypeScript tests with debugging enabled.                                                                                                            |

Set breakpoints in `.ts` files. The integrated MailHog profile opens the Fiori application directly after CAP reports that the server is ready. The server profiles run once; restart the debug session after editing handlers. Stop any existing `npm start` or `npm run watch` process first so port `4004` is available.

The MailHog profile requires Docker Desktop to be running in Linux-container mode. It controls the same MailHog container as manual `docker compose` commands, including stopping it if it was already running. MailHog uses in-memory storage, so its inbox is cleared when restarted. If VS Code exits unexpectedly before teardown, run `docker compose stop mailhog` yourself. The debug tasks do not start or stop Docker Desktop.

Install the workspace recommendations when VS Code offers them. They include SAP CDS language support and the SAP Fiori tools extension pack used to generate and maintain the UI application.

## Demo Users

The following credentials are public development fixtures, not production accounts:

| Username          | Password               | Role             | Planet                   |
| ----------------- | ---------------------- | ---------------- | ------------------------ |
| `earth-user`      | `earth-demo`           | `SpacefarerUser` | Earth                    |
| `earth-colleague` | `earth-colleague-demo` | `SpacefarerUser` | Earth                    |
| `mars-user`       | `mars-demo`            | `SpacefarerUser` | Mars                     |
| `planetless-user` | `planetless-demo`      | `SpacefarerUser` | None (negative fixture)  |
| `roleless-user`   | `roleless-demo`        | None             | Earth (negative fixture) |

The landing page is public; the OData service requires the role above. CAP's built-in `basic` authentication validates these fixed users without enabling its default sample users. Unknown usernames are rejected. Use separate private browser sessions when switching users because browsers cache Basic authentication credentials.

These settings apply to development and tests. The production profile selects JWT authentication and requires future identity-provider configuration and dependencies; this repository is not a production deployment setup.

The planetless identity proves that all Spacefarer operations require a valid planet attribute. The roleless identity proves that successful authentication does not grant access without `SpacefarerUser`. `earth-colleague` proves that two users can share Earth active records while drafts remain private to their owner. A CDS instance restriction filters active records, counts, expansions, mutations, and batch subrequests by `$user.planet`; CAP's draft ownership rules protect direct draft access. A source-navigation guard applies both the planet and draft-owner predicates when following associations from a draft, including generated draft-administration data. The agreed security design has no administrator role or cross-planet bypass.

## MailHog

With Docker Desktop running:

```powershell
docker compose up -d mailhog
```

Open the [MailHog inbox](http://localhost:8025). SMTP listens on `127.0.0.1:1025`; both published ports are limited to the local machine. Messages stay in MailHog rather than being sent to external recipients. Its default storage is in memory, so restarting it clears the inbox.

With MailHog running, execute `npm run test:mailhog` for the explicit SMTP integration check. It sends one welcome message to a unique test address and verifies its subject and body through MailHog's local HTTP API. The routine `npm test` suite excludes this check and never requires SMTP.

The notification service defaults to this local MailHog instance. Copy `.env.example` to `.env` to change its SMTP host, port, sender, secure-transport flag, and connection, greeting, or socket timeouts. Configure both `SMTP_USER` and `SMTP_PASSWORD` when a future SMTP provider requires credentials; local MailHog requires neither. Local `.env` files are ignored by Git.

CAP sends a welcome message after a new active Spacefarer is committed, including activation of a new draft. Delivery is best effort: SMTP failures are logged after commit and do not remove the created record or turn its successful API response into a failure. This version has no durable outbox or automatic retry, so process interruption or SMTP failure can lose a notification.

Stop this project's MailHog container with:

```powershell
docker compose down
```

## API Demo

With Docker Desktop running, start MailHog and CAP in separate terminals:

```powershell
docker compose up -d mailhog
```

```powershell
npm start
```

The following PowerShell setup creates Basic-auth headers for both demo planets:

```powershell
$api = "http://localhost:4004/odata/v4/galactic"

function New-DemoHeaders([string]$credentials) {
  $token = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($credentials))
  @{ Authorization = "Basic $token"; Accept = "application/json" }
}

$earth = New-DemoHeaders "earth-user:earth-demo"
$mars = New-DemoHeaders "mars-user:mars-demo"
```

Read the first five records for each planet in descending stardust order, expand their assignments, and request each filtered count:

```powershell
$earthQuery = '/Spacefarers?$filter=originPlanet%20eq%20%27Earth%27&$orderby=stardustCollection%20desc&$top=5&$skip=0&$count=true&$expand=department,position'
$marsQuery = '/Spacefarers?$filter=originPlanet%20eq%20%27Mars%27&$orderby=stardustCollection%20desc&$top=5&$skip=0&$count=true&$expand=department,position'

Invoke-RestMethod -Uri ($api + $earthQuery) -Headers $earth
Invoke-RestMethod -Uri ($api + $marsQuery) -Headers $mars
```

Create, read, update, and delete an active Spacefarer. The API derives `originPlanet` from the Earth identity and MailHog captures a welcome email after the create commits.

```powershell
$body = @{
  IsActiveEntity = $true
  firstName = "API"
  lastName = "Voyager"
  email = "api.voyager@galactic.example"
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "$api/Spacefarers" -Method Post -Headers $earth -ContentType "application/json" -Body $body
$activeKey = "Spacefarers(ID=$($created.ID),IsActiveEntity=true)"

Invoke-RestMethod -Uri "$api/$activeKey" -Headers $earth
Invoke-RestMethod -Uri "$api/$activeKey" -Method Patch -Headers $earth -ContentType "application/json" -Body '{"spacesuitColor":"Cerulean"}'
Invoke-RestMethod -Uri "$api/$activeKey" -Method Delete -Headers $earth
```

Create and activate a draft, then open a later edit and discard it:

```powershell
$draftBody = @{
  firstName = "Draft"
  lastName = "Voyager"
  email = "draft.voyager@galactic.example"
} | ConvertTo-Json

$draft = Invoke-RestMethod -Uri "$api/Spacefarers" -Method Post -Headers $earth -ContentType "application/json" -Body $draftBody
$draftKey = "Spacefarers(ID=$($draft.ID),IsActiveEntity=false)"
$activeKey = "Spacefarers(ID=$($draft.ID),IsActiveEntity=true)"

Invoke-RestMethod -Uri "$api/$draftKey/draftActivate" -Method Post -Headers $earth -ContentType "application/json" -Body '{}'
Invoke-RestMethod -Uri "$api/$activeKey/draftEdit" -Method Post -Headers $earth -ContentType "application/json" -Body '{"PreserveChanges":false}'
Invoke-RestMethod -Uri "$api/$draftKey" -Method Patch -Headers $earth -ContentType "application/json" -Body '{"spacesuitColor":"Gold"}'
Invoke-RestMethod -Uri "$api/$draftKey" -Method Delete -Headers $earth
Invoke-RestMethod -Uri "$api/$activeKey" -Method Delete -Headers $earth
```

Invalid input returns an OData error object containing `error.code`, `error.message`, and, when applicable, `error.target`. For example, this request returns HTTP 400 with **Stardust collection cannot be negative.** as its message and `stardustCollection` as its target:

```powershell
try {
  Invoke-RestMethod -Uri "$api/Spacefarers" -Method Post -Headers $earth -ContentType "application/json" -Body '{"IsActiveEntity":true,"firstName":"Invalid","lastName":"Candidate","email":"invalid@galactic.example","stardustCollection":-1}'
} catch {
  $_.ErrorDetails.Message
}
```

## Checks

```powershell
npm run typecheck
npm run lint:frontend
npm run build:frontend
npm test
npm run format:check
docker compose config --quiet
```

The tests start a real CAP server on an automatically selected port. Bootstrap coverage verifies the landing page, SQLite connectivity, and authorized OData metadata access. Authorization coverage distinguishes anonymous, unknown-user, and missing-role failures. Planet-isolation coverage verifies collections, counts, direct records, mutations, drafts, active and draft navigations, generated draft metadata, shared catalogs, missing attributes, and OData batches. Domain-model coverage verifies table deployment, required fields, defaults, ranges, association contracts, and real association expansion. Seed-data coverage verifies catalog relationships, numeric boundaries, assignment consistency, planet variety, and pagination volume. Service coverage verifies exposed data, read-only catalogs, active CRUD, and the complete draft lifecycle. Lifecycle coverage verifies trusted planets, defaults, active validation, partial-update integrity, and draft activation boundaries. Fiori error coverage verifies exact user-facing messages, OData codes, property targets, severity, draft activation, and correction after a rejected save. Notification coverage verifies message construction, SMTP transport configuration, post-commit delivery, suppression for other lifecycle events, and preservation of committed data when delivery fails. Automated tests inject a notification test double and do not need Docker or MailHog.

Formatting covers supported source, configuration, and documentation files. Plain Prettier does not format CDS files.

## Files to Explore

| File or directory                     | Purpose                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `package.json`                        | Runtime and development dependencies, commands, and CAP configuration profiles.    |
| `package-lock.json`                   | Resolved dependency versions for reproducible installs with `npm ci`.              |
| `srv/galactic-service.cds`            | The protected OData service with draft-enabled Spacefarers and read-only catalogs. |
| `srv/galactic-constraints.cds`        | Declarative required-field and numeric-range validation with readable messages.    |
| `srv/galactic-service.ts`             | Small service entry point that registers the Spacefarer lifecycle handlers.        |
| `srv/lifecycle/`                      | Trusted-planet, active-record, assignment, and shared-type modules.                |
| `srv/services/`                       | Configurable SMTP notification boundary and welcome-message construction.          |
| `db/schema.cds`                       | The persistence model for Spacefarers and the shared catalogs.                     |
| `db/data/`                            | Deterministic CSV fixtures loaded into the local database at startup.              |
| `test/bootstrap.test.ts`              | TypeScript tests using `cds.test` and Vitest.                                      |
| `test/authorization.test.ts`          | Anonymous, invalid-credential, and missing-role access tests.                      |
| `test/domain-model.test.ts`           | Model compilation and SQLite persistence tests.                                    |
| `test/seed-data.test.ts`              | Seed loading, relationship consistency, and demo-volume tests.                     |
| `test/service.test.ts`                | OData projections, catalog protection, active CRUD, and draft lifecycle tests.     |
| `test/planet-isolation.test.ts`       | Planet-scoped reads, writes, drafts, navigation, counts, and batch tests.          |
| `test/lifecycle.test.ts`              | Focused creation, update, assignment, default, and draft integrity tests.          |
| `test/notification-service.test.ts`   | Welcome-message and SMTP configuration tests without external delivery.            |
| `test/notification-lifecycle.test.ts` | Post-commit notification and lifecycle suppression tests.                          |
| `test/fiori-create-flow.test.ts`      | Draft-enabled and insertable metadata contracts used by the Fiori Create action.   |
| `test/fiori-user-experience.test.ts`  | Human-readable entity/property labels and email semantic behavior.                 |
| `test/fiori-error-handling.test.ts`   | Structured messages, field targets, and rejected-draft recovery for Fiori.         |
| `test/mailhog.integration.test.ts`    | Explicit real-SMTP capture check, excluded from the routine test suite.            |
| `vitest.config.mts`                   | Vitest setup and serial test-file execution for the shared CAP test server.        |
| `vitest.mailhog.config.mts`           | Isolated Vitest configuration for the opt-in MailHog integration check.            |
| `tsconfig.json`                       | Strict TypeScript settings, CAP type resolution, and source maps.                  |
| `app/spacefarer/`                     | TypeScript SAP Fiori elements application served through CAP.                      |
| `.vscode/launch.json`                 | Debug configurations for the server and tests.                                     |
| `.vscode/tasks.json`                  | Type-checking and MailHog lifecycle tasks for debugging.                           |
| `compose.yaml`                        | Local MailHog container.                                                           |

## Design and Future Work

See the [assignment](doc/galactic_spacefarer_assignment.md), [backend design](doc/backend-design.md), and [implementation progress](doc/implementation-progress.md).

Future galactic administration could support government reports across planets and controlled planet reassignment. Those features need a separate authorization design and are outside this homework implementation. Real identity-provider integration and durable email retries are also future work.
