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

## 2. Auth - two options, pick one

The backend supports **both**. The API is identical either way, but read
"Switching is not reversible mid-demo" below before assuming you can flip
between them freely.

### Option A - local login (works right now, zero setup)

`AuthContext` is already wired to it:

```jsx
const { user, loading, login, register, logout, profileComplete } = useAuth();
```

Nothing to install. Start here so you are never blocked.

### Option B - Cognito (the AWS service, if there is time)

Real user pool, email verification, password reset. Costs you an extra screen
(the email confirmation code) and about 1.5 hours.

```bash
npm install aws-amplify
```

Configure once, in `src/index.js`:

```jsx
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
    },
  },
});
```

The three values come from the `sam deploy` outputs - ask Vipul.

Then the flow is three screens instead of two:

```jsx
import { signUp, confirmSignUp, signIn, fetchAuthSession } from 'aws-amplify/auth';

// 1. Register
await signUp({ username: email, password, options: { userAttributes: { name } } });

// 2. NEW SCREEN - user types the 6-digit code from their email
await confirmSignUp({ username: email, confirmationCode: code });

// 3. Login
await signIn({ username: email, password });

// 4. Hand the token to our api layer - everything else is unchanged
const session = await fetchAuthSession();
api.setAuthToken(session.tokens.idToken.toString());
```

**Use the ID token, not the access token.** The backend verifies the ID token
because it carries email and name.

### What else changes (do not skip this)

Switching to Cognito is more than swapping two calls. `AuthContext` currently
stores `hackmatch_token` in localStorage and restores the session by calling
`/auth/me` on page load. With Cognito:

- **Session restore** comes from `fetchAuthSession()`, not localStorage and not
  `/auth/me`. Rewrite the `useEffect` in `AuthContext` accordingly.
- **Tokens expire.** Call `fetchAuthSession()` before API calls (or on 401 and
  retry) and re-run `setAuthToken`. The local token lasts 7 days and never
  needed this.
- **A Cognito user has no profile yet.** Cognito only knows email and name -
  there is no record in our database until `POST /profiles` runs. After first
  login, send the user straight to `/profile`, not `/choose`.
- **`logout`** must call Amplify's `signOut()`, not just clear localStorage.

Every other call in `src/api` is unchanged - they all just need a valid token
in the header.

### Switching is not reversible mid-demo

Cognito user ids are different from the `user_...` ids in the seeded data. When
Vipul flips the backend to Cognito the seeded accounts stop being reachable and
the database is reseeded. Agree on the switch together - do not assume you can
flip back and forth.

### Which to build

Do the pages first with Option A. Switch to Cognito at the end if time allows -
it only touches Login, Register and one new confirmation screen. If you run out
of time, we ship Option A and nothing is wasted.

---

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
| `Login.js` | **Done** - wired to `useAuth().login` |
| `Register.js` | **Done** - includes the Student / Professional toggle |

Use `Choose.js` and `CreateTeam.js` as your reference for calling the API and
handling loading/error states.

## 5. What is left

| Page | Needs |
|---|---|
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
