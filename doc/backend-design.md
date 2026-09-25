# Galactic Spacefarer Backend Design

## Purpose and Scope

Build the backend for the local SAP interview exercise before creating the Fiori application. The first milestone covers implementation-plan phases 1–11: CAP setup, domain model, seed data, OData service, lifecycle handlers, SMTP notifications, authorization, tests, and backend verification.

Use SAP CAP Node.js, CDS, SQLite, and OData V4. CAP supplies generic CRUD and query handling. Include draft support now so the later Fiori List Report and Object Page can use the same backend lifecycle.

This document records the decisions agreed during the planning discussion. The original assignment remains unchanged. The implementation plan contains the corresponding work sequence.

## Domain Model

Use `galactic.spacefarers` as the namespace. Spacefarers use UUID keys and CAP managed audit fields. Keep the proposed first name, last name, email, origin planet, spacesuit color, stardust collection, navigation skill, department, and position fields.

- First name, last name, and email are required for active records.
- Stardust collection is a nonnegative integer, defaulting to `0` when omitted on creation.
- Navigation skill is an integer from `0` to `100`, defaulting to `1` when omitted on creation. An explicit `0` is valid.
- Origin planet is assigned from the authenticated user's planet. Conflicting input is rejected, and the planet cannot be changed afterward.
- Departments and positions are shared, read-only catalogs available to authorized users on any planet.
- Every catalog position belongs to a department. A spacefarer can have no assignment, a department alone, or a position with its matching department.
- Assignment references must exist. Partial updates must leave the resulting record consistent.

Incomplete drafts are permitted. Validate the final active record at activation, and enforce authorization throughout the draft lifecycle. Use CDS constraints and CAP request errors where appropriate; keep custom logic focused on trusted values and cross-field checks.

## Access Model

The local demo uses explicitly configured mock users such as `earth-user` and `mars-user`, each with the `SpacefarerUser` role and one planet attribute. No login system or SAP BTP integration is required for this milestone.

Reject anonymous requests, unauthorized roles, unknown mock usernames, and attempts to access spacefarer data without a valid planet attribute. Limit mock authentication to development and tests; production must not silently inherit it.

Every application user can access only their own planet's spacefarers. There is no administrator role or cross-planet exception. Use CAP restrictions for persisted data and explicit input checks for planet assignment and immutability. Apply these rules to active records, drafts, direct requests, and batch operations.

Do not expose a navigation route from a shared catalog that bypasses spacefarer isolation. Test navigation, expansions, and counts rather than assuming that a filtered list proves isolation. Preserve CAP draft ownership rules between users of the same planet.

## Creation and Email Delivery

For a newly activated candidate, the flow is:

```text
Create and fill draft
    ↓
Activate draft
    ↓
before CREATE: trusted defaults and active-record validation
    ↓
CAP generic CREATE
    ↓
after CREATE: register request-success callback
    ↓
Successful transaction commit
    ↓
SMTP welcome message to the candidate's email
    ↓
MailHog captures the message
```

Keep email construction and transport in a small notification module with a `sendWelcomeEmail(spacefarer)` boundary. The required active `after CREATE` handler registers delivery using `req.on('succeeded', ...)`, after the transaction or enclosing changeset succeeds.

Use MailHog for local SMTP capture. Provide Docker Compose with localhost SMTP port `1025` and inbox port `8025`; the CAP process runs on the host. Keep SMTP settings configurable and document them in `.env.example` and the README.

Catch and log delivery failures, with bounded transport timeouts. A failed email must not undo creation. Do not send welcome messages for seed loading, draft creation, discarded drafts, edits, failed validation, or rolled-back transactions.

This is best-effort delivery after commit. It does not guarantee durable or exactly-once delivery. Automatic retries and an outbox are outside this milestone.

## Verification and Completion

Implement automated API tests before frontend work. Cover:

- CRUD and standard OData filtering, sorting, pagination, counts, and associations.
- Required fields, numeric boundaries, deterministic defaults, and partial-update integrity.
- Optional department/position assignment and rejection of invalid combinations.
- Authentication, roles, trusted planet defaults, conflicting values, and reassignment attempts.
- Isolation across planets for active data and drafts, plus draft ownership within one planet.
- Shared catalog reads and rejected catalog writes.
- Draft creation, edit, activation, discard, and incomplete-draft behavior.
- Notifications after successful active creation, no notification on rollback, and preservation of data when SMTP fails.

Routine automated tests mock the notification boundary and run without MailHog. A separate explicit integration check verifies SMTP capture in MailHog. The local demo includes Earth and Mars seed records and enough visible rows to demonstrate pagination for each user.

Provide setup and API demo instructions in the README during this milestone. Follow the CodeScene requirements in `AGENTS.md`, including the 10.0 Code Health target and safeguards before commits and PRs.

## Future Extensions

Document these as future possibilities, not current functionality:

- Galactic government reporting across planets.
- Controlled planet reassignment by a future galactic administration role.
- Real identity-provider integration for deployment.
- Durable notification delivery and retries.

Future administration would require a separate authorization design. It introduces no exception to this version's strict planet isolation.

## Technical References

- [CAP authorization and Node.js limitations](https://cap.cloud.sap/docs/guides/security/authorization)
- [CAP request-success events and transaction timing](https://cap.cloud.sap/docs/node.js/events)
- [CAP draft lifecycle](https://cap.cloud.sap/docs/node.js/fiori)
- [MailHog setup and default ports](https://github.com/mailhog/MailHog)
