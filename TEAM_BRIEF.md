# HackMatch - Team Brief

## What is HackMatch?
> **"AI recommends. Humans decide."**

A platform where:
- **Individuals** find teams for hackathons
- **Team Leaders** find members with needed skills
- **AI** recommends matches, but **humans** decide

---

## Core Flow

```
1. Sign up → Verify email
2. Create profile (skills, interests)
3. Add competition (AI extracts metadata)
4. Create team → Enter required skills
5. Get AI recommendations
6. Send invite/request
7. Accept → Team formed!
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| Hosting | AWS Amplify |
| Auth | Amazon Cognito |
| Backend | AWS Lambda + API Gateway |
| Database | Amazon DynamoDB |
| AI | Amazon Bedrock |

---

## Features (2-Day Scope)

### ✅ MUST HAVE
- [ ] Cognito auth (signup/login)
- [ ] Profile creation (skills, interests)
- [ ] Competition extraction (Bedrock AI)
- [ ] Team creation + skill requirements
- [ ] Skill gap analysis
- [ ] AI recommendations with explanations
- [ ] Join requests + Invitations
- [ ] Eligibility filtering
- [ ] Deploy on AWS

### ❌ NOT IN SCOPE
- Event check-in
- Location features
- Chat
- GitHub integration

---

## Work Split

### Vipul (Dev 1 - AI + Backend)
| Task | Est. Time |
|------|-----------|
| Bedrock extraction prompt | 4 hrs |
| Skill matching logic | 3 hrs |
| Team gap analysis | 2 hrs |
| Candidate recommendations | 4 hrs |
| Eligibility system | 2 hrs |
| **Total** | **~15 hrs** |

### Vidushi (Dev 2 - Frontend + AWS)
| Task | Est. Time |
|------|-----------|
| React app setup | 2 hrs |
| Cognito integration | 3 hrs |
| Profile form | 2 hrs |
| Team create UI | 3 hrs |
| Recommendations UI | 3 hrs |
| Join/Invite flows | 3 hrs |
| Deploy on Amplify | 3 hrs |
| **Total** | **~19 hrs** |

---

## Git Branches

```
main          → stable, deployed
├── vipul     → Vipul's work
└── vidushi   → Vidushi's work
```

### Branch Naming
```
feature/auth
feature/competition
feature/team
feature/matching
feature/recommendations
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/profiles` | POST | Create profile |
| `/profiles/:id` | GET/PUT | Read/update profile |
| `/competitions` | POST | Create competition |
| `/competitions/:id/analyze` | POST | AI extraction |
| `/teams` | POST | Create team |
| `/teams/:id` | GET/PUT | Read/update team |
| `/teams/:id/recommendations` | GET | AI recommendations |
| `/users/:id/recommended-teams` | GET | Teams for user |
| `/teams/:id/join-request` | POST | Request to join |
| `/join-requests/:id/approve` | POST | Accept request |
| `/join-requests/:id/reject` | POST | Reject request |
| `/teams/:id/invite` | POST | Send invite |
| `/invitations/:id/accept` | POST | Accept invite |
| `/invitations/:id/decline` | POST | Decline invite |

---

## DynamoDB Tables

| Table | Primary Key |
|-------|-------------|
| Users | userId |
| Competitions | competitionId |
| Teams | teamId |
| JoinRequests | requestId |
| Invitations | invitationId |

---

## Day 1 Checklist

- [ ] AWS account setup
- [ ] Cognito user pool created
- [ ] DynamoDB tables created
- [ ] React app scaffolded
- [ ] Auth working (signup/login)
- [ ] Profile CRUD working
- [ ] Competition form ready
- [ ] Bedrock extraction working
- [ ] Team creation working
- [ ] Skill gap showing

---

## Day 2 Checklist

- [ ] Recommendations endpoint working
- [ ] Explanations generating
- [ ] Join request flow working
- [ ] Invitation flow working
- [ ] Eligibility filtering working
- [ ] All UI wired to real APIs
- [ ] Deployed on Amplify
- [ ] Demo video recorded
- [ ] README updated
- [ ] Final testing done

---

## Demo Script (3 mins)

| Time | What to show |
|------|--------------|
| 0:00 | "Students can't find teammates" |
| 0:15 | Signup + verify email |
| 0:35 | Create profile, add skills |
| 0:55 | Paste competition URL |
| 1:25 | AI extracts metadata |
| 1:45 | Create team, add required skills |
| 2:05 | Show skill gap |
| 2:25 | AI recommends candidates |
| 2:45 | Send invite, accept |
| 3:00 | "AI recommends, humans decide" |

---

## Important Rules

1. **AI never decides** - only recommends
2. **Eligibility is deterministic** - no AI
3. **Skills are manual** - leader enters them
4. **Humans accept/reject** - not AI
5. **Validate on server** - never trust frontend

---

## Questions?

Ask in repo issues or WhatsApp group.

**Good luck! 🚀**
