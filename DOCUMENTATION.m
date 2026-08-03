# 🛡️ Crifolayer TrustLayer Platform Documentation
Welcome to the official, comprehensive documentation for the **Crifolayer TrustLayer Platform**. This document serves as the absolute blueprint and integration manual for future reference, covering architectural designs, local development guides, database structures, the B2B SDK, global APIs, and compliance details.

---

## 📌 Table of Contents
1. [🚀 Getting Started & Local Setup](#-getting-started--local-setup)
2. [🏗️ Architectural Blueprint & Data Flows](#️-architectural-blueprint--data-flows)
3. [📁 Codebase Directory Structure](#-codebase-directory-structure)
4. [🗄️ Database Models & Graph Engines](#️-database-models--graph-engines)
5. [📈 Trust Score Calculation Logic](#-trust-score-calculation-logic)
6. [🔐 B2B OAuth 2.0 PKCE Flow](#-b2b-oauth-20-pkce-flow)
7. [🛡️ GDPR Privacy & Compliance Engineering](#️-gdpr-privacy--compliance-engineering)
8. [📦 B2B Node.js SDK Reference](#-b2b-nodejs-sdk-reference)
9. [🔌 Global REST API Gateway Reference](#-global-rest-api-gateway-reference)
10. [📡 Webhooks Integration Guide](#-webhooks-integration-guide)
11. [⚠️ Error Handling & Response Schemas](#️-error-handling--response-schemas)

---

## 🚀 Getting Started & Local Setup

### ⚙️ Prerequisites
Ensure the following systems are installed locally:
- **Node.js** (v18.x or later)
- **npm** (v9.x or later)
- **Supabase Account / CLI** (for Postgres storage & auth)
- **Neo4j AuraDB** (optional, for relationship graphs and fraud detection)

---

### 📂 Backend Setup

1. **Clone & Navigate** to the backend directory:
   ```bash
   cd backend
   ```

2. **Configure Environment Variables** by creating a `.env` file:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Supabase Credentials
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-private-key

   # Database Connection Strings (PostgreSQL)
   DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

   # Neo4j Graph DB Config (Optional)
   NEO4J_URI=bolt://your-auradb-endpoint:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-auradb-password

   # Sumsub KYC integration
   SUMSUB_BASE_URL=https://api.sumsub.com
   SUMSUB_APP_TOKEN=your-sumsub-app-token
   SUMSUB_SECRET_KEY=your-sumsub-secret-key
   SUMSUB_LEVEL_NAME=id-and-liveness

   # Security secrets
   JWT_SECRET=your-jwt-signing-secret-key-2026
   SYSTEM_SALT=your-immutable-compliance-salt-2026
   ```

3. **Install Dependencies & Initialize DB**:
   ```bash
   npm install
   npx prisma db push
   ```

4. **Launch Backend Dev Server**:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`.

---

### 💻 Frontend Setup

1. **Navigate** to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Configure Environment Variables** by creating a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
   ```

3. **Install Dependencies & Start Dev Server**:
   ```bash
   npm install
   npm run dev
   ```
   The client application will run on `http://localhost:5173`.

---

## 🏗️ Architectural Blueprint & Data Flows

Crifolayer is engineered as a decoupled, high-performance web application consisting of a modern single-page frontend (Vite/React 19) and a secure gateway backend API service (Node.js/Express.js 5).

### 🔄 Core Platform System Map
```mermaid
graph TD
    A[Vite/React Client App] -->|HTTPS REST / Web3 WalletSIWE| B[Express Gateway API Router]
    A -->|Auth & Queries| C[Supabase Auth / PostgreSQL]
    
    B -->|User Records & API Logs| C
    B -->|Identity Verification Flow| D[Sumsub KYC SDK]
    B -->|Interactive Graph & Fraud Auditing| E[Neo4j AuraDB]
    B -->|AES-256 Encryption Vault| F[Secure Encryption Service]
    B -->|Queued Transaction Status Notifications| G[Email Queue Manager]
```

### 🛣️ Client-Side Route Matrix
Routing is configured in [App.tsx](file:///Users/sujoymoulick/PROJECTS/trustlayer-app/src/App.tsx) using `react-router-dom`:

| Client Route | Page Component | Access Control |
| :--- | :--- | :--- |
| `/` | `Landing` | Public |
| `/login` | `Login` | Public (with Cloudflare Turnstile bot gating) |
| `/pricing` | `Pricing` | Public |
| `/profile` | `PublicProfile` | Public (displays public identity badge summary) |
| `/logout` | `Logout` | Public |
| `/oauth/consent` | `OauthConsent` | Public (handles interactive user approvals for B2B OAuth) |
| `/dashboard` | `Dashboard` | Private layout (requires session login) |
| `/verification-center` | `VerificationCenter` | Private (Sumsub KYC Verification interface) |
| `/wallet` | `WalletDashboard` | Private (Ethereum/Decentralized credentials dashboard) |
| `/identity` | `Identity` | Private |
| `/passport` | `Passport` | Private (reputation card profile view) |
| `/connected-apps` | `ConnectedApps` | Private (lists connected B2C adapters) |
| `/analytics` | `RiskAnalysis` | Private (fraud audit and behavior metrics) |
| `/developer/portal` | `ApiDashboard` | Private Developer console |
| `/developer/keys` | `PersonalKeys` | Private Developer API key manager |
| `/developer/docs` | `DeveloperDocs` | Private interactive API references |
| `/developer/webhooks` | `DeveloperWebhooks` | Private webhooks dashboard |
| `/developer/playground` | `DeveloperPlayground` | Private API testing playground |
| `/developer/sdk` | `DeveloperSDK` | Private developer SDK guide |
| `/developer/status` | `DeveloperStatus` | Private API network status monitor |
| `/vault` | `ConsentVault` | Private GDPR & data sharing permission controls |
| `/admin` | `Admin` | Restricted (requires role === ADMIN status verification) |

---

## 📁 Codebase Directory Structure
```text
├── 📂 backend/                      # Backend gateway app code
│   ├── 📂 config/                   # Environmental configuration & Cloudinary integration
│   ├── 📂 controllers/              # REST request endpoint controllers
│   ├── 📂 db/                       # Supabase client wrapper & Neo4j driver
│   ├── 📂 docs/                     # API schema documentation (OpenAPI 3.0 yaml)
│   ├── 📂 middleware/               # Token authentications, rate limiting, and security
│   ├── 📂 models/                   # Schema validation models
│   ├── 📂 prisma/                   # PostgreSQL schema definition & migrations
│   ├── 📂 routes/                   # Router mount mappings
│   ├── 📂 services/                 # Graph query pipelines, encryption vault, email queues
│   ├── 📄 app.js                    # Core Express initialization entrypoint
│   └── 📄 package.json              # Backend service dependencies configuration
├── 📂 frontend/                     # Frontend client workspace
│   ├── 📂 src/
│   │   ├── 📂 components/           # UI widgets (DigiLocker, Graph test, Turnstile)
│   │   ├── 📂 context/              # Context files (Theme, Guest)
│   │   ├── 📂 hooks/                # SIWE and wallet connection hooks
│   │   ├── 📂 layouts/              # Side-navigation layout shells
│   │   ├── 📂 lib/                  # Web3 providers & Supabase connectors
│   │   └── 📂 pages/                # Page components
│   ├── 📄 package.json              # Frontend package dependencies configuration
│   └── 📄 vite.config.ts            # Frontend build configs
├── 📂 sdk/                          # Official B2B Developer Node.js SDK package
└── 📂 supabase/                     # Supabase database configurations & migration scripts
```

---

## 🗄️ Database Models & Graph Engines

### 1. Relational PostgreSQL Schema (Prisma)
Prisma is used to model relational user profiles, audit trails, and B2B keys in Postgres:

```prisma
enum Role {
  USER
  ADMIN
}

enum TrustCategory {
  LOW_TRUST
  MODERATE_TRUST
  HIGH_TRUST
  VERIFIED_TRUSTED
  ENTERPRISE_TRUSTED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model User {
  id                String              @id @default(uuid())
  email             String              @unique
  fullName          String?
  role              Role                @default(USER)
  plan              String              @default("free")
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  connectedAccounts ConnectedAccount[]
  trustScores       TrustScore[]
  riskReports       RiskReport[]
  auditLogs         AuditLog[]
  walletConnections WalletConnection[]
  verificationEvents VerificationEvent[]
  developerApps     DeveloperApp[]
}

model ConnectedAccount {
  id                 String              @id @default(uuid())
  userId             String
  provider           String              // e.g. gitlab, upwork, plaid, worldid, ens
  providerAccountId  String
  accessToken        String?             @db.Text
  refreshToken       String?             @db.Text
  tokenExpiresAt     DateTime?
  scopes             String[]
  status             String              // CONNECTED, EXPIRED, REVOKED, ERROR
  lastSyncedAt       DateTime?
  metadata           Json?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TrustScore {
  id              String        @id @default(uuid())
  userId          String        @unique
  score           Int           @default(300)
  category        TrustCategory @default(LOW_TRUST)
  breakdown       Json
  fraudPenalties  Json?
  updatedAt       DateTime      @updatedAt
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model DeveloperApp {
  id                   String            @id @default(uuid())
  userId               String
  name                 String
  description          String?
  sandboxKeyHash       String?           @unique
  sandboxKeyHint       String?
  productionKeyHash    String?           @unique
  productionKeyHint    String?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
  user                 User              @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model WebhookEndpoint {
  id        String   @id @default(uuid())
  appId     String
  url       String
  secret    String   @db.Text
  events    String[]            // e.g. trust.score.updated, fraud.detected
  isActive  Boolean  @default(true)
}
```

---

### 2. Neo4j Graph Schema
Neo4j maps trust dynamics and detects financial fraud, circular transactions, and collusion structures:

#### Node Definitions:
- `(:User { id: String, email: String, plan: String, kycStatus: String, trustScore: Integer })`
- `(:IdentityProvider { provider: String, accountId: String })`
- `(:Wallet { address: String })`

#### Relationships:
- `(:User)-[:CONNECTED_VIA { linkedAt: DateTime }]->(:IdentityProvider)`
- `(:User)-[:TRUSTS { weight: Float, createdAt: DateTime }]->(:User)`
- `(:Wallet)-[:SENT { txHash: String, amount: Float, network: String, timestamp: DateTime }]->(:Wallet)`

---

### 💡 Cypher Query Examples

#### Neighbour-Weighted Trust Score Computation:
Calculates a user's trust score by combining 70% of their base profile score with 30% of the average trust score of other users who trust them:
```cypher
MATCH (u:User { id: $userId })
OPTIONAL MATCH (u)<-[:TRUSTS]-(v:User)
WITH u, avg(v.trustScore) AS neighborsAvg
RETURN u.trustScore AS baseScore,
       coalesce(neighborsAvg, 0) AS networkImpact
```

#### Circular Transaction Fraud Detection:
Detects financial collusion or circular payments (between 2 and 5 hops) starting and ending at the same user:
```cypher
MATCH (u:User { id: $userId })
MATCH path = (u)-[:SENT|TO*2..5]->(u)
RETURN count(path) > 0 AS isFraudulent
```

---

## 📈 Trust Score Calculation Logic

Trust scores are calculated dynamically inside the [trustScoreService.js](file:///Users/sujoymoulick/PROJECTS/trustlayer-app/backend/services/trustScoreService.js) based on plan features, identity verification status, and social link factors:

1. **Identity Anchor (KYC)**:
   - Verified KYC status provides **300 points**.
   - Pending KYC status provides **100 points**.
2. **Social & Integration Links**:
   - Every verified social link (GitHub, LinkedIn) adds **50 points** (capped at a maximum of **200 points**).
3. **Behavioral Anomaly Penalties**:
   - If a user triggers a rapid verification burst (>5 integrations linked in a short timeframe), a high-severity alert is logged in `risk_logs`, and their score is penalized by **-100 points**.
4. **Subscription Plan Gates**:
   - **Free Plan**: Restricted to static identity and social verification scores (maximum **500 points**).
   - **Pro/Enterprise Plans**: Unlocks Stripe financial validation data (+200 points) and professional activity scores (+150 points), allowing the user to reach the maximum score of **1000 points**.
5. **Admin Score Modifiers**:
   - Administrators can manually adjust scores up or down using the `admin_score_modifier` field in the database.

---

## 🔐 B2B OAuth 2.0 PKCE Flow

Crifolayer implements a complete OAuth 2.0 PKCE (Proof Key for Code Exchange) authorization flow. This allows third-party B2B client applications to securely read verified user data without handling raw API credentials directly.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Partner App (B2B Client)
    participant Auth as Crifolayer Gateway (Backend)
    participant ConsentPage as Crifolayer Frontend Consent Page

    App->>Auth: 1. GET /oauth/authorize (with PKCE code_challenge, client_id, state, redirect_uri)
    Auth-->>ConsentPage: 2. Redirect to /oauth/consent page with flowId
    User->>ConsentPage: 3. Approve scopes & grant permissions
    ConsentPage->>Auth: 4. POST /oauth/consent (approve flowId & userId)
    Auth-->>App: 5. Redirect back to redirect_uri with temporary authorization code
    App->>Auth: 6. POST /oauth/token (exchange code & plaintext code_verifier)
    Note over Auth: 7. Validate code_verifier against code_challenge (S256 base64url)
    Auth-->>App: 8. Return 60-min JWT access token
```

---

## 🛡️ GDPR Privacy & Compliance Engineering

### 1. Salting & Ledger Hashing for Account Purges
To satisfy GDPR "Right to Erasure" requirements while protecting the platform from sybil attacks or rating manipulation, users can irreversibly delete their personal profile data.
Before their profile is removed from the production database, their device fingerprint, user ID, and email address are combined and hashed with a secret system salt:

$$\text{ledger\_hash} = \text{SHA256}(\text{fingerprint} \mathbin{\Vert} \text{userId} \mathbin{\Vert} \text{userEmail} \mathbin{\Vert} \text{SYSTEM\_SALT})$$

This immutable ledger hash is stored in `fraud_prevention_ledger` alongside their historical trust score and flags. If a user deletes their account to bypass a low reputation score, their device fingerprint will match this ledger if they attempt to sign up again.

```javascript
// Account Purge Controller Snippet
const salt = process.env.SYSTEM_SALT || 'crifolayer-global-compliance-salt-2026';
const immutableLedgerHash = crypto
  .createHash('sha256')
  .update(`${fingerprint}:${userId}:${userEmail}:${salt}`)
  .digest('hex');

// Insert hash in ledger
await supabase.from('fraud_prevention_ledger').insert([{
  fingerprint_hash: immutableLedgerHash,
  former_trust_score: trustScore,
  former_fraud_flags: trustScore < 300 ? ['score-gaming-risk'] : []
}]);

// Cascade Delete user profile
await supabase.from('profiles').delete().eq('id', userId);
```

---

### 2. GDPR-Compliant IP Anonymization
To prevent storing PII in consent logs, user IP addresses are masked before they are recorded:

```javascript
function maskIpAddress(ip) {
  if (!ip) return '0.0.0.0';
  if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.0';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0'; // Mask final octet for IPv4
      return parts.join('.');
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 2) {
      return parts.slice(0, 3).join(':') + '::0'; // Mask subnet for IPv6
    }
  }
  return ip;
}
```

---

## 📦 B2B Node.js SDK Reference

### 🛠️ Installation
Install the SDK directly in your Node.js application:
```bash
npm install @crifolayer/sdk
```

---

### 🔑 Initialization
Generate Sandbox or Production keys in the Developer Portal, and initialize the client:
```javascript
const CrifolayerSDK = require('@crifolayer/sdk');

const client = new CrifolayerSDK({
  apiKey: 'tl_sb_acmeapp_8d7f6e52c803ab971e44f32e987c...',
  baseUrl: 'https://api.crifolayer.com/api/v1',
  timeout: 10000, // 10s timeout
  maxRetries: 3   // Retry on network errors or rate limits (429)
});
```

---

### 📡 SDK Methods

#### 1. Retrieve User Trust Score
```javascript
const response = await client.getTrustScore('usr_useruuid123');
console.log('Trust Score:', response.data.score);
```

#### 2. Decrypt User Identity Passport
```javascript
const response = await client.getPassport('usr_useruuid123');
console.log('Legal Full Name:', response.data.identity.legal_name);
```

#### 3. Programmatic Document Verification
Submit document images to the verification pipeline for analysis:
```javascript
const result = await client.verifyIdentity(
  'usr_useruuid123',
  'PASSPORT',
  'data:image/jpeg;base64,...'
);
console.log('Verification Status:', result.verificationResult.status);
```

#### 4. Link Third-Party Integrations
Link external credentials to a user profile to recalculate their trust weight:
```javascript
const result = await client.linkAccount('usr_useruuid123', 'gitlab', {
  accessToken: 'glpat-xxx'
});
console.log('Link Result:', result.message);
```

---

## 🔌 Global REST API Gateway Reference

### 🔒 Gateway Authentication Headers
Requests to protected endpoints must include these validation headers:
- `X-API-Key`: Your developer API Key.
- `X-TrustLayer-Signature`: Cryptographic HMAC signature (calculated as: `HMAC_SHA256(timestamp + "." + JSON.stringify(body), API_KEY)`).
- `X-TrustLayer-Timestamp`: UNIX timestamp (in seconds). The server enforces a **5-minute sliding window** to prevent replay attacks.

---

### 🛣️ REST Endpoint Specifications

#### 1. POST `/api/v1/auth/token`
Generates a short-lived Bearer access token:
- **Request Body**:
  ```json
  {
    "apiKey": "tl_sb_acmeapp_8d7f6e52c803ab971e..."
  }
  ```
- **Response**:
  ```json
  {
    "token_type": "Bearer",
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "expires_in": 3600
  }
  ```

#### 2. GET `/api/v1/secure/trustscore`
Returns a user's calculated trust score, breakdown, and active risk flags:
- **Query Parameter**: `userId` (UUID, required)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "4a5779be-7615-424d-b645-5c770755fc36",
      "score": 720,
      "category": "VERIFIED_TRUSTED",
      "breakdown": { "identity": 250, "financial": 200, "developer": 180, "professional": 90 },
      "fraudPenalties": null,
      "updatedAt": "2026-08-04T00:00:00Z"
    }
  }
  ```

#### 3. GET `/api/v1/secure/passport`
Returns decrypted user passport profile details:
- **Query Parameter**: `userId` (UUID, required)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "4a5779be-7615-424d-b645-5c770755fc36",
      "email": "user@example.com",
      "fullName": "Jane Doe",
      "walletAddress": "0x123f6e52c803ab971e...",
      "createdAt": "2026-05-18T00:35:49Z"
    }
  }
  ```

#### 4. POST `/api/v1/secure/verify-id`
Launches the document OCR and validation pipeline:
- **Request Body**:
  ```json
  {
    "userId": "4a5779be-7615-424d-b645-5c770755fc36",
    "documentType": "PASSPORT",
    "documentData": "data:image/jpeg;base64,..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "transactionId": "tx_9f3a2b1c",
    "userId": "4a5779be-7615-424d-b645-5c770755fc36",
    "verificationResult": {
      "status": "VERIFIED",
      "confidenceScore": 0.98,
      "extractedFields": { "fullName": "Jane Doe", "country": "US", "ageVerified": true },
      "checkedAt": "2026-08-04T00:00:00Z"
    }
  }
  ```

---

## 📡 Webhooks Integration Guide

Webhooks send real-time event updates from Crifolayer directly to your application backend.

### 🛡️ Signature Verification
Each webhook payload is signed with your webhook secret. Verify this signature in your server endpoints before processing:

```javascript
// Webhook Signature Verification Example (Node.js/Express)
const crypto = require('crypto');

app.post('/webhooks/trustlayer', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-trustlayer-signature'];
  const secret = process.env.TRUSTLAYER_WEBHOOK_SECRET;
  
  const computed = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature !== computed) {
    return res.status(401).send('Signature verification failed.');
  }

  // Process verified webhook payload
  const { event, data } = JSON.parse(req.body);
  console.log(`Received event: ${event}`, data);
  res.sendStatus(200);
});
```

---

### 🔔 Supported Webhook Events
- `trust.score.updated`: Fired when a user's trust score changes.
- `fraud.detected`: Fired when a high-severity fraud signal is confirmed.
- `identity.verified`: Fired when a user completes document verification.
- `passport.updated`: Fired when details on a user's passport change.

---

## ⚠️ Error Handling & Response Schemas

Crifolayer returns standard, structured JSON errors for all API requests:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry after 60 seconds.",
    "retry_after": 60
  }
}
```

### 📋 Error Code Directory

| Machine Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | `401` | Missing or invalid API key or bearer signature. |
| `FORBIDDEN` | `403` | Client lacks scopes or user has revoked B2B sharing consent. |
| `NOT_FOUND` | `404` | The requested user, application, or passport does not exist. |
| `CONFLICT` | `409` | Resource state conflict (e.g. account already exists). |
| `VALIDATION_FAILED` | `422` | Request body validation failed (e.g., missing parameter). |
| `RATE_LIMIT_EXCEEDED`| `429` | Request limit hit. Check response headers. |
| `SERVER_ERROR` | `500` | Gateway pipelines failed. Retry with backoff. |

---

*Crifolayer TrustLayer Platform Documentation · © 2026.*
