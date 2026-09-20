# Submission answers — copy/paste

Fill the username, GitHub, LinkedIn and resume fields yourself. Everything
below is drafted. **Read each one before pasting** — adjust anything that
doesn't sound like you.

---

## Project title

```
HackMatch
```

## Track

```
Ship It
```

## GitHub link

```
https://github.com/Vipul-Ydv/first-commit
```

## Deployed link

```
https://master.d2vspho7z11qj5.amplifyapp.com
```

---

## What does your project do?

```
HackMatch helps students find hackathon teammates based on what a team is
missing, rather than on who looks similar.

The problem: teams form out of whoever you already know. You end up with three
backend developers and no designer, and no way to find the designer who was
sitting two rows away. Existing options are a Discord channel or a noticeboard
where everyone posts "looking for team" into the void.

How it works. A team leader adds the competition — paste the text or upload the
actual brief as a PPT, Word doc or PDF, and we extract the six things that
matter: name, organiser, deadline, min and max team size, and eligibility. The
leader then types the skills their team is missing. That part is never inferred;
it is the leader's own judgement.

From there the team's skill gap is visible as a plain fraction — "1 of 3 skills
covered" — and candidates are ranked by what they fill in that gap. This is the
part that differs from every other matcher: we rank against the hole, not
against similarity. A second ML engineer joining a team that already has one
does not appear at all, however strong their profile. Each recommendation
states why in plain language, built only from the skills that actually matched.

It works in both directions. A leader gets recommended candidates and sends an
invitation, which the candidate accepts or declines. An individual gets
recommended teams and sends a join request, which the leader accepts or
rejects. A human decides on both sides — the system never forms a team by
itself.

Eligibility is a hard filter applied before anything is scored, so a candidate
who is not eligible for a competition is never ranked, never shown, and never
explained. That is plain deterministic code, not a model, because who gets into
a team should be reproducible and auditable.

Who it is for: students entering hackathons, and particularly the ones without
an existing network — first-years, people from smaller colleges, and anyone
attending an event where they know nobody.
```

---

## How did you use AWS in your project?

```
Ship It track. Everything below is deployed and serving traffic.

AWS Lambda — the entire API. An ordinary Express app wrapped with
serverless-http rather than one function per route, so the same application
object runs on a laptop or in Lambda. arm64, 512 MB.

Amazon API Gateway (HTTP API) — routing, CORS, and throttling at 100 rps with a
200 burst so a single client cannot exhaust Lambda concurrency. We use the
$default stage: a named stage prefixes the request path with the stage name,
which silently 404'd every route until we found it.

Amazon DynamoDB — five tables (Users, Competitions, Teams, JoinRequests,
Invitations) on PAY_PER_REQUEST, so there is no idle cost and nothing to
capacity-plan. Identity lookups use ConsistentRead, because the default
eventually-consistent read intermittently returned "not found" for a row we had
just written.

Amazon S3 — uploaded competition documents. The bucket is private with all
public access blocked; the browser uploads directly using a presigned PUT, so a
10 MB slide deck never passes through Lambda's 6 MB payload limit. Downloads are
presigned and expire in five minutes.

AWS Amplify Hosting — the React frontend, building from GitHub on every merge
to master.

Amazon CloudWatch — a dashboard covering API traffic, p50/p99 latency, Lambda
invocations, errors, concurrency and duration, and DynamoDB consumed capacity.
Three alarms: API 5xx, Lambda errors, and p99 latency above 3 seconds.
Structured JSON access logs with 7-day retention.

AWS IAM — per-resource least privilege. Each DynamoDB table is granted
individually, and S3 access is an explicit GetObject/PutObject statement scoped
to one prefix rather than the broader SAM-managed policy, which would also have
granted delete and list.

AWS CloudFormation via AWS SAM — the whole stack is one template. Every
resource above, plus the Cognito pool, alarms and dashboard, is reproducible
from a single sam deploy.

Two honest notes:

Amazon Cognito is provisioned — user pool and app client, email as username,
auto-verified email — and the backend verifies its ID tokens against the pool
JWKS. It is not currently in the auth path: we kept local JWT auth rather than
swap the login flow the night before submission, and AUTH_PROVIDER switches
between them.

Amazon Bedrock is integrated against the Converse API for competition
extraction, with schema validation and a mandatory human review step. Our AWS
account is still in verification and returns "Operation not allowed" on every
model invocation, for Anthropic and Amazon Nova models alike. So we ship a
deterministic parser behind the same interface. One environment variable
switches providers, and the Bedrock path falls back to rules on any error.
```

---

## Team leader's contributions (Vipul)

```
Backend, AI integration and AWS infrastructure.

- Deterministic core: eligibility gate, skill-gap analysis, and candidate and
  team ranking in both directions, with a synonym dictionary so "ML" matches
  "Machine Learning"
- Competition extraction behind a provider adapter: Amazon Bedrock and a
  deterministic parser returning identical validated output
- Document upload: text extraction from PPTX, DOCX and PDF, straight to S3 via
  presigned URLs, with per-user key ownership checks
- The full REST API: profiles, competitions, teams, recommendations,
  invitations, join requests and both dashboards
- Storage abstraction with in-memory and DynamoDB implementations, so the API
  was built and tested before any AWS account existed
- All AWS infrastructure as SAM: Lambda, API Gateway, DynamoDB, S3, Cognito,
  IAM, CloudWatch dashboard and alarms
- 108 automated tests, including end-to-end coverage of the full matching loop
- Product specification, API contract and project documentation
```

## Second team member's contributions (Vidushi)

```
Frontend and user experience.

- The complete React application: landing, authentication, profile, team
  creation, team browsing, team detail and both dashboards
- A design system rather than default styling: custom palette, typography,
  shadows and around thirty semantic component classes, including a dedicated
  skill-gap coverage bar
- Both matching directions in the UI — invitations and join requests as
  separate flows with separate inboxes
- The competition review screen, where AI-extracted fields are presented for
  human confirmation and unextracted fields are shown blank rather than guessed
- Responsive layout, loading and empty states throughout
```

---

## What you didn't like about the AWS services you used

```
Amazon Bedrock and AWS CloudShell — the account verification experience. A new
account sits in a partial-verification state where EC2, DynamoDB and Lambda all
work normally, but Bedrock returns "Operation not allowed" and CloudShell
refuses to start. Nothing tells you this up front. We spent hours assuming we
had misconfigured Bedrock before CloudShell happened to surface the real reason:
"account verification is in progress, this may take up to two days." That
message belongs on the Bedrock console the first time invocation fails, not
hidden behind an unrelated service. "Operation not allowed" is also the wrong
error for a verification hold — it reads like a permissions problem, so we went
looking through IAM.

Amazon Bedrock model access — the console says the model access page has been
retired and models auto-enable on first invocation. In practice, first-time
Anthropic use requires submitting a use case form, and that form itself returned
"Your account is not authorized to perform this action." Three different
messages for what turned out to be one underlying cause.

Amazon API Gateway HTTP API — a named stage prefixes the request path with the
stage name. Our stack deployed green, every resource created, and every single
route returned 404 because Lambda received /prod/health while the app only knew
/health. Nothing in CloudFormation flags this. It would cost nothing to warn
when a proxy integration is attached to a named stage.

AWS CloudFormation parameters — an unconstrained String parameter accepts an
empty string. We pressed Enter past a NoEcho secret during sam deploy --guided
and shipped a stack with no signing secret, silently. A NoEcho parameter with no
default is almost always required; prompting again on empty input, or warning,
would have caught it. We added MinLength ourselves afterwards.

Amazon DynamoDB — GetItem being eventually consistent by default is defensible,
but it produces genuinely confusing behaviour in a request/response app. We
created a profile and immediately read it back to create a team, and
intermittently got "not found" for a row that definitely existed.

Amazon Comprehend — DetectEntities returns every date in a document with no way
to express which one matters. A competition brief has a registration deadline
and a judging date; both come back as DATE with 0.99 confidence. We had to keep
the regex to decide which was which, based on the cue word next to it.

AWS SAM CLI — sam validate --lint told us the Node runtime we had chosen was
deprecated months earlier. Useful, but sam init and sam deploy never mention it,
so you only find out if you happen to run the linter.
```

---

## What you liked about the AWS services you used

```
AWS SAM — the single biggest win. One template file creates an HTTP API, a
Lambda, five DynamoDB tables, a Cognito user pool, IAM roles, three CloudWatch
alarms and a dashboard, reproducibly, from one command. Coming from clicking
things in consoles, having the whole stack in version control and reviewable in
a pull request changed how we worked. sam deploy --guided saving to
samconfig.toml meant every subsequent deploy was a single command.

AWS Lambda with serverless-http — being able to wrap an ordinary Express app
rather than restructure into one function per route meant our deployment target
became a wrapper choice instead of a rewrite. With an AWS account that was
partially blocked all weekend, keeping that door open was the best decision we
made.

Amazon DynamoDB on-demand — PAY_PER_REQUEST removed an entire category of
decision. No capacity planning, no idle cost, and the same table definition
works for a demo and for real traffic.

AWS Amplify Hosting — connecting a GitHub repo and getting automatic builds on
every merge took about ten minutes, with no CI configuration to write. It
detected our build spec without being told.

Amazon CloudWatch — defining a dashboard and alarms inside the same SAM template
as the application means monitoring arrives with the deploy instead of being a
task someone remembers later. Within minutes of our first traffic we had p99
latency and error rates without configuring an agent.

Amazon S3 presigned URLs — exactly the right primitive. The browser uploads
straight to a private bucket, so a 10 MB file never touches Lambda's 6 MB
payload limit, and the bucket stays closed to the public. About twenty lines of
code.

Amazon Comprehend — worth calling out because it was our fallback when Bedrock
was unavailable, and it works with no model access, no approval and no setup.
DetectEntities identified the organiser and event name out of unstructured
competition text immediately.

IAM policy templates in SAM — DynamoDBCrudPolicy scoped per table makes least
privilege the easy path rather than the diligent one. We did replace S3CrudPolicy
with an explicit statement after noticing it also granted delete and list, but
having readable named policies made that easy to spot and fix.
```

---

## Blog links

```
(paste your AWS Builder Center URL here once published — docs/blog-post.md)
```

## YouTube video demo link

```
(unlisted or public, under 3 minutes)
```
