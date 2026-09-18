# ConnectCampus - Project Plan

## Team Members
- **Vipul** - Backend & AWS
- **Team Member** - Frontend & UI/UX

---

## Day-wise Plan (Sept 17-20)

### Day 1 (Sept 17) - Setup & Core Backend
| Task | Owner | Status |
|------|-------|--------|
| Project setup (repo, folders, configs) | Vipul | ✅ Done |
| MongoDB models (User, Event, Team) | Vipul | ✅ Done |
| Auth routes (register/login) | Vipul | ✅ Done |
| React app setup with Tailwind | Team Member | ⬜ |
| Basic UI components (Navbar, Cards) | Team Member | ⬜ |

### Day 2 (Sept 18) - Features Build
| Task | Owner | Status |
|------|-------|--------|
| Profile update routes | Vipul | ⬜ |
| AI Matching algorithm | Vipul | ⬜ |
| Team CRUD routes | Vipul | ⬜ |
| Profile page UI | Team Member | ⬜ |
| Team matching UI | Team Member | ⬜ |

### Day 3 (Sept 19) - Location & Events
| Task | Owner | Status |
|------|-------|--------|
| Event routes + QR code | Vipul | ⬜ |
| Location-based nearby users | Vipul | ⬜ |
| Event check-in system | Vipul | ⬜ |
| Event page UI | Team Member | ⬜ |
| Nearby users map view | Team Member | ⬜ |

### Day 4 (Sept 20) - Polish & Deploy
| Task | Owner | Status |
|------|-------|--------|
| AWS deployment (EC2/S3) | Vipul | ⬜ |
| Bug fixes & testing | Both | ⬜ |
| Demo video recording | Both | ⬜ |
| Final submission | Both | ⬜ |

---

## Feature Breakdown

### 1. Student Verification ✅
- College email verification (.edu, .ac.in domains)
- Verified badge on profile
- Trust score based on verification

### 2. AI Skill Matching ⬜
- Match users by complementary skills
- Score: 40% skill match + 30% interest + 30% complementary
- Smart team recommendations

### 3. Team Finder ⬜
- Create team for hackathon
- List required skills
- Auto-suggest best teammates
- Open/closed team toggle

### 4. Event Check-in ⬜
- Create events with QR codes
- Scan QR to check in
- See who's at the event
- Network with nearby attendees

### 5. Location Discovery ⬜
- Find nearby users at events/summits
- Map view of attendees
- Connect with people nearby

### 6. Hackathon History ⬜
- Add past hackathon participation
- Show achievements
- Build credibility

---

## AWS Services to Use

| Service | Purpose |
|---------|---------|
| **Cognito** | Student email verification |
| **Lambda** | Serverless functions |
| **S3** | Store profile images, QR codes |
| **DynamoDB** | Optional: Fast data access |
| **Location Service** | Map & nearby search |
| **EC2** | Deploy backend |
| **Amplify** | Deploy frontend |

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile

### Users
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/location` - Update location
- `POST /api/users/hackathon-history` - Add history

### Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - List teams
- `GET /api/teams/match/:userId` - Get matching teams
- `POST /api/teams/:id/join` - Join team

### Events
- `POST /api/events` - Create event
- `GET /api/events` - List events
- `GET /api/events/:id/qr` - Get QR code
- `POST /api/events/:id/checkin` - Check in
- `GET /api/events/:id/nearby` - Find nearby users

---

## UI Pages Needed

1. **Landing Page** - Hero + Features
2. **Login/Register** - Auth forms
3. **Dashboard** - User feed + suggestions
4. **Profile** - Edit skills, interests, history
5. **Teams** - Browse/create teams
6. **Team Detail** - Members, match score
7. **Events** - List of events
8. **Event Detail** - QR code, check-in, nearby
9. **Map View** - See nearby users

---

## Demo Video Points (3 mins)

1. **Problem** (30 sec) - Students can't find teammates
2. **Solution** (1 min) - Show verification, matching, events
3. **Demo** (1.5 min) - Live walkthrough of features
4. **AWS Usage** (30 sec) - Show AWS services used
