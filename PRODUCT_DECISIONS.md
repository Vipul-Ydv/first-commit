# ConnectCampus - Product Decisions

## Team Discussion Document
Fill this together with your team before final implementation.

---

## 1. Product Vision

### What is ConnectCampus?
<!-- One line description -->
_A platform where students verify their identity and find teammates for hackathons and events._

### Problem Statement
<!-- What problem are we solving? -->

### Target Users
<!-- Who will use this? -->

---

## 2. Scope Decision: College vs Global

### Option A: College-Specific
| Aspect | Details |
|--------|---------|
| Pros | - Focused user base<br>- Easier verification<br>- Local community |
| Cons | - Limited growth<br>- College dependency |
| Example | Only IIT Delhi students |

### Option B: Multi-College
| Aspect | Details |
|--------|---------|
| Pros | - Wider reach<br>- Cross-college networking<br>- More hackathon options |
| Cons | - Harder verification<br>- More competition |
| Example | All colleges in Delhi |

### Option C: Global Platform
| Aspect | Details |
|--------|---------|
| Pros | - Maximum reach<br>- International hackathons<br>- Diverse skills |
| Cons | - Complex verification<br>- Time zone issues |
| Example | Students worldwide |

### ✅ Our Decision: [FILL: A / B / C]

### Reason:
<!-- Why did we choose this? -->

---

## 3. Features Priority

### Must Have (MVP)
- [ ] Student email verification
- [ ] User profile (skills, interests)
- [ ] Team creation
- [ ] Team discovery
- [ ] Basic skill matching

### Should Have
- [ ] AI-powered matching
- [ ] Event creation
- [ ] QR code check-in
- [ ] Location-based search
- [ ] Hackathon history

### Nice to Have
- [ ] Chat between users
- [ ] Video calls
- [ ] Team analytics
- [ ] Leaderboard
- [ ] Badges and rewards

### Future Features
- [ ] AI teammate recommendations
- [ ] Integration with Devpost/GitHub
- [ ] Mentor matching
- [ ] Sponsor integration

---

## 4. User Flow

### New User Journey
```
1. Visit website
2. Click "Get Started"
3. Enter college email
4. Verify email (OTP/link)
5. Complete profile
6. Add skills & interests
7. Browse teams OR Create team
8. Find teammates
9. Collaborate
```

### Returning User Journey
```
1. Login
2. See dashboard
3. Check new team requests
4. Update profile
5. Join events
```

---

## 5. Verification System

### How do we verify students?

| Method | Pros | Cons |
|--------|------|------|
| College email (.edu) | Easy, automatic | Fake emails possible |
| Student ID upload | More secure | Manual verification |
| College API integration | Most accurate | Hard to implement |
| Peer verification | Community-driven | Can be gamed |

### ✅ Our Decision: [FILL]

### College Domains to Support:
<!-- List .edu domains -->
- .edu
- .ac.in
- .edu.in
- [Add more]

---

## 6. Matching Algorithm

### How do we match users?

### Factor 1: Skills (Weight: __%)
- Complementary skills preferred
- Example: Frontend + Backend

### Factor 2: Interests (Weight: __%)
- Same domain interest
- Example: Both interested in AI/ML

### Factor 3: Availability (Weight: __%)
- Looking for same thing
- Example: Both want hackathon

### Factor 4: Location (Weight: __%)
- Nearby users get priority
- Same city/college bonus

### Factor 5: Experience (Weight: __%)
- Hackathon history
- Past wins

---

## 7. Team Formation Rules

| Rule | Decision |
|------|----------|
| Min team size | [FILL: 1/2] |
| Max team size | [FILL: 3/4/5] |
| Can join multiple teams? | [FILL: Yes/No] |
| Can leave team? | [FILL: Yes/No] |
| Team creator = Leader? | [FILL: Yes/No] |
| Leader can remove members? | [FILL: Yes/No] |

---

## 8. Event System

### What events are supported?

- [ ] Hackathons
- [ ] Workshops
- [ ] Meetups
- [ ] Tech talks
- [ ] Summits

### Event Check-in Method:
- [ ] QR Code scan
- [ ] Location-based auto check-in
- [ ] Manual check-in by organizer

---

## 9. Data We Collect

| Data | Purpose | Required? |
|------|---------|-----------|
| Name | Profile | Yes |
| Email | Auth + Verification | Yes |
| College | Verification | Yes |
| Skills | Matching | Optional |
| Interests | Matching | Optional |
| Location | Nearby search | Optional |
| Phone | Notifications | Optional |

---

## 10. Privacy & Security

| Decision | Choice |
|----------|--------|
| Profile visibility | [Public / Private / Friends only] |
| Location visible to | [All / Teams only / Nobody] |
| Data retention | [FILL: duration] |
| Account deletion | [Yes / No] |

---

## 11. Monetization (Future)

### How will we make money?

| Model | Pros | Cons |
|-------|------|------|
| Freemium | Easy entry | Hard to convert |
| Sponsorships | Free for users | Dependence |
| Premium features | Direct revenue | May limit growth |
| Event tickets | Clear value | Limited scale |

### ✅ Our Decision: [FILL]

---

## 12. Success Metrics

### How do we know it's working?

| Metric | Target |
|--------|--------|
| Users signed up | [FILL] |
| Teams formed | [FILL] |
| Active users (weekly) | [FILL] |
| Match success rate | [FILL] |
| User retention | [FILL] |

---

## 13. Competition

| Platform | What they do | How we're different |
|----------|--------------|---------------------|
| Devpost | Hackathon listings | We focus on team matching |
| LinkedIn | Professional networking | We're student-focused |
| Discord | Communities | We have AI matching |
| Meetup | Events | We have verification |

---

## 14. Technical Decisions

| Decision | Choice |
|----------|--------|
| Frontend | React + Tailwind |
| Backend | Node.js + Express OR Serverless |
| Database | MongoDB OR DynamoDB |
| Auth | Custom OR Cognito |
| Hosting | AWS Amplify |

---

## 15. Open Questions

<!-- Things to discuss with team -->

1. Should we support international students?
2. Do we need a chat feature?
3. How do we handle fake profiles?
4. Should we integrate with GitHub?
5. Do we need an admin panel?

---

## Final Decisions Summary

| Topic | Decision |
|-------|----------|
| Scope | [FILL] |
| Verification | [FILL] |
| Team size | [FILL] |
| Matching algo | [FILL] |
| Events | [FILL] |
| Privacy | [FILL] |
| Monetization | [FILL] |

---

*Last updated: Sept 18, 2026*
*Authors: Vipul + Team*
