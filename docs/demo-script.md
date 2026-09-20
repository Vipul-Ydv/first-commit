# Demo Script — 3 minutes

Covers what the submission form scores:
**about the project · tech stack and architecture · how you used AWS · learning.**

The rewrite rule: **open on the surprise, not on the setup.** Judges watch
dozens of these. An anecdote costs twenty seconds before anything happens on
screen — and the strongest thing this product does is refuse to recommend
someone. That now lands in the first fifteen seconds instead of at 1:00.

```
0:00 – 0:15   The person who isn't on the list
0:15 – 0:30   Why that is the right answer
0:30 – 0:52   Reading the brief
0:52 – 1:30   The gap closes
1:30 – 1:45   The second person who isn't on the list
1:45 – 2:25   Architecture and AWS
2:25 – 2:42   Learning
2:42 – 3:00   Close
```

---

## Tabs, in this order

```
1  App        https://master.d2vspho7z11qj5.amplifyapp.com
              signed in as vipul@btkit.ac.in,
              already on VisionX -> Candidate Recommendations
2  The brief  docs/demo/AI-Innovation-Challenge-2026.pdf
3  Diagram    docs/demo/architecture.svg
4  Dashboard  https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards/dashboard/HackMatch
```

Tab 1 starts **on the candidate list**, not the landing page. The old script
opened logged out and spent its best seconds on a login form.

Plus an **incognito window** signed in as `aisha@btkit.ac.in` — the invite and
the accept need two accounts, and two tabs in one window share storage and log
each other out mid-take.

Logins: any seeded user, password `hackmatch2026`

```
vipul@btkit.ac.in   the leader      AWS, Node.js
aisha@btkit.ac.in   the candidate   Python, Machine Learning, AWS
imran@btkit.ac.in   never log in    the strong candidate the gap logic hides
rohit@other.ac.in   never log in    the strong candidate eligibility hides
```

---

## Before you record

- [ ] **Silent run-through first.** Do not record the first attempt.
- [ ] Ask Claude to re-seed afterwards — the run-through leaves state behind
      and it will be on camera
- [ ] That run-through also fills the dashboard. Wait ~5 min, then set tab 4
      to **1h** — on 3h the lines have gaps and look like an outage
- [ ] Incognito window as Aisha, sitting on her dashboard
- [ ] `Ctrl+Shift+B` to hide bookmarks; close every other tab
- [ ] Record 15 seconds and play it back — confirm the mic is actually on
- [ ] Close Slack, WhatsApp, email

---

# 0:00 – 0:15 · Open on the absence

*[Tab 1, already showing VisionX's candidate list. Five names. Start talking
immediately — no title card, no "hi, I'm".]*

> "There's a student at this college called Imran. AWS, Docker, CI/CD — three
> strong skills, eligible for this competition, actively looking for a team."

*[Scroll the list slowly. He is not in it.]*

> "He doesn't appear anywhere on this list. That's not a bug. That's the
> entire product."

---

# 0:15 – 0:30 · Why that is right

*[Point at the Skill Coverage card: 1 of 3, AWS covered.]*

> "This team already has AWS. A second AWS person adds nothing they don't
> already have. What they're missing is machine learning and design."

> "So we don't rank people by how good they look. We rank them by what they
> fill. Aisha is first because she closes the machine learning gap."

> "At the last hackathon I went to, three backend developers submitted a
> project with no interface. There were designers in that room. Nobody found
> them in time. Similarity matching makes that worse, because it keeps handing
> you more of what you already have."

---

# 0:30 – 0:52 · Reading the brief

*[Tab 2 — the PDF, two seconds, so they see it is a real document. Then tab 1:
Create Team → upload it.]*

> "Every hackathon sends a PDF like this one. Rather than retyping it, upload
> the file — we pull out six fields. Name, organiser, deadline, team size,
> eligibility."

*[The review screen appears. **Do not submit it.**]*

> "And it stops here. A human confirms every field before anything is saved,
> and anything we couldn't read confidently is left blank rather than guessed.
> I'm not going to confirm this one — I already have a team."

---

# 0:52 – 1:30 · The gap closes

*[Back to VisionX. Invite Aisha.]*

> "The leader types the skills the team needs — that's their judgement, not a
> model's. Then they invite. And the candidate decides."

*[Switch to the incognito window. Aisha's dashboard shows the invitation.
Accept.]*

*[Switch back. Refresh. Coverage moves 1 of 3 → 2 of 3.]*

**Say nothing for two seconds.** This is the most convincing moment in the
video, and narrating over it is the easiest way to waste it.

> "Machine learning is covered now, so every remaining recommendation re-ranks
> around design instead. The list was never a fixed leaderboard. It's a
> function of what's still missing."

> "It runs the other way too — an individual gets recommended teams and sends a
> join request, and the leader decides. Both directions, a human on each end."

---

# 1:30 – 1:45 · The second absence

> "One more person who isn't on that list. Rohit has machine learning *and*
> design. On paper he's the strongest match in the database — he'd close both
> gaps at once."

> "This competition is BTKIT-only and he's at a different college. Eligibility
> is a hard filter that runs before anything is scored, so he's never ranked,
> never shown, and never explained away. That's deliberate. Who gets into a
> team should be reproducible, not a call a model makes."

---

# 1:45 – 2:25 · Architecture and AWS

*[Tab 3 — the diagram.]*

> "Ship It track, so all of this is deployed and serving traffic."

> "React on **Amplify**, building from GitHub on every merge. Requests go
> through **API Gateway** to a **Lambda** running an ordinary Express app
> wrapped with serverless-http — the same application object runs on my laptop
> or in Lambda. That mattered more than it sounds. Our AWS account was
> partially blocked all weekend, and keeping the deployment target a wrapper
> choice instead of a rewrite is what let us keep moving."

> "Five **DynamoDB** tables, pay-per-request, no idle cost. Uploaded briefs go
> to a private **S3** bucket — the browser uploads straight there with a
> presigned URL, so a 10 MB deck never hits Lambda's 6 MB payload limit.
> **IAM** is least privilege: every table granted individually, S3 scoped to a
> single prefix, no wildcards."

*[Tab 4 — the live CloudWatch dashboard. Let it sit ~8 seconds.]*

> "**CloudWatch**, defined in the same template as the app, so monitoring
> arrived with the deploy instead of being a task someone remembers later.
> Request rate, p99 latency, Lambda errors, DynamoDB capacity. Three alarms,
> currently green."

> "The whole stack is one **AWS SAM** template. One command rebuilds every
> resource in this video."

**On AI, be exact — do not soften this:**

> "**Bedrock** is integrated against the Converse API, with schema validation
> and mandatory human review. But our account is still in verification and
> won't allow model invocation. So extraction ships behind an adapter: one
> interface, three providers, one environment variable. The matching was never
> going to be a model anyway — anything deciding who gets into a team should be
> reproducible."

---

# 2:25 – 2:42 · Learning

> "A green CloudFormation stack means the resources exist, not that the app
> works. Ours deployed clean and every route returned 404, because a named API
> Gateway stage prefixes the request path. Nothing caught it except curling the
> real URL."

> "And good coverage of the happy path isn't good coverage. We had 82 passing
> tests and still shipped a bug where completing your profile deleted your
> password — because no test logged in *after* creating a profile."

---

# 2:42 – 3:00 · Close

*[Back to the candidate list — end on the image you opened with.]*

> "Two people you'd expect on this list aren't on it. One because the team
> already has his skill, one because he isn't eligible. Getting those two
> exclusions right matters more than any amount of ranking cleverness."

> "Eight AWS services in production, both directions of matching working end to
> end, 108 tests, and infrastructure you can rebuild from one template."

> "AI recommends. Humans decide."

---

## What changed, and why

| Before | Now |
|---|---|
| Opened logged out on the landing page | Opens on the candidate list, mid-product |
| Anecdote first, product at 0:20 | Product at 0:00, anecdote at 0:22 as *evidence* |
| One absence (Rohit), at 1:00 | Two absences, at 0:05 and 1:30 — they bracket the demo |
| Upload created a real team | Stops at the review screen: proves human review *and* leaves the data clean |
| Closed on a stat list | Closes by returning to the opening image |

---

## Accuracy — do not overclaim

- **Don't say "AI-powered" or "powered by Bedrock".** Extraction runs a
  deterministic parser right now.
- **Don't count Cognito** in the service total. Provisioned, not in the auth
  path. Eight is the honest number.
- The diagram shows Cognito and Bedrock **dashed**, labelled "integrated and
  tested — not in the live path". Don't hide it.
- Imran and Rohit are real rows in the seeded database, and both really are
  filtered out for the reasons given. If a judge asks you to prove they exist,
  browse the team list as Vipul — don't claim it without being able to show it.

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
> at demo scale, not at real scale. And college-scoped discovery: seeing the
> teams forming on your own campus."

---

## Recording notes

- **Never narrate the UI.** "Now I click Login" is a wasted second. Say why.
- **Cut every loading spinner** in the edit. Three of them is ten seconds.
- Running long? Trim the architecture narration, never the demo beats. Protect
  the two absences and the gap recalculating.
- Record 2–3 takes. The second is always better than the first.
