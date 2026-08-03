import { useState } from 'react';
import { Copy, Check, Package, Terminal, Globe, Code2, ArrowRight, Zap, RefreshCw, ShieldCheck, Activity } from 'lucide-react';

const LANGS = ['Node.js', 'Python', 'Go', 'Java'] as const;
type Lang = typeof LANGS[number];

const INSTALL: Record<Lang, string> = {
  'Node.js': 'npm install trustlayer-sdk',
  'Python':  'pip install trustlayer-sdk-py',
  'Go':      'go get github.com/trustlayer/trustlayer-go-sdk',
  'Java':    '<dependency>\n  <groupId>io.trustlayer</groupId>\n  <artifactId>trustlayer-java-sdk</artifactId>\n  <version>1.0.0</version>\n</dependency>',
};

const EXAMPLES: Record<Lang, { title: string; code: string }[]> = {
  'Node.js': [
    {
      title: 'Get Trust Score',
      code: `import TrustLayer from 'trustlayer-sdk';

const client = new TrustLayer({
  apiKey: process.env.TRUSTLAYER_KEY
});

// Retrieve a user's trust score
const score = await client.users.getTrustScore('user_uuid');
console.log(score.trust_score);   // 780
console.log(score.score_category); // 'HIGH_TRUST'`,
    },
    {
      title: 'Verify Identity',
      code: `const result = await client.identity.verify({
  userId: 'user_uuid',
  documentType: 'passport',
  documentHash: 'sha256_hash_of_document'
});

if (result.verified) {
  console.log('Identity verified at level:', result.verification_level);
}`,
    },
    {
      title: 'Submit Fraud Report',
      code: `const report = await client.fraud.report({
  targetUserId: 'suspected_user_uuid',
  reason: 'Fake marketplace listings',
  severity: 'high',
  evidence: {
    deviceFingerprint: 'abc123',
    ip: '192.168.1.1'
  }
});
console.log('Report ID:', report.id);`,
    },
    {
      title: 'Verify Webhook Signature',
      code: `import crypto from 'crypto';

function verifyWebhook(rawBody, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expected) {
    throw new Error('Invalid webhook signature');
  }
  return JSON.parse(rawBody);
}`,
    },
  ],
  'Python': [
    {
      title: 'Get Trust Score',
      code: `from trustlayer import TrustLayer

client = TrustLayer(api_key="tl_sk_live_xxx")

# Retrieve a user's trust score
score = client.users.get_trust_score("user_uuid")
print(score["trust_score"])    # 780
print(score["score_category"]) # 'HIGH_TRUST'`,
    },
    {
      title: 'Verify Identity',
      code: `result = client.identity.verify(
    user_id="user_uuid",
    document_type="passport",
    document_hash="sha256_hash"
)

if result["verified"]:
    print("Level:", result["verification_level"])`,
    },
    {
      title: 'Submit Fraud Report',
      code: `report = client.fraud.report(
    target_user_id="suspected_user",
    reason="Fake marketplace listings",
    severity="high",
    evidence={
        "device_fingerprint": "abc123",
        "ip": "192.168.1.1"
    }
)
print("Report ID:", report["id"])`,
    },
    {
      title: 'Verify Webhook Signature',
      code: `import hmac, hashlib

def verify_webhook(raw_body: bytes, signature: str, secret: str) -> dict:
    expected = 'sha256=' + hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise ValueError("Invalid webhook signature")
    import json
    return json.loads(raw_body)`,
    },
  ],
  'Go': [
    {
      title: 'Get Trust Score',
      code: `package main

import (
    "fmt"
    trustlayer "github.com/trustlayer/trustlayer-go-sdk"
)

func main() {
    client := trustlayer.NewClient("tl_sk_live_xxx")

    score, err := client.Users.GetTrustScore("user_uuid")
    if err != nil {
        panic(err)
    }
    fmt.Println(score.TrustScore)    // 780
    fmt.Println(score.ScoreCategory) // HIGH_TRUST
}`,
    },
    {
      title: 'Verify Identity',
      code: `result, err := client.Identity.Verify(&trustlayer.VerifyRequest{
    UserID:       "user_uuid",
    DocumentType: "passport",
    DocumentHash: "sha256_hash",
})
if err != nil { panic(err) }
fmt.Println("Level:", result.VerificationLevel)`,
    },
    {
      title: 'Verify Webhook Signature',
      code: `import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
)

func verifyWebhook(body []byte, sig, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(body)
    expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(sig), []byte(expected))
}`,
    },
  ],
  'Java': [
    {
      title: 'Get Trust Score',
      code: `import io.trustlayer.TrustLayerClient;
import io.trustlayer.model.TrustScore;

TrustLayerClient client = TrustLayerClient.builder()
    .apiKey("tl_sk_live_xxx")
    .build();

TrustScore score = client.users().getTrustScore("user_uuid");
System.out.println(score.getTrustScore());    // 780
System.out.println(score.getScoreCategory()); // HIGH_TRUST`,
    },
    {
      title: 'Verify Identity',
      code: `import io.trustlayer.model.VerifyRequest;
import io.trustlayer.model.VerifyResult;

VerifyResult result = client.identity().verify(
    VerifyRequest.builder()
        .userId("user_uuid")
        .documentType("passport")
        .documentHash("sha256_hash")
        .build()
);
System.out.println("Level: " + result.getVerificationLevel());`,
    },
  ],
};

const FEATURES = [
  { icon: RefreshCw, label: 'Automatic Retries', desc: 'Exponential backoff on 5xx errors' },
  { icon: Zap,       label: 'Rate Limit Handling', desc: 'Respects 429 headers automatically' },
  { icon: ShieldCheck, label: 'OAuth Wrappers', desc: 'Token refresh handled transparently' },
  { icon: Code2,     label: 'Typed Responses', desc: 'Full TypeScript definitions included' },
  { icon: Activity,  label: 'Built-in Logging', desc: 'Optional request/response logging' },
  { icon: Globe,     label: 'Webhook Verification', desc: 'HMAC signature verification helpers' },
];

export default function DeveloperSDK() {
  const [lang, setLang] = useState<Lang>('Node.js');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-brutal-yellow border border-slate-200 dark:border-zinc-800 px-3 py-1 font-bold text-[10px] uppercase tracking-widest mb-4 shadow-sm">
          <Package size={12} /> SDK &amp; Libraries
        </div>
        <h1 className="font-display text-4xl uppercase tracking-tight text-[var(--text-primary)] mb-2">
          Client Libraries
        </h1>
        <p className="text-sm font-bold text-[var(--text-secondary)] max-w-2xl">
          Official SDKs for integrating TrustLayer into your platform. All libraries include automatic retries, typed responses, and webhook verification helpers.
        </p>
      </div>

      {/* Language tabs */}
      <div className="flex gap-0 border-[3px] border-black mb-8 w-fit shadow-md">
        {LANGS.map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider border-r-[3px] border-black last:border-r-0 transition-colors ${
              lang === l ? 'bg-brutal-yellow text-black' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-brutal-yellow/20'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Install card */}
      <div className="brutal-card mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-[var(--text-primary)]" />
            <span className="font-bold text-sm uppercase text-[var(--text-primary)]">Installation</span>
          </div>
          <button
            onClick={() => copy(INSTALL[lang], 'install')}
            className="flex items-center gap-1.5 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-brutal-yellow transition-colors bg-[var(--bg-primary)] text-[var(--text-primary)]"
          >
            {copied === 'install' ? <><Check size={11} className="text-green-600" /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>
        <pre className="bg-zinc-900 text-zinc-100 p-4 font-mono text-xs overflow-x-auto border-2 border-zinc-700">
          {INSTALL[lang]}
        </pre>
      </div>

      {/* SDK Features grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {FEATURES.map(f => (
          <div key={f.label} className="brutal-card flex items-start gap-3 p-4">
            <div className="w-8 h-8 bg-brutal-yellow border border-slate-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <f.icon size={14} className="text-black" />
            </div>
            <div>
              <div className="font-bold text-xs uppercase text-[var(--text-primary)]">{f.label}</div>
              <div className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Code examples */}
      <div>
        <h2 className="font-display text-xl uppercase tracking-tight text-[var(--text-primary)] mb-6 border-b-[3px] border-[var(--border-color)] pb-2">
          Code Examples
        </h2>
        <div className="flex flex-col gap-6">
          {EXAMPLES[lang].map((ex, idx) => (
            <div key={idx} className="brutal-card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-primary)] border-b-[3px] border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-[var(--text-primary)]" />
                  <span className="font-bold text-sm text-[var(--text-primary)]">{ex.title}</span>
                </div>
                <button
                  onClick={() => copy(ex.code, `ex-${idx}`)}
                  className="flex items-center gap-1.5 border-2 border-[var(--border-color)] px-2.5 py-1 text-[10px] font-bold uppercase hover:bg-brutal-yellow transition-colors bg-[var(--bg-primary)] text-[var(--text-primary)]"
                >
                  {copied === `ex-${idx}` ? <><Check size={11} className="text-green-600" /> Copied</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>
              <pre className="bg-zinc-900 text-zinc-100 p-5 font-mono text-xs overflow-x-auto leading-relaxed">
                {ex.code}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Quickstart CTA */}
      <div className="mt-10 border-[3px] border-black bg-brutal-yellow p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl uppercase text-black mb-1">Ready to integrate?</h3>
            <p className="text-xs font-bold text-black/70">Create your developer app and get API keys in 60 seconds.</p>
          </div>
          <a
            href="/developer/portal"
            className="brutal-btn bg-black text-brutal-yellow flex items-center gap-2 whitespace-nowrap"
          >
            Get API Keys <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
