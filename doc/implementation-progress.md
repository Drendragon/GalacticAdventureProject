# Implementation Progress

Plan: [Galactic Spacefarer Adventure – Implementation Plan](Galactic%20Spacefarer%20Adventure%20%E2%80%93%20Implementation%20Plan.md)

Design: [Backend Design](backend-design.md)

## Working Agreement

- Implement on `master`, one phase at a time.
- Stop after each phase for the user's code review and learning discussion.
- The user owns all commits and pushes; do not stage or commit changes.

## Phase 1 — CAP Initialization

Status: implemented; stopped for the user's Phase 1 review. Phase 2 has not started.

Scope: dependencies, SQLite configuration, start/watch/test scripts, an empty CAP service shell, MailHog configuration, and setup instructions.

Ruling: use an empty `GalacticService` shell to make the CAP server runnable before Phase 2. No domain entities or business handlers belong in this phase. Phase 4 will extend this service with projections.

Ruling: use CAP's `basic` authentication kind with explicitly configured demo users in development/test profiles. This is the built-in mock-user mechanism without the default sample users provided by `mocked`.

Pre-flight: Phase 2 will add the data model; Phase 4 will consume it in the service; Phase 6 will consume the SMTP configuration. Phase 1 verifies startup and database connectivity without introducing those later features.

Baseline: `npm start` fails because the npm initialization has no start script.

## Phase 1 Verification

- Before the service/configuration was added, the bootstrap suite had four expected failures for the missing service and authentication; SQLite already connected through the installed adapter's defaults.
- `npm test`: 5 passed, 0 failed. These tests exercise the real server and SQLite, with no mocked application components.
- `npm start`: server started on port 4004; the landing page and Mars user's metadata request returned HTTP 200.
- `npm run watch`: server started on port 4004; the landing page returned HTTP 200. The sandbox initially blocked CAP's user-profile service registry; the same command succeeded outside that restriction without code changes.
- Development/test configuration uses the fixed demo users; production configuration resolves to JWT without those users.
- `npm run format:check` and `git diff --check`: passed.
- `docker compose config --quiet`: passed. Docker Desktop's Linux engine is stopped, so MailHog runtime startup has not been verified.
- CodeScene: bootstrap test Code Health is 10.0; safeguard passed with one eligible file checked and no issues.
- Independent read-only review: no actionable findings. Later-phase features are intentionally absent.
- No files staged, no commits made, and no pushes performed. Work remains on `master`.

Next: review `package.json`, `srv/galactic-service.cds`, `test/bootstrap.test.ts`, and `compose.yaml` with the user before Phase 2 domain modeling.

## Phase 1 Follow-up — TypeScript and Debugging

User requested TypeScript for handwritten executable code and VS Code debug startup, optionally with MailHog lifecycle management. This extends Phase 1; Phase 2 remains unstarted.

- Applied CAP's `cds add typescript` setup with local compiler, runner, CAP API types, and model type generator.
- Converted the bootstrap test to TypeScript and added strict type checking. Tests preload `test/setup.ts` so CAP discovers future `.ts` handlers.
- Changed local `npm start` to `cds serve`, whose CLI detects TypeScript; `cds-serve` alone is intended for compiled JavaScript.
- Added server, server-with-MailHog, and test launch configurations. Every profile type-checks before debugging. The MailHog profile starts and stops the project's MailHog service; Docker Desktop must already be running.
- Recorded the TypeScript convention in `AGENTS.md`, the design, and the implementation plan.

Verification:

- `npm run typecheck`: passed with strict checking.
- `npm test`: all 5 TypeScript bootstrap tests passed. The equivalent test-debugger command also passed all 5 tests.
- Server launch command with Node inspector enabled: CAP started, HTTP returned 200, and the inspector exposed a debug target. Port 4005 was used for this check to preserve an existing process on 4004.
- `tsx` invokes Windows user lookup, which the sandbox blocks; tests and runtime commands succeeded outside the sandbox without code changes.
- Compose configuration validates. Docker Desktop is still stopped, so automatic MailHog startup/teardown has not been exercised against a running daemon.
- VS Code launch/task wiring was reviewed; pressing F5 and interactive source breakpoints still need the user's editor check.
- CodeScene: TypeScript bootstrap test score 10.0; safeguard passed with 2 eligible files checked. The single-line test setup has no standalone numeric score. Set repository-local `core.quotepath=false` to work around the safeguard's inability to read Git-escaped non-ASCII filenames; this changes path display only.
- Independent read-only review: no actionable findings.
- No staging, commits, pushes, or Phase 2 work. Stopped for the user's review.

Editor follow-up: reproduced the missing `rootDir` diagnostic with VS Code's bundled TypeScript 6.0.3. Added `rootDir: "."` to preserve paths relative to the project root. The same compiler then reported zero diagnostics, and the project's TypeScript 7 type check also passed.

Test-runner follow-up: switched the five bootstrap checks to Vitest so tests use Jest-style `describe`, `it`, and `expect`. `npm test` runs Vitest once; the VS Code test debugger launches the same runner. Vitest loads `test/setup.ts` before test files and runs files serially because CAP's test server uses shared process state.

Verification: `npm test` passed all 5 checks, `npm run typecheck` and `npm run format:check` passed, and the Vitest command with the Node inspector enabled passed all 5 checks. `git diff --check` found no whitespace errors. CodeScene's pre-commit safeguard passed with 2 eligible files checked and no issues. The VS Code F5 experience still needs an interactive editor check.

## Phase 2 — Domain Model

Status: implemented; stopped for the user's Phase 2 review. Phase 3 has not started.

Added `db/schema.cds` under the `galactic.spacefarers` namespace:

- `Spacefarers` uses UUID keys and managed audit fields. Names, email, origin planet, and both numeric values are required in persisted rows.
- Omitted stardust defaults to `0`; omitted wormhole navigation skill defaults to `1`. CDS range annotations declare stardust as nonnegative and navigation skill as `0` through `100`.
- `Departments` and `Positions` use UUID keys. Every position requires a department.
- Spacefarer department and position assignments remain optional. All managed associations declare target-existence validation.

TDD evidence: the model-shape, defaults, required-field, required-position-department, and association-target tests were each observed failing before their corresponding CDS declarations were added. Association expansion was exercised through a real in-memory SQLite deployment.

Ruling: numeric range annotations are a CAP application-service validation contract rather than SQLite `CHECK` constraints. Phase 2 verifies the compiled CDS annotations; Phase 4 API tests will verify rejection through the OData service after entity projections exist.

Deferred to later planned phases: seed data (Phase 3), service projections and draft enablement (Phase 4), trusted planet derivation and cross-field assignment checks (Phase 5), and authorization (Phase 7).

Verification:

- `npm test`: 17 passed across the bootstrap and domain-model suites.
- `npm run typecheck`: passed with strict TypeScript checking.
- `npx cds compile db/schema.cds --to sql`: generated all three SQLite tables with the expected keys, required columns, defaults, and association foreign-key columns.
- `npm run format:check` and `git diff --check`: passed.
- CodeScene initially scored the new test file 9.38 for duplicated candidate setup. Extracting one typed test-data builder raised it to the required 10.0 while preserving all tests.
- CodeScene's pre-commit safeguard passed with 1 eligible file checked and no issues.
- Independent read-only review found no CDS defect and confirmed CAP removes non-key `not null` constraints from generated draft entities, preserving the later incomplete-draft design. Its Code Health finding was addressed by the fixture refactor.

Deferred minor from review: constraint tests currently assert that SQLite rejects invalid rows without matching the exact SQLite error text. More specific message assertions may reduce false positives, but they also couple these model tests to adapter-specific wording.

## Phase 3 — Seed Data

Status: implemented; stopped for the user's Phase 3 review. Phase 4 has not started.

Added deterministic CSV fixtures under `db/data`:

- 5 shared Departments and 8 Positions with stable UUIDs and valid department relationships.
- 16 Spacefarers: 6 Earth, 6 Mars, and one each from Europa, Titan, Kepler-186f, and Proxima Centauri b.
- Optional-assignment examples include no assignment, department only, and a position with its matching department.
- Numeric examples include explicit zero values and varied valid stardust/navigation values for later sorting and filtering demos.

Ruling: seed six Earth and six Mars rows so `$top=5&$skip=5` has a second visible page for either configured demo user. Four other planets provide filter variety while keeping the total within the plan's 10–20 range.

Ruling: use stable human-readable UUID patterns for deterministic associations and repeatable API examples. These are public demo fixtures rather than generated production identifiers.

CAP loads CSV fixtures during database deployment rather than through the application service. Consequently, seed loading does not invoke the later active `CREATE` notification handler.

TDD evidence: the catalog test first observed empty Department and Position tables, then passed after their CSV fixtures were added. The Spacefarer test first observed zero rows, then passed after the 16-row fixture was added. Both exercise CAP's real CSV loader and in-memory SQLite database.

Verification:

- `npm test`: 19 passed across 3 Vitest files.
- `npm run typecheck`: passed with strict TypeScript checking.
- `npm run format:check` and `git diff --check`: passed.
- CodeScene: the new seed-data test scores 10.0.
- CodeScene's pre-commit safeguard passed with 1 eligible file checked and no issues.
- Independent read-only review found no blocking issues and confirmed the fixture counts, UUID validity, relationship consistency, pagination volume, and real CAP loading path.

Deferred minor from review: the assignment-consistency test proves that every selected Position belongs to the selected Department, but does not separately assert that department-only Spacefarer references exist. The current fixture references were independently verified as valid; a future hardening test could protect this case from later CSV edits.

## Phase 4 — CAP Service

Status: implemented; stopped for the user's Phase 4 review. Phase 5 has not started.

Extended the protected `GalacticService` with projections for all three domain entities:

- `Spacefarers` is draft-enabled and uses CAP's generated OData V4 handlers for active CRUD and draft operations.
- `Departments` and `Positions` are shared read-only catalogs. CAP rejects writes to either projection with HTTP 405.
- No custom TypeScript service handler was added. Trusted field derivation and assignment validation remain Phase 5 work.

Ruling: retain CAP's standard draft contract and direct active CRUD support rather than manually implementing basic persistence handlers. Draft activation will reach the active `CREATE` or `UPDATE` event used by later business handlers.

Ruling: the service already requires the `SpacefarerUser` role from Phase 1, but Phase 4 does not add row-level planet isolation. Until its planned authorization phase, either configured demo user can see all seeded Spacefarers. The documentation calls out this temporary state so it is not mistaken for the final security behavior.

TDD evidence: the first projection tests returned HTTP 404 for every entity. After adding the projections, catalog write tests returned HTTP 201 until `@readonly` was applied. Draft tests then failed because `IsActiveEntity` was unknown and incomplete drafts hit active-table constraints; adding `@odata.draft.enabled` made the generated draft flow available.

Verification:

- The service suite verifies seeded reads for all projections, write rejection for both catalogs, direct active `POST`/`GET`/`PATCH`/`DELETE`, and draft creation, edit, activation, edit activation, and discard.
- Draft discard is verified by confirming the last activated active value remains unchanged after deleting a later modified draft.
- `npm test`: 34 passed across 4 Vitest files after splitting active CRUD and draft lifecycle coverage into focused, independent cases.
- `npm run typecheck`, `npm run format:check`, and `git diff --check`: passed.
- `npx cds compile srv/galactic-service.cds --to edmx --service GalacticService`: produced valid OData V4 metadata with all three entity sets, draft fields and actions, and read-only capability annotations.
- CodeScene: the new service test scores 10.0; the pre-commit safeguard passed with 1 eligible file checked and no issues across 4 modified files.
- Independent read-only review found no critical or important issues. Its two minor test-hardening suggestions were applied: update/delete rejection is now checked for both catalogs, and draft discard explicitly verifies that the draft no longer exists while the active row remains unchanged. Re-review confirmed both findings resolved with no regression.
