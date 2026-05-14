import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, RefreshCw, Edit3, Save, X,
  ExternalLink, Shield, Globe, BookOpen,
  MapPin, Fingerprint, Users, Database,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useGuest } from '../context/GuestContext';
import { useProfileAvatar } from '../hooks/useProfileAvatar';

/* ─── Provider metadata ──────────────────────────────────────────── */
const PROVIDER_META: Record<string, { emoji: string; label: string }> = {
  github:        { emoji: '🐙', label: 'GitHub'     },
  linkedin_oidc: { emoji: '🔗', label: 'LinkedIn'   },
  google:        { emoji: '🔍', label: 'Google'     },
  twitter:       { emoji: '🐦', label: 'Twitter'    },
  facebook:      { emoji: 'Ⓕ',  label: 'Facebook'   },
  digilocker:    { emoji: '🇮🇳', label: 'DigiLocker' },
  email:         { emoji: '📧', label: 'Email'      },
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmt(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function mask(s: string) {
  if (s.length <= 4) return s;
  return s.slice(0, 2) + '•'.repeat(Math.max(s.length - 4, 3)) + s.slice(-2);
}
function scoreLabel(n: number) {
  if (n >= 800) return { text: 'ELITE',    bg: 'bg-brutal-green', txt: 'text-black' };
  if (n >= 500) return { text: 'VERIFIED', bg: 'bg-brutal-yellow', txt: 'text-black' };
  return           { text: 'LOW',      bg: 'bg-brutal-pink',   txt: 'text-white' };
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function Cell({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">{label}</div>
      <div className={`text-sm font-bold break-words leading-tight text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="border-b-4 border-black last:border-b-0">
      <div className="flex items-center gap-2 px-6 py-2 bg-gray-100 border-b-2 border-black">
        {Icon && <Icon size={13} className="text-gray-600" />}
        <span className="font-display text-[10px] uppercase tracking-widest text-gray-700">{title}</span>
      </div>
      <div className="px-6 py-5 bg-white">{children}</div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function Passport() {
  const { isGuest } = useGuest();
  const navigate    = useNavigate();

  const [passport,   setPassport  ] = useState<any>(null);
  const [loading,    setLoading   ] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError     ] = useState<string | null>(null);

  // Real-time avatar from Supabase Storage
  const userId = passport?.dataSources?.supabaseUserId ?? null;
  const { url: liveAvatarUrl } = useProfileAvatar(userId);

  const [editing,   setEditing  ] = useState(false);
  const [editName,  setEditName ] = useState('');
  const [editDob,   setEditDob  ] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving,    setSaving   ] = useState(false);
  const [saveMsg,   setSaveMsg  ] = useState('');

  /* ── data loader ── */
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const d = await apiFetch('/passport');
      setPassport(d);
      setEditName(d.profile?.name  || '');
      setEditDob(d.identity?.dob   || '');
      setEditPhone(d.profile?.phone || '');
    } catch (e: any) {
      setError(e.message || 'Failed to load passport');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    load();
  }, [isGuest, load]);

  /* ── save handler ── */
  const save = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await apiFetch('/passport/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: editName, date_of_birth: editDob, phone: editPhone }),
      });
      setSaveMsg('✓ Profile saved');
      setEditing(false);
      load(true);
    } catch (e: any) {
      setSaveMsg(`✗ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  /* ── edge states ── */
  if (isGuest) return (
    <div className="max-w-md mx-auto pt-20 text-center space-y-6">
      <div className="text-7xl">🛂</div>
      <h2 className="font-display text-4xl uppercase">Trust Passport</h2>
      <p className="text-sm font-bold uppercase text-gray-500">
        Sign in to access your verified identity passport.
      </p>
      <button onClick={() => navigate('/login')}
        className="brutal-btn bg-brutal-yellow px-10 py-4 text-base font-black uppercase">
        Sign In →
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-5">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-black bg-brutal-yellow flex items-center justify-center text-4xl">🛂</div>
        <Loader2 className="absolute -top-2 -right-2 animate-spin size-6 text-black" />
      </div>
      <p className="font-display text-xs uppercase tracking-[0.3em] animate-pulse">Assembling Your Passport…</p>
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto pt-16 space-y-4 text-center">
      <div className="brutal-card border-4 border-black bg-brutal-pink p-10 shadow-[8px_8px_0_#000]">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="font-black uppercase text-sm mb-6">{error}</p>
        <button onClick={() => load()} className="brutal-btn bg-white px-8 py-3 font-black uppercase text-sm">Retry</button>
      </div>
    </div>
  );

  const isVerified = !!passport?.kyc?.verified;
  const score      = passport?.trustNetwork?.score ?? 450;
  const sl         = scoreLabel(score);
  const apps       = passport?.connectedApps ?? [];

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">

      {/* ── Top toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-3xl uppercase flex items-center gap-3">
          <BookOpen size={30} /> Trust Passport
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {saveMsg && (
            <span className={`px-3 py-1 border-2 border-black font-black text-[10px] uppercase ${saveMsg.startsWith('✓') ? 'bg-brutal-green' : 'bg-brutal-pink'}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={() => load(true)} disabled={refreshing}
            className="brutal-btn bg-white size-10 p-0 flex items-center justify-center min-h-0"
            title="Refresh passport data"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="brutal-btn bg-brutal-yellow px-5 py-2 text-xs font-black uppercase flex items-center gap-2">
              <Edit3 size={13} /> Edit Profile
            </button>
          ) : (
            <>
              <button onClick={save} disabled={saving}
                className="brutal-btn bg-brutal-green px-5 py-2 text-xs font-black uppercase flex items-center gap-2">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
              </button>
              <button onClick={() => { setEditing(false); setSaveMsg(''); }}
                className="brutal-btn bg-white size-10 p-0 flex items-center justify-center min-h-0">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── PASSPORT DOCUMENT ───────────────────────────────────── */}
      <div className="border-[5px] border-black shadow-[16px_16px_0_#000] overflow-hidden bg-white">

        {/* ── 1 · HEADER STRIPE ── */}
        <div className="bg-black text-brutal-yellow px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield size={22} className="text-brutal-yellow" />
            <span className="font-display text-base uppercase tracking-[0.2em]">🛂 Pramaaan Trust Passport</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white/40">{passport?.passportId}</span>
            <span className={`px-3 py-1.5 border-2 font-black text-[10px] uppercase tracking-wider ${
              isVerified ? 'bg-brutal-green border-brutal-green text-black' : 'bg-brutal-pink border-brutal-pink text-white'
            }`}>
              {isVerified ? '✅ VERIFIED' : '⚠ UNVERIFIED'}
            </span>
          </div>
        </div>

        {/* ── 2 · IDENTITY HEADER ROW ── */}
        <div className="flex border-b-4 border-black">
          {/* Avatar */}
          <div className="w-40 flex-shrink-0 border-r-4 border-black bg-gray-50 flex items-center justify-center p-5">
            <div className="relative">
              <img
                src={liveAvatarUrl || passport?.profile?.avatar || `https://api.dicebear.com/9.x/personas/svg?seed=${passport?.profile?.email}`}
                alt="Passport Photo"
                className="w-28 h-28 border-4 border-black object-cover"
              />
              {isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-brutal-green border-2 border-black w-8 h-8 flex items-center justify-center text-base">✓</div>
              )}
            </div>
          </div>

          {/* Name + identifiers */}
          <div className="flex-1 p-6 space-y-5">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block font-black text-[10px] uppercase text-gray-400 mb-1">Full Name</label>
                  <input className="brutal-input w-full text-xl font-black uppercase" value={editName}
                    onChange={e => setEditName(e.target.value)} placeholder="Your legal name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black text-[10px] uppercase text-gray-400 mb-1">Date of Birth</label>
                    <input type="date" className="brutal-input w-full" value={editDob}
                      onChange={e => setEditDob(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-black text-[10px] uppercase text-gray-400 mb-1">Phone</label>
                    <input className="brutal-input w-full" value={editPhone}
                      onChange={e => setEditPhone(e.target.value)} placeholder="+91 00000 00000" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Full Name</div>
                  <div className="font-display text-3xl uppercase leading-tight mt-0.5">
                    {passport?.profile?.name || passport?.identity?.firstName
                      ? `${passport?.identity?.firstName || ''} ${passport?.identity?.lastName || ''}`.trim() || passport?.profile?.name
                      : '— Not Set —'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Cell label="Passport ID" value={passport?.passportId} mono />
                  <Cell label="Issued" value={fmt(passport?.issuedAt)} />
                  <Cell label="Valid Until" value={fmt(passport?.expiresAt)} />
                </div>
              </>
            )}
          </div>

          {/* Trust score */}
          <div className={`w-32 flex-shrink-0 border-l-4 border-black flex flex-col items-center justify-center p-4 text-center gap-2 ${sl.bg}`}>
            <div className={`text-[9px] font-black uppercase tracking-widest ${sl.txt} opacity-60`}>Trust Score</div>
            <div className={`font-display text-5xl leading-none font-black ${sl.txt}`}>{score}</div>
            <div className={`text-[8px] font-black uppercase ${sl.txt} opacity-50`}>/ 1000</div>
            <div className={`border-2 border-black px-2 py-0.5 font-black text-[9px] uppercase ${sl.txt}`}>{sl.text}</div>
          </div>
        </div>

        {/* ── 3 · PERSONAL + ADDRESS + DOCUMENT ── */}
        <div className="grid grid-cols-3 border-b-4 border-black divide-x-4 divide-black">
          {/* Personal Details */}
          <div className="p-5 space-y-4 bg-white">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 border-b-2 border-black pb-2">
              Personal Details
            </div>
            <Cell label="Date of Birth"  value={passport?.identity?.dob ? fmt(passport.identity.dob) : null} />
            <Cell label="Nationality"    value={passport?.identity?.nationality} />
            <Cell label="Gender"         value={passport?.identity?.gender} />
            <Cell label="Place of Birth" value={passport?.identity?.placeOfBirth} />
            <Cell label="Phone"          value={passport?.profile?.phone} />
            <Cell label="Email"          value={passport?.profile?.email} mono />
          </div>

          {/* Address */}
          <div className="p-5 space-y-4 bg-white">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 border-b-2 border-black pb-2 flex items-center gap-2">
              <MapPin size={11} /> Address
            </div>
            {passport?.address?.formattedAddress ? (
              <>
                <Cell label="Street"   value={passport.address.street} />
                <Cell label="City"     value={passport.address.town} />
                <Cell label="State"    value={passport.address.state} />
                <Cell label="Postcode" value={passport.address.postCode} />
                <Cell label="Country"  value={passport.address.country} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <Globe size={32} className="text-gray-300" />
                <p className="text-[10px] font-black uppercase text-gray-500">
                  Address available after<br />full document verification
                </p>
              </div>
            )}
          </div>

          {/* Document */}
          <div className="p-5 space-y-4 bg-white">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 border-b-2 border-black pb-2 flex items-center gap-2">
              <Fingerprint size={11} /> KYC Document
            </div>
            <Cell label="Doc Type"   value={passport?.document?.type} />
            <Cell label="Doc Number" value={passport?.document?.number ? mask(passport.document.number) : null} mono />
            <Cell label="Issued By"  value={passport?.document?.issuedCountry} />
            <Cell label="Expires"    value={passport?.document?.validUntil ? fmt(passport.document.validUntil) : null} />
            <div className="pt-3 border-t-2 border-dashed border-gray-300 space-y-3">
              <Cell label="KYC Status"  value={passport?.kyc?.status?.replace('_', ' ').toUpperCase()} />
              <Cell label="Verified On" value={fmt(passport?.kyc?.verifiedAt)} />
            </div>
          </div>
        </div>

        {/* ── 4 · CONNECTED APPS ── */}
        <Section title={`Connected Apps & Identities — ${apps.length} linked`} icon={Database}>
          {apps.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {apps.map((app: any, i: number) => {
                const m = PROVIDER_META[app.provider] ?? { emoji: '🔒', label: app.provider };
                return (
                  <div key={i}
                    className="border-2 border-black p-3 bg-white shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-default">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl leading-none">{m.emoji}</span>
                      <span className="bg-brutal-green border border-black text-[8px] font-black uppercase px-1.5 py-0.5">✓ Linked</span>
                    </div>
                    <div className="font-black text-xs uppercase mb-0.5">{m.label}</div>
                    {app.accountId && (
                      <div className="font-mono text-[9px] text-gray-400 truncate">{app.accountId}</div>
                    )}
                    <div className="text-[8px] text-gray-400 mt-1">{fmt(app.linkedAt)}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 border ${
                        app.source === 'supabase'
                          ? 'border-blue-200 text-blue-600 bg-blue-50'
                          : 'border-purple-200 text-purple-600 bg-purple-50'
                      }`}>
                        {app.source === 'supabase' ? 'OAuth' : 'Neo4j'}
                      </span>
                      {app.profileUrl && (
                        <a href={app.profileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-gray-300 hover:text-black transition-colors">
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              <p className="font-black uppercase text-sm mb-3">No apps linked</p>
              <button onClick={() => navigate('/identity')}
                className="brutal-btn bg-brutal-yellow text-black px-6 py-2 text-xs font-black uppercase">
                Go to Identity →
              </button>
            </div>
          )}
        </Section>

        {/* ── 5 · TRUST NETWORK ── */}
        <Section title="Trust Network Score — powered by Neo4j" icon={Users}>
          <div className="space-y-6">
            {/* Score gauge */}
            <div className="flex items-end gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-5xl">{score}</span>
                  <span className="text-[10px] font-black uppercase text-gray-400">/ 1000</span>
                </div>
                <div className="h-5 border-2 border-black bg-gray-100 shadow-[4px_4px_0_#000] overflow-hidden">
                  <div
                    className={`h-full border-r-2 border-black transition-all duration-1000 ${sl.bg}`}
                    style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase text-gray-400">
                  <span>0</span><span>250</span><span>500</span><span>750</span><span>1000</span>
                </div>
              </div>
              <div className={`px-5 py-3 border-4 border-black shadow-[4px_4px_0_#000] ${sl.bg}`}>
                <div className={`font-display text-xl uppercase ${sl.txt}`}>{sl.text}</div>
                <div className={`text-[9px] font-black uppercase ${sl.txt} opacity-60`}>Trust Tier</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Connected Apps', val: apps.length },
                { label: 'Trusting', val: passport?.trustNetwork?.trusting?.filter((t: any) => t?.id).length ?? 0 },
                { label: 'Trusted By', val: passport?.trustNetwork?.trustedBy?.filter((t: any) => t?.id).length ?? 0 },
              ].map(({ label, val }) => (
                <div key={label} className="border-2 border-black p-4 text-center shadow-[4px_4px_0_#000]">
                  <div className="font-display text-3xl">{val}</div>
                  <div className="font-black text-[9px] uppercase text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 6 · DATA ANCHORS ── */}
        <div className="bg-black text-white px-6 py-5">
          <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">
            Data Anchors — Verified Sources
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              {
                label: 'Supabase Record',
                sub: `id:${(passport?.dataSources?.supabaseUserId || '').slice(0, 18)}…`,
                color: 'bg-[#3ECF8E]',
                txt: 'text-black',
              },
              {
                label: 'Sumsub KYC',
                sub: passport?.dataSources?.sumsubApplicantId || 'Applicant ID pending',
                color: 'bg-brutal-yellow',
                txt: 'text-black',
              },
              {
                label: 'Neo4j Graph',
                sub: `node:${(passport?.dataSources?.neo4jNodeId || '').slice(0, 18)}…`,
                color: 'bg-[#4581C3]',
                txt: 'text-white',
              },
            ].map(({ label, sub, color, txt }) => (
              <div key={label} className={`${color} border-2 border-white/10 px-5 py-3 min-w-[180px]`}>
                <div className={`font-black text-[10px] uppercase tracking-wider ${txt}`}>{label}</div>
                <div className={`font-mono text-[8px] mt-0.5 max-w-[200px] truncate ${txt} opacity-60`}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
