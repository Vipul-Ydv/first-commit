# Demo Script - 3 minutes

**Record against the live URL, not localhost.** Judges can tell, and "deployed"
is the whole Ship It track.

```
Frontend  https://master.d2vspho7z11qj5.amplifyapp.com
API       https://2eh5fktfc5.execute-api.us-east-1.amazonaws.com
```

Dashboard  https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards/dashboard/HackMatch

Demo logins: any seeded user, password `hackmatch2026`
(`aisha@btkit.ac.in`, `neha@btkit.ac.in`, ...)

---

## Before you record

- [ ] Open the live URL in a clean browser window - no bookmarks bar, no other tabs
- [ ] Log out, so you start from the landing page
- [ ] Have `docs/demo/AI-Innovation-Challenge-2026.pptx` on your desktop, ready to pick
- [ ] Upload it once before recording, so the flow is warm and you know the timing
- [ ] Do one full silent run-through first. Do not record the first attempt.
- [ ] Close Slack, WhatsApp, email - no notification popups
- [ ] Open the CloudWatch dashboard in a second tab, ready for the close
- [ ] Hit the live app a few times first, so the dashboard has data on it and
      is not five empty graphs

**The file to upload:** `docs/demo/AI-Innovation-Challenge-2026.pptx`

A five-slide deck written the way a real hackathon deck is - title, organiser,
eligibility, dates, prizes. Verified against the deployed API: all six fields
extract, `needsReview: false`, nothing left blank.

**Fallback, if the upload misbehaves on the day.** Click "Enter manually", or
paste this into the text box and use *Extract details*:

```
AI Innovation Challenge 2026
Organised by: BTKIT
Teams of 2-4 members.
Registration deadline: 30 November 2026.
Open only to students from BTKIT.
```

Both paths produce the same six fields. Know which one you are doing before you
hit record - deciding on camera is what makes a demo look shaky.

---

## The script

### 0:00-0:20 - The problem

> "Students want to enter hackathons but can't find the right teammates. A team
> with three backend developers and no designer is going to struggle - and
> there's no good way to find the person who fills that gap."

Land on the home page while you say it. Do not read the landing page aloud.

### 0:20-0:40 - Profile

Log in. Show the profile: skills, availability, role preference.

> "You sign up, list your skills, and pick a direction - lead a team, or find
> one. Both matter, and we built both."

**Show the Choose screen.** This is where the two directions become visible.
Do not skip it.

### 0:40-1:10 - The competition brief, and the AI

Create a Team → **Upload the brief** → pick the `.pptx`.

> "Every hackathon sends you a deck or a PDF. Rather than retyping it, upload
> the actual file."

The upload and extraction run back to back - let them finish on screen.

> "It reads the deck and pulls out six things: name, organiser, deadline, team
> size, and who's eligible. Nothing else. It never touches required skills or
> judging criteria."

Let the filled fields sit on screen for a beat.

> "And a human confirms it before anything is saved. If a field can't be
> extracted confidently we leave it blank rather than guess."

**Why upload rather than paste.** It is the more convincing version of the same
capability - a real file going in beats a block of text someone prepared. The
file goes straight to S3 with a presigned URL, so it never passes through
Lambda, and the extracted text runs through exactly the same path as pasted
text.

Worth one sentence if you have room:

> "PPT, Word, PDF or plain text - and the file stays attached to the
> competition, so everyone who joins the team can open the same brief."

### 1:10-1:30 - The leader defines the need

Type required skills: **Machine Learning**, **AWS**, **UI/UX**.

> "The leader types what they need. We never infer required skills from the
> competition text - that's the leader's judgement, not the model's."

### 1:30-1:50 - The skill gap

Show the gap: **Covered: AWS · Remaining: Machine Learning, UI/UX**

> "Now the team's gap is visible. One of three skills covered. This is a plain
> set comparison, not a score - you can see exactly why."

### 1:50-2:20 - Recommendations

Open recommended candidates.

> "We rank people by what they fill in that gap - not by overall similarity.
> Aisha is first because she covers the high-priority Machine Learning gap and
> she's marked this competition as a preference."

Point at one reason line.

> "Every recommendation says why, in plain language, built only from the
> matched skills. The model never invents experience someone doesn't have."

**The line worth saying out loud:**

> "There's also a strong Machine Learning candidate from another college who
> never appears here - the competition is BTKIT-only, and eligibility is a
> hard filter applied before anything is scored. That's plain code, not AI."

### 2:20-2:40 - Human decides, both ways

Send the invitation. Switch account. Accept.

> "The leader invites. The candidate decides."

**Show the gap recalculate: 1 of 3 → 2 of 3.**

Pause here. This is the most convincing moment in the demo - let it land.

### 2:40-2:55 - The other direction

Switch to a user with no team → Find a Team → show recommended teams.

> "It works the other way too. An individual sees teams matched to their
> skills, sends a join request - and this time the leader decides."

### 2:55-3:00 - Close

Have the **CloudWatch dashboard** open in a second tab and cut to it here.

> "Eight AWS services, all on demand - DynamoDB pay-per-request, arm64 Lambda,
> the API throttled, nothing idling. And we can see it running: latency,
> errors, alarms. AI recommends. Humans decide."

Why this matters: Ship It scores **architecture and cost decisions**, not just
"is it deployed". Almost nobody shows monitoring. Five seconds of a real
dashboard says you can operate the thing, not only launch it.

If you are running long, cut the second half of 0:20-0:40 rather than this.

---

## If asked about AI

Be straight. It reads better than overclaiming:

> "Extraction is behind an adapter with two implementations - Bedrock and a
> deterministic parser. Our AWS account is still in verification, so Bedrock
> model invocation is blocked. The integration is written and tested; one
> environment variable switches it. We shipped the fallback rather than a demo
> that 403s live."

## If asked about fake accounts

> "Right now it's email and password. Cognito is deployed with email
> verification and the backend already verifies its tokens - we kept local auth
> for the demo rather than switch login the night before submission."

## If asked what you'd do next

> "Atomic membership updates. Accepting is currently read-check-write, so two
> simultaneous accepts on the same team could race. It needs a conditional
> write in DynamoDB - fine at demo scale, not fine at real scale."

Knowing your own weak spot is worth more than pretending you have none.

---

## Recording notes

- **Do not narrate the UI.** "Now I click Login" is wasted time. Say why, not what.
- **Cut every loading spinner** in the edit.
- 3 minutes is short. The gap recalculating and the eligibility filter are the
  two things to protect if you run long.
- Record 2-3 takes. The second is always better than the first.
