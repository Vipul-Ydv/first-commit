# HackMatch

**AI-assisted teammate matching for hackathons.**

> **"AI recommends. Humans decide."**

Built for the AWS *First Commit* hackathon — Bharat Builds Tour.

---

## The problem

Students want to enter hackathons but can't find the right teammates. A team with three
backend developers and no designer will struggle, and there's no good way to find the
person who fills the gap — especially across colleges.

## How it works

Everyone signs up, fills a profile with their skills, then picks a direction.

**Create a Team** — you're the leader
Add the competition (AI reads the page and extracts the metadata for you to confirm) →
type the skills your team is missing → HackMatch shows you people who have those skills,
with a reason → you send an **invitation** → *they* accept or decline.

**Find a Team** — you're looking to join
Browse open teams → HackMatch shows you teams that match your skills, with a reason →
you send a **join request** → *the leader* accepts or rejects.

Either way, membership changes recalculate the team's skill gap immediately.

## The rule we don't break

AI never forms a team and never makes the accept/reject call. It does exactly three
things: extracts competition metadata, resolves skill synonyms, and writes the
explanation sentence. Eligibility, team capacity, duplicate checks and every final
decision are plain deterministic code.

This is a product decision, not a technical limitation — the full reasoning is in
[`docs/spec.md`](docs/spec.md) §11.

---

## Architecture

| Layer | Service |
|---|---|
| Hosting | AWS Amplify |
| Auth | Amazon Cognito |
| API | Amazon API Gateway |
| Compute | AWS Lambda |
| Database | Amazon DynamoDB |
| AI | Amazon Bedrock |
| File storage | Amazon S3 |
| Logs | Amazon CloudWatch |

```
React SPA ──► Amplify
    │
    ├──► Cognito ──► JWT
    │
    └──► API Gateway ──► Lambda ──┬──► DynamoDB
                                  ├──► Bedrock
                                  └──► CloudWatch
```

## Repository layout

```
├── client/          React frontend
│   └── src/api/     API layer + mock fixtures (the frozen contract)
├── server/          Backend
└── docs/            All project documentation
```

## Documentation

| Document | Read it for |
|---|---|
| [`docs/spec.md`](docs/spec.md) | **Source of truth.** Full product + technical spec |
| [`docs/api-contract.md`](docs/api-contract.md) | Frozen API shapes, error codes, enums |
| [`docs/work-split.md`](docs/work-split.md) | What we're building, who builds what, timeline |
| [`docs/team-brief.md`](docs/team-brief.md) | Short version of the product |
| [`docs/plan.md`](docs/plan.md) | Two-day execution plan |
| [`docs/archive/`](docs/archive/) | Superseded documents — do not follow |

## Getting started

```bash
git clone https://github.com/Vipul-Ydv/first-commit.git
cd first-commit
```

Frontend:

```bash
cd client && npm install && npm start
```

Backend:

```bash
cd server && npm install && npm run dev
```

The frontend runs standalone against mock fixtures — set `USE_MOCK = true` in
`client/src/api/index.js` (the default) and no backend is required. Flip it to `false`
to talk to the real API.

## Status

Active build. The product specification and API contract are frozen; implementation is
in progress against them.

## Team

| Role | Name |
|---|---|
| Backend + AI | Vipul ([@Vipul-Ydv](https://github.com/Vipul-Ydv)) |
| Frontend + AWS | Vidushi |

## License

MIT
