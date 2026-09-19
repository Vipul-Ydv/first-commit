# HackMatch - What We Build & Who Builds What

**Deadline: Sept 20.** Two developers. Read this fully before writing code.

---

## 1. What HackMatch is (in simple words)

A website where students find teammates for hackathons.

Two kinds of people use it:

| Person | What they want |
|---|---|
| **Leader** - already has a team | "I need someone who knows Python" |
| **Individual** - has no team | "Which team needs my skills?" |

HackMatch shows each of them a suggested list. **AI only suggests. The human clicks yes or no.**

---

## 2. How it works (step by step)

### Everyone does this first

```
1. Sign up with email  ->  verify email
2. Fill profile: name, college/company, skills, github, linkedin,
   interests, availability, role you want
3. Choose:  "Create a Team"   OR   "Find a Team"
```

### Path A - Create a Team (you are the leader)

```
4a. Add the competition.
    Paste the competition link or text.
    AI reads it and fills 6 things: name, organizer, deadline,
    min team size, max team size, who is allowed to join.
    You check it and fix anything wrong. Then save.

5a. Make your team. Type the skills you need.
    (YOU type them. AI does not guess them.)

6a. Screen shows your skill gap:
        Have -> AWS
        Need -> Machine Learning, UI/UX

7a. Screen shows suggested PEOPLE who have the missing skills,
    with a reason: "Fills your Machine Learning requirement."

8a. You click INVITE.
9a. That person clicks accept or decline.   <- THEY decide
10a. If accepted: they join, and the skill gap updates by itself.
```

### Path B - Find a Team (you have no team)

```
4b. Open "Find a Team". You see a list of open teams.

5b. Screen shows suggested TEAMS for you, with a reason:
    "You match 2 of this team's 3 needed skills."

6b. Open a team. See the competition, needed skills, current gap.

7b. You click REQUEST TO JOIN.
8b. The team leader clicks accept or reject.   <- THEY decide
9b. If accepted: you join, and the skill gap updates by itself.
```

### Important: these are two different things

| You are | You send | Who answers |
|---|---|---|
| Leader | **Invitation** | The candidate |
| Individual | **Join Request** | The leader |

Do not build one button for both. Two buttons, two inboxes.

---

## 3. The rules we never break

1. AI only suggests. A human always clicks accept/reject.
2. AI reads competitions only. It never decides who is allowed in.
3. The leader types the required skills by hand. AI never guesses them.
4. Eligibility is plain if/else code. Never AI.
5. If a competition has no college restriction, **everyone is allowed**. Blank must never mean "blocked".
6. Always check on the server. Never trust the browser.

---

## 4. The parts we are building

| # | Part | Who |
|---|---|---|
| 1 | Sign up / login (Cognito) | Dev 2 |
| 2 | Profile page | Dev 2 |
| 3 | Add competition + AI reads it | Dev 1 (AI) + Dev 2 (form) |
| 4 | Create team + type needed skills | Dev 2 |
| 5 | Skill gap box (have / need) | Dev 1 (logic) + Dev 2 (box) |
| 6 | Suggested people (for leader) | Dev 1 (logic) + Dev 2 (list) |
| 7 | Suggested teams (for individual) | Dev 1 (logic) + Dev 2 (list) |
| 8 | Invite + accept/decline | Dev 1 (API) + Dev 2 (buttons) |
| 9 | Join request + accept/reject | Dev 1 (API) + Dev 2 (buttons) |
| 10 | Dashboard (my team, my requests) | Dev 2 |
| 11 | Put it on AWS | Both |

---

## 5. How we work at the same time without blocking each other

This is the most important section. Read it twice.

### Rule 1 - Agree on the JSON first, before anyone codes

In the first hour, together, we write example JSON for every screen and save it in `client/src/api/mock/`.

Example - `mock/recommendations.json`:

```json
{
  "recommendations": [
    {
      "userId": "user_456",
      "name": "Aisha",
      "matchedSkills": ["AWS", "Machine Learning"],
      "missingSkillsFilled": ["Machine Learning"],
      "matchReason": "Fills the team's Machine Learning requirement.",
      "competitionPreferenceMatch": true
    }
  ]
}
```

Now Dev 2 builds the screen using this file. Dev 1 builds the real API that returns exactly this shape. **Neither one waits for the other.**

### Rule 2 - One switch to go from fake to real

Make one file: `client/src/api/index.js`

```js
const USE_MOCK = true;   // Dev 2 keeps this true all day
```

When Dev 1's API is live, flip it to `false`. That is the whole integration.

### Rule 3 - Never touch the other person's folder

| Dev 1 | Dev 2 |
|---|---|
| only `server/` | only `client/` |

The only shared files are this doc and the mock JSON. That means **zero merge conflicts**.

### Rule 4 - Own branches, small commits

```
Dev 1 -> branch: vipul
Dev 2 -> branch: vidushi
```

Push often. Merge into `master` only when something actually works.

---

## 6. Time plan

### Block 0 - TOGETHER (1.5 hrs) - do this before splitting

- [ ] Write all mock JSON files (the contract) - 45 min
- [ ] AWS account, Cognito user pool, 5 DynamoDB tables - 30 min
- [ ] Request Bedrock model access (needs approval, start it NOW) - 5 min
- [ ] Clean up git: delete `files.zip`, fix the broken `Vidushi` branch, push `master` - 10 min

### Block 1 - Sept 19, rest of day (7 hrs each)

**Dev 1 - Vipul (backend + AI)**

| Task | Hrs |
|---|---|
| Express wrapped in Lambda (`serverless-http`) + deploy skeleton | 2.5 |
| DynamoDB read/write helpers (replaces Mongoose) | 2.0 |
| Routes: profiles, teams, competitions | 2.5 |

**Dev 2 - Vidushi (frontend)**

| Task | Hrs |
|---|---|
| Fix the client build (`react-scripts` missing, no `public/index.html`) | 0.75 |
| Delete Events, MapView, QR pages - not in scope | 0.25 |
| Cognito signup/login working | 2.5 |
| Profile form page | 1.5 |
| "Create a Team / Find a Team" choice + Create Team form | 2.0 |

**End of Sept 19:** login works, profile saves, team can be created.

### Block 2 - Sept 20 morning (7 hrs each)

**Dev 1 - Vipul**

| Task | Hrs |
|---|---|
| Eligibility check + skill gap + ranking + synonym list ("ML" = "Machine Learning") | 2.5 |
| Bedrock: read competition + write the reason sentence | 2.5 |
| Invitation API + Join Request API | 2.0 |

**Dev 2 - Vidushi**

| Task | Hrs |
|---|---|
| Add-competition form | 1.5 |
| Skill gap box | 1.0 |
| Two suggestion lists (people + teams) | 2.0 |
| Invite / Request buttons + accept-reject inbox | 2.0 |
| Browse teams list | 0.75 |

### Block 3 - TOGETHER (4 hrs) - Sept 20 afternoon

- [ ] Flip `USE_MOCK = false`, connect everything - 1.5
- [ ] Add 8-10 fake profiles, or the suggestion list looks empty in the demo - 0.75
- [ ] Deploy frontend on Amplify - 1.0
- [ ] Test the full flow, fix bugs - 1.5
- [ ] Record the 3-minute video - 1.5

**Total: about 20 hrs each. There is no spare time.** If we fall behind, cut from section 7 - do not cut from section 2.

---

## 7. Cut list (only if we run out of time)

Cut in this order. Everything here is marked "should have" or "display only" in the spec, so cutting is safe:

1. Search and filter on the browse-teams page - just show a plain list
2. Competition-preference bonus in ranking
3. The "all team members must be from the same college" rule (keep students-only and college-restriction)
4. Optional profile fields: portfolio, projects, experience, gender
5. AI-written reason sentence -> use a fixed template instead (keep AI for reading the competition - that is the part judges see)

**Never cut:** either of the two paths in section 2. Both must work.

---

## 8. If one developer cannot work

Then one person does backend only, and uses plain unstyled forms for the UI. The Tailwind classes in `client/src/index.css` already exist - `.btn-primary`, `.card`, `.input-field`, `.badge`. That drops the work to about 14 hrs.

Ugly but working beats pretty but broken.

---

*Source of truth for product details: `spec.md`*
