# Crifolayer B2B Developer Node.js SDK

Official high-performance Node.js client library wrapper for the **Crifolayer Trustlayer B2B Integration Suite**. 

This SDK simplifies authenticating requests, signs JSON payloads cryptographically using HMAC-SHA256, and incorporates automatic exponential backoff retries with randomized jitter to handle rate limits (`HTTP 429`) and gateway network glitches smoothly.

---

## 🚀 Installation

Install the package via npm:

```bash
npm install @crifolayer/sdk
```

---

## 🔑 Quick Start

### 1. Initialization

Generate your Sandbox (`tl_sb_...`) or Production (`tl_prod_...`) keys inside the Crifolayer **Developer Portal Dashboard** (`/api`), and instantiate the client:

```javascript
const CrifolayerSDK = require('@crifolayer/sdk');

const client = new CrifolayerSDK({
  apiKey: 'tl_sb_acmeapp_8d7f6e52c803ab971e44f32e987c...',
  baseUrl: 'https://api.crifolayer.com/api/v1', // Defaults to local sandbox http://localhost:5000/api/v1
  timeout: 8000,                            // Request timeout limit (defaults to 10000ms)
  maxRetries: 4                             // Automatic exponential retries (defaults to 3)
});
```

---

## 📡 API Methods Reference

### 1. Fetch User Trust Score Profile

Retrieve the unified Trust Score (300-850), components breakdown metrics, and active fraud penalties or risk signal indicators:

```javascript
async function getScore(userId) {
  try {
    const response = await client.getTrustScore(userId);
    console.log('Trust Score Profile:', response.data);
    /*
      {
        success: true,
        data: {
          userId: "4a5779be-7615-424d-b645-5c770755fc36",
          score: 745,
          category: "VERIFIED_TRUSTED",
          breakdown: { identity: 250, financial: 180, developer: 210 },
          fraudPenalties: null,
          updatedAt: "2026-05-18T00:35:49Z"
        }
      }
    */
  } catch (error) {
    console.error('Failed to fetch score:', error.message);
  }
}
```

### 2. Retrieve Decrypted Identity Passport

Decrypt and fetch verified KYC credentials (email, legal full name, associated wallets) for high-trust user flows:

```javascript
async function getPassport(userId) {
  try {
    const response = await client.getPassport(userId);
    console.log('User Passport:', response.data);
  } catch (error) {
    console.error('Passport decryption failed:', error.message);
  }
}
```

### 3. Programmatic Document Verification

Upload identity documents (Passport, National ID, Driver's License) for OCR and security integrity checks:

```javascript
async function verifyDoc(userId, base64Image) {
  try {
    const response = await client.verifyIdentity(
      userId,
      'PASSPORT',
      base64Image // raw base64 string or safe URI block
    );
    console.log('Document Verification Transaction Result:', response.verificationResult);
  } catch (error) {
    console.error('Verification submit failed:', error.message);
  }
}
```

### 4. Link Integration Adapters

Connect a third-party platform credential (e.g. Upwork profile credentials, git tokens, Plaid balances) to a user profile to recalculate their trust weight:

```javascript
async function linkUpworkAccount(userId) {
  try {
    const response = await client.linkAccount(
      userId,
      'upwork',
      { authCode: 'upwork_temp_token_123' }
    );
    console.log('Account Link Successful:', response.message);
  } catch (error) {
    console.error('Account link failed:', error.message);
  }
}
```

---

## 🔒 Advanced Cryptographic Protection

### Built-in Replay Attack Mitigation
Every API request sent via the SDK is automatically signed using a SHA-256 HMAC generated from the combination of your **Secret API Key**, a request body dump, and a millisecond-precision timestamp. 

The API Gateway enforces a strict **5-minute sliding window** to reject replay attacks and signature spoofing.

---

## 📄 License
MIT License. Copyright (c) 2026 Crifolayer Team.
