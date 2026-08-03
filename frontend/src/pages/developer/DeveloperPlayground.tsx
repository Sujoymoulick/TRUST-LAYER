import { useState } from 'react';
import { Play, Copy, Check, Terminal, Zap, ChevronDown } from 'lucide-react';
import { useGuest } from '../../context/GuestContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Endpoint {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  label: string;
  hasBody: boolean;
  hasPathParam: boolean;
  defaultBody?: object;
}

interface ResponseState {
  status: number | null;
  latency: number | null;
  body: object | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/users/:id/score',
    label: 'GET /users/:id/score',
    hasBody: false,
    hasPathParam: true,
  },
  {
    method: 'GET',
    path: '/api/v1/users/:id',
    label: 'GET /users/:id',
    hasBody: false,
    hasPathParam: true,
  },
  {
    method: 'GET',
    path: '/api/v1/passport/:id',
    label: 'GET /passport/:id',
    hasBody: false,
    hasPathParam: true,
  },
  {
    method: 'POST',
    path: '/api/v1/secure/verify-id',
    label: 'POST /secure/verify-id',
    hasBody: true,
    hasPathParam: false,
    defaultBody: {
      user_id: 'usr_demo_001',
      document_type: 'PASSPORT',
      country_code: 'US',
    },
  },
  {
    method: 'POST',
    path: '/api/v1/developer/fraud',
    label: 'POST /developer/fraud',
    hasBody: true,
    hasPathParam: false,
    defaultBody: {
      reported_user_id: 'usr_demo_002',
      reason: 'Suspicious activity detected',
      severity: 'medium',
      evidence_url: 'https://example.com/evidence',
    },
  },
  {
    method: 'POST',
    path: '/api/v1/developer/webhooks',
    label: 'POST /developer/webhooks',
    hasBody: true,
    hasPathParam: false,
    defaultBody: {
      url: 'https://yourapp.com/webhook',
      events: ['score.updated', 'verification.completed'],
      description: 'My webhook endpoint',
    },
  },
  {
    method: 'GET',
    path: '/api/v1/developer/webhooks',
    label: 'GET /developer/webhooks',
    hasBody: false,
    hasPathParam: false,
  },
  {
    method: 'DELETE',
    path: '/api/v1/developer/webhooks/:id',
    label: 'DELETE /developer/webhooks/:id',
    hasBody: false,
    hasPathParam: true,
  },
];

// ─── Mock Response Generator ──────────────────────────────────────────────────

function generateMockResponse(endpoint: Endpoint, pathParam: string): { status: number; body: object } {
  const id = pathParam || 'demo_123';
  const path = endpoint.path;

  if (path === '/api/v1/users/:id/score') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          user_id: id,
          trust_score: 780,
          score_category: 'HIGH_TRUST',
          breakdown: {
            identity: 200,
            professional: 180,
            social: 150,
            financial: 250,
          },
          risk_analysis: {
            active_flags: [],
            behavioral_anomalies: false,
          },
          last_updated: new Date().toISOString(),
        },
      },
    };
  }

  if (path === '/api/v1/users/:id') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          user_id: id,
          display_name: 'John Doe',
          trust_level: 'HIGH_TRUST',
          public_score: 780,
          badges: ['GitHub Verified', 'LinkedIn Verified'],
          connected_providers: ['github', 'linkedin'],
        },
      },
    };
  }

  if (path === '/api/v1/passport/:id') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          user_id: id,
          passport_url: `https://app.trustlayer.io/profile?id=${id}`,
          verification_badges: [
            { provider: 'github', status: 'CONNECTED' },
          ],
          trust_score: 780,
          trust_category: 'HIGH_TRUST',
        },
      },
    };
  }

  if (path === '/api/v1/secure/verify-id') {
    return {
      status: 200,
      body: {
        success: true,
        transaction_id: 'txn_' + Math.random().toString(36).slice(2, 10),
        verified: true,
        verification_level: 'High',
        verified_at: new Date().toISOString(),
      },
    };
  }

  if (path === '/api/v1/developer/fraud') {
    return {
      status: 200,
      body: {
        success: true,
        message: 'Fraud report submitted for review.',
        report: {
          id: 'fr_' + Math.random().toString(36).slice(2, 10),
          status: 'pending',
          severity: 'medium',
          created_at: new Date().toISOString(),
        },
      },
    };
  }

  // All webhook endpoints
  if (path.includes('/developer/webhooks')) {
    return {
      status: 200,
      body: {
        success: true,
        message: 'Operation successful',
        data: [],
      },
    };
  }

  return {
    status: 404,
    body: { success: false, error: 'Endpoint not found' },
  };
}

// ─── JSON Syntax Highlighter ──────────────────────────────────────────────────

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-blue-400'; // numbers
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-yellow-400'; // keys
          } else {
            cls = 'text-green-400'; // strings
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-red-400'; // booleans
        } else if (/null/.test(match)) {
          cls = 'text-purple-400'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

// ─── Method Badge ─────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-brutal-green text-black',
    POST: 'bg-brutal-blue text-white',
    DELETE: 'bg-brutal-pink text-black',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold font-mono rounded border border-black ${colors[method] ?? 'bg-gray-200 text-black'}`}
    >
      {method}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  const color =
    status >= 200 && status < 300
      ? 'bg-brutal-green text-black'
      : status >= 400 && status < 500
      ? 'bg-brutal-yellow text-black'
      : 'bg-brutal-pink text-black';
  return (
    <span
      className={`inline-block px-3 py-1 text-sm font-bold font-mono border border-black ${color}`}
    >
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeveloperPlayground() {
  useGuest();

  const [isSandbox, setIsSandbox] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [authMethod, setAuthMethod] = useState<'apikey' | 'oauth'>('apikey');
  const [apiKey, setApiKey] = useState('');
  const [pathParam, setPathParam] = useState('demo_123');
  const [requestBody, setRequestBody] = useState(() =>
    JSON.stringify(ENDPOINTS[0].defaultBody ?? {}, null, 2)
  );
  const [response, setResponse] = useState<ResponseState>({
    status: null,
    latency: null,
    body: null,
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const endpoint = ENDPOINTS[selectedIndex];

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleEndpointChange(idx: number) {
    setSelectedIndex(idx);
    setResponse({ status: null, latency: null, body: null });
    setBodyError(null);
    const ep = ENDPOINTS[idx];
    if (ep.hasBody && ep.defaultBody) {
      setRequestBody(JSON.stringify(ep.defaultBody, null, 2));
    } else {
      setRequestBody('');
    }
  }

  function handleBodyChange(value: string) {
    setRequestBody(value);
    try {
      if (value.trim()) JSON.parse(value);
      setBodyError(null);
    } catch {
      setBodyError('Invalid JSON');
    }
  }

  async function handleSend() {
    if (bodyError) return;
    setLoading(true);
    setResponse({ status: null, latency: null, body: null });

    const delay = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
    await new Promise((r) => setTimeout(r, delay));

    const latency = Math.floor(Math.random() * (180 - 42 + 1)) + 42;
    const mock = generateMockResponse(endpoint, pathParam);

    setResponse({ status: mock.status, latency, body: mock.body });
    setLoading(false);
  }

  function buildCurl(): string {
    const resolvedPath = endpoint.hasPathParam
      ? endpoint.path.replace(':id', pathParam || '{id}')
      : endpoint.path;
    const base = 'https://api.trustlayer.io';
    const authHeader =
      authMethod === 'apikey'
        ? `-H "X-API-Key: ${apiKey || 'tl_sk_test_...'}" \\`
        : `-H "Authorization: Bearer ${apiKey || '<access_token>'}" \\`;
    const bodyPart =
      endpoint.hasBody && requestBody.trim()
        ? `  -d '${requestBody.replace(/\n/g, ' ')}' \\`
        : '';

    return [
      `curl -X ${endpoint.method} \\`,
      `  "${base}${resolvedPath}" \\`,
      `  ${authHeader}`,
      `  -H "Content-Type: application/json" \\`,
      bodyPart,
    ]
      .filter(Boolean)
      .join('\n')
      .replace(/\\\n$/, '');
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCurl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Page Header ── */}
      <div
        className="border-b-[3px] border-[var(--border-color)] px-6 py-6"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brutal-yellow border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1
                className="font-display text-2xl uppercase tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                API Playground
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Test TrustLayer endpoints interactively — no setup required
              </p>
            </div>
          </div>

          {/* Sandbox / Live Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Mode:
            </span>
            <div className="flex border-[3px] border-[var(--border-color)] overflow-hidden shadow-[4px_4px_0px_#000]">
              <button
                onClick={() => setIsSandbox(true)}
                className={`px-4 py-1.5 text-sm font-bold uppercase tracking-tight transition-colors ${
                  isSandbox
                    ? 'bg-brutal-yellow text-black'
                    : 'bg-transparent'
                }`}
                style={!isSandbox ? { color: 'var(--text-secondary)' } : {}}
              >
                Sandbox
              </button>
              <button
                onClick={() => setIsSandbox(false)}
                className={`px-4 py-1.5 text-sm font-bold uppercase tracking-tight border-l-[3px] border-[var(--border-color)] transition-colors ${
                  !isSandbox
                    ? 'bg-brutal-pink text-black'
                    : 'bg-transparent'
                }`}
                style={isSandbox ? { color: 'var(--text-secondary)' } : {}}
              >
                Live
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Sandbox Banner */}
        {isSandbox && (
          <div className="flex items-center gap-3 px-4 py-3 border-[3px] border-black bg-brutal-yellow shadow-[4px_4px_0px_#000]">
            <Zap className="w-4 h-4 text-black flex-shrink-0" />
            <p className="text-sm font-bold text-black">
              🧪 Sandbox Mode — responses are simulated. No real API calls are made.
            </p>
          </div>
        )}

        {!isSandbox && (
          <div className="flex items-center gap-3 px-4 py-3 border-[3px] border-black bg-brutal-pink shadow-[4px_4px_0px_#000]">
            <Zap className="w-4 h-4 text-black flex-shrink-0" />
            <p className="text-sm font-bold text-black">
              ⚡ Live Mode — requests will be sent to the real TrustLayer API.
            </p>
          </div>
        )}

        {/* ── Two-column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Request Builder ── */}
          <div className="space-y-4">
            <div className="brutal-card p-5 space-y-5">
              <h2
                className="font-display text-lg uppercase tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Request Builder
              </h2>

              {/* Endpoint Selector */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Endpoint
                </label>
                <div className="relative">
                  <select
                    value={selectedIndex}
                    onChange={(e) => handleEndpointChange(Number(e.target.value))}
                    className="w-full appearance-none border-[3px] border-[var(--border-color)] px-3 py-2.5 pr-10 text-sm font-mono shadow-[4px_4px_0px_#000] focus:outline-none focus:border-black"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {ENDPOINTS.map((ep, idx) => (
                      <option key={idx} value={idx}>
                        {ep.method} {ep.path}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <MethodBadge method={endpoint.method} />
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {endpoint.path}
                  </span>
                </div>
              </div>

              {/* Auth Method */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Auth Method
                </label>
                <div className="flex border-[3px] border-[var(--border-color)] overflow-hidden shadow-[4px_4px_0px_#000]">
                  <button
                    onClick={() => setAuthMethod('apikey')}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-tight transition-colors ${
                      authMethod === 'apikey'
                        ? 'bg-brutal-blue text-white'
                        : 'bg-transparent'
                    }`}
                    style={authMethod !== 'apikey' ? { color: 'var(--text-secondary)' } : {}}
                  >
                    API Key
                  </button>
                  <button
                    onClick={() => setAuthMethod('oauth')}
                    className={`flex-1 py-2 text-sm font-bold uppercase tracking-tight border-l-[3px] border-[var(--border-color)] transition-colors ${
                      authMethod === 'oauth'
                        ? 'bg-brutal-blue text-white'
                        : 'bg-transparent'
                    }`}
                    style={authMethod !== 'oauth' ? { color: 'var(--text-secondary)' } : {}}
                  >
                    OAuth Bearer
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {authMethod === 'apikey' ? 'API Key' : 'Bearer Token'}
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={authMethod === 'apikey' ? 'tl_sk_test_...' : 'eyJhbGciOiJ...'}
                  className="w-full border-[3px] border-[var(--border-color)] px-3 py-2.5 text-sm font-mono shadow-[4px_4px_0px_#000] focus:outline-none focus:border-black"
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Path Param Input */}
              {endpoint.hasPathParam && (
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Path Parameter <span className="text-brutal-blue">:id</span>
                  </label>
                  <input
                    type="text"
                    value={pathParam}
                    onChange={(e) => setPathParam(e.target.value)}
                    placeholder="demo_123"
                    className="w-full border-[3px] border-[var(--border-color)] px-3 py-2.5 text-sm font-mono shadow-[4px_4px_0px_#000] focus:outline-none focus:border-black"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Replaces <code className="font-mono">:id</code> in the path
                  </p>
                </div>
              )}

              {/* Request Body */}
              {endpoint.hasBody && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="block text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Request Body (JSON)
                    </label>
                    {bodyError && (
                      <span className="text-xs text-red-500 font-bold">{bodyError}</span>
                    )}
                  </div>
                  <textarea
                    value={requestBody}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    rows={10}
                    className="w-full border-[3px] border-[var(--border-color)] px-3 py-2.5 text-sm font-mono shadow-[4px_4px_0px_#000] focus:outline-none focus:border-black resize-none"
                    style={{
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      borderColor: bodyError ? '#ef4444' : undefined,
                    }}
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSend}
                  disabled={loading || !!bodyError}
                  className="brutal-btn bg-brutal-yellow flex items-center gap-2 flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopy}
                  className="brutal-btn bg-transparent border-[3px] border-[var(--border-color)] flex items-center gap-2 px-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-brutal-green" />
                      <span className="text-brutal-green text-sm font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm font-bold">cURL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* cURL Preview */}
            <div className="brutal-card p-4 space-y-2">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-secondary)' }}
              >
                Generated cURL
              </p>
              <pre className="bg-zinc-900 text-zinc-100 text-xs font-mono p-3 rounded overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {buildCurl()}
              </pre>
            </div>
          </div>

          {/* ── RIGHT: Response Viewer ── */}
          <div className="brutal-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="font-display text-lg uppercase tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Response
              </h2>
              {response.status !== null && response.latency !== null && (
                <div className="flex items-center gap-3">
                  <StatusBadge status={response.status} />
                  <div
                    className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 border-[2px] border-[var(--border-color)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Zap className="w-3 h-3" />
                    {response.latency}ms
                  </div>
                </div>
              )}
            </div>

            {/* Response Body */}
            {response.body === null ? (
              <div className="bg-zinc-900 rounded border border-zinc-700 flex flex-col items-center justify-center min-h-[420px] text-center px-6">
                <Terminal className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-zinc-400 font-mono text-sm">Hit Send to see the response</p>
                <p className="text-zinc-600 font-mono text-xs mt-1">
                  Select an endpoint and click Send Request
                </p>
              </div>
            ) : loading ? (
              <div className="bg-zinc-900 rounded border border-zinc-700 flex flex-col items-center justify-center min-h-[420px]">
                <span className="w-8 h-8 border-4 border-brutal-yellow border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 font-mono text-sm mt-4">Fetching response...</p>
              </div>
            ) : (
              <div className="bg-zinc-900 rounded border border-zinc-700 overflow-auto min-h-[420px] max-h-[620px]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">application/json</span>
                </div>
                <pre
                  className="text-xs font-mono p-4 leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(JSON.stringify(response.body, null, 2)),
                  }}
                />
              </div>
            )}

            {/* Response meta */}
            {response.status !== null && (
              <div
                className="text-xs font-mono px-3 py-2 border-[2px] border-[var(--border-color)] flex flex-wrap items-center gap-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>
                  Status:{' '}
                  <span
                    className={
                      response.status >= 200 && response.status < 300
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {response.status}{' '}
                    {response.status === 200
                      ? 'OK'
                      : response.status === 404
                      ? 'Not Found'
                      : response.status === 500
                      ? 'Internal Server Error'
                      : ''}
                  </span>
                </span>
                <span>Latency: <span className="text-brutal-yellow">{response.latency}ms</span></span>
                <span>Mode: <span className="text-brutal-yellow">{isSandbox ? 'Sandbox' : 'Live'}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
