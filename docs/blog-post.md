# The AI feature we shipped without the AI

*Building HackMatch for the AWS First Commit hackathon, and what fought back.*

---

## The problem

Students want to enter hackathons and can't find the right teammates. A team of
three backend developers and no designer is going to struggle, and there is no
good way to find the person who fills that hole — especially across colleges.

So we built **HackMatch**. A leader adds a competition, types the skills the
team is missing, and gets a ranked list of people who fill those specific gaps,
each with a plain-language reason. An individual browses it from the other side
and gets teams matched to their skills.

One rule ran through the whole design: **AI recommends, humans decide.** The
model never forms a team and never accepts anyone. It does exactly three
things — pull metadata out of a competition description, resolve skill synonyms,
and write the explanation sentence. Eligibility, capacity, duplicate checks and
every final decision are plain deterministic code.

That constraint turned out to matter far more than we expected, for a reason we
did not see coming.

---

## The architecture

Ship It track, so everything is deployed:

```
React (Amplify)
      │
      ▼
API Gateway  ──►  Lambda (Express via serverless-http)  ──►  DynamoDB
                                │
                                ├──► Bedrock
                                └──► CloudWatch
```

A few decisions worth explaining:

**Express inside Lambda, not one function per route.** `serverless-http` wraps
an ordinary Express app. The same app object runs on a laptop, on EC2, or in
Lambda — the deployment target became a wrapper choice instead of a rewrite.
With an AWS account that was misbehaving all weekend, keeping that door open
was the best decision we made.

**Everything on demand.** DynamoDB on `PAY_PER_REQUEST`, arm64 Lambda, 7-day log
retention, API Gateway throttled at 100 rps. Idle cost is effectively zero, and
a single bad client can't run up the bill.

**A store interface from day one.** Every collection exposes the same small set
of async methods - `get`, `put`, `update`, `list`, `find`, `findOne`, `remove`,
`count`. We started with an in-memory implementation so the whole API could be
built and tested with no AWS account at all, then added DynamoDB behind the same
interface. Routes and business logic never changed.

That last one saved us twice, and I'll come back to why.

---

## What fought back

### Bedrock was blocked, and we didn't find out until late

The plan was Claude on Bedrock for competition extraction. Console → Model
access → and the page told me model access had been retired; models auto-enable
on first use now. Great. Except invoking one returned:

```
ValidationException: Operation not allowed
```

Then an Anthropic use-case form, which returned:

```
Your account is not authorized to perform this action.
```

I assumed it was an Anthropic-specific gate and tried Amazon's own Nova models
instead. Same error. Then CloudShell refused to start:

> *Your account verification is in progress. This may take up to two days for
> new accounts.*

There it was. A brand-new AWS account sits in a partial-verification state where
core services work fine — EC2 and DynamoDB were happy — while newer ones are
gated. My deadline was the next day. "Up to two days" meant Bedrock was not
happening.

**What saved us:** hours earlier, before any of this, I'd put extraction behind
an adapter with two providers — Bedrock, and a deterministic parser — both
returning the same validated shape. It was written as insurance against a slow
model call. It turned out to be insurance against not having a model at all.

```js
EXTRACTION_PROVIDER=rules     // regex parser, no AWS needed
EXTRACTION_PROVIDER=bedrock   // real call, falls back to rules on any error
```

Nothing downstream can tell which one ran. We shipped the rules path, and the
Bedrock integration sits there tested, one environment variable away.

The lesson isn't "write fallbacks." It's that the fallback has to exist *before*
you know you need it. If I'd started writing it at 9pm the night before, it
would have been rushed and half-tested.

### CloudFormation said success. Every route 404'd.

The stack deployed clean. Lambda, API Gateway, five DynamoDB tables, all green.
Then:

```
GET /health → {"error":{"code":"NOT_FOUND"}}
```

Our own error handler — so the Lambda was running and responding. It just didn't
recognise its own routes.

A **named API Gateway stage prefixes the request path with the stage name.**
Lambda was receiving `/prod/health`; Express only knows `/health`. Every single
route was dead. CloudFormation has no opinion about this, because nothing is
wrong infrastructurally.

Switching the stage to `$default` serves from the domain root and the paths line
up with local development exactly.

**The lesson:** a green CloudFormation stack means the resources exist, not that
the application works. Nothing found this except curling the deployed URL.

### An empty parameter deployed a stack with no signing secret

During `sam deploy --guided` I pressed Enter past the JWT secret prompt without
noticing. CloudFormation accepts an empty string for an unconstrained `String`
parameter, so the stack deployed — and the code fell back to a default secret
that is **visible in the public repo.** Anyone could have forged a session token
for any user.

Two fixes, because one wasn't enough:

```yaml
JwtSecret:
  Type: String
  NoEcho: true
  MinLength: 32      # now fails at changeset time
```

```js
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is not set. Refusing to start with a known default.');
}
```

Fail loudly at deploy time, and refuse to run if it somehow gets through. A
deploy that fails is annoying. A deploy that silently succeeds with no
authentication is much worse.

### Completing your profile deleted your password

This one was found by an automated reviewer on the pull request, and it was a
genuine demo-killer.

`POST /profiles` built a user record out of sanitised profile fields and wrote
it with `put()`. But `put()` replaces the whole item, and the sanitised profile
deliberately contains no auth fields — so `passwordHash` was silently deleted.

Every user could register, fill in their profile, and then never log in again.

My end-to-end test suite had 82 passing tests and missed it completely, because
**nothing logged in after creating a profile.** The test walked the demo script,
and the demo script never revisits login.

That is the most useful thing I learned all weekend. Good coverage of the happy
path is not the same as good coverage. The bug lived in the seam between two
features that were each tested on their own.

---

## What I'd do differently

**Test the deployed thing, not just the code.** Three of these bugs were
invisible locally and obvious the moment I hit the real URL.

**Write down what you decided not to fix.** Accepting a teammate is currently
read-check-write, so two simultaneous accepts could race and over-fill a team.
Fixing it properly needs an atomic conditional write in DynamoDB. I chose not to
do that the night before a deadline — but I wrote the reasoning into the code
rather than leaving it silent, so the next person knows it's a decision and not
an oversight.

**Verify assumptions about your own infrastructure.** I skipped Cognito because
Bedrock and CloudShell were blocked and I assumed the restriction was broad. It
wasn't. One read-only CLI call would have told me Cognito worked fine. I lost
hours of optionality to an assumption I never spent thirty seconds checking.

---

## What I learned

- **SAM and infrastructure as code.** Ten minutes of `template.yaml` and one
  command creates an HTTP API, a Lambda, five tables, a Cognito pool, IAM roles,
  alarms and a dashboard. Reproducibly.
- **DynamoDB is not a small SQL database.** `GetItem` is eventually consistent
  by default, which caused intermittent "not found" right after a successful
  write. `ConsistentRead: true` on identity lookups fixed it.
- **Lambda has no memory between requests.** Our in-memory store worked
  perfectly in development and would have silently lost data in production —
  each cold start is a fresh container.
- **`sam validate --lint` earns its keep.** It told us `nodejs20.x` had been
  deprecated months ago, which we'd never have noticed otherwise.
- **The boring layer is what saves you.** An adapter and a store interface,
  written early for no urgent reason, are why a blocked AI service and a shaky
  AWS account cost us features instead of the whole project.

---

## Where it ended up

Live on Amplify, API Gateway, Lambda, DynamoDB, S3, CloudWatch, IAM and
CloudFormation. Cognito is deployed and its tokens verify, but it is not in
the auth path yet, so I am not counting it. 121 tests. Both directions of the
matching loop working end to end against the deployed API.

And an AI feature shipped without the AI — which, given the weekend, I'm
counting as the thing I'm proudest of.
