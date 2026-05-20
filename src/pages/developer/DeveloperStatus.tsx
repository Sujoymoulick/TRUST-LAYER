import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Clock, Activity, Zap, Shield, Globe, RefreshCw, Server } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  uptime: number;
  latency: number;
  status: 'operational' | 'degraded' | 'outage';
}

interface Incident {
  date: string;
  title: string;
  status: 'resolved' | 'monitoring' | 'investigating';
  description: string;
}

const SERVICES: Service[] = [
  { id: 'gateway',   name: 'API Gateway',    description: 'Primary REST API endpoint',     icon: Globe,    uptime: 99.98, latency: 42,  status: 'operational' },
  { id: 'auth',      name: 'OAuth Service',  description: 'Authentication & token exchange', icon: Shield,   uptime: 99.99, latency: 68,  status: 'operational' },
  { id: 'trust',     name: 'Trust Engine',   description: 'Score computation & updates',   icon: Activity, uptime: 99.95, latency: 115, status: 'operational' },
  { id: 'fraud',     name: 'Fraud Engine',   description: 'Anomaly detection & reports',   icon: Zap,      uptime: 99.91, latency: 89,  status: 'operational' },
  { id: 'webhooks',  name: 'Webhook System', description: 'Event delivery infrastructure', icon: Server,   uptime: 99.87, latency: 55,  status: 'operational' },
];

const INCIDENTS: Incident[] = [
  {
    date: '2026-05-18',
    title: 'Elevated API Latency',
    status: 'resolved',
    description: 'Some requests to /users/:id/score experienced increased latency (120-300ms) for ~18 minutes. Root cause: database connection pool exhaustion. Resolved by scaling connection limits.',
  },
  {
    date: '2026-05-10',
    title: 'Webhook Delivery Delays',
    status: 'resolved',
    description: 'Webhook events experienced delivery delays of 5-15 minutes due to a queue backlog. No events were lost. Queue processing restored after auto-scaling triggered.',
  },
  {
    date: '2026-04-29',
    title: 'OAuth Token Exchange — Planned Maintenance',
    status: 'resolved',
    description: 'Scheduled 12-minute maintenance window for OAuth service upgrades. All token exchanges were temporarily unavailable. Completed ahead of schedule.',
  },
];

const STATUS_COLOR: Record<Service['status'], string> = {
  operational: 'bg-brutal-green text-black',
  degraded:    'bg-brutal-yellow text-black',
  outage:      'bg-brutal-pink text-white',
};

const STATUS_LABEL: Record<Service['status'], string> = {
  operational: '● Operational',
  degraded:    '◐ Degraded',
  outage:      '✕ Outage',
};

const INCIDENT_COLOR: Record<Incident['status'], string> = {
  resolved:      'bg-green-100 text-green-800 border-green-300',
  monitoring:    'bg-amber-100 text-amber-800 border-amber-300',
  investigating: 'bg-red-100 text-red-800 border-red-300',
};

export default function DeveloperStatus() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  // Pulse animation every 5s to indicate live monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setLastUpdated(new Date());
      setTimeout(() => setPulse(false), 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const allOperational = SERVICES.every(s => s.status === 'operational');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-brutal-yellow border-2 border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest mb-4 shadow-[2px_2px_0px_#000]">
          <Activity size={12} /> System Status
        </div>
        <h1 className="font-display text-4xl uppercase tracking-tight text-[var(--text-primary)] mb-2">
          API Status
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            Real-time health monitoring for all TrustLayer services.
          </p>
          <div className={`flex items-center gap-1.5 text-[10px] font-black text-[var(--text-secondary)] transition-opacity ${pulse ? 'opacity-50' : 'opacity-100'}`}>
            <RefreshCw size={10} className={pulse ? 'animate-spin' : ''} />
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Overall status banner */}
      <div className={`border-[3px] border-black p-5 mb-8 shadow-[6px_6px_0px_#000] flex items-center gap-4 ${allOperational ? 'bg-brutal-green' : 'bg-brutal-yellow'}`}>
        {allOperational
          ? <CheckCircle size={28} className="text-black flex-shrink-0" />
          : <AlertCircle size={28} className="text-black flex-shrink-0" />
        }
        <div>
          <div className="font-display text-xl uppercase text-black">
            {allOperational ? 'All Systems Operational' : 'Some Systems Degraded'}
          </div>
          <div className="text-xs font-bold text-black/70">
            {allOperational
              ? 'All TrustLayer services are running normally.'
              : 'We are investigating issues with some services.'}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-black ${pulse ? 'opacity-40' : 'opacity-100'} transition-opacity`} />
          <span className="text-[10px] font-black uppercase text-black">Live</span>
        </div>
      </div>

      {/* Services grid */}
      <div className="mb-10">
        <h2 className="font-display text-xl uppercase text-[var(--text-primary)] mb-5 border-b-[3px] border-[var(--border-color)] pb-2">
          Services
        </h2>
        <div className="flex flex-col gap-0 border-[3px] border-black shadow-[6px_6px_0px_#000] overflow-hidden">
          {SERVICES.map((svc, idx) => (
            <div
              key={svc.id}
              className={`flex items-center gap-4 px-5 py-4 ${idx < SERVICES.length - 1 ? 'border-b-[3px] border-black/20' : ''} bg-[var(--bg-primary)] hover:bg-brutal-yellow/5 transition-colors`}
            >
              <div className="w-10 h-10 bg-brutal-yellow border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#000]">
                <svc.icon size={16} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm uppercase text-[var(--text-primary)]">{svc.name}</div>
                <div className="text-[10px] font-bold text-[var(--text-secondary)]">{svc.description}</div>
              </div>
              {/* Uptime */}
              <div className="hidden sm:flex flex-col items-end mr-4">
                <div className="font-black text-xs text-[var(--text-primary)]">{svc.uptime}%</div>
                <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Uptime (30d)</div>
              </div>
              {/* Latency */}
              <div className="hidden md:flex flex-col items-end mr-4">
                <div className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1">
                  <Clock size={10} /> {svc.latency}ms
                </div>
                <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Avg Latency</div>
              </div>
              {/* Status badge */}
              <span className={`border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase whitespace-nowrap ${STATUS_COLOR[svc.status]}`}>
                {STATUS_LABEL[svc.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Uptime bar chart — last 30 days */}
      <div className="brutal-card mb-10">
        <h2 className="font-display text-lg uppercase text-[var(--text-primary)] mb-4">30-Day Uptime History</h2>
        <div className="flex gap-0.5 h-10 items-end">
          {Array.from({ length: 30 }, (_, i) => {
            // Simulate mostly green with occasional amber
            const rand = Math.random();
            const color = rand > 0.95 ? 'bg-brutal-yellow' : rand > 0.99 ? 'bg-brutal-pink' : 'bg-brutal-green';
            const height = rand > 0.95 ? '70%' : '100%';
            return (
              <div key={i} className="flex-1 relative group cursor-pointer">
                <div
                  className={`w-full ${color} border border-black/20 transition-opacity hover:opacity-70`}
                  style={{ height }}
                />
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-black px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  Day {30 - i}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold text-[var(--text-secondary)]">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
            <div className="w-3 h-3 bg-brutal-green border border-black/30" /> Operational
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
            <div className="w-3 h-3 bg-brutal-yellow border border-black/30" /> Degraded
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
            <div className="w-3 h-3 bg-brutal-pink border border-black/30" /> Outage
          </span>
        </div>
      </div>

      {/* Incident history */}
      <div>
        <h2 className="font-display text-xl uppercase text-[var(--text-primary)] mb-5 border-b-[3px] border-[var(--border-color)] pb-2">
          Incident History
        </h2>
        <div className="flex flex-col gap-4">
          {INCIDENTS.map((inc, idx) => (
            <div key={idx} className="brutal-card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-black text-sm uppercase text-[var(--text-primary)]">{inc.title}</span>
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] mt-0.5">{inc.date}</div>
                </div>
                <span className={`border-2 px-2.5 py-0.5 text-[10px] font-black uppercase ${INCIDENT_COLOR[inc.status]}`}>
                  {inc.status}
                </span>
              </div>
              <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed">
                {inc.description}
              </p>
            </div>
          ))}
        </div>

        {/* No incidents notice */}
        <div className="mt-6 text-center py-6 border-[3px] border-dashed border-[var(--border-color)]">
          <CheckCircle size={24} className="mx-auto mb-2 text-brutal-green" />
          <div className="font-black text-sm uppercase text-[var(--text-secondary)]">No Active Incidents</div>
          <div className="text-[10px] font-bold text-[var(--text-secondary)] mt-1">All systems running normally as of today.</div>
        </div>
      </div>
    </div>
  );
}
