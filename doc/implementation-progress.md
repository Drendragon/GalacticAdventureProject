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
