# Demo Script — 3 minutes

Covers what the form scores: **the project · tech stack and architecture ·
how you used AWS · learning.**

Two rules behind this draft:

1. **Problem first, but only ten seconds of it.** The previous draft opened
   straight on the surprise, which was clever and slightly wrong — at second
   three a viewer doesn't yet know what they're looking at, so a missing name
   reads as confusing rather than surprising. Ten seconds of a problem
   everyone recognises makes the next twenty land far harder.
2. **Nothing is explained that can be shown.** Every claim below has something
   moving on screen underneath it.

```
0:00 – 0:12   The problem, in one sentence everyone recognises
0:12 – 0:30   The candidate we refuse to recommend
0:30 – 0:50   Where the rules came from
0:50 – 1:25   The gap closes          <- the moment that sells it
1:25 – 1:40   The second refusal
1:40 – 2:20   Architecture and AWS
2:20 – 2:38   Learning
2:38 – 3:00   Close
```

---

## Setup — 5 minutes, do this before anything else

```
Tab 1  App        master.d2vspho7z11qj5.amplifyapp.com
                  signed in as vipul@btkit.ac.in
                  sitting on VisionX -> Candidate Recommendations
Tab 2  Brief      docs/demo/AI-Innovation-Challenge-2026.pdf
Tab 3  Diagram    docs/demo/architecture.svg
Tab 4  Dashboard  console.aws.amazon.com/cloudwatch -> HackMatch, range 1h
```

Plus an **incognito window** signed in as `aisha@btkit.ac.in`. Two tabs in the
same window share storage and will log each other out mid-take.

Password for everyone: `hackmatch2026`

```
vipul@btkit.ac.in   the leader     AWS, Node.js
aisha@btkit.ac.in   the candidate  Python, Machine Learning, AWS
imran@btkit.ac.in   never log in   the one the gap logic refuses
rohit@other.ac.in   never log in   the one eligibility refuses
```

**Caption for the first five seconds** — on screen, not spoken:

```
HackMatch — Vipul Yadav & Vidushi · Ship It
```

Judges need to know who built this. Saying it out loud costs eight of your
best seconds; a caption costs none. If your editor can't do captions, the
spoken version is written into the close instead. One or the other, never both.

- [ ] `Ctrl+Shift+B` — hide bookmarks. Close every other tab.
- [ ] Record 15 seconds, play it back, confirm the mic is on.
- [ ] Silent run-through. **Do not record the first attempt.**
- [ ] Ask Claude to re-seed after the run-through.
- [ ] Close Slack, WhatsApp, email.

---

# 0:00 – 0:12 · The problem

*[Tab 1, already on the candidate list. Don't describe the screen.]*

> "Every hackathon has this team. Four backend developers, no designer. Not
> because there were no designers in the building — there were. They just
> never found each other in time."

> "Every tool that tries to fix this matches you with people like you. Which is
> exactly how you end up with four backend developers."

---

# 0:12 – 0:30 · The candidate we refuse

> "So here's what this does instead. Imran is a student at this college. AWS,
> Docker, CI/CD, eligible for this competition, actively looking for a team."

*[Scroll the list. He isn't on it.]*

> "We refuse to recommend him."

**Half a second of silence.**

*[Point at Skill Coverage: 1 of 3, AWS covered.]*

> "Because this team already has AWS. He'd be the fifth person who does what
> they can already do. We don't rank people by how strong they look — we rank
> them by which hole they fill. Aisha is first because she closes machine
> learning."

---

# 0:30 – 0:50 · Where the rules came from

> "Teams of two to four. BTKIT students only. I didn't type any of that."

*[Tab 2 — the PDF, two seconds. Then Tab 1: Create Team → upload it.]*

> "It's in the competition brief the organiser sent. Someone has to get the
> deadline, the team size and the eligibility rules out of a PDF and into a
> form correctly, or every match after that is built on the wrong constraints.
> That's the boring step people skip, and it's the one the AI is for."

*[The review screen appears. **Don't submit it.**]*

> "Six fields out, and then it stops. A human confirms every one before
> anything is saved, and anything we couldn't read confidently is left blank
> rather than guessed — a wrong deadline is worse than a missing one."

---

# 0:50 – 1:25 · The gap closes

*[Back to VisionX. Invite Aisha.]*

> "The leader invites. The candidate decides."

*[Incognito window — Aisha's dashboard. Accept. Switch back. Refresh.]*

*[Coverage moves 1 of 3 → 2 of 3.]*

**Say nothing for two seconds.** This is the most persuasive moment in the
video. Talking over it is the easiest way to waste it.

> "Machine learning is covered, so the whole list re-ranks around design
> instead. It was never a leaderboard. It's a function of what's still
> missing."

> "And it runs both ways — an individual gets recommended teams, sends a join
> request, and the leader decides. A human on each end, every time."

---

# 1:25 – 1:40 · The second refusal

> "One more person who isn't on that list. Rohit has machine learning *and*
> design — on paper the strongest match in the database. He'd close both gaps
> at once."

> "He's at a different college, and this competition is BTKIT-only. That's the
> eligibility line out of that PDF, doing its job. It's a hard filter that runs
> before anything is scored, so he's never ranked and never shown."

> "Who gets into a team should be reproducible. Not a call a model makes."

---

# 1:40 – 2:20 · Architecture and AWS

*[Tab 3 — the diagram.]*

> "Ship It track, so all of this is deployed and serving traffic."

> "React on **Amplify**, building from GitHub on every merge. **API Gateway**
> into a **Lambda** running an ordinary Express app wrapped with
> serverless-http — the same application object runs on my laptop or in Lambda.
> That mattered more than it sounds: our AWS account was partially blocked all
> weekend, and keeping the deployment target a wrapper choice instead of a
> rewrite is what let us keep moving."

> "Five **DynamoDB** tables, pay-per-request, no idle cost. Briefs go to a
> private **S3** bucket — the browser uploads straight there with a presigned
> URL, so a 10 MB deck never touches Lambda's 6 MB payload limit. **IAM** is
> least privilege: every table granted individually, S3 scoped to one prefix,
> no wildcards."

*[Tab 4 — the live dashboard. Let it sit ~8 seconds.]*

> "**CloudWatch**, defined in the same template as the app, so monitoring
> arrived with the deploy instead of being a task someone remembers later.
> Three alarms, currently green. The whole stack is one **AWS SAM** template —
> one command rebuilds every resource in this video."

**On AI, be exact:**

> "**Bedrock** is integrated against the Converse API with schema validation
> and mandatory human review, but our account is still in verification and
> won't allow model invocation. So extraction ships behind an adapter — one
> interface, three providers, one environment variable. The matching was never
> going to be a model anyway."

---

# 2:20 – 2:38 · Learning

> "A green CloudFormation stack means the resources exist, not that the app
> works. Ours deployed clean and every route returned 404, because a named API
> Gateway stage prefixes the request path."

> "And good coverage of the happy path isn't good coverage. We had 82 passing
> tests and still shipped a bug where completing your profile deleted your
> password — because no test logged in *after* creating a profile."

---

# 2:38 – 3:00 · Close

*[Back to the candidate list — the image you opened on.]*

> "Two people you'd expect on this list aren't. One because the team already
> has his skill, one because he isn't eligible. Getting those two refusals
> right matters more than any amount of ranking cleverness."

> "Eight AWS services in production, matching working in both directions, 121
> tests, and infrastructure you can rebuild from one template."

> "AI recommends. Humans decide."

*[If you skipped the opening caption, add: "I'm Vipul — backend and AWS.
Vidushi built the frontend."]*

---

## Running out of time? Cut in this order

You have two hours. If a take keeps breaking, drop beats from the top of this
list — each one leaves a coherent video behind.

1. **The upload beat (0:30–0:50).** Costs 20 seconds and two tab switches, and
   it's the most fragile part of the take. Replace with one line over the team
   page: *"Team size and eligibility come out of the organiser's PDF
   automatically — there's a human review step before anything saves."* The
   architecture section still covers S3 and the extraction adapter.
2. **The CloudWatch tab (8 seconds).** Say the same sentence over the diagram.
3. **The reverse direction line** at 1:22.

**Never cut:** the two refusals, or the two seconds of silence when coverage
moves. Those are the whole video.

---

## Accuracy — do not overclaim

- **Don't say "AI-powered" or "powered by Bedrock".** Extraction runs a
  deterministic parser right now.
- **Don't count Cognito** in the service total. Provisioned, not in the auth
  path. Eight is the honest number.
- The diagram shows Cognito and Bedrock **dashed**, labelled "integrated and
  tested — not in the live path". That's deliberate. Don't hide it.
- Imran and Rohit are real rows, really filtered out for the stated reasons.
  Don't claim anything you can't show.

## If asked about AI

> "Matching is deterministic by design. AI has one job — reading a competition
> brief into structured fields. That's built against Bedrock and tested; our
> account isn't entitled to invoke models, so we ship a deterministic parser
> behind the same interface."

## If asked about fake accounts

> "College is self-declared. Cognito is deployed and verifies email ownership —
> switching it on is the next step, then student-ID verification."

## If asked what's next

> "Atomic membership updates — accepting is read-check-write, so two
> simultaneous accepts could race. Fine at demo scale, not at real scale."

---

## Recording notes

- **Never narrate the UI.** "Now I click Login" is a wasted second. Say why.
- **Cut every loading spinner** in the edit. Three of them is ten seconds.
- Record 2–3 takes. The second is always better than the first. Don't chase a
  perfect one — an honest take with one stumble beats a fourth attempt you
  don't have time for.
