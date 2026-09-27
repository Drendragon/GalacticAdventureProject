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

## Phase 5 — CREATE Lifecycle Logic

Status: implemented; stopped for the user's Phase 5 review. Phase 6 has not started.

Added `srv/galactic-service.ts` as a typed `cds.ApplicationService` implementation:

- Active `CREATE` derives `originPlanet` from the authenticated user's nonempty planet attribute, rejects conflicting input, applies deterministic numeric defaults, validates required fields and ranges, verifies catalog references, and enforces matching department/position assignments.
- Active `UPDATE` loads the existing row and validates the resulting merged state. Omitted values remain unchanged, required values cannot be cleared, planet reassignment is rejected, and partial assignment changes cannot leave a mismatched position and department.
- Draft `NEW` assigns the trusted planet immediately. Draft `PATCH` prevents planet tampering while allowing incomplete business data. Draft activation reaches the active `CREATE` or `UPDATE` handlers for final validation.
- The handler asserts at startup that the service projection remains draft-enabled. CAP continues to provide persistence and draft choreography; no CRUD handler was reimplemented.

Ruling: treat an omitted or explicit `null` planet during creation as missing and replace it with the trusted authenticated value. A non-null conflicting value is rejected. Updates treat `null` as a reassignment attempt and reject it.

Ruling: allow incomplete drafts so users can fill fields incrementally. Trusted planet checks run during draft creation and planet edits, while required fields, ranges, references, and cross-field assignment consistency are enforced when the draft is activated.

Ruling: add `planetless-user` as a negative development/test fixture with the application role but no planet attribute. Lifecycle writes reject this identity with HTTP 403. Full read isolation for missing or differing planets remains in the planned authorization phase.

TDD evidence: active creation initially produced database 500 errors for missing trusted/required values and accepted conflicting planets and inconsistent assignments. Update tests then demonstrated that generic PATCH allowed planet reassignment and inconsistent partial assignment changes. Draft tests showed `originPlanet: null`, accepted conflicting draft input, and allowed planet tampering until `NEW` and draft `PATCH` handlers were registered.

TypeScript loader finding: setting `CDS_TYPESCRIPT=tsx` makes CAP discover `.ts` handlers but does not register the transpiler. The CAP CLI normally preloads `tsx/cjs`; `test/setup.ts` now does the same before tests start CAP programmatically.

Verification:

- `npm test`: 77 passed across 5 Vitest files; the focused lifecycle suite contains 43 cases.
- `npm run typecheck` and `npm run format:check`: passed.
- CodeScene: the lifecycle test scores 10.0. The handler initially scored 8.67 for compound numeric conditions; extracting named predicates raised it to 10.0.
- CodeScene's pre-commit safeguard passed with 3 eligible files checked and no issues across 6 modified files.
- Independent read-only review found that numeric `null` values were incorrectly treated as omitted by `??=` and that one invalid-position test did not reach the position lookup. Defaults now apply only to `undefined`, explicit numeric nulls are covered for creation and update, and the position case supplies a valid department. Re-review confirmed both findings resolved with no regression.
- Phase 6 notification delivery is intentionally absent. It will add the active `after CREATE` success callback and MailHog transport.

Review follow-up: split the original lifecycle implementation along its existing responsibilities. `galactic-service.ts` now only registers CAP events; `srv/lifecycle/planet-policy.ts` owns trusted-planet rules, `active-record-validation.ts` owns create/update orchestration and scalar validation, `assignment-validation.ts` owns catalog consistency, and `types.ts` contains their shared request shape. The service and all behavior modules retain Code Health 10.0; the type-only module has no standalone score. Independent re-review found no actionable boundary or behavior issues.

## Phase 6 — Notification Service

Status: implemented; stopped for the user's Phase 6 review. Phase 7 has not started.

Added a small TypeScript notification boundary backed by Nodemailer:

- `sendWelcomeEmail` addresses the created Spacefarer's email and builds the agreed plain-text welcome message.
- SMTP host, port, sender, secure transport, optional username/password, and bounded connection, greeting, and socket timeouts come from environment variables with local MailHog defaults.
- Credentials must be provided as a complete username/password pair. The local MailHog path omits authentication.
- Transport creation is injected in unit tests, so routine verification never needs Docker and cannot deliver external email.
- The CAP lifecycle does not call this module yet. Phase 7 owns the active `after CREATE` success callback and delivery-failure policy.

Ruling: keep SMTP transport configuration in the adapter while exposing only `sendWelcomeEmail(spacefarer)` to lifecycle code. This allows a future SMTP provider without coupling CAP handlers to Nodemailer.

TDD evidence: the focused notification suite first failed because the service module did not exist, then passed after message construction and configurable transport creation were implemented.

Verification:

- A real SMTP integration check sent a unique welcome message through `127.0.0.1:1025`; MailHog's HTTP API confirmed that it was captured for the intended recipient.
- `npm test`: 81 tests passed across 6 Vitest files, including 4 focused notification-service cases.
- `npm run typecheck`, `npm run format:check`, `docker compose config --quiet`, and `git diff --check`: passed.
- CodeScene: both new TypeScript files score 10.0; the pre-commit safeguard passed with 2 eligible files checked and no issues across 7 modified files.
- Independent read-only review found no critical or important issues and confirmed Phase 6 is ready for review. It suggested minor test hardening for every default transport option, a custom sender, and rejected delivery; these can be added with the broader notification coverage in Phase 10.

## Phase 7 — After CREATE Handler

Status: implemented; stopped for the user's Phase 7 review. Phase 8 has not started.

Added the notification lifecycle integration:

- Active `CREATE` registers a `request.on("succeeded")` callback from the required CAP `after CREATE` event.
- The callback sends the validated candidate through the Phase 6 notification boundary only after the transaction commits.
- Delivery failures are caught and logged inside the success callback, preserving the committed record and successful API response.
- New draft activation sends one welcome message. Draft creation, editing an existing active record through a draft, active updates, and failed validation do not send one.
- Routine tests load CAP's CommonJS notification module through a dedicated test helper and replace its boundary with a Vitest spy, preventing accidental SMTP traffic across every CAP test file.

Ruling: use `request.data` as the notification payload. CAP's generic draft-enabled `after CREATE` handler supplies an affected-row collection as its result, while `request.data` contains the candidate enriched and validated by the `before CREATE` handler.

Ruling: isolate the mixed-loader concern in `test/notification-test-double.ts`. Vitest's module runner and CAP's TypeScript CommonJS loader otherwise instantiate the module through separate caches, causing an ESM-side spy to miss CAP's instance and attempt real SMTP delivery.

TDD evidence: the lifecycle suite first failed because the shared notification boundary did not exist. The initial handler then exposed the mixed-loader duplicate instance through real `ECONNREFUSED` attempts and showed CAP's collection-shaped result. Spying on CAP's CommonJS instance and using validated request data made all six focused lifecycle cases pass.

Verification:

- A real authenticated OData `POST` committed a new active Spacefarer and MailHog captured exactly one welcome message for that candidate through the Phase 7 handler.
- The focused notification lifecycle suite passed all 6 cases; the complete suite passed 87 tests across 7 files.
- `npm run typecheck`, `npm run format:check`, `docker compose config --quiet`, and `git diff --check`: passed.
- CodeScene: all scoreable touched application and test files retain 10.0; the pre-commit safeguard passed with 6 eligible files checked and no issues across 8 modified files.
- Independent read-only review found no critical or important issues and confirmed the transaction callback follows CAP's root commit semantics. It deferred changeset rollback and explicit active-PATCH coverage to Phase 10, along with making the logger-spy teardown resilient to a failed assertion.

## Phase 8 — Authorization

Status: implemented; stopped for the user's Phase 8 review. Phase 9 has not started.

The `GalacticService` already carried `@requires: 'SpacefarerUser'` from the protected service shell introduced in Phase 1. Phase 8 completed and isolated its authorization evidence:

- Anonymous requests and unknown Basic-auth usernames are rejected with HTTP 401.
- Added a configured `roleless-user` with valid credentials and an Earth attribute but no application role. CAP authenticates this identity and rejects service access with HTTP 403.
- Existing Earth and Mars fixtures retain `SpacefarerUser` and can access the service.
- No administrator, wildcard role, or unrestricted application identity exists.
- Moved the anonymous and unknown-user assertions from bootstrap coverage into a focused authorization suite.

TDD evidence: before `roleless-user` was configured, the new missing-role case returned 401 because authentication failed. After adding the identity without `SpacefarerUser`, the same request reached authorization and returned the required 403.

Verification:

- The focused authorization and bootstrap suites passed 6 tests; the complete suite passed 88 tests across 8 files.
- `npm run typecheck`, `npm run format:check`, CDS-to-EDMX compilation, and `git diff --check`: passed.
- CodeScene: both modified test files score 10.0; the pre-commit safeguard passed with 2 eligible files checked and no issues across 5 modified files.
- Independent read-only review found no issues. It confirmed the fixture is development-scoped, production still selects JWT without demo users, and no administrator or privileged bypass exists.
