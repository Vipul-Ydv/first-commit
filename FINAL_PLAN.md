# HackMatch - Final 2-Day Plan

## Focus: Core Matching Flow Only

---

## What We're Building

> **"AI recommends. Humans decide."**

One complete, polished flow:
```
Sign up → Create profile → Add competition → Create team → 
Get AI recommendations → Send invite/request → Accept → Team formed
```

---

## Features (Core Only)

| # | Feature | Time | Owner |
|---|---------|------|-------|
| 1 | Auth (Cognito) + Profile | 3 hrs | Dev 2 |
| 2 | Competition extraction (Bedrock) | 4 hrs | Dev 1 |
| 3 | Team creation + skill requirements | 3 hrs | Dev 2 |
| 4 | Skill gap analysis | 2 hrs | Dev 1 |
| 5 | AI recommendations + explanations | 4 hrs | Dev 1 |
| 6 | Join requests + Invitations | 3 hrs | Dev 2 |
| 7 | Eligibility system | 2 hrs | Dev 1 |
| 8 | Frontend (all pages) | 8 hrs | Dev 2 |
| 9 | AWS deployment | 3 hrs | Both |
| 10 | Testing + bug fixes | 4 hrs | Both |
| | **Total** | **~36 hrs** | |

---

## ❌ Features CUT (Post-hackathon)

- Event check-in with QR codes
- Location-based nearby users
- Map view
- Chat/messaging
- GitHub integration
- Mentor matching

---

## ⚠️ Add IF Time Remaining

- Hackathon history (1-2 hrs)
- Better UI polish

---

## Day 1 Plan (Sept 17)

### Morning (4 hrs)
| Task | Dev 1 (AI) | Dev 2 (Frontend) |
|------|------------|------------------|
| Setup | AWS account, Bedrock access | React app, Cognito pool |
| Auth | - | Signup/Login wired |
| Profile | - | Profile create/edit |

### Afternoon (4 hrs)
| Task | Dev 1 (AI) | Dev 2 (Frontend) |
|------|------------|------------------|
| Competition | Bedrock extraction prompt | Competition form UI |
| Teams | - | Team create + skills UI |
| Gap analysis | Skill gap function | - |

### Evening (4 hrs)
| Task | Dev 1 (AI) | Dev 2 (Frontend) |
|------|------------|------------------|
| Integration | Test Bedrock calls | Wire frontend to APIs |
| Review | Fix issues | Fix issues |

**Day 1 Goal:** User can signup, create profile, add competition, create team, see skill gap

---

## Day 2 Plan (Sept 18)

### Morning (4 hrs)
| Task | Dev 1 (AI) | Dev 2 (Frontend) |
|------|------------|------------------|
| Recommendations | Candidate matching endpoint | Recommendations UI |
| Explanations | Bedrock explanation text | - |
| Requests | - | Join request/invite APIs |

### Afternoon (4 hrs)
| Task | Dev 1 (AI) | Dev 2 (Frontend) |
|------|------------|------------------|
| Eligibility | Eligibility check function | - |
| Integration | - | Wire all endpoints |
| Dashboards | - | Individual + Leader views |

### Evening (4 hrs)
| Task | Dev 1 (AI) | Dev 2 (Frontend) |
|------|------------|------------------|
| Deploy | - | Amplify deployment |
| Testing | Fix bugs | Fix bugs |
| Demo | - | Record 3-min video |

**Day 2 Goal:** Full loop works, deployed, demo ready

---

## AWS Services Used

| Service | Purpose |
|---------|---------|
| Cognito | User auth + verification |
| Lambda | Backend functions |
| API Gateway | REST API |
| DynamoDB | Data storage |
| Bedrock | Competition extraction + explanations |
| S3 | Competition documents |
| Amplify | Frontend hosting |
| CloudWatch | Logs |

---

## Demo Script (3 mins)

1. **Intro** (15 sec) - Problem: students can't find teammates
2. **Signup** (20 sec) - Create account, verify email
3. **Profile** (20 sec) - Add skills, interests
4. **Competition** (30 sec) - Paste URL, AI extracts metadata
5. **Team** (30 sec) - Create team, add required skills
6. **Gap Analysis** (20 sec) - Show covered/remaining skills
7. **AI Match** (30 sec) - Show recommendations with explanations
8. **Invite/Accept** (20 sec) - Send invite, candidate accepts
9. **Result** (15 sec) - Team formed, gap updated
10. **AWS** (10 sec) - Show architecture diagram

---

## Success Criteria

| Criteria | Target |
|----------|--------|
| Full loop works | ✅ End-to-end |
| Deployed | ✅ Live URL |
| Demo video | ✅ 3 mins |
| AWS services | ✅ At least 3 used |
| Clean code | ✅ No crashes |

---

## Git Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable, deployed version |
| `vipul` | Dev 1 (AI) work |
| `vidushi` | Dev 2 (Frontend) work |
| `feature/*` | Individual features |

---

*Last updated: Sept 18, 2026*
*Team: Vipul + Vidushi*
