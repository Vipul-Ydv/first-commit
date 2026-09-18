# ConnectCampus - AWS Deployment Plan

## Track: Ship It (Deployed with URL)
Free credits cover the weekend deployment.

---

## AWS Services We'll Use

| Feature | AWS Service | Why |
|---------|-------------|-----|
| **Student Auth** | Cognito | Email verification, user pools |
| **User Profiles** | DynamoDB | Fast NoSQL for profiles, skills |
| **Events Data** | DynamoDB | Store events, check-ins |
| **AI Matching** | Lambda + SageMaker | Serverless matching algorithm |
| **Profile Images** | S3 | Store avatars, QR codes |
| **Backend API** | API Gateway + Lambda | Serverless REST API |
| **Frontend Hosting** | Amplify Hosting | Deploy React app |
| **Location Search** | Location Service | Find nearby users |
| **Notifications** | SNS | Event reminders, connection requests |
| **Monitoring** | CloudWatch | Logs, metrics |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│                   Amplify Hosting                       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   API Gateway                           │
│              REST API Endpoints                         │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Auth    │    │  Users   │    │  Events  │
    │ Lambda   │    │ Lambda   │    │ Lambda   │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Cognito  │    │ DynamoDB │    │ DynamoDB │
    └──────────┘    └──────────┘    └──────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ S3 Bucket│
                    │ (images) │
                    └──────────┘
```

---

## Day-wise AWS Implementation

### Day 1 (Sept 17) - Setup
| Task | Service | Status |
|------|---------|--------|
| Create AWS account | - | ⬜ |
| Setup Cognito User Pool | Cognito | ⬜ |
| Create DynamoDB tables | DynamoDB | ⬜ |
| Create S3 bucket | S3 | ⬜ |

### Day 2 (Sept 18) - Backend
| Task | Service | Status |
|------|---------|--------|
| Create Lambda functions | Lambda | ⬜ |
| Setup API Gateway | API Gateway | ⬜ |
| Connect Cognito + Lambda | Cognito | ⬜ |
| Test auth flow | - | ⬜ |

### Day 3 (Sept 19) - Features
| Task | Service | Status |
|------|---------|--------|
| Location-based search | Location Service | ⬜ |
| AI matching with Lambda | Lambda | ⬜ |
| S3 for profile images | S3 | ⬜ |
| SNS notifications | SNS | ⬜ |

### Day 4 (Sept 20) - Deploy
| Task | Service | Status |
|------|---------|--------|
| Deploy frontend | Amplify | ⬜ |
| Setup CloudWatch | CloudWatch | ⬜ |
| Custom domain (optional) | Route 53 | ⬜ |
| Final testing | - | ⬜ |

---

## DynamoDB Tables

### Users Table
```json
{
  "tableName": "ConnectCampus-Users",
  "partitionKey": "userId",
  "attributes": [
    "email", "name", "college", "skills", 
    "interests", "location", "isVerified"
  ]
}
```

### Events Table
```json
{
  "tableName": "ConnectCampus-Events",
  "partitionKey": "eventId",
  "attributes": [
    "name", "date", "location", "checkedInUsers"
  ]
}
```

### Teams Table
```json
{
  "tableName": "ConnectCampus-Teams",
  "partitionKey": "teamId",
  "attributes": [
    "name", "leader", "members", "requiredSkills"
  ]
}
```

---

## Lambda Functions

1. **auth-handler** - Register, login, verify email
2. **users-handler** - CRUD for user profiles
3. **teams-handler** - Create/join teams
4. **events-handler** - Create events, check-in
5. **matching-handler** - AI skill matching
6. **location-handler** - Find nearby users

---

## Cost Estimation (Free Tier)

| Service | Free Tier | Our Usage |
|---------|-----------|-----------|
| Lambda | 1M requests/month | ~10K |
| DynamoDB | 25GB storage | ~1GB |
| S3 | 5GB storage | ~500MB |
| API Gateway | 1M calls/month | ~50K |
| Cognito | 50K MAU | ~1K |
| Amplify | 5GB storage | ~100MB |

**Estimated Cost: $0** (within free tier)

---

## Deployment Steps

### 1. Cognito Setup
```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name ConnectCampus \
  --auto-verified-attributes email \
  --username-attributes email
```

### 2. DynamoDB Setup
```bash
# Create tables
aws dynamodb create-table \
  --table-name ConnectCampus-Users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 3. S3 Setup
```bash
# Create bucket for images
aws s3 mb s3://connectcampus-images --region ap-south-1
```

### 4. Lambda Deployment
```bash
# Package and deploy
zip -r function.zip .
aws lambda create-function \
  --function-name auth-handler \
  --runtime nodejs18.x \
  --handler index.handler \
  --role arn:aws:iam::role/lambda-role \
  --zip-file fileb://function.zip
```

### 5. Amplify Deployment
```bash
# In client folder
amplify init
amplify publish
```

---

## Demo Video Points (3 mins)

1. **Problem** (30 sec) - Students can't find teammates
2. **Solution** (1 min) - Show verification, AI matching, events
3. **Live Demo** (1 min) - Walkthrough on deployed app
4. **AWS Usage** (30 sec) - Show Cognito, Lambda, DynamoDB, Location Service
5. **Impact** (30 sec) - How this helps students nationwide
