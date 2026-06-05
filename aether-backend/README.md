# Zelo Backend — AWS CDK Infrastructure

## Setup Steps

### 1. Create IAM User for GitHub Actions

1. Go to AWS Console → IAM → Users → **Create user**
2. Name: `github-actions-deployer`
3. Attach policy: `AdministratorAccess` (scope down later)
4. Create access key → **Copy the key ID and secret**

### 2. Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → Add secrets:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | The access key ID from step 1 |
| `AWS_SECRET_ACCESS_KEY` | The secret access key from step 1 |

### 3. Push & Deploy

```bash
git add .
git commit -m "Add Zelo backend infrastructure"
git push
```

The GitHub Action will automatically deploy all stacks.

### 4. After Deploy — Get Stack Outputs

After deployment, check CloudFormation outputs:

- `ZeloAuthStack.UserPoolId`
- `ZeloAuthStack.UserPoolClientId`
- `ZeloUserStack.ApiUrl`

Copy these into `Aether/src/constants/config.ts`.

## Stack Architecture

| Stack | Resources |
|---|---|
| **ZeloAuthStack** | Cognito User Pool, App Client |
| **ZeloUserStack** | API Gateway, Users table (DynamoDB), UserService Lambda |
| **ZeloTripStack** | Trips table, ItineraryItems table, TripService Lambda |
| **ZeloBookingStack** | Bookings table, Feedback table, PrepChecklist table, S3 bucket, SQS queue |
| **ZeloNotificationStack** | SNS topic, EventBridge rules (T-7, day-of) |

## API Endpoints

### Auth (no token required)
- `POST /auth/signup` — Sign up with email + password
- `POST /auth/confirm` — Confirm email with code
- `POST /auth/login` — Login, returns tokens

### Users (token required)
- `POST /users` — Create profile
- `GET /users/{id}` — Get profile
- `PUT /users/{id}` — Update preferences
- `PUT /users/{id}/integrations` — Save integration tokens

### Trips (token required)
- `POST /trips` — Create trip
- `GET /trips?status=active` — List trips
- `GET /trips/{id}` — Get trip
- `PUT /trips/{id}` — Update trip
- `POST /trips/{id}/generate-canvas` — Generate archetypes + regions
- `GET /trips/{id}/canvas` — Get canvas data
- `GET /trips/{id}/itinerary` — Get itinerary (auto-generates if empty)
- `PUT /trips/{id}/itinerary/reorder` — Drag-drop reorder
- `GET /trips/{id}/restaurants` — Find nearby restaurants
- `GET /trips/{id}/prep` — Prep hub data
- `GET /trips/{id}/packing` — Packing suggestions

### Bookings (token required)
- `POST /bookings` — Create booking quote
- `POST /bookings/{id}` — Confirm and generate QR
- `GET /bookings` — List bookings
- `GET /bookings/{id}` — Get booking

### Feedback (token required)
- `POST /feedback` — Submit rating/review

## Cost Estimate

All services fall within AWS Free Tier:

| Service | Free Tier | Monthly Cost (H0) |
|---|---|---|
| Cognito | 50,000 MAUs | $0 |
| API Gateway | 1M calls | $0 |
| Lambda | 1M requests | $0 |
| DynamoDB | 25GB | $0 |
| S3 | 5GB | $0 |
| SNS | 1M publishes | $0 |
| SQS | 1M requests | $0 |
| EventBridge | Free | $0 |
| **Total** | | **$0/mo** |
