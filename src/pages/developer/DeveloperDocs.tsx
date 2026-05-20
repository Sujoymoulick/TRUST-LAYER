import { useState } from 'react';
import {
  Copy,
  Check,
  ChevronRight,
  Shield,
  Zap,
  Globe,
  AlertTriangle,
  Book,
  Webhook,
} from 'lucide-react';
import { useGuest } from '../../context/GuestContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionId =
  | 'authentication'
  | 'trust-score'
  | 'identity'
  | 'fraud'
  | 'passport'
  | 'webhooks'
  | 'error-codes';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'authentication', label: 'Authentication', icon: <Shield size={15} /> },
  { id: 'trust-score', label: 'Trust Score API', icon: <Zap size={15} /> },
  { id: 'identity', label: 'Identity API', icon: <Globe size={15} /> },
  { id: 'fraud', label: 'Fraud API', icon: <AlertTriangle size={15} /> },
  { id: 'passport', label: 'Passport API', icon: <Book size={15} /> },
  { id: 'webhooks', label: 'Webhooks', icon: <Webhook size={15} /> },
  { id: 'error-codes', label: 'Error Codes', icon: <AlertTriangle size={15} /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MethodBadgeProps {
  method: 'GET' | 'POST' | 'DELETE';
}

function MethodBadge({ method }: MethodBadgeProps) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-600',
    POST: 'bg-green-600',
    DELETE: 'bg-red-600',
  };
  return (
    <span
      className={`${colors[method]} text-white font-mono text-xs px-2 py-0.5 rounded-sm font-bold tracking-widest uppercase select-none`}
    >
      {method}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'STABLE' | 'BETA';
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`text-xs font-mono font-bold px-2 py-0.5 border-[2px] border-black uppercase tracking-widest select-none ${
        status === 'STABLE'
          ? 'bg-brutal-green text-black'
          : 'bg-brutal-yellow text-black'
      }`}
    >
      {status}
    </span>
  );
}

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — do nothing
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="absolute top-3 right-3 p-1.5 rounded-sm border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 hover:text-white"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

interface CodeBlockProps {
  code: string;
}

function CodeBlock({ code }: CodeBlockProps) {
  return (
    <div className="relative mt-3">
      <pre className="bg-zinc-900 text-zinc-100 rounded-none border-2 border-black p-4 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

interface EndpointCardProps {
  method: 'GET' | 'POST' | 'DELETE';
  url: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
  status?: 'STABLE' | 'BETA';
}

function EndpointCard({
  method,
  url,
  description,
  requestBody,
  responseBody,
  status = 'STABLE',
}: EndpointCardProps) {
  return (
    <div className="border-[2px] border-black bg-[var(--bg-primary)] shadow-[3px_3px_0px_#000] mb-4">
      {/* Endpoint header */}
      <div className="flex items-center gap-3 p-3 border-b-[2px] border-black bg-zinc-50 dark:bg-zinc-800 flex-wrap">
        <MethodBadge method={method} />
        <code className="font-mono text-sm font-bold text-[var(--text-primary)] flex-1 break-all">
          {url}
        </code>
        <StatusBadge status={status} />
      </div>
      {/* Endpoint body */}
      <div className="p-4">
        <p className="text-sm text-[var(--text-secondary)] mb-2">{description}</p>
        {requestBody && (
          <>
            <p className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-3 mb-1">
              Request Body
            </p>
            <CodeBlock code={requestBody} />
          </>
        )}
        {responseBody && (
          <>
            <p className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-3 mb-1">
              Response
            </p>
            <CodeBlock code={responseBody} />
          </>
        )}
      </div>
    </div>
  );
}

interface SectionCardProps {
  id: SectionId;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ id, title, children }: SectionCardProps) {
  return (
    <section id={id} className="brutal-card mb-8 scroll-mt-24">
      <h2 className="font-display text-xl uppercase tracking-tight text-[var(--text-primary)] mb-1 pb-3 border-b-[2px] border-black">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ─── Section content ──────────────────────────────────────────────────────────

function AuthenticationSection() {
  const tokenResponse = `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}`;

  const bearerExample = `curl https://api.trustlayer.io/api/v1/secure/trustscore \\
  -H "Authorization: Bearer tl_sk_live_xxxxxxxxxxxx"`;

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        TrustLayer uses API keys to authenticate requests. All production requests must be made over
        HTTPS. API keys are scoped by environment — never share your live key in client-side code.
      </p>

      {/* Key prefix table */}
      <div className="border-[2px] border-black mb-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brutal-yellow border-b-[2px] border-black">
              <th className="text-left px-4 py-2 font-display text-xs uppercase tracking-widest text-black">
                Prefix
              </th>
              <th className="text-left px-4 py-2 font-display text-xs uppercase tracking-widest text-black">
                Environment
              </th>
              <th className="text-left px-4 py-2 font-display text-xs uppercase tracking-widest text-black">
                Billing
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/10">
              <td className="px-4 py-2 font-mono text-xs text-[var(--text-primary)]">
                tl_sk_test_
              </td>
              <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">Sandbox</td>
              <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">No charges</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-mono text-xs text-[var(--text-primary)]">
                tl_sk_live_
              </td>
              <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">Production</td>
              <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">Metered</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EndpointCard
        method="POST"
        url="/api/v1/auth/token"
        description="Exchange your API key for a short-lived Bearer JWT used in subsequent requests."
        requestBody={`{\n  "api_key": "tl_sk_live_xxxxxxxxxxxx"\n}`}
        responseBody={tokenResponse}
        status="STABLE"
      />

      <p className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-5 mb-2">
        Example authenticated request
      </p>
      <CodeBlock code={bearerExample} />

      <EndpointCard
        method="GET"
        url="/api/v1/secure/trustscore"
        description="Test endpoint to verify your Bearer token is valid and your key has the correct scopes."
        status="STABLE"
      />

      <div className="mt-4 p-3 border-[2px] border-black bg-brutal-yellow/20">
        <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-1">
          ⚠ Security Note
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Bearer tokens expire after <strong>3600 seconds</strong>. Cache and refresh them
          server-side. Never expose API keys in browser JavaScript or mobile binaries.
        </p>
      </div>
    </>
  );
}

function TrustScoreSection() {
  const scoreResponse = `{
  "user_id": "usr_abc123",
  "trust_score": 847,
  "score_category": "HIGH",
  "breakdown": {
    "identity_verification": 210,
    "behavioral_consistency": 185,
    "platform_tenure": 162,
    "peer_vouching": 148,
    "document_verification": 142
  },
  "risk_analysis": {
    "active_flags": 0,
    "behavioral_anomalies": []
  },
  "last_updated": "2026-05-21T00:31:57Z"
}`;

  const userResponse = `{
  "user_id": "usr_abc123",
  "display_name": "Alex Johnson",
  "trust_level": "VERIFIED",
  "public_score": 847,
  "badges": ["identity_verified", "phone_verified", "email_verified"],
  "connected_providers": ["google", "github", "linkedin"]
}`;

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        The Trust Score API returns a numeric trust score (0–1000) for any TrustLayer user, along
        with a breakdown of contributing factors and active risk signals.
      </p>

      <EndpointCard
        method="GET"
        url="/api/v1/users/:id/score"
        description="Retrieve the full trust score and risk analysis for a given user. Requires the trust_score:read scope."
        responseBody={scoreResponse}
        status="STABLE"
      />

      <EndpointCard
        method="GET"
        url="/api/v1/users/:id"
        description="Retrieve public profile information for a user, including their display name, badge list, and connected identity providers."
        responseBody={userResponse}
        status="STABLE"
      />

      <div className="mt-4 p-3 border-[2px] border-black bg-brutal-blue/10">
        <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-1">
          Score categories
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {[
            { label: 'CRITICAL', range: '0–299', color: 'bg-red-500' },
            { label: 'LOW', range: '300–499', color: 'bg-orange-400' },
            { label: 'MEDIUM', range: '500–699', color: 'bg-brutal-yellow' },
            { label: 'HIGH', range: '700–1000', color: 'bg-brutal-green' },
          ].map((cat) => (
            <div key={cat.label} className="border-[2px] border-black p-2 text-center">
              <div className={`${cat.color} text-black text-xs font-bold py-0.5 mb-1`}>
                {cat.label}
              </div>
              <div className="text-xs font-mono text-[var(--text-secondary)]">{cat.range}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function IdentitySection() {
  const idRequest = `{
  "user_id": "usr_abc123",
  "document_type": "aadhaar",
  "document_hash": "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1..."
}`;

  const idResponse = `{
  "verified": true,
  "verification_level": "FULL_KYC",
  "transaction_id": "txn_id_9f3a2b1c",
  "verified_at": "2026-05-21T00:31:57Z"
}`;

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        The Identity API provides document-level verification. Documents are hashed client-side;
        TrustLayer never stores raw document images. Supported types:{' '}
        <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 border border-black/20">
          aadhaar
        </code>
        ,{' '}
        <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 border border-black/20">
          passport
        </code>
        ,{' '}
        <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 border border-black/20">
          dl
        </code>
        .
      </p>

      <EndpointCard
        method="POST"
        url="/api/v1/secure/verify-id"
        description="Submit a document hash for verification. Returns a transaction ID and verification level upon success. Requires the identity:write scope."
        requestBody={idRequest}
        responseBody={idResponse}
        status="STABLE"
      />

      <div className="mt-4 p-3 border-[2px] border-black bg-brutal-green/10">
        <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-2">
          Verification levels
        </p>
        <div className="space-y-1">
          {[
            { level: 'EMAIL_ONLY', desc: 'Email address confirmed' },
            { level: 'PHONE_VERIFIED', desc: 'OTP-verified phone number' },
            { level: 'PARTIAL_KYC', desc: 'Single document verified' },
            { level: 'FULL_KYC', desc: 'Multiple documents + liveness check' },
          ].map((v) => (
            <div key={v.level} className="flex items-start gap-2 text-xs">
              <code className="font-mono font-bold text-[var(--text-primary)] shrink-0 w-32">
                {v.level}
              </code>
              <span className="text-[var(--text-secondary)]">{v.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function FraudSection() {
  const fraudRequest = `{
  "app_id": "app_xyz789",
  "target_user_id": "usr_abc123",
  "reason": "Repeated charge-back attempts with stolen credentials",
  "severity": "high",
  "evidence": {
    "device_fingerprint": "fp_7a3b2c1d9e0f",
    "ip": "192.168.1.42"
  }
}`;

  const fraudResponse = `{
  "success": true,
  "report": {
    "id": "rpt_8f4d1e2a",
    "status": "UNDER_REVIEW",
    "severity": "high",
    "created_at": "2026-05-21T00:31:57Z"
  }
}`;

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        The Fraud API allows partner applications to submit structured fraud reports against
        TrustLayer users. Reports feed into TrustLayer's risk engine and may affect a user's trust
        score after review.
      </p>

      <EndpointCard
        method="POST"
        url="/api/v1/developer/fraud"
        description="Submit a fraud report against a user. Severity must be one of: low, medium, high, critical. Requires the fraud:report scope."
        requestBody={fraudRequest}
        responseBody={fraudResponse}
        status="STABLE"
      />

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { level: 'low', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', border: 'border-blue-400' },
          { level: 'medium', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', border: 'border-yellow-400' },
          { level: 'high', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', border: 'border-orange-400' },
          { level: 'critical', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', border: 'border-red-500' },
        ].map((s) => (
          <div
            key={s.level}
            className={`border-[2px] ${s.border} ${s.color} px-3 py-2 text-center`}
          >
            <p className="font-mono font-bold text-xs uppercase tracking-widest">{s.level}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function PassportSection() {
  const passportResponse = `{
  "user_id": "usr_abc123",
  "passport_url": "https://passport.trustlayer.io/p/usr_abc123",
  "verification_badges": [
    "identity_verified",
    "phone_verified",
    "email_verified",
    "social_github"
  ],
  "trust_score": 847,
  "social_verifications": {
    "github": { "username": "alexjohnson", "verified": true },
    "linkedin": { "verified": true, "connections": 312 },
    "twitter": { "verified": false }
  }
}`;

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        The Passport API returns a user's shareable TrustLayer Passport — a portable identity
        profile that summarizes their verified credentials, badges, and current trust score. Use
        this to render trust badges in your own UI.
      </p>

      <EndpointCard
        method="GET"
        url="/api/v1/passport/:id"
        description="Retrieve the full TrustLayer Passport for a user. The passport_url is a publicly shareable link. Requires the passport:read scope."
        responseBody={passportResponse}
        status="BETA"
      />

      <div className="mt-4 p-3 border-[2px] border-black bg-brutal-pink/10">
        <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-1">
          Beta Notice
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          The Passport API schema is subject to change during the beta period. Pin your integration
          to a specific schema version using the{' '}
          <code className="font-mono">X-TrustLayer-Schema-Version</code> request header.
        </p>
      </div>
    </>
  );
}

function WebhooksSection() {
  const registerRequest = `{
  "url": "https://yourapp.com/webhooks/trustlayer",
  "events": ["trust.score.updated", "fraud.detected"],
  "description": "Production webhook"
}`;

  const registerResponse = `{
  "id": "wh_5c3f2e1a",
  "url": "https://yourapp.com/webhooks/trustlayer",
  "events": ["trust.score.updated", "fraud.detected"],
  "secret": "whsec_9f3a2b1c8d7e6f5a4b3c2d1e",
  "created_at": "2026-05-21T00:31:57Z"
}`;

  const listResponse = `{
  "webhooks": [
    {
      "id": "wh_5c3f2e1a",
      "url": "https://yourapp.com/webhooks/trustlayer",
      "events": ["trust.score.updated", "fraud.detected"],
      "status": "ACTIVE",
      "created_at": "2026-05-21T00:31:57Z"
    }
  ]
}`;

  const hmacSnippet = `const sig = req.headers['x-trustlayer-signature'];
const computed = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(rawBody)
  .digest('hex');

if (sig !== computed) {
  throw new Error('Invalid signature');
}`;

  const events = [
    { event: 'trust.score.updated', desc: 'Fired whenever a user\'s trust score changes.' },
    { event: 'fraud.detected', desc: 'Fired when a high-severity fraud signal is confirmed.' },
    { event: 'identity.verified', desc: 'Fired when a user completes document verification.' },
    { event: 'passport.updated', desc: 'Fired when a user\'s passport profile changes.' },
  ];

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Webhooks let you receive real-time event notifications from TrustLayer. Secure each
        endpoint with HMAC-SHA256 signature verification using the secret returned at registration.
      </p>

      <EndpointCard
        method="POST"
        url="/api/v1/developer/webhooks"
        description="Register a new webhook endpoint. Returns the signing secret — store it securely, it won't be shown again."
        requestBody={registerRequest}
        responseBody={registerResponse}
        status="STABLE"
      />

      <EndpointCard
        method="GET"
        url="/api/v1/developer/webhooks"
        description="List all registered webhook endpoints for the authenticated application."
        responseBody={listResponse}
        status="STABLE"
      />

      <EndpointCard
        method="DELETE"
        url="/api/v1/developer/webhooks/:id"
        description="Permanently remove a webhook endpoint. All pending deliveries to this endpoint will be cancelled."
        status="STABLE"
      />

      {/* HMAC verification */}
      <div className="mt-6">
        <h3 className="font-display text-sm uppercase tracking-widest text-[var(--text-primary)] mb-2">
          Signature Verification (Node.js)
        </h3>
        <CodeBlock code={hmacSnippet} />
      </div>

      {/* Events table */}
      <div className="mt-6">
        <h3 className="font-display text-sm uppercase tracking-widest text-[var(--text-primary)] mb-3">
          Available Events
        </h3>
        <div className="border-[2px] border-black overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-100 border-b-[2px] border-black">
                <th className="text-left px-4 py-2 font-mono text-xs">Event</th>
                <th className="text-left px-4 py-2 font-mono text-xs">Description</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr
                  key={ev.event}
                  className={i < events.length - 1 ? 'border-b border-black/10' : ''}
                >
                  <td className="px-4 py-2 font-mono text-xs text-brutal-blue font-bold text-[var(--text-primary)]">
                    {ev.event}
                  </td>
                  <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">{ev.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ErrorCodesSection() {
  const errorFormat = `{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Retry after 60 seconds.",
    "retry_after": 60
  }
}`;

  const errors = [
    { code: 'UNAUTHORIZED', http: 401, meaning: 'Missing or invalid Bearer token.' },
    { code: 'FORBIDDEN', http: 403, meaning: 'Authenticated but lacking required scope.' },
    { code: 'NOT_FOUND', http: 404, meaning: 'The requested resource does not exist.' },
    { code: 'CONFLICT', http: 409, meaning: 'Resource already exists or state conflict.' },
    { code: 'VALIDATION_FAILED', http: 422, meaning: 'Request body failed schema validation.' },
    { code: 'RATE_LIMIT_EXCEEDED', http: 429, meaning: 'Request rate limit hit. Check Retry-After header.' },
    { code: 'SERVER_ERROR', http: 500, meaning: 'Unexpected server error. Retry with exponential backoff.' },
  ];

  const httpColor = (code: number) => {
    if (code < 400) return 'bg-brutal-green text-black';
    if (code < 500) return 'bg-brutal-yellow text-black';
    return 'bg-brutal-pink text-black';
  };

  return (
    <>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        All TrustLayer API errors follow a consistent JSON envelope. HTTP status codes align with
        RFC 9110. Machine-readable error codes are provided for programmatic handling.
      </p>

      <div className="border-[2px] border-black overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-100 border-b-[2px] border-black">
              <th className="text-left px-4 py-2 font-mono text-xs">Code</th>
              <th className="text-left px-4 py-2 font-mono text-xs">HTTP</th>
              <th className="text-left px-4 py-2 font-mono text-xs">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err, i) => (
              <tr
                key={err.code}
                className={i < errors.length - 1 ? 'border-b border-black/10' : ''}
              >
                <td className="px-4 py-2 font-mono text-xs font-bold text-[var(--text-primary)]">
                  {err.code}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 ${httpColor(err.http)}`}
                  >
                    {err.http}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">{err.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-display text-sm uppercase tracking-widest text-[var(--text-primary)] mb-2">
        Standard Error Response
      </h3>
      <CodeBlock code={errorFormat} />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeveloperDocs() {
  const { isGuest } = useGuest();
  const [activeSection, setActiveSection] = useState<SectionId>('authentication');

  const handleNavClick = (id: SectionId) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="border-b-[3px] border-black bg-brutal-yellow shadow-[0px_4px_0px_#000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Book size={28} className="text-black" />
                <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-black">
                  API Documentation
                </h1>
              </div>
              <p className="text-sm sm:text-base font-mono text-black/70 max-w-xl">
                Everything you need to integrate TrustLayer into your platform
              </p>
            </div>
            <div className="flex items-center gap-2 self-end">
              <span className="border-[2px] border-black bg-white text-black font-mono text-xs px-3 py-1 font-bold">
                v1.0
              </span>
              {isGuest && (
                <span className="border-[2px] border-black bg-black text-brutal-yellow font-mono text-xs px-3 py-1 font-bold">
                  GUEST VIEW
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-6 items-start">
        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-6 self-start">
          <div className="border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden"
               style={{ background: 'var(--bg-primary)' }}>
            <div className="border-b-[2px] border-black px-4 py-2 bg-zinc-900">
              <p className="font-display text-xs uppercase tracking-widest text-zinc-100">
                Sections
              </p>
            </div>
            <nav className="py-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors border-b border-black/10 last:border-b-0 ${
                      isActive
                        ? 'bg-brutal-yellow text-black font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className={isActive ? 'text-black' : 'text-[var(--text-secondary)]'}>
                      {item.icon}
                    </span>
                    <span className="text-xs font-mono">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={12} className="ml-auto text-black shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick links card */}
          <div className="mt-4 border-[2px] border-black p-3 shadow-[3px_3px_0px_#000]"
               style={{ background: 'var(--bg-primary)' }}>
            <p className="font-display text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-2">
              Quick Links
            </p>
            <div className="space-y-1">
              {['Changelog', 'SDKs', 'Status Page', 'Support'].map((link) => (
                <button
                  key={link}
                  className="block w-full text-left text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-0.5 transition-colors"
                >
                  → {link}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Mobile Nav (horizontal scroll) ─────────────────────────────── */}
        <div className="lg:hidden w-full overflow-x-auto mb-4 -mt-2">
          <div className="flex gap-2 pb-1 min-w-max">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black text-xs font-mono font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Content ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          <SectionCard id="authentication" title="Authentication">
            <AuthenticationSection />
          </SectionCard>

          <SectionCard id="trust-score" title="Trust Score API">
            <TrustScoreSection />
          </SectionCard>

          <SectionCard id="identity" title="Identity API">
            <IdentitySection />
          </SectionCard>

          <SectionCard id="fraud" title="Fraud API">
            <FraudSection />
          </SectionCard>

          <SectionCard id="passport" title="Passport API">
            <PassportSection />
          </SectionCard>

          <SectionCard id="webhooks" title="Webhooks">
            <WebhooksSection />
          </SectionCard>

          <SectionCard id="error-codes" title="Error Codes">
            <ErrorCodesSection />
          </SectionCard>

          {/* Footer bar */}
          <div className="mt-8 border-[2px] border-black p-4 flex flex-wrap items-center justify-between gap-3"
               style={{ background: 'var(--bg-primary)' }}>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              TrustLayer API v1.0 · Last updated May 2026
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brutal-green border border-black inline-block" />
              <span className="text-xs font-mono text-[var(--text-secondary)]">All systems operational</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
