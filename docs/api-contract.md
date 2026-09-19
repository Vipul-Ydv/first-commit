# HackMatch - Frozen API Contract

**Status: FROZEN.** Both developers code against this. If something must change, tell the other person *before* changing it - a silent change here costs an afternoon of rework.

- Frontend reads these shapes from `client/src/api/mock/*.json`
- Backend must return **exactly** these shapes
- The switch that connects them: `USE_MOCK` in `client/src/api/index.js`

---

## 1. Conventions

| Rule | Detail |
|---|---|
| Case | `camelCase` everywhere in API responses |
| Dates | ISO 8601 UTC, e.g. `2026-09-30T23:59:00Z` |
| **Reads return full objects** | `GET /teams/:id` returns `members[]` with names and skills - **not** bare `memberIds`. The UI must never need a second call to render a screen. |
| **Writes send IDs only** | `POST /teams` sends `competitionId`, not the whole competition object |
| **Identity comes from the JWT** | Never send `userId` in a request body to identify the caller. `POST /teams/:id/join-request` has **no body** - the server reads who you are from the token. Sending it would be a security hole (spec §12). |
| Auth header | `Authorization: Bearer <cognito-jwt>` on every call |

---

## 2. Endpoints

| Method | Path | Who can call | Mock file |
|---|---|---|---|
| `POST` | `/profiles` | any logged-in | `profile.json` |
| `GET` | `/profiles/:id` | any logged-in | `profile.json` |
| `PUT` | `/profiles/:id` | owner only | `profile.json` |
| `POST` | `/competitions/analyze` | any logged-in | `competition-analyze.json` |
| `POST` | `/competitions` | any logged-in | - |
| `POST` | `/teams` | any logged-in (creator becomes leader) | `team.json` |
| `GET` | `/teams` | any logged-in | `teams-browse.json` |
| `GET` | `/teams/:id` | any logged-in | `team.json` |
| `PUT` | `/teams/:id` | **leader only** | `team.json` |
| `GET` | `/teams/:id/recommendations` | **leader only** | `recommendations-candidates.json` |
| `GET` | `/users/:id/recommended-teams` | **self only** | `recommendations-teams.json` |
| `POST` | `/teams/:id/join-request` | any eligible | - |
| `POST` | `/join-requests/:id/approve` | **leader only** | - |
| `POST` | `/join-requests/:id/reject` | **leader only** | - |
| `POST` | `/teams/:id/invite` | **leader only** | - |
| `POST` | `/invitations/:id/accept` | **invitee only** | - |
| `POST` | `/invitations/:id/decline` | **invitee only** | - |
| `GET` | `/users/:id/dashboard` | **self only** | `dashboard-individual.json` |
| `GET` | `/teams/:id/dashboard` | **leader only** | `dashboard-leader.json` |

---

## 3. The skill gap (must match exactly on both sides)

```
covered   = requiredSkills  ∩  (all member skills combined)
remaining = requiredSkills  -  covered
coveragePercent = round(covered / requiredSkills * 100)
```

Recalculated on **every** membership change. Returned inside `GET /teams/:id` as `skillGap`, so the frontend never computes it.

Worked example, matching `team.json`:

| | |
|---|---|
| Required | Machine Learning, AWS, UI/UX |
| Members know | AWS, Node.js, Python |
| **covered** | AWS |
| **remaining** | Machine Learning, UI/UX |
| **coveragePercent** | 33 |

---

## 4. Errors

Every failure returns HTTP 4xx with this body:

```json
{ "error": { "code": "TEAM_FULL", "message": "This team is already full." } }
```

Full code list with HTTP statuses: `client/src/api/mock/errors.json`. The ones that will actually fire during the demo:

| Code | When |
|---|---|
| `TEAM_FULL` | Checked on **send** and again on **accept** - the team can fill up in between |
| `DUPLICATE_REQUEST` | Second pending join request to the same team |
| `NOT_ELIGIBLE` | Fails `studentOnly` or institution restriction |
| `NOT_LEADER` | Non-leader tries to invite or approve |
| `ALREADY_MEMBER` | Member requests to join their own team |

**Extraction failure is not an error.** `POST /competitions/analyze` returns **HTTP 200** with `needsReview: true` and an `unextracted` array. The form shows those fields blank for the human to fill. Never guess a value.

---

## 5. Shared demo cast

Use these exact IDs and names in the mocks, in the seed data, and in the demo. If the seed data uses different names, the demo will not line up with the screenshots.

| ID | Name | College | Skills | Role in demo |
|---|---|---|---|---|
| `user_001` | Vipul Yadav | BTKIT | AWS, Node.js | Team leader |
| `user_002` | Rahul Sharma | BTKIT | Python | Existing member |
| `user_456` | Aisha Khan | BTKIT | Python, Machine Learning, AWS | **Top candidate** - gets invited |
| `user_457` | Neha Verma | BTKIT | UI/UX, Figma | 2nd candidate |
| `user_458` | Karan Mehta | BTKIT | UI/UX, Java | 3rd - same skill as Neha, weaker availability |
| `user_459` | Sneha Rao | BTKIT | UI/UX, Illustrator | Sends a **join request** (Path B) |

| ID | Name | Detail |
|---|---|---|
| `team_123` | VisionX | Leader `user_001`, 2/4 members, needs ML + AWS + UI/UX |
| `team_124` | DataDock | 3/4 members, `almost_full` |
| `competition_123` | AI Innovation Challenge | studentOnly, BTKIT only, deadline 2026-09-30 |

Why Neha and Karan both have UI/UX: it demonstrates the spec's secondary signals (A.7). Same matched skill, so availability and role preference break the tie. Good thing to point at in the video.

---

## 6. Enum values - do not invent new ones

| Field | Allowed |
|---|---|
| `userType` | `student`, `professional` |
| `requiredSkills[].priority` | `high`, `medium`, `low` |
| `team.status` | `recruiting`, `almost_full`, `full`, `closed` |
| join request `status` | `pending`, `accepted`, **`rejected`**, `cancelled` |
| invitation `status` | `pending`, `accepted`, **`declined`**, `cancelled` |

Note the asymmetry: join requests are **rejected**, invitations are **declined**. That is from the spec - keep it, it is how the two flows stay readable in the dashboards.

---

## 7. Things the backend must never trust from the frontend

1. Who the caller is - always from the verified JWT
2. Whether a team has space - re-check at accept time
3. Whether someone is eligible - re-check at accept time
4. Whether the caller is the leader - re-check on every mutation

The frontend disabling a button is a convenience, not the enforcement.

---

*Product details: `spec.md` · Who builds what: `work-split.md`*
