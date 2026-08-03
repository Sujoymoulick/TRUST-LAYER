import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Webhook,
  AlertTriangle,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGuest } from '../../context/GuestContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://trust-layers-backend.onrender.com/api/v1';

// ─── Types ──────────────────────────────────────────────────────────────────

type WebhookEvent =
  | 'trust.score.updated'
  | 'fraud.detected'
  | 'identity.verified'
  | 'passport.updated';

interface WebhookRecord {
  id: string;
  appId: string;
  url: string;
  events: WebhookEvent[];
  status: 'active' | 'inactive';
  secretHint: string;
  createdAt: string;
}

interface AppRecord {
  id: string;
  name: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'trust.score.updated', label: 'trust.score.updated', description: 'User trust score changed' },
  { value: 'fraud.detected', label: 'fraud.detected', description: 'Fraud anomaly triggered' },
  { value: 'identity.verified', label: 'identity.verified', description: 'ID verification completed' },
  { value: 'passport.updated', label: 'passport.updated', description: 'Passport data updated' },
];

const EVENT_BADGE_CLASSES: Record<WebhookEvent, string> = {
  'trust.score.updated': 'bg-blue-100 text-blue-800',
  'fraud.detected': 'bg-red-100 text-red-800',
  'identity.verified': 'bg-green-100 text-green-800',
  'passport.updated': 'bg-purple-100 text-purple-800',
};

const MOCK_WEBHOOKS: WebhookRecord[] = [
  {
    id: 'mock-wh-1',
    appId: 'mock-app-1',
    url: 'https://api.example.com/webhooks/trustlayer',
    events: ['trust.score.updated', 'identity.verified'],
    status: 'active',
    secretHint: 'whsec_...ef89',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-wh-2',
    appId: 'mock-app-1',
    url: 'https://hooks.myservice.io/tl-events',
    events: ['fraud.detected', 'passport.updated'],
    status: 'inactive',
    secretHint: 'whsec_...cd34',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function truncateUrl(url: string, max = 40): string {
  return url.length > max ? url.slice(0, max) + '…' : url;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeveloperWebhooks() {
  const { isGuest } = useGuest();
  const navigate = useNavigate();

  // Auth / app state
  const [userId, setUserId] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [noApps, setNoApps] = useState(false);

  // Webhook list
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Add webhook modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState<WebhookEvent[]>([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Secret reveal modal
  const [revealSecret, setRevealSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<WebhookRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Load user + apps + webhooks ──────────────────────────────────────────

  useEffect(() => {
    if (isGuest) {
      setWebhooks(MOCK_WEBHOOKS);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setFetchError('');

      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setUserId(user.id);

        // 2. Fetch apps
        const appsRes = await fetch(`${API_BASE}/developer/apps?userId=${user.id}`);
        if (!appsRes.ok) throw new Error('Failed to fetch apps');
        const appsData: AppRecord[] = await appsRes.json();

        if (!appsData || appsData.length === 0) {
          setNoApps(true);
          setLoading(false);
          return;
        }

        const firstAppId = appsData[0].id;
        setAppId(firstAppId);

        // 3. Fetch webhooks
        await loadWebhooks(firstAppId, user.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setFetchError(message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuest]);

  async function loadWebhooks(aid: string, uid: string) {
    const res = await fetch(`${API_BASE}/developer/webhooks?appId=${aid}&userId=${uid}`);
    if (!res.ok) throw new Error('Failed to fetch webhooks');
    const data: WebhookRecord[] = await res.json();
    setWebhooks(data);
  }

  // ── Register webhook ─────────────────────────────────────────────────────

  function toggleEvent(event: WebhookEvent) {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formUrl.trim()) {
      setFormError('Endpoint URL is required.');
      return;
    }
    try {
      new URL(formUrl);
    } catch {
      setFormError('Please enter a valid URL (e.g. https://your-server.com/webhook).');
      return;
    }
    if (formEvents.length === 0) {
      setFormError('Select at least one event to subscribe to.');
      return;
    }
    if (!appId || !userId) {
      setFormError('No app found. Please create an app first.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/developer/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, url: formUrl.trim(), events: formEvents, userId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to register webhook');
      }

      const created = await res.json();

      // Show secret once
      if (created.secret) {
        setRevealSecret(created.secret);
      }

      // Refresh list
      await loadWebhooks(appId, userId);

      // Reset form
      setFormUrl('');
      setFormEvents([]);
      setShowAddModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete webhook ───────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget || !userId) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(
        `${API_BASE}/developer/webhooks/${deleteTarget.id}?userId=${userId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to delete webhook');
      }

      setWebhooks((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Copy secret ──────────────────────────────────────────────────────────

  async function handleCopySecret() {
    if (!revealSecret) return;
    try {
      await navigator.clipboard.writeText(revealSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 md:p-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-brutal-yellow border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
              <Webhook className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-display text-3xl uppercase tracking-tight">Webhooks</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm ml-13">
            Register HTTP endpoints to receive real-time event notifications from TrustLayer.
          </p>
        </div>

        {!isGuest && !noApps && (
          <button
            onClick={() => {
              setFormUrl('');
              setFormEvents([]);
              setFormError('');
              setShowAddModal(true);
            }}
            className="brutal-btn bg-brutal-yellow flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        )}
      </div>

      {/* ── Guest Banner ── */}
      {isGuest && (
        <div className="brutal-card bg-brutal-yellow mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-black mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-black text-sm">You're browsing as a guest</p>
            <p className="text-black/80 text-xs mt-0.5">
              Sign in to register and manage real webhook endpoints.{' '}
              <button
                onClick={() => navigate('/login')}
                className="underline font-semibold hover:no-underline"
              >
                Sign in now
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-[3px] border-black border-t-brutal-yellow rounded-full animate-spin" />
        </div>
      )}

      {/* ── Fetch Error ── */}
      {!loading && fetchError && (
        <div className="brutal-card bg-red-50 border-red-500 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-red-700 text-sm">Failed to load webhooks</p>
            <p className="text-red-600 text-xs mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

      {/* ── No Apps State ── */}
      {!loading && noApps && (
        <div className="brutal-card text-center py-16">
          <div className="w-16 h-16 bg-brutal-yellow border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mx-auto mb-4">
            <Webhook className="w-8 h-8 text-black" />
          </div>
          <h2 className="font-display text-xl uppercase mb-2">No Apps Found</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
            You need to create an app before you can register webhook endpoints.
          </p>
          <button
            onClick={() => navigate('/developer')}
            className="brutal-btn bg-brutal-blue text-white flex items-center gap-2 mx-auto"
          >
            <ExternalLink className="w-4 h-4" />
            Go to Developer Portal
          </button>
        </div>
      )}

      {/* ── Webhooks Table ── */}
      {!loading && !fetchError && !noApps && (
        <>
          {webhooks.length === 0 ? (
            <div className="brutal-card text-center py-16">
              <div className="w-16 h-16 bg-brutal-yellow border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mx-auto mb-4">
                <Webhook className="w-8 h-8 text-black" />
              </div>
              <h2 className="font-display text-xl uppercase mb-2">No Webhooks Yet</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
                Register an endpoint to start receiving real-time event notifications.
              </p>
              {!isGuest && (
                <button
                  onClick={() => {
                    setFormUrl('');
                    setFormEvents([]);
                    setFormError('');
                    setShowAddModal(true);
                  }}
                  className="brutal-btn bg-brutal-yellow flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Webhook
                </button>
              )}
            </div>
          ) : (
            <div className="brutal-card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-[3px] border-black bg-[var(--bg-primary)]">
                    <th className="text-left px-4 py-3 font-display uppercase tracking-tight text-xs">URL</th>
                    <th className="text-left px-4 py-3 font-display uppercase tracking-tight text-xs">Events</th>
                    <th className="text-left px-4 py-3 font-display uppercase tracking-tight text-xs">Status</th>
                    <th className="text-left px-4 py-3 font-display uppercase tracking-tight text-xs">Secret Hint</th>
                    <th className="text-left px-4 py-3 font-display uppercase tracking-tight text-xs">Created</th>
                    <th className="text-left px-4 py-3 font-display uppercase tracking-tight text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((wh, idx) => (
                    <tr
                      key={wh.id}
                      className={`border-b border-[var(--border-color)] ${
                        idx % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-black/[0.02] dark:bg-white/[0.02]'
                      } hover:bg-brutal-yellow/10 transition-colors`}
                    >
                      {/* URL */}
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs text-[var(--text-primary)] break-all"
                          title={wh.url}
                        >
                          {truncateUrl(wh.url)}
                        </span>
                      </td>

                      {/* Events */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {wh.events.map((ev) => (
                            <span
                              key={ev}
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${EVENT_BADGE_CLASSES[ev]}`}
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {wh.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brutal-green text-black text-xs font-bold border border-black rounded-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-200 text-zinc-600 text-xs font-bold rounded-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Secret Hint */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                          <span className="font-mono text-xs text-[var(--text-secondary)]">
                            {wh.secretHint}
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        {formatDate(wh.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isGuest ? (
                          <span className="text-xs text-[var(--text-secondary)] italic">Read-only</span>
                        ) : (
                          <button
                            onClick={() => {
                              setDeleteError('');
                              setDeleteTarget(wh);
                            }}
                            className="brutal-btn bg-red-500 text-white text-xs px-3 py-1.5 flex items-center gap-1"
                            title="Delete webhook"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          Add Webhook Modal
      ════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="bg-[var(--bg-primary)] border-[3px] border-black shadow-[8px_8px_0px_#000] p-6 max-w-lg w-full relative">
            {/* Close */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-8 h-8 border-[2px] border-black flex items-center justify-center hover:bg-brutal-yellow transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
                <Webhook className="w-4 h-4 text-black" />
              </div>
              <h2 className="font-display text-xl uppercase tracking-tight">Register Endpoint</h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-[var(--text-primary)]">
                  Endpoint URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full border-[2px] border-black bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-brutal-yellow transition-colors placeholder:text-[var(--text-secondary)]"
                />
              </div>

              {/* Events */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-[var(--text-primary)]">
                  Events to Subscribe <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {ALL_EVENTS.map(({ value, label, description }) => (
                    <label
                      key={value}
                      className={`flex items-start gap-3 p-3 border-[2px] cursor-pointer transition-colors ${
                        formEvents.includes(value)
                          ? 'border-black bg-brutal-yellow/20'
                          : 'border-[var(--border-color)] hover:border-black hover:bg-black/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formEvents.includes(value)}
                        onChange={() => toggleEvent(value)}
                        className="mt-0.5 accent-black w-4 h-4 shrink-0"
                      />
                      <div>
                        <span
                          className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${EVENT_BADGE_CLASSES[value]}`}
                        >
                          {label}
                        </span>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Error */}
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border-[2px] border-red-500">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-red-700 text-xs">{formError}</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="brutal-btn bg-brutal-yellow flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-[2px] border-black border-t-transparent rounded-full animate-spin" />
                      Registering…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Register Endpoint
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="brutal-btn bg-[var(--bg-primary)] border-[2px] border-black"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          Secret Reveal Modal
      ════════════════════════════════════════════════════════════════════ */}
      {revealSecret && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-primary)] border-[3px] border-black shadow-[8px_8px_0px_#000] p-6 max-w-lg w-full">
            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brutal-yellow border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <h2 className="font-display text-xl uppercase tracking-tight">Webhook Secret</h2>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-red-50 border-[2px] border-red-500 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-red-700 text-sm font-bold">
                Save your signing secret now — it will NOT be shown again.
              </p>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Use this secret to verify the{' '}
              <code className="bg-black/10 px-1 rounded">TrustLayer-Signature</code> header on
              incoming webhook requests.
            </p>

            {/* Secret block */}
            <div className="relative bg-black border-[2px] border-black p-4 mb-4 overflow-x-auto">
              <code className="text-brutal-green font-mono text-sm break-all">{revealSecret}</code>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopySecret}
                className="brutal-btn bg-brutal-green flex items-center gap-2 text-black"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Secret
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRevealSecret(null);
                  setCopied(false);
                }}
                className="brutal-btn bg-[var(--bg-primary)] border-[2px] border-black flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          Delete Confirmation Modal
      ════════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div className="bg-[var(--bg-primary)] border-[3px] border-black shadow-[8px_8px_0px_#000] p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 border-[3px] border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-xl uppercase tracking-tight">Delete Webhook</h2>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Are you sure you want to delete this webhook endpoint?
            </p>
            <div className="bg-black/5 border-[2px] border-[var(--border-color)] p-3 mb-4 rounded-sm">
              <p className="font-mono text-xs text-[var(--text-primary)] break-all">{deleteTarget.url}</p>
            </div>
            <p className="text-xs text-red-600 mb-4">
              This action cannot be undone. All event subscriptions for this endpoint will be removed.
            </p>

            {deleteError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border-[2px] border-red-500 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-red-700 text-xs">{deleteError}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="brutal-btn bg-red-500 text-white flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-[2px] border-white border-t-transparent rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (!deleting) {
                    setDeleteTarget(null);
                    setDeleteError('');
                  }
                }}
                disabled={deleting}
                className="brutal-btn bg-[var(--bg-primary)] border-[2px] border-black disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
