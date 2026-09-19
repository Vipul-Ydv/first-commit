# Frontend Handoff - for Vidushi

**The backend is finished and running. The client now builds.** Everything below
is the frontend work that remains.

---

## 1. Run it

Two terminals.

```bash
cd server && npm install && npm run dev      # http://localhost:5000
```

```bash
cd client && npm install && npm start        # http://localhost:3000
```

The client proxies `/` API calls to port 5000 already - no CORS setup needed.

The server seeds 11 users, 2 teams and 1 competition on boot, so every screen
has real data to render. `SEED=false` starts empty.

---

## 2. Auth works

Real registration and login (bcrypt + JWT). No Cognito - the AWS account could
not provision it, so this stands in.

`AuthContext` is already wired. Use it:

```jsx
const { user, loading, login, register, logout, profileComplete } = useAuth();
```

`profileComplete` is true once the user has a name, at least one skill, and a
college or organization. Matching needs all three, so gate on it.

---

## 3. Call the API through one file

**Never use `axios` directly in a page.** Everything goes through `src/api`:

```jsx
import * as api from '../api';

const team = await api.getTeam(id);
const { recommendations } = await api.getCandidateRecommendations(teamId);
await api.sendInvitation(teamId, userId);
```

Every function is in `client/src/api/index.js`. Shapes are frozen in
`docs/api-contract.md` and mirrored in `client/src/api/mock/*.json`.

### Errors

Every failure comes back as `{ error: { code, message } }`.

```jsx
try {
  await api.sendJoinRequest(teamId);
} catch (e) {
  toast.error(api.readError(e));        // message for the user
  if (api.errorCode(e) === 'TEAM_FULL') refresh();   // branch on code
}
```

Codes you will actually hit: `TEAM_FULL`, `DUPLICATE_REQUEST`,
`DUPLICATE_INVITATION`, `ALREADY_MEMBER`, `NOT_ELIGIBLE`, `NOT_LEADER`.
Full list: `client/src/api/mock/errors.json`.

### Mock mode

`USE_MOCK` in `src/api/index.js` is now `false` because the backend is real.
Set it to `true` if you ever want to work without the server running.

---

## 4. What is done

| Page | State |
|---|---|
| `Choose.js` | **Done** - the fork between the two directions |
| `CreateTeam.js` | **Done** - competition paste, extraction review, skills |
| `Navbar.js` | Done - dead Events/Map links removed |
| `App.js` | Done - routing for both directions |
| `AuthContext.js` | Done - wired to real auth |

Use `Choose.js` and `CreateTeam.js` as your reference for calling the API and
handling loading/error states.

## 5. What is left

| Page | Needs |
|---|---|
| `Login.js` | Rewire to `useAuth().login` - still calls old axios endpoints |
| `Register.js` | Rewire to `useAuth().register`; ask Student vs Professional |
| `Profile.js` | Rewire + new fields: `userType`, `collegeName`/`organizationName`, `skills`, `github`, `linkedin`, `interests`, `competitionPreferences`, `availability`, `rolePreference` |
| `Teams.js` | Two sections: recommended teams (`getRecommendedTeams`) and browse all (`browseTeams`) |
| `TeamDetail.js` | Gap display, member list, and the two actions - request to join, or (if leader) view candidates and invite |
| `Dashboard.js` | Individual view (`getIndividualDashboard`) and leader view (`getLeaderDashboard`) |
| `Landing.js` | Copy still says ConnectCampus in places |

---

## 6. The thing not to break

There are **two directions**, and they are different objects with different
deciders:

| You are | You send | Who answers |
|---|---|---|
| Leader | **Invitation** | the candidate |
| Individual | **Join Request** | the leader |

Do not merge them into one button. Both must work in the demo.

---

## 7. Screens the demo needs to show

In order, from `docs/spec.md` §17:

1. Profile with skills
2. Create team - paste competition, review extracted fields, type required skills
3. **Skill gap** - covered vs remaining. This is the money shot; make it obvious.
4. **Recommended candidates** with the plain-language reason under each name
5. Invite -> accept -> gap visibly recalculates
6. The other direction: find a team -> join request -> leader accepts

The gap recalculating live after someone joins is the single most convincing
moment. Make sure that refresh actually happens.

---

## 8. Notes

- `.btn-primary`, `.card`, `.input-field`, `.badge`, `.badge-skills` already
  exist in `src/index.css`. Use them rather than inventing new styles.
- Do not write a Tailwind class name inside a comment. Tailwind scans comments
  and will generate CSS from it - that is what broke the build before.
- Competition extraction currently runs a deterministic parser, not Bedrock.
  The Bedrock adapter is built and tested; the AWS account is not authorized
  yet. Nothing in the UI changes either way.
