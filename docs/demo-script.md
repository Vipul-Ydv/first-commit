# Demo Script — 3 minutes

**Record against the live URL, not localhost.** Judges can tell, and "deployed"
is the whole Ship It track.

```
Frontend   https://master.d2vspho7z11qj5.amplifyapp.com
API        https://2eh5fktfc5.execute-api.us-east-1.amazonaws.com
Dashboard  https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards/dashboard/HackMatch
```

Demo logins: any seeded user, password `hackmatch2026`
(`aisha@btkit.ac.in`, `neha@btkit.ac.in`, ...)

The file to upload: **`docs/demo/AI-Innovation-Challenge-2026.pptx`**
Verified against the deployed API — all six fields extract, nothing left blank.

---

## Before you record

- [ ] Open the live URL in a clean window — no bookmarks bar, no other tabs
- [ ] Log out, so you start from the landing page
- [ ] Have the `.pptx` on your desktop, ready to pick
- [ ] **Click around the live app for a minute** so the dashboard has data on it.
      Five empty graphs is worse than no dashboard.
- [ ] Open the dashboard in a second tab, scrolled to the top
- [ ] One full silent run-through. **Do not record the first attempt.**
- [ ] Close Slack, WhatsApp, email

---

## 0:00 – 0:18 · Open on a person, not a product

*[Landing page on screen. Do not read it aloud.]*

> "At the last hackathon I was at, a team of three backend developers submitted
> a project with no interface at all. Not because there were no designers in the
> room — there were. They just had no way to find each other in time."

## 0:18 – 0:35 · What it is, and the one difference

*[Log in → Choose screen]*

> "HackMatch is a team finder, built around one idea: match on what a team is
> **missing**, not on who looks similar."

> "You sign up, list your skills, and pick a side — leading a team, or looking
> to join one. Both work, and I'll show you both."

## 0:35 – 1:05 · Upload the brief

*[Create a Team → upload the .pptx]*

> "Every hackathon sends you a deck or a PDF. Rather than retyping it, upload
> the file."

*[Let extraction finish on screen]*

> "It pulls out six things — name, organiser, deadline, team size, eligibility.
> Nothing else. It never touches required skills or judging criteria."

> "And a human confirms it before anything is saved. If a field can't be read
> confidently, it's left blank rather than guessed."

## 1:05 – 1:25 · The leader decides what's needed

*[Type: Machine Learning, AWS, UI/UX]*

> "The leader types what the team needs. We never infer that from the
> competition text — that's their judgement, not a model's."

## 1:25 – 1:40 · The gap

> "One of three skills covered. A plain set comparison, not a score — you can
> see exactly why."

## 1:40 – 2:15 · The part that is different

*[Open recommended candidates]*

> "Here's where it stops being a normal matcher. Most tools find you people who
> look like you. For a team, that's backwards."

> "This team already has AWS. So someone strong in AWS — even with four relevant
> skills — **doesn't appear at all.** Aisha ranks first because she fills
> Machine Learning, the gap."

> "Every recommendation says why, built only from matched skills. It can't
> invent experience someone doesn't have."

> "And there's a strong Machine Learning candidate from another college who
> never appears. This competition is BTKIT-only — eligibility is a hard filter
> applied before anything is scored. Plain code, not a model."

## 2:15 – 2:40 · Humans decide

*[Invite → switch account → accept]*

> "The leader invites. The candidate decides."

*[Gap moves 1/3 → 2/3]*

**Say nothing for two seconds.** This is the most convincing moment in the demo.

## 2:40 – 2:52 · The other direction

*[As Neha → Find a Team → join request → leader approves]*

> "It works the other way too. Someone without a team sees teams matched to
> their skills, sends a join request — and this time the leader decides."

## 2:52 – 3:00 · Close

*[Cut to the CloudWatch dashboard tab]*

> "Eight AWS services, all on demand — Lambda, API Gateway, DynamoDB, S3,
> Amplify — with monitoring and alarms. AI recommends. Humans decide."

---

## Accuracy — do not overclaim

**Do not say "AI-powered" or "powered by Bedrock".** Extraction currently runs a
deterministic parser. The Bedrock integration is built and tested; the AWS
account is not entitled to invoke models.

**Do not count Cognito in the service list.** It is deployed but not in the auth
path, so eight is the honest number.

## If asked about AI

> "Matching is deterministic by design — eligibility, capacity and ranking are
> plain rules, because anything deciding who gets into a team should be
> reproducible, not a model call. AI has one job here: reading a competition
> brief into structured fields. That's built against Bedrock's Converse API and
> tested — our account is still in verification and won't allow model
> invocation, so we ship a deterministic parser behind the same interface. One
> environment variable switches it."

## If asked about fake accounts

> "College is self-declared right now. Cognito is deployed and verifies email
> ownership — switching it on is the next step, then student-ID verification."

## If asked what you would do next

> "Atomic membership updates. Accepting is read-check-write, so two
> simultaneous accepts could race. It needs a conditional write in DynamoDB —
> fine at demo scale, not at real scale."

> "And college-scoped discovery: see teams forming on your own campus."

Knowing your own weak spot is worth more than pretending you have none.

---

## Recording notes

- **Do not narrate the UI.** "Now I click Login" is wasted time. Say why, not what.
- **Cut every loading spinner** in the edit.
- Running long? Cut 0:18–0:35 to one sentence. Protect the gap recalculating
  and the eligibility line — those two are what make this look built rather
  than assembled.
- Record 2–3 takes. The second is always better than the first.
