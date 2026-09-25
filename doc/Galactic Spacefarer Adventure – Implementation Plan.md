# Galactic Spacefarer Adventure – Implementation Plan

## 1. Goal

Build a small full-stack SAP application using:

- SAP CAP with Node.js
- CDS data model
- SQLite for local development
- OData V4 service
- SAP Fiori Elements
- List Report
- Object Page
- CAP authorization
- lifecycle handlers around Spacefarer creation

The application manages galactic spacefarers and demonstrates CRUD operations, validation, data enrichment, authorization, row-level access restrictions, and a notification side effect after creation.

Do not use NestJS or build a separate Express REST API. CAP should own the backend service layer and expose the OData API.

## Agreed First Milestone

Implement phases 1–11 before starting the Fiori application. Include backend draft support, structured validation errors, a minimal setup/demo README, and Git hygiene in this milestone even where the original phase ordering placed documentation or polish later.

The agreed design is recorded in [Backend Design](backend-design.md). Decisions from the planning discussion:

- Run a local demo with explicitly configured mock users; no SAP BTP integration in this milestone.
- Enforce strict planet isolation for every user. Do not create an administrator role or a cross-planet bypass.
- Assign `originPlanet` from the authenticated user's planet. Reject conflicting input and prevent reassignment.
- Share read-only department and position catalogs across planets. Assignment is optional, but a selected position requires its matching department.
- Send SMTP welcome emails to MailHog after successful transaction commit. Log delivery failures without undoing creation.
- Include draft lifecycle and authorization tests before frontend work.
- Document galactic government reporting, administrative planet reassignment, and durable notification retries as future extensions only.

---

# 2. High-Level Architecture

```text
SQLite
   ↓
CAP CDS Domain Model
   ↓
CAP Node.js Service
   ├── Generic CRUD
   ├── before CREATE
   ├── after CREATE
   └── Authorization
   ↓
OData V4
   ↓
Fiori Elements
   ├── List Report
   └── Object Page
```

---

# 3. Project Structure

Target structure:

```text
galactic-spacefarer/
│
├── app/
│   └── spacefarer/
│       └── Fiori Elements application
│
├── db/
│   ├── schema.cds
│   └── data/
│       ├── galactic.spacefarers-Spacefarers.csv
│       ├── galactic.spacefarers-Departments.csv
│       └── galactic.spacefarers-Positions.csv
│
├── srv/
│   ├── galactic-service.cds
│   ├── galactic-service.js
│   └── services/
│       └── notification-service.js
│
├── test/
│   └── backend tests
│
├── package.json
├── compose.yaml
├── .env.example
├── README.md
└── .gitignore
```

Use standard CAP project conventions. Avoid unnecessary abstraction unless it helps isolate external behavior such as email notifications.

---

# 4. Phase 1 – Initialize the CAP Node.js Project

## Tasks

Create a new CAP project.

Install the required CAP dependencies.

Configure SQLite for local development.

Add a MailHog service to Docker Compose with SMTP on localhost port `1025` and the inbox on localhost port `8025`. The CAP application runs locally. Document SMTP environment settings in `.env.example` without real credentials.

Keep mocked authentication explicitly scoped to development and tests. Production authentication integration is outside this local milestone; do not let production silently fall back to mocked users.

Add scripts for:

```text
npm start
npm run watch
npm test
```

The development application should run using:

```bash
cds watch
```

## Acceptance Criteria

Running the application starts the CAP server successfully.

The CAP landing page is accessible.

SQLite is used locally.

---

# 5. Phase 2 – Create the Domain Model

Create `db/schema.cds`.

Use namespace:

```cds
namespace galactic.spacefarers;
```

Create the following entities.

## Spacefarers

Suggested model:

```text
ID
firstName
lastName
email
originPlanet
spacesuitColor
stardustCollection
wormholeNavigationSkill
department
position
createdAt
createdBy
modifiedAt
modifiedBy
```

Use CAP aspects such as:

```cds
cuid
managed
```

Suggested CDS shape:

```cds
entity Spacefarers : cuid, managed {
    firstName                  : String(100);
    lastName                   : String(100);
    email                      : String(255);
    originPlanet               : String(100);
    spacesuitColor             : String(50);
    stardustCollection         : Integer;
    wormholeNavigationSkill    : Integer;

    department : Association to Departments;
    position   : Association to Positions;
}
```

## Departments

Fields:

```text
ID
name
description
```

## Positions

Fields:

```text
ID
name
description
department
```

`Positions` should have an association to `Departments`.

## Validation Semantics

Use these domain rules:

```text
email is required
firstName is required
lastName is required
originPlanet is required

stardustCollection >= 0

wormholeNavigationSkill:
minimum = 0
maximum = 100
```

`originPlanet` is required on persisted spacefarers, but callers may omit it: derive it from the authenticated user's planet on creation. Reject a conflicting supplied value and reject attempts to change the planet afterward. A user without a valid planet attribute cannot access spacefarer data.

Use deterministic defaults of `0` for omitted stardust collection and `1` for omitted navigation skill. Preserve explicitly supplied zero values.

Departments and positions are shared reference catalogs exposed read-only to authorized users. Every catalog position belongs to a department. A spacefarer may have neither assignment, or a department alone. A selected position must exist and requires its matching department.

Apply data integrity rules to active creation and updates, including draft activation. For partial updates, validate the resulting assignment against the existing record, not only the fields in the request. Drafts may be incomplete before activation; authorization and planet checks apply throughout their lifecycle.

Do not overcomplicate the data model.

## Acceptance Criteria

The CDS model compiles successfully.

SQLite tables are generated.

Associations between entities are navigable.

---

# 6. Phase 3 – Add Seed Data

Create CSV seed data under `db/data`.

Provide approximately:

```text
10–20 Spacefarers
4–6 Departments
6–10 Positions
```

Suggested planets:

```text
Earth
Mars
Europa
Titan
Kepler-186f
Proxima Centauri b
```

Suggested departments:

```text
Exploration
Engineering
Science
Navigation
Logistics
```

Suggested positions:

```text
Explorer
Engineer
Scientist
Navigator
Cargo Specialist
Mission Commander
```

Ensure there are multiple users from different planets so row-level security can later be demonstrated.

Seed enough Earth and Mars spacefarers to demonstrate pagination within each user's visible records. Seed data does not trigger welcome emails.

## Acceptance Criteria

When the application starts, the database contains meaningful demo data.

The List Report will have enough data to demonstrate filtering and pagination.

---

# 7. Phase 4 – Create the CAP Service

Create:

```text
srv/galactic-service.cds
```

Expose:

```text
Spacefarers
Departments
Positions
```

Suggested structure:

```cds
using { galactic.spacefarers as db } from '../db/schema';

service GalacticService {

    @odata.draft.enabled
    entity Spacefarers as projection on db.Spacefarers;

    @readonly entity Departments as projection on db.Departments;

    @readonly entity Positions as projection on db.Positions;

}
```

Do not manually implement basic CRUD.

CAP generic handlers must provide the following operations for Spacefarers; Departments and Positions are read-only:

```text
CREATE
READ
UPDATE
DELETE
```

Expose the service using OData V4.

Include CAP draft support in this backend milestone. Verify creation, edit, activation, and discard through the supported draft API. Activation of a new draft must reach active `CREATE`; activation of an edit must reach active `UPDATE`. Apply notifications only to active creation. Add the authorization described in phases 8–9 to the service skeleton above.

## Acceptance Criteria

The following type of endpoint works:

```text
/odata/v4/galactic/Spacefarers
```

The `$metadata` endpoint returns valid OData metadata.

GET, POST, PATCH, and DELETE work.

---

# 8. Phase 5 – Implement CREATE Lifecycle Logic

Create:

```text
srv/galactic-service.js
```

Extend:

```js
cds.ApplicationService
```

Register lifecycle handlers using:

```js
this.before('CREATE', ...)
this.after('CREATE', ...)
```

---

## 8.1 Before CREATE Handler

Responsibilities:

### Validate data

Reject creation when:

```text
email is missing
firstName or lastName is missing
the user has no valid planet attribute
supplied originPlanet conflicts with the user's planet
stardustCollection < 0
wormholeNavigationSkill < 0
wormholeNavigationSkill > 100
the department or position reference is invalid
the selected position does not belong to the selected department
```

Use CAP request APIs such as:

```js
req.reject(...)
req.error(...)
```

### Enhance/default data

If missing:

```text
stardustCollection → default to 0
wormholeNavigationSkill → default to 1
originPlanet → derive from the authenticated user's planet
```

Suggested default:

```text
wormholeNavigationSkill = 1
```

Do not introduce random data.

The handler should produce deterministic behavior.

Apply the same active-record integrity rules to updates without resetting omitted fields. Use framework-native validation where possible and small shared helpers for rules requiring existing data. Supply trusted planet values at draft creation as well; do not defer security checks until activation. Final required-field validation must allow incomplete drafts to exist until the user saves them.

---

# 9. Phase 6 – Notification Service

The assignment asks for a notification email after successful Spacefarer creation.

Do not integrate a production email provider unless it is simple and does not add unnecessary infrastructure.

Create an abstraction such as:

```text
srv/services/notification-service.js
```

Suggested API:

```js
sendWelcomeEmail(spacefarer)
```

For local development, send actual SMTP messages to MailHog through a configurable transport. MailHog captures them for inspection rather than delivering them to external recipients. Use the created spacefarer's email as the recipient.

Example message body:

```text
Welcome aboard, Jane Doe.
Your Galactic Spacefarer adventure has begun.
```

Keep SMTP host, port, sender, and any future credentials configurable. The transport can later point to:

```text
an external SMTP provider
```

without changing domain logic.

Use bounded SMTP timeouts. Automated backend tests mock the notification boundary; an explicitly run MailHog integration check verifies real SMTP capture locally.

---

# 10. Phase 7 – After CREATE Handler

Register:

```js
this.after('CREATE', Spacefarers, ...)
```

From that handler, register a request-success callback that runs after commit and calls:

```js
notificationService.sendWelcomeEmail(spacefarer)
```

Keep external notification logic outside the handler itself.

Important implementation note:

The homework explicitly asks for an `after CREATE` event, so implement it on active Spacefarers. The handler registers `req.on('succeeded', ...)` to start delivery after confirmed transaction success, including the entire OData changeset where applicable.

Catch and log SMTP delivery failures inside the success callback. Do not roll back the committed spacefarer or report its creation as failed because notification delivery failed. Do not send emails for drafts, updates, failed validation, or rolled-back requests.

Do not build an outbox or automatic retry implementation for this homework. Document that process interruption or delivery failure can lose a notification; durable delivery is a future enhancement.

## Acceptance Criteria

Creating a Spacefarer:

```text
1. triggers before CREATE validation
2. stores the entity
3. triggers after CREATE, which registers notification delivery
4. commits the transaction successfully
5. attempts SMTP delivery to MailHog
```

Draft activation of a new candidate follows this sequence. Editing or abandoning a draft produces no welcome email.

---

# 11. Phase 8 – Authorization

Implement two security concepts.

## 11.1 Authenticated/Authorized Access

Require an authorized user for the service in the local demo as well. Reject anonymous access and authenticated users without the required role.

Create a role such as:

```text
SpacefarerUser
```

There is no administrator role and no unrestricted application user.

Use CAP authorization annotations such as:

```cds
@requires
```

or:

```cds
@restrict
```

---

# 12. Phase 9 – Planet-Level Data Isolation

The requirement says users from Planet X must not access data from Planet Y.

Implement this as backend authorization.

Do not implement this only in the Fiori UI.

Use a user attribute such as:

```text
$user.planet
```

The conceptual rule is:

```text
SpacefarerUser can only read/write Spacefarers
where:

originPlanet = $user.planet
```

Every application user is subject to this restriction.

Example conceptual restriction:

```cds
@restrict: [
    {
        grant: '*',
        to: 'SpacefarerUser',
        where: 'originPlanet = $user.planet'
    }
]
```

Exact syntax should follow the CAP version used in the project.

The annotation is not sufficient for incoming values in CAP Node.js. Explicitly derive/check `originPlanet` on creation, prevent planet changes on update, and protect draft operations as well as active records. Reject missing or invalid user planet attributes. Test direct entity access, navigation, expansions, counts, and batches; avoid introducing an unprotected catalog-to-spacefarer navigation path.

## Local Development

Configure mocked users for local development.

Provide at least:

```text
earth-user
role: SpacefarerUser
planet: Earth

mars-user
role: SpacefarerUser
planet: Mars
```

Disable acceptance of arbitrary mock usernames. Mock users are development/test fixtures, not a custom authentication server. SAP BTP and real identity-provider integration are outside the local demo scope and should be described as future deployment work.

## Acceptance Criteria

Earth user:

```text
sees Earth Spacefarers
cannot access Mars Spacefarers
```

Mars user:

```text
sees Mars Spacefarers
cannot access Earth Spacefarers
```

Both users:

```text
can read the shared department and position catalogs
cannot modify the catalogs
cannot create a spacefarer for another planet
cannot change a spacefarer's planet
cannot access another planet's active records or drafts
```

---

# 13. Phase 10 – Backend Tests

Create automated tests before starting Fiori work.

At minimum test:

## READ

```text
GET Spacefarers works
```

## CREATE

Valid Spacefarer can be created.

## Validation

Reject:

```text
negative stardust
wormholeNavigationSkill > 100
wormholeNavigationSkill < 0
missing required values
invalid or mismatched department/position assignments
```

Cover both active creation and updates, including partial updates. Verify that incomplete drafts can be saved temporarily but cannot be activated as invalid active records.

## Defaults

Verify missing optional values are initialized correctly.

## Authorization

Verify planet-scoped access.

Cover anonymous users, missing roles, missing planet attributes, and unknown mock usernames. Check cross-planet reads, writes, forged origin values, reassignment attempts, drafts, `$count`, navigation/expansion, and OData batches. Verify catalogs are shared but read-only.

## Draft Lifecycle

Cover new draft, edit, save/activation, and discard. Verify draft ownership between two users of the same planet as well as isolation between planets. An active update must not trigger a welcome email.

## Notification

Mock or spy on the notification service and verify that it is invoked after committed active creation, including activation of a new draft. Verify no invocation for incomplete/discarded drafts, edits, failed validation, or a rolled-back changeset. Simulated SMTP failure must leave the created record intact.

Routine automated backend tests must not require MailHog or deliver email. Provide a separate, explicit SMTP integration check against the local MailHog inbox.

---

# 14. Phase 11 – Verify Backend Before Building UI

Before creating the Fiori application, manually verify:

```text
GET Spacefarers
POST Spacefarers
PATCH Spacefarer
DELETE Spacefarer
```

Verify:

```text
$filter
$orderby
$top
$skip
```

because the Fiori List Report will depend on these OData capabilities.

Example:

```text
GET Spacefarers?$filter=originPlanet eq 'Earth'
```

```text
GET Spacefarers?$orderby=stardustCollection desc
```

```text
GET Spacefarers?$top=5&$skip=5
```

Also verify `$count`, association expansion, the draft create/edit/save/discard flows, and real welcome-message capture in MailHog after active creation. Repeat isolation checks using the Earth and Mars demo users.

Provide a minimal README now with setup, mock-user credentials, MailHog startup/inbox details, tests, and an API demo flow. Use structured CAP validation errors now; the later UI phase checks how Fiori displays them.

Follow `AGENTS.md`: target Code Health 10.0, safeguard AI-touched code before suggesting or making commits, and analyze the full branch before a PR. Resolve regressions before marking implementation ready.

Only continue to Fiori when the API is stable.

---

# 15. Phase 12 – Create Fiori Elements Application

Use SAP Fiori Tools in VS Code.

Create a Fiori Elements application based on:

```text
List Report / Object Page
```

Connect it to the CAP OData service.

Primary entity:

```text
Spacefarers
```

Do not create a freestyle SAPUI5 application.

Use metadata-driven Fiori Elements functionality wherever possible.

---

# 16. Phase 13 – List Report

The List Report should display:

```text
Name
Origin Planet
Department
Position
Stardust Collection
Wormhole Navigation Skill
Spacesuit Color
```

Required functionality:

```text
sorting
filtering
pagination
row navigation
```

Useful filters:

```text
Origin Planet
Department
Position
Spacesuit Color
```

Use CDS/Fiori annotations rather than manually implementing table behavior.

Relevant annotation concepts may include:

```text
UI.LineItem
UI.SelectionFields
UI.HeaderInfo
```

---

# 17. Phase 14 – Object Page

Selecting a Spacefarer from the List Report opens its Object Page.

Display sections such as:

## General Information

```text
First Name
Last Name
Email
Origin Planet
Department
Position
```

## Spacefaring Statistics

```text
Stardust Collection
Wormhole Navigation Skill
Spacesuit Color
```

Allow editing at minimum:

```text
stardustCollection
spacesuitColor
```

Prefer allowing other sensible fields to remain editable unless there is a reason to make them read-only.

`originPlanet` is assigned by the backend and remains read-only. Departments and positions are selectable from read-only reference catalogs; users cannot maintain the catalogs through this application.

Use annotations such as:

```text
UI.FieldGroup
UI.Facets
UI.HeaderInfo
```

Avoid custom UI extensions unless clearly necessary.

---

# 18. Phase 15 – Fiori Create Flow

Enable Spacefarer creation through Fiori.

The Create action starts a draft. Saving it activates a new Spacefarer and exercises:

```text
draft NEW and PATCH
draft activation
before CREATE
CAP generic CREATE
after CREATE registers delivery
transaction commit
SMTP welcome email
```

This is an important end-to-end demo scenario.

---

# 19. Phase 16 – User Experience Polish

Add human-readable labels.

Example:

```text
wormholeNavigationSkill
```

should appear as:

```text
Wormhole Navigation Skill
```

and not as the technical field name.

Use sensible labels for:

```text
Spacefarer
Department
Position
Origin Planet
Stardust Collection
Spacesuit Color
```

Add basic Fiori semantic behavior where appropriate.

Do not spend excessive time on custom styling.

---

# 20. Phase 17 – Error Handling

Ensure validation failures appear correctly through OData and Fiori.

Examples:

```text
Navigation skill must be between 0 and 100.
```

```text
Stardust collection cannot be negative.
```

```text
Origin planet must match your assigned planet.
```

Use CAP error APIs so Fiori receives structured OData errors.

Do not throw arbitrary unstructured JavaScript exceptions for normal validation failures.

---

# 21. Phase 18 – README

Create a strong README.

Include:

## Project overview

Explain the Galactic Spacefarer exercise.

## Architecture

Include:

```text
Fiori Elements
      ↓
OData V4
      ↓
SAP CAP Node.js
      ↓
SQLite
```

## Prerequisites

```text
Node.js
npm
SAP CDS CLI
SAP Fiori Tools
```

## Installation

```bash
npm install
```

## Start

```bash
cds watch
```

## Tests

```bash
npm test
```

## Demo users

Document local users:

```text
earth-user
mars-user
```

Do not expose real credentials or secrets.

## Security model

Explain:

```text
authentication
role-based authorization
planet-based row-level authorization
```

## CREATE lifecycle

Explain:

```text
before CREATE
    ↓
validation/defaulting
    ↓
database insert
    ↓
after CREATE
    ↓
register success callback
    ↓
transaction commit
    ↓
SMTP welcome email
```

## Email implementation

Explain SMTP delivery to MailHog, how to start it with Docker Compose, how to open its inbox, and how to configure the sender and transport. Explain that delivery failure does not undo creation and that this version has no durable retry mechanism.

## Assumptions

Document ambiguous requirements and chosen interpretations.

## Future Galactic Administration

Potential future features include galactic government reports across planets and controlled planet reassignment by a galactic administration role. They would need a separately designed authorization model. This version has no such role, API, or planet-isolation exception.

Also document real identity-provider integration and durable notification delivery as future production work.

---

# 22. Phase 19 – Git Hygiene

Use meaningful commits.

Suggested sequence:

```text
chore: initialize CAP project

feat: add spacefarer domain model

feat: expose galactic OData service

feat: add spacefarer create validation

feat: add welcome notification

feat: add role and planet authorization

test: cover spacefarer service

feat: add Fiori list report

feat: add Fiori object page

docs: add setup and architecture documentation
```

Do not commit:

```text
node_modules
SQLite transient files
local secrets
generated temporary files
```

---

# 23. Phase 20 – Final Demo Scenario

The completed project should support this demo:

## 1. Start application

```bash
cds watch
```

## 2. Open Fiori application

List Report shows seeded Spacefarers.

## 3. Demonstrate List Report

Show:

```text
sorting
filtering
pagination
```

## 4. Open Object Page

Select a Spacefarer.

Show detailed information.

## 5. Edit Spacefarer

Change:

```text
spacesuitColor
stardustCollection
```

Save successfully.

## 6. Create valid Spacefarer

Create a new candidate.

Verify:

```text
defaults are applied
database entry exists
notification is triggered
```

## 7. Create invalid Spacefarer

Try:

```text
wormholeNavigationSkill = 150
```

Verify the API/Fiori displays a meaningful validation error.

## 8. Demonstrate security

As Earth user:

```text
only Earth records appear
```

As Mars user:

```text
only Mars records appear
```

Attempt to create or reassign a spacefarer to another planet:

```text
the backend rejects the request
```

---

# 24. Non-Goals

Do not add these unless absolutely required:

```text
NestJS
custom Express controllers
React frontend
microservices
Kafka
Redis
HANA
Kubernetes
production SMTP infrastructure
custom authentication server
custom pagination logic
custom filtering implementation
large design system customization
```

The goal is to demonstrate correct SAP CAP and Fiori usage, not architectural complexity.

---

# 25. Coding Guidelines

Use modern JavaScript compatible with the selected CAP Node.js version.

Prefer:

```text
small modules
clear naming
async/await
service separation
framework-native CAP APIs
```

Avoid:

```text
large service files
duplicated validation
manual CRUD implementations
business logic inside UI code
frontend-only authorization
unnecessary framework abstractions
```

---

# 26. Definition of Done

The project is complete when:

- CAP Node.js backend starts successfully
- SQLite works locally
- Spacefarer, Department, and Position entities exist
- relationships work
- OData V4 service exposes CRUD
- before CREATE validates and enriches Spacefarers
- after CREATE registers SMTP notification delivery after successful commit
- MailHog captures welcome emails; delivery failure preserves the created record
- backend authorization requires an authorized user
- strict planet-level access isolation works with no administrator bypass
- originPlanet is derived from the user and cannot be reassigned
- shared catalogs are read-only and optional assignments remain consistent
- draft creation, editing, activation, and discard work with authorization checks
- automated backend tests pass
- Fiori List Report works
- sorting works
- filtering works
- pagination works
- Fiori Object Page works
- Spacefarer data can be edited
- Spacefarers can be created through the Fiori application
- backend validation errors are visible in the UI
- seed data is available
- README explains setup, architecture, assumptions, security, and demo flow
- project is stored in a clean Git repository
