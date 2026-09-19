# Deployment

Two paths. **Path 1 is the Ship It track answer.** Path 2 exists because the
AWS account on this project has already blocked one feature, and a live URL
tomorrow matters more than which cloud it sits on.

The application code is identical in both. Only the wrapper changes.

---

## Before either path

```bash
cd server && npm test        # 82 tests
cd client && npm run build   # must compile
```

Do not deploy a red build. You will not have time to debug it remotely.

---

## Path 1 - AWS (the track answer)

### 1a. Backend: SAM

Needs the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

```bash
sam build
sam deploy --guided
```

It will ask for:

| Prompt | Answer |
|---|---|
| Stack name | `hackmatch` |
| Region | `us-east-1` (matches where the account has been working) |
| `JwtSecret` | A random string. Generate one; do not paste a value from source control. |
| `ExtractionProvider` | `rules` unless Bedrock is authorized |
| `BedrockModelId` | Leave empty unless Bedrock is authorized |

This creates the Lambda, the HTTP API, and all five DynamoDB tables
(`PAY_PER_REQUEST`, so no idle cost).

Copy the **ApiUrl** output. Then check it:

```bash
curl https://<ApiUrl>/health
```

### 1b. Seed the deployed database

The tables start empty, and empty recommendation screens make the demo look
broken. Point the seed at DynamoDB and run it once:

```bash
cd server
STORE=dynamo AWS_REGION=us-east-1 node -e "
  require('./store/seed').seed(require('./store').createStore().store)
    .then(c => console.log('seeded', c))
"
```

### 1c. Frontend: Amplify

1. Amplify console -> **Host web app** -> connect this GitHub repo, branch `master`
2. It detects `amplify.yml` automatically
3. Add environment variable `REACT_APP_API_URL` = the ApiUrl from 1a
4. Deploy

Amplify redeploys on every push to `master` after this.

---

## Path 2 - Fallback, if AWS blocks again

Same code. Roughly 15 minutes, no AWS account involved.

### Backend on Render

- New **Web Service**, connect the repo
- Root directory `server`, build `npm install`, start `npm start`
- Environment: `JWT_SECRET`, `NODE_ENV=production`, and `STORE=memory`

`STORE=memory` is acceptable **only here**, because Render runs a single
long-lived process. Data resets on redeploy, so re-run the demo flow after
any deploy. It is not acceptable on Lambda - see `server/store/dynamo.js`.

For persistence without AWS, MongoDB Atlas' free tier plus a `store/mongo.js`
satisfying the same interface is about an hour of work. Only do this if the
demo needs to survive a restart.

### Frontend on Vercel or Netlify

- Root directory `client`, build `npm run build`, publish `build`
- Environment: `REACT_APP_API_URL` = the Render URL

---

## Environment variables

| Variable | Where | Notes |
|---|---|---|
| `JWT_SECRET` | backend | Required. Random. Never committed. |
| `STORE` | backend | `dynamo` on Lambda. `memory` only on a single-process host. |
| `NODE_ENV` | backend | `production` disables the `x-dev-user` auth header |
| `EXTRACTION_PROVIDER` | backend | `rules` or `bedrock` |
| `BEDROCK_MODEL_ID` | backend | Only if Bedrock is authorized |
| `REACT_APP_API_URL` | frontend | Backend base URL. Baked in at build time - changing it needs a rebuild. |

---

## Two things that will bite you

**`NODE_ENV=production` is not optional.** Without it the `x-dev-user` header
still works, and anyone can act as any user by setting one header.

**`REACT_APP_API_URL` is compiled into the bundle.** Create React App inlines
it at build time, so changing it in the host's settings does nothing until you
trigger a rebuild.

---

## Demo day checklist

- [ ] `/health` responds on the deployed backend
- [ ] Seed data is present - recommendation screens are not empty
- [ ] Register a brand new account and walk the full flow on the live URL
- [ ] Both directions work: invitation **and** join request
- [ ] Skill gap visibly recalculates after someone joins
- [ ] Video recorded against the deployed URL, not localhost

---

## Demo logins

Seeded users have no password by default - they exist to fill the
recommendation lists, not to be signed into. But the demo needs to show a
candidate *accepting* an invitation, which means signing in as them.

Set `SEED_PASSWORD` when seeding to give every seeded user that password:

```bash
cd server
STORE=dynamo AWS_REGION=us-east-1 SEED_PASSWORD=<pick one> node -e "require('./store/seed').seed(require('./store').createStore().store).then(c => console.log('seeded', c))"
```

The result prints `loginEnabled: true` when it took effect.

Then `aisha@btkit.ac.in`, `neha@btkit.ac.in` and the rest all sign in with that
password. Emails follow the pattern `<firstname>@btkit.ac.in` - see
`server/store/seed.js`.

**Opt-in on purpose.** A shared known password across accounts on a public API
is fine for a demo full of fake people and unacceptable anywhere else. Never
set this on a deployment holding real users.
