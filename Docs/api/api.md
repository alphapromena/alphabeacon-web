# AlphaStudio API

Base URL: `https://g2pftek7nwnh7kstwuvii2j4pm0aqllt.lambda-url.eu-west-2.on.aws/api` (deployed).
The machine-readable contract is [openapi.json](openapi.json) (also served live at
`GET /api/openapi`); this file adds the human context: conventions, error semantics,
and per-endpoint notes.

## Conventions

- **Success responses** are bare resource JSON — no envelope. Paginated lists are
  `{ "items": [...], "total": <int> }` with `limit`/`offset` query params
  (default 20, max 100 — notifications default to 50). `total` is the full match count,
  not the page size.
- **Status codes**: `200` reads/updates · `201` creates · `204` deletes/logout (empty body).
- **IDs** are Postgres bigints serialized as **decimal strings** (`"42"`). Treat them as
  opaque strings; do not do arithmetic on them.
- **Timestamps** are ISO 8601 UTC strings (`2026-07-28T12:34:56.789Z`).
- **Request id**: every response carries `x-request-id` (a client may send its own and it
  is echoed). Include it in bug reports — it links to the server logs.
- **Auth**: `Authorization: Bearer <opaque session token>`. Tokens are opaque — no
  client-side parsing, no refresh endpoint; on 401 re-login. Sessions have a sliding
  expiry (12 h, or 30 d with `rememberMe`) under an absolute cap (7 d / 90 d).
- **CORS** is handled at the Lambda Function URL, not by the app.

## Error responses

All errors share one envelope:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid email" }],
    "requestId": "0f3c1a2e-..."
  }
}
```

- `code` is machine-readable and **part of the contract** — switch on it, not on `message`.
- `details` appears only when there is something structured to say (never on 5xx).
- 5xx messages are always the generic `"Internal server error"` — internals are never leaked.

| HTTP | `code`              | Meaning                                                                        |
| ---- | ------------------- | ------------------------------------------------------------------------------ |
| 400  | `bad_request`       | Malformed request or invalid/expired verification code                         |
| 400  | `validation_failed` | Body/query/param failed schema validation (`details` lists fields)             |
| 401  | `unauthorized`      | Missing/unknown/expired/revoked session token, or failed login                 |
| 403  | `forbidden`         | Authenticated, but wrong role/tier, org not active, or email not verified      |
| 404  | `not_found`         | Resource doesn't exist **or caller has no access** (existence is never leaked) |
| 409  | `conflict`          | Uniqueness/state invariant violated (duplicate email, double-redeemed code)    |
| 429  | `rate_limited`      | Too many requests — honor the `Retry-After` header (seconds)                   |
| 500  | `internal`          | Unanticipated server bug — report with `requestId`                             |

## Email deep links (frontend contract)

Emails with codes deep-link into the frontend (`DASHBOARD_URL`, falling back to
`STUDIO_URL`) with the email and code in the query string so forms autofill:

| Email          | Link                                        |
| -------------- | ------------------------------------------- |
| Password reset | `/reset-password?email=<email>&code=<code>` |
| Org invite     | `/accept-invite?email=<email>&code=<code>`  |

Codes are 6 digits, expire after **10 minutes**, allow **5 attempts**, and are
rate-limited (60 s between sends, max 5 per hour per email+purpose). Requesting a new
code invalidates the previous one.

## Endpoints

### System

#### `GET /api/health`

Liveness probe. No auth, no database access. → `200 { "ok": true }`

#### `GET /api/openapi`

The generated OpenAPI 3.1 document for this API (excluded from itself).

### Auth

The **auth session response** returned by login, verify-email, and accept-invite:

```json
{
  "token": "opaque-session-token",
  "expiresAt": "2026-07-29T06:11:09.032Z",
  "user": {
    "id": "1",
    "name": "...",
    "email": "...",
    "role": "user",
    "status": "active",
    "emailVerifiedAt": "...",
    "createdAt": "..."
  },
  "orgs": [{ "id": "1", "name": "...", "slug": "...", "status": "active", "role": "owner", "joinedAt": "..." }]
}
```

#### `POST /api/auth/signup`

Body `{ name, email, password }` (password 8–72 chars). Creates an **unverified**
account and emails a signup code. → `201 { email, codeExpiresAt }`.
Retrying with the same **unverified** email overwrites name/password and resends the
code; a **verified** email → `409`.

#### `POST /api/auth/verify-email`

Body `{ email, code, rememberMe? }`. Consumes the signup code, marks the email
verified, and **logs the user in** → `200` auth session response.
note: for testing and dev the code will always be 000000

#### `POST /api/auth/resend-verification`

Body `{ email }`. Resends the signup code. Always `204` (silent no-op for unknown or
already-verified emails) — never an account oracle. Rate limits still apply (`429`).

#### `POST /api/auth/login`

Body `{ email, password, rememberMe? }` → `200` auth session response.
Failures: unknown email / wrong password → `401` `"Invalid email or password"` (same
message, no enumeration). Correct password but unverified email → `403` with
`details.reason = "email_not_verified"` (route the user to the verify screen and offer
resend). Disabled account → `403` `"This account is disabled"`.

#### `POST /api/auth/logout` _(auth)_

Revokes the current session → `204`.

#### `POST /api/auth/logout-all` _(auth)_

Revokes **every** session of the user, including this one → `200 { revoked }`.

#### `POST /api/auth/forgot-password`

Body `{ email }`. Emails a password-reset code (deep link above). Always `204` —
silent no-op for unknown emails. Calling again **is** the resend (rate-limited).

#### `POST /api/auth/reset-password`

Body `{ email, code, newPassword }`. Sets the password, revokes **all** sessions, and
(as a side effect of proving inbox ownership) marks the email verified → `204`.
Log in afterwards.

#### `POST /api/auth/accept-invite`

Body `{ email, code, password, name?, rememberMe? }`. For **new users** invited to an
org (deep link above): sets their password + optional name, verifies the email, and
logs them in → `200` auth session response. Existing users never receive a code —
their membership is added immediately on invite.

### Me _(all require auth)_

#### `GET /api/me`

→ `200` user (`{ id, name, email, role, status, emailVerifiedAt, createdAt }`).

#### `PATCH /api/me`

Body `{ name? }` (at least one field) → `200` updated user.

#### `POST /api/me/change-password`

Body `{ currentPassword, newPassword }`. Wrong current password → `400`. Revokes every
**other** session (the current one stays valid) → `204`.

#### `GET /api/me/orgs`

→ `200 { items: [org summary], total }` — orgs the user actively belongs to, with
their role and join date.

### Orgs _(all require auth)_

Org-scoped routes (`/orgs/:orgId/...`) resolve membership once per request: non-members
get `404` (existence never leaks), members of a suspended/closed org get `403`.
Platform admins bypass membership with a synthetic owner role.

#### `POST /api/orgs`

Body `{ name, slug? }` (slug: lowercase/digits/dashes, derived from name when omitted;
duplicate explicit slug → `409`). Creator becomes the first **owner** →
`201 { org, membership }`.

#### `GET /api/orgs/:orgId`

→ `200 { org, membership }` — the workspace root.

#### `PATCH /api/orgs/:orgId` _(owner)_

Body `{ name?, slug? }` (at least one; duplicate slug → `409`) → `200` updated org.

#### `DELETE /api/orgs/:orgId` _(owner)_

**Soft-close**: status becomes `closed`, data is retained, and every member — owners
included — is locked out (`403` on org routes). Reopening requires a platform admin.
→ `204`.

#### `POST /api/orgs/:orgId/leave`

Any member may leave (their membership is deactivated) → `204`. The **last owner**
cannot leave (`409`) — transfer ownership (role change) or close the org first.

#### `GET /api/orgs/:orgId/members`

→ `200 { items: [{ id, userId, name, email, role, isActive, joinedAt }], total }`.
**Accepted members only** — pending invites live under `/invites`. Deactivated
(removed/left) members are hidden unless `?includeInactive=true`. `id` is the
membership id used by the member/invite management endpoints.

#### `POST /api/orgs/:orgId/members/invite` _(admin or owner)_

Body `{ email, role? }` with `role ∈ admin | member` (default `member`; owners are not
invitable — ownership is granted via role change). → `201 { userId, email, role, invitedNewUser }`.

- **Existing user** → membership added (or an inactive one reactivated) immediately;
  informational email; `invitedNewUser: false`. Already an active member → `409`.
- **New user** → account created (unusable password) + membership; the invite email
  carries a set-password code redeemed via `POST /api/auth/accept-invite`;
  `invitedNewUser: true`. Until accepted it appears under `/invites`, not `/members`.

#### `PATCH /api/orgs/:orgId/members/:memberId` _(owner)_

Body `{ role }` with `role ∈ owner | admin | member` → `200` member item. Granting
`owner` is how co-owners / ownership transfer work. Demoting the **last owner** →
`409`. Works on pending invites too (adjusts the role they will get).

#### `DELETE /api/orgs/:orgId/members/:memberId` _(admin or owner)_

Soft-remove (membership deactivated; re-inviting reactivates) → `204`.
Admins may remove members only; owners may remove anyone; equal/higher role → `403`;
the last owner → `409`; yourself → `400` (use `/leave`).

#### `GET /api/orgs/:orgId/invites` _(admin or owner)_

→ `200 { items: [{ id, userId, email, name, role, invitedAt }], total }` — invites the
recipient has not accepted yet (`id` is the membership id).

#### `POST /api/orgs/:orgId/invites/:memberId/resend` _(admin or owner)_

Mints a fresh code (invalidating the previous one) and re-sends the invite email →
`200 { email, codeExpiresAt }`. Code rate limits apply (`429` + `Retry-After`).
Already accepted → `409`.

#### `DELETE /api/orgs/:orgId/invites/:memberId` _(admin or owner)_

Cancels a pending invite → `204`. The membership is deleted; if the invitee has no
other org, their placeholder account and codes are deleted too, so the email can sign
up or be re-invited completely fresh. Already accepted → `409` (remove the member
instead).

### Brand _(auth + org membership)_

The workspace's brand kit: four org-scoped resources under `/api/orgs/:orgId/brand`.
All four expose the **same** CRUD surface, so one table covers
`<resource> ∈ voices | tones | sources | topics`:

| Method   | Path                                    | Result                 |
| -------- | --------------------------------------- | ---------------------- |
| `GET`    | `/api/orgs/:orgId/brand/<resource>`     | `200 { items, total }` |
| `POST`   | `/api/orgs/:orgId/brand/<resource>`     | `201` the created item |
| `GET`    | `/api/orgs/:orgId/brand/<resource>/:id` | `200` the item         |
| `PATCH`  | `/api/orgs/:orgId/brand/<resource>/:id` | `200` the updated item |
| `DELETE` | `/api/orgs/:orgId/brand/<resource>/:id` | `204`                  |

- **Any member** may read and write — there is no role tier here; tenant isolation is
  the only gate.
- Lists are newest first (`createdAt DESC`), offset-paginated (default 20, max 100).
- `PATCH` is partial and requires **at least one** field — `{}` → `400`.
- `DELETE` is a hard delete (no soft-delete flag); deleting twice → `404`.
- An id that belongs to **another org** is a `404`, never a `403` — the org scope is in
  the SQL `WHERE`, so existence never leaks.

Fields per resource — every item also carries `id`, `orgId`, `createdAt`, `updatedAt`:

| Resource  | Body fields                     | Required on create    | Validation                                                              |
| --------- | ------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| `voices`  | `description`                   | `description`         | 1–2000 chars                                                            |
| `tones`   | `name`, `description`, `preset` | `name`, `description` | `name` 1–120, `description` 1–2000, `preset` boolean (defaults `false`) |
| `sources` | `url`, `title`                  | `url`, `title`        | `url` must parse as a URL, ≤2048 chars; `title` 1–200                   |
| `topics`  | `description`                   | `description`         | 1–2000 chars                                                            |

`preset` marks a built-in/starter tone so the UI can group or lock it; it is a plain
settable field, not a protected one.

### Scheduling _(auth + org membership)_

Three org-scoped resources that together decide **when** content is generated and **what
dates matter**: a `schedule` is the recurring plan, an `event-source` is a feed of dated
events, and the `slots` it produces are those events awaiting a keep-or-skip decision.

**Any member** may read and write — no role tier; tenant isolation is the only gate. An
id belonging to another org is `404`, never `403`. `PATCH` is partial and requires at
least one field (`{}` → `400`). Lists are offset-paginated (default 20, max 100).

#### `GET /api/orgs/:orgId/schedules`

→ `200 { items, total }`, newest first.

#### `POST /api/orgs/:orgId/schedules`

→ `201` the created schedule.

```json
{
  "timezone": "Asia/Amman",
  "days": ["sun", "mon", "tue", "wed", "thu"],
  "generateAt": "07:00",
  "postsPerDay": 2,
  "modelAlias": "balanced",
  "toneIds": ["12"],
  "eventAware": true,
  "active": true
}
```

| Field         | Required | Rules                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------- |
| `timezone`    | yes      | IANA zone name (anything `Intl` accepts), ≤64 chars                       |
| `days`        | yes      | 1–7 of `sun mon tue wed thu fri sat`, no duplicates                       |
| `generateAt`  | yes      | `HH:MM`, 24-hour, zero-padded — wall-clock time **in `timezone`**         |
| `postsPerDay` | no (1)   | integer 1–24                                                              |
| `modelAlias`  | no (`balanced`) | `fast` \| `balanced` \| `quality`                                   |
| `toneIds`     | no (`[]`)| ids of **this org's** tones, ≤50, no duplicates                           |
| `eventAware`  | no (true)| whether generation should take slots into account                         |
| `active`      | no (true)| paused schedules stay listed                                              |

- A tone id that doesn't exist **or belongs to another org** → `400` `validation_failed`
  with a `details` entry per offending id. Nothing is written.
- `toneIds` comes back sorted ascending — the order you send is not preserved.
- Deleting a tone removes it from every schedule that referenced it.

#### `GET` / `PATCH` / `DELETE /api/orgs/:orgId/schedules/:id`

→ `200` the schedule · `200` the updated schedule · `204`.
`PATCH toneIds` **replaces** the whole selection; `[]` clears it. Omit it to leave the
tones untouched. Delete is a hard delete.

#### `GET /api/orgs/:orgId/event-sources/countries`

→ `200 { items: [{ code, name }], total }` — the active countries, name-ordered, and the
only valid values for `country`. Global reference data: the same list for every org, and
**not paginated** (`limit`/`offset` are ignored). Registered above `/:id`, so `countries`
is never read as an event-source id.

#### `GET` / `POST` / `GET :id` / `PATCH :id` / `DELETE :id` `/api/orgs/:orgId/event-sources`

```json
{ "kind": "holidays", "country": "JO" }
```

| Field     | Required | Rules                                                            |
| --------- | -------- | ---------------------------------------------------------------- |
| `kind`    | yes      | `holidays` (the only kind today)                                 |
| `country` | yes      | ISO 3166-1 alpha-2, case-insensitive on input, stored uppercase  |

- An unknown or **deactivated** country → `400` `validation_failed` on `country`.
  Deactivating a country blocks new sources but leaves existing ones working.
- One source per `kind` + `country` per org — a duplicate is `409`.
- `DELETE` also deletes every slot that source produced.

#### `GET /api/orgs/:orgId/slots`

→ `200 { items, total }` in **calendar order** (`date` ascending), not newest-first.

```json
{
  "id": "7",
  "orgId": "1",
  "eventSourceId": "3",
  "date": "2026-07-24",
  "status": "review",
  "title": "Eid al-Adha",
  "kind": "holiday"
}
```

Query params (on top of `limit`/`offset`): `from` and `to` (`YYYY-MM-DD`, **inclusive**),
`status`, `eventSourceId`. `date` is a plain calendar date — no time, no zone, and it
round-trips byte-for-byte.

#### `PATCH /api/orgs/:orgId/slots/:id`

Body `{ skip }` → `200` the updated slot. This is the **entire** slot mutation surface:
slots are written by event ingestion, so there is no create and no delete (`POST`/`DELETE`
on these paths are `404`).

- `skip: true` → `status: "skipped"`
- `skip: false` → `status: "review"`
- `approved` is set by the generation pipeline and is never reachable from this endpoint.
- Re-ingesting a feed never resurrects a skipped slot or duplicates an existing one.

### Notifications _(auth + org membership)_

A per-user inbox scoped to one org: you only ever see **your own** notifications for the
org in the path, and there is no id in any path. Nothing here writes to an inbox —
notifications are raised server-side by the feature that causes them.

#### `GET /api/orgs/:orgId/notifications`

→ `200 { items, total }`, newest first. `limit` **defaults to 50** (max 100), `offset`
defaults to 0.

Item shape:

```json
{
  "id": "12",
  "orgId": "1",
  "userId": "3",
  "kind": "content.published",
  "title": "Your post is live",
  "message": "“Launch week” was published to LinkedIn.",
  "action": "/content/42",
  "relatedType": "content",
  "relatedId": "42",
  "seenAt": null,
  "createdAt": "2026-07-29T09:12:00.000Z",
  "updatedAt": "2026-07-29T09:12:00.000Z"
}
```

- `seenAt: null` means **unread**.
- `action` is an optional call to action (a frontend route or label); `null` when there
  is nothing to click.
- `relatedType` + `relatedId` point at the subject and are **both null or both set**.
  There is no foreign key on purpose — the subject may have been deleted since, so
  resolve the link defensively.
- `kind` is a free-form event type owned by the producing feature; treat unknown kinds
  as generic rather than failing.

#### `GET /api/orgs/:orgId/notifications/unread-count`

→ `200 { unread }` — the badge count for this user in this org.

#### `POST /api/orgs/:orgId/notifications/read-all`

Stamps every unread row as seen → `200 { updated }` (how many rows flipped).
Idempotent: a second call returns `{ "updated": 0 }`. Rows that were already read keep
their original `seenAt`. There is no per-notification read endpoint yet.
