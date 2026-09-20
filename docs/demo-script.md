# Demo Script — 3 minutes

Written for Vidushi to record. Balanced against what the submission form asks
the video to cover:
**about the project · tech stack and architecture · how you used AWS · learning.**

An earlier draft of this script was 137 seconds of product demo and 8 seconds of
AWS. "Built on AWS" is a scored criterion, so architecture now gets its own
segment.

```
0:00 – 0:20   The problem
0:20 – 1:35   The product, demoed
1:35 – 2:20   Architecture and AWS
2:20 – 2:40   Learning
2:40 – 3:00   Close
```

---

## What you need

```
Frontend    https://master.d2vspho7z11qj5.amplifyapp.com
Diagram     docs/demo/architecture.svg                  (browser, full screen)
Upload file docs/demo/AI-Innovation-Challenge-2026.pdf
Dashboard   a screenshot Vipul sends you — you cannot open the AWS console,
            it is his account
```

Demo logins: any seeded user, password `hackmatch2026`
(`aisha@btkit.ac.in`, `neha@btkit.ac.in`)

Showing invite → accept needs **two accounts**. Use two windows, or one normal
and one incognito, so you are not logging in and out mid-take.

**Three tabs, in this order:** app · diagram · dashboard screenshot

---

## Before you record

- [ ] Log out of the app so you start on the landing page
- [ ] **Silent run-through first.** Do not record the first attempt.
- [ ] Tell Vipul when the run-through is done — it puts data on the dashboard.
      He waits ~5 min, screenshots it, and sends it. Open that image in tab 3.
- [ ] Diagram open full screen in its own tab, zoomed to fit
- [ ] The PDF on the desktop, one click away
- [ ] Second browser window (or incognito) signed in as a different user
- [ ] Close Slack, WhatsApp, email

---

# 0:00 – 0:20 · The problem

*[Landing page. Do not read it aloud.]*

> "At the last hackathon I was at, a team of three backend developers submitted
> a project with no interface at all. Not because there were no designers in the
> room — there were. They just had no way to find each other in time."

> "HackMatch is a team finder built around one idea: match on what a team is
> **missing**, not on who looks similar."

---

# 0:20 – 1:35 · The product

## Upload the brief *(0:20)*

*[Create a Team → upload the PDF]*

> "Every hackathon sends a deck or a PDF. Rather than retyping it, upload the
> file. We pull out six things — name, organiser, deadline, team size,
> eligibility. Nothing else."

> "A human confirms it before anything is saved. If a field can't be read
> confidently, it's left blank rather than guessed."

## Required skills and the gap *(0:45)*

*[Type: Machine Learning, AWS, UI/UX]*

> "The leader types what the team needs — that's their judgement, not a
> model's. Now the gap is visible: one of three skills covered."

## The part that's different *(1:00)*

*[Open recommended candidates]*

> "Most matching tools find you people who look like you. For a team that's
> backwards. This team already has AWS — so someone strong in AWS, even with
> four relevant skills, **doesn't appear at all.** Aisha ranks first because she
> fills Machine Learning, the gap."

> "And there's a strong Machine Learning candidate from another college who
> never appears. This competition is BTKIT-only — eligibility is a hard filter
> applied before anything is scored."

## Humans decide *(1:20)*

*[Invite → switch account → accept]*

> "The leader invites. The candidate decides."

*[Gap moves 1/3 → 2/3]*

**Two seconds of silence.** This is the most convincing moment in the demo.

> "It works the other way too — an individual sends a join request, and the
> leader decides."

---

# 1:35 – 2:20 · Architecture and AWS

*[Switch to the diagram tab]*

> "Ship It track, so all of this is deployed."

> "React on **Amplify**, building from GitHub on every merge. Requests go
> through **API Gateway** to a **Lambda** running an ordinary Express app
> wrapped with serverless-http — so the same application object runs on my
> laptop or in Lambda. That mattered: our AWS account was partially blocked all
> weekend, and keeping the deployment target a wrapper choice instead of a
> rewrite is what let us keep moving."

> "Five **DynamoDB** tables on pay-per-request, so there's no idle cost.
> Uploaded briefs go to a private **S3** bucket — the browser uploads directly
> with a presigned URL, so a 10 MB deck never hits Lambda's 6 MB payload limit."

> "**IAM** is least privilege — each table granted individually, S3 scoped to a
> single prefix, no wildcards."

*[Switch to tab 3 — the dashboard screenshot. Leave it up for about 8 seconds.]*

> "And **CloudWatch**, defined in the same template as the app — request rate,
> p99 latency, Lambda errors, DynamoDB capacity. Three alarms, currently green."

> "The whole stack is one **AWS SAM** template. One command rebuilds every
> resource you've just seen."

*If the screenshot never arrives:* stay on the diagram and point at the
CloudWatch box while you say the line above. It lists the alarms, so the claim
still holds — you just won't be showing the proof.

**On AI, be exact:**

> "**Bedrock** is integrated against the Converse API with schema validation and
> mandatory human review — but our account is still in verification and won't
> allow model invocation. So extraction ships behind an adapter: one interface,
> three providers, and one environment variable switches them. Matching itself
> was never meant to be a model — anything deciding who gets into a team should
> be reproducible, not a guess."

---

# 2:20 – 2:40 · Learning

> "Biggest lesson: a green CloudFormation stack means the resources exist, not
> that the app works. Ours deployed clean and every route returned 404, because
> a named API Gateway stage prefixes the request path. Nothing found it except
> curling the real URL."

> "Second: good coverage of the happy path isn't good coverage. We had 82
> passing tests and still shipped a bug where completing your profile deleted
> your password — because no test logged in *after* creating a profile."

---

# 2:40 – 3:00 · Close

*[Back to the diagram, or to the app — whichever you are already on]*

> "Eight AWS services in production, all on demand. Both directions of matching
> working end to end, 108 tests, and infrastructure you can rebuild from one
> template."

> "AI recommends. Humans decide."

---

## Accuracy — do not overclaim

- **Don't say "AI-powered" or "powered by Bedrock".** Extraction runs a
  deterministic parser right now.
- **Don't count Cognito** in the service total. It's provisioned but not in the
  auth path. Eight is the honest number.
- The diagram shows Cognito and Bedrock **dashed**, labelled "integrated and
  tested — not in the live path". That's deliberate. Don't hide it.

## If asked about AI

> "Matching is deterministic by design. AI has one job: reading a competition
> brief into structured fields. That's built against Bedrock and tested; our
> account isn't entitled to invoke models, so we ship a deterministic parser
> behind the same interface."

## If asked about fake accounts

> "College is self-declared. Cognito is deployed and verifies email ownership —
> switching it on is the next step, then student-ID verification."

## If asked what you'd do next

> "Atomic membership updates — accepting is read-check-write, so two
> simultaneous accepts could race. Needs a conditional write in DynamoDB. Fine
> at demo scale, not at real scale. And college-scoped discovery: see teams
> forming on your own campus."

---

## Recording notes

- **Don't narrate the UI.** "Now I click Login" is wasted seconds. Say why, not what.
- **Cut every loading spinner** in the edit.
- Running long? Trim the architecture narration, not the demo beats. Protect the
  gap recalculating and the eligibility filter.
- Record 2–3 takes. The second is always better than the first.
