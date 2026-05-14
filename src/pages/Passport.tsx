import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Edit3, Save, X, ExternalLink, Shield, Globe, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import { useGuest } from '../context/GuestContext';

const PROVIDER_META: Record<string, { icon: string; label: string; color: string }> = {
  github:        { icon: '🐙', label: 'GitHub',   color: '#1a1a1a' },
  linkedin_oidc: { icon: '🔗', label: 'LinkedIn', color: '#0077B5' },
  google:        { icon: '🔍', label: 'Google',   color: '#4285F4' },
  twitter:       { icon: '🐦', label: 'Twitter',  color: '#1DA1F2' },
  facebook:      { icon: 'f',  label: 'Facebook', color: '#1877F2' },
  digilocker:    { icon: '🇮🇳', label: 'DigiLocker', color: '#FF6B35' },
  email:         { icon: '📧', label: 'Email',    color: '#10B981' },
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Passport() {
  const { isGuest } = useGuest();
  const navigate = useNavigate();
  const [passport, setPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadPassport = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/passport');
      setPassport(data);
      setEditName(data.profile?.name || '');
      setEditDob(data.identity?.dob || '');
      setEditPhone(data.profile?.phone || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load passport');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    loadPassport();
  }, [isGuest, loadPassport]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await apiFetch('/passport/profile', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: editName, date_of_birth: editDob, phone: editPhone }),
      });
      setSaveMsg('✓ Saved successfully');
      setEditing(false);
      await loadPassport(true);
    } catch (err: any) {
      setSaveMsg(`✗ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ─── Guest / Loading / Error states ────────────────────────────────────
  if (isGuest) return (
    <div className="max-w-xl mx-auto pt-16 text-center space-y-6">
      <div className="text-6xl">🛂</div>
      <h2 className="font-display text-3xl uppercase">Trust Passport</h2>
      <p className="font-bold text-gray-500 uppercase text-sm">Sign in to view your verified identity passport.</p>
      <button onClick={() => navigate('/login')} className="brutal-btn bg-brutal-yellow px-8 py-3 font-black uppercase">
        Sign In →
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px] flex-col gap-4">
      <Loader2 className="animate-spin size-12 text-brutal-blue" />
      <p className="font-display text-xs uppercase tracking-widest animate-pulse">Building Your Passport...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto pt-12 text-center space-y-4">
      <div className="brutal-card bg-brutal-pink p-8">
        <p className="font-black uppercase text-sm">⚠ {error}</p>
        <button onClick={() => loadPassport()} className="brutal-btn bg-white mt-4 px-6 py-2 text-sm font-black uppercase">Retry</button>
      </div>
    </div>
  );

  const isVerified = passport?.kyc?.verified;
  const score = passport?.trustNetwork?.score || 450;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl uppercase flex items-center gap-3">
          <BookOpen className="size-8" /> Trust Passport
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPassport(true)}
            disabled={refreshing}
            className="brutal-btn bg-white size-10 flex items-center justify-center p-0 min-h-0"
            title="Refresh passport data"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="brutal-btn bg-brutal-yellow px-5 py-2 text-xs font-black uppercase flex items-center gap-2"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSaveProfile} disabled={saving} className="brutal-btn bg-brutal-green px-5 py-2 text-xs font-black uppercase flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
              <button onClick={() => { setEditing(false); setSaveMsg(''); }} className="brutal-btn bg-white size-10 p-0 flex items-center justify-center min-h-0">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {saveMsg && (
        <div className={`px-4 py-2 border-2 border-black font-black uppercase text-xs ${saveMsg.startsWith('✓') ? 'bg-brutal-green' : 'bg-brutal-pink'}`}>
          {saveMsg}
        </div>
      )}

      {/* ── PASSPORT CARD ── */}
      <div className="border-4 border-black shadow-[12px_12px_0px_#000] overflow-hidden">

        {/* Header stripe */}
        <div className="bg-black text-brutal-yellow px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-brutal-yellow" />
            <span className="font-display text-sm uppercase tracking-widest">Pramaaan Trust Passport</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs opacity-60">{passport?.passportId}</span>
            {isVerified ? (
              <span className="bg-brutal-green text-black px-3 py-1 border-2 border-brutal-green font-black text-[10px] uppercase">✓ Verified</span>
            ) : (
              <span className="bg-brutal-pink text-white px-3 py-1 border-2 border-brutal-pink font-black text-[10px] uppercase">Unverified</span>
            )}
          </div>
        </div>

        {/* Main passport body */}
        <div className="bg-white p-0">

          {/* Identity header row */}
          <div className="flex gap-0 border-b-4 border-black">
            {/* Avatar */}
            <div className="w-36 flex-shrink-0 border-r-4 border-black p-4 flex items-center justify-center bg-gray-50">
              <img
                src={passport?.profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${passport?.profile?.email}`}
                alt="Avatar"
                className="w-24 h-24 border-4 border-black object-cover"
              />
            </div>

            {/* Name + dates */}
            <div className="flex-1 p-5 space-y-4">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-black text-[10px] uppercase mb-1 text-gray-500">Full Name</label>
                    <input
                      className="brutal-input text-xl font-black uppercase w-full"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-[10px] uppercase mb-1 text-gray-500">Date of Birth</label>
                      <input
                        type="date"
                        className="brutal-input w-full"
                        value={editDob}
                        onChange={e => setEditDob(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-black text-[10px] uppercase mb-1 text-gray-500">Phone</label>
                      <input
                        className="brutal-input w-full"
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="font-black text-[10px] uppercase text-gray-400">Full Name</div>
                    <div className="font-display text-2xl uppercase">{passport?.profile?.name || '—'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="font-black text-[10px] uppercase text-gray-400">Passport ID</div>
                      <div className="font-mono text-xs font-bold">{passport?.passportId}</div>
                    </div>
                    <div>
                      <div className="font-black text-[10px] uppercase text-gray-400">Issued</div>
                      <div className="font-bold text-sm">{formatDate(passport?.issuedAt)}</div>
                    </div>
                    <div>
                      <div className="font-black text-[10px] uppercase text-gray-400">Valid Until</div>
                      <div className="font-bold text-sm">{formatDate(passport?.expiresAt)}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Trust score badge */}
            <div className="w-28 flex-shrink-0 border-l-4 border-black bg-brutal-yellow flex flex-col items-center justify-center p-4 text-center">
              <div className="font-black text-[9px] uppercase text-black/60 mb-1">Trust Score</div>
              <div className="font-display text-4xl font-black text-black leading-none">{score}</div>
              <div className="font-black text-[8px] uppercase text-black/50 mt-1">/ 1000</div>
              <div className={`mt-2 px-2 py-0.5 border-2 border-black font-black text-[8px] uppercase ${score >= 800 ? 'bg-brutal-green' : score >= 500 ? 'bg-white' : 'bg-brutal-pink'}`}>
                {score >= 800 ? 'Elite' : score >= 500 ? 'Good' : 'Low'}
              </div>
            </div>
          </div>

          {/* Personal + Address + Document row */}
          <div className="grid grid-cols-3 border-b-4 border-black">
            {/* Personal info */}
            <div className="border-r-4 border-black p-5 space-y-3">
              <h3 className="font-display text-xs uppercase text-gray-500 border-b-2 border-black pb-2 mb-3">Personal Details</h3>
              <Row label="Date of Birth" value={passport?.identity?.dob ? formatDate(passport.identity.dob) : '—'} />
              <Row label="Nationality"   value={passport?.identity?.nationality || '—'} />
              <Row label="Gender"        value={passport?.identity?.gender || '—'} />
              <Row label="Place of Birth" value={passport?.identity?.placeOfBirth || '—'} />
              <Row label="Phone"         value={passport?.profile?.phone || '—'} />
              <Row label="Email"         value={passport?.profile?.email} small />
            </div>

            {/* Address */}
            <div className="border-r-4 border-black p-5 space-y-3">
              <h3 className="font-display text-xs uppercase text-gray-500 border-b-2 border-black pb-2 mb-3">Address</h3>
              {passport?.address?.formattedAddress ? (
                <>
                  <Row label="Street"   value={passport.address.street   || '—'} />
                  <Row label="City"     value={passport.address.town     || '—'} />
                  <Row label="State"    value={passport.address.state    || '—'} />
                  <Row label="Postcode" value={passport.address.postCode || '—'} />
                  <Row label="Country"  value={passport.address.country  || '—'} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-center gap-2">
                  <Globe size={20} className="text-gray-300" />
                  <p className="text-[10px] font-black uppercase text-gray-400">Address data from KYC</p>
                  <p className="text-[9px] text-gray-300">Available after document verification</p>
                </div>
              )}
            </div>

            {/* Document */}
            <div className="p-5 space-y-3">
              <h3 className="font-display text-xs uppercase text-gray-500 border-b-2 border-black pb-2 mb-3">KYC Document</h3>
              <Row label="Doc Type"    value={passport?.document?.type    || '—'} />
              <Row label="Doc Number"  value={passport?.document?.number  ? maskDoc(passport.document.number) : '—'} />
              <Row label="Issued By"   value={passport?.document?.issuedCountry || '—'} />
              <Row label="Valid Until" value={passport?.document?.validUntil ? formatDate(passport.document.validUntil) : '—'} />
              <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                <Row label="KYC Status" value={passport?.kyc?.status?.toUpperCase().replace('_', ' ') || '—'} />
                <Row label="Verified On" value={formatDate(passport?.kyc?.verifiedAt)} />
              </div>
            </div>
          </div>

          {/* Connected Apps */}
          <div className="p-5 border-b-4 border-black">
            <h3 className="font-display text-xs uppercase text-gray-500 border-b-2 border-black pb-2 mb-4">
              Connected Apps & Identities
              <span className="ml-3 bg-black text-white px-2 py-0.5 text-[9px] font-black">{passport?.connectedApps?.length || 0} linked</span>
            </h3>
            {passport?.connectedApps?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {passport.connectedApps.map((app: any, i: number) => {
                  const meta = PROVIDER_META[app.provider] || { icon: '🔒', label: app.provider, color: '#666' };
                  return (
                    <div key={i} className="border-2 border-black p-3 shadow-[3px_3px_0px_#000] bg-white hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{meta.icon}</span>
                        <span className="bg-brutal-green border border-black text-[8px] font-black uppercase px-1.5 py-0.5">✓ Linked</span>
                      </div>
                      <div className="font-black text-xs uppercase">{meta.label}</div>
                      {app.accountId && (
                        <div className="font-mono text-[9px] text-gray-500 truncate mt-0.5">{app.accountId}</div>
                      )}
                      <div className="text-[8px] text-gray-400 mt-1">{formatDate(app.linkedAt)}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 border ${app.source === 'supabase' ? 'border-blue-300 text-blue-600 bg-blue-50' : 'border-purple-300 text-purple-600 bg-purple-50'}`}>
                          {app.source === 'supabase' ? 'OAuth' : 'Neo4j'}
                        </span>
                        {app.profileUrl && (
                          <a href={app.profileUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black">
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] font-black uppercase text-gray-400 text-center py-6">No apps linked yet — go to Identity page to connect.</p>
            )}
          </div>

          {/* Trust Network */}
          <div className="p-5 border-b-4 border-black">
            <h3 className="font-display text-xs uppercase text-gray-500 border-b-2 border-black pb-2 mb-4">Trust Network (Neo4j Graph)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-black p-4 text-center shadow-[3px_3px_0px_#000]">
                <div className="font-display text-3xl font-black">{score}</div>
                <div className="font-black text-[9px] uppercase text-gray-500 mt-1">Trust Score</div>
              </div>
              <div className="border-2 border-black p-4 text-center shadow-[3px_3px_0px_#000]">
                <div className="font-display text-3xl font-black">{passport?.trustNetwork?.trusting?.filter((t: any) => t?.id).length || 0}</div>
                <div className="font-black text-[9px] uppercase text-gray-500 mt-1">Trusting</div>
              </div>
              <div className="border-2 border-black p-4 text-center shadow-[3px_3px_0px_#000]">
                <div className="font-display text-3xl font-black">{passport?.trustNetwork?.trustedBy?.filter((t: any) => t?.id).length || 0}</div>
                <div className="font-black text-[9px] uppercase text-gray-500 mt-1">Trusted By</div>
              </div>
            </div>
            {/* Score bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                <span>Score Progress</span><span>{score} / 1000</span>
              </div>
              <div className="h-4 border-2 border-black bg-gray-100 shadow-[3px_3px_0px_#000]">
                <div className="h-full bg-brutal-yellow border-r-2 border-black transition-all duration-700" style={{ width: `${Math.min((score / 1000) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Data Anchors */}
          <div className="p-5 bg-black text-white">
            <div className="font-black text-[9px] uppercase text-white/40 mb-3">Data Anchors — Verified Sources</div>
            <div className="flex flex-wrap gap-3">
              <AnchorBadge label="Supabase Record" sublabel={passport?.dataSources?.supabaseUserId?.slice(0, 16) + '...'} color="bg-brutal-blue" />
              <AnchorBadge label="Sumsub KYC" sublabel={passport?.dataSources?.sumsubApplicantId || 'Not linked'} color="bg-brutal-yellow text-black" />
              <AnchorBadge label="Neo4j Graph" sublabel={`node:${passport?.dataSources?.neo4jNodeId?.slice(0, 16)}...`} color="bg-brutal-green text-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div className="font-black text-[9px] uppercase text-gray-400">{label}</div>
      <div className={`font-bold ${small ? 'text-[10px]' : 'text-sm'} break-all`}>{value || '—'}</div>
    </div>
  );
}

function AnchorBadge({ label, sublabel, color }: { label: string; sublabel: string; color: string }) {
  return (
    <div className={`${color} border-2 border-white/20 px-4 py-2`}>
      <div className="font-black text-[9px] uppercase">{label}</div>
      <div className="font-mono text-[8px] opacity-70 mt-0.5 max-w-[200px] truncate">{sublabel}</div>
    </div>
  );
}

function maskDoc(num: string) {
  if (num.length <= 4) return num;
  return num.slice(0, 2) + '*'.repeat(num.length - 4) + num.slice(-2);
}
