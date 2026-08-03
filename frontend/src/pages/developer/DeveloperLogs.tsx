import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Search,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGuest } from '../../context/GuestContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://trust-layers-backend.onrender.com/api/v1';

interface ApiLog {
  id: string;
  requestId: string;
  method: 'GET' | 'POST' | 'DELETE';
  endpoint: string;
  status: number;
  duration: number;
  environment: 'sandbox' | 'production';
  appName: string;
  errorMessage?: string;
  createdAt: string;
}

const now = new Date('2026-05-21T00:31:57+05:30');

function daysAgo(d: number, h = 0, m = 0): string {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - d);
  dt.setHours(dt.getHours() - h);
  dt.setMinutes(dt.getMinutes() - m);
  return dt.toISOString();
}

const MOCK_LOGS: ApiLog[] = [
  {
    id: '1',
    requestId: 'req_a1b2c3d4',
    method: 'GET',
    endpoint: '/users/usr_9Xk2mP/score',
    status: 200,
    duration: 120,
    environment: 'production',
    appName: 'TrustLayer Core',
    createdAt: daysAgo(0, 0, 2),
  },
  {
    id: '2',
    requestId: 'req_e5f6g7h8',
    method: 'POST',
    endpoint: '/secure/verify-id',
    status: 201,
    duration: 340,
    environment: 'sandbox',
    appName: 'ID Verify Demo',
    createdAt: daysAgo(0, 0, 15),
  },
  {
    id: '3',
    requestId: 'req_i9j0k1l2',
    method: 'POST',
    endpoint: '/developer/fraud',
    status: 400,
    duration: 85,
    environment: 'sandbox',
    appName: 'Fraud Guard',
    errorMessage: 'Invalid payload: missing required field "userId".',
    createdAt: daysAgo(0, 1, 5),
  },
  {
    id: '4',
    requestId: 'req_m3n4o5p6',
    method: 'GET',
    endpoint: '/passport/pass_7Yz3qW',
    status: 401,
    duration: 55,
    environment: 'production',
    appName: 'TrustLayer Core',
    errorMessage: 'Unauthorized: Invalid API key.',
    createdAt: daysAgo(0, 2, 30),
  },
  {
    id: '5',
    requestId: 'req_q7r8s9t0',
    method: 'GET',
    endpoint: '/users/usr_3Lp8nQ/score',
    status: 200,
    duration: 98,
    environment: 'sandbox',
    appName: 'Risk Analytics',
    createdAt: daysAgo(1, 0, 0),
  },
  {
    id: '6',
    requestId: 'req_u1v2w3x4',
    method: 'DELETE',
    endpoint: '/passport/pass_2Kc6mT',
    status: 200,
    duration: 45,
    environment: 'production',
    appName: 'TrustLayer Core',
    createdAt: daysAgo(1, 3, 10),
  },
  {
    id: '7',
    requestId: 'req_y5z6a7b8',
    method: 'POST',
    endpoint: '/secure/verify-id',
    status: 429,
    duration: 72,
    environment: 'production',
    appName: 'ID Verify Demo',
    errorMessage: 'Rate limit exceeded. Retry after 60 seconds.',
    createdAt: daysAgo(1, 5, 45),
  },
  {
    id: '8',
    requestId: 'req_c9d0e1f2',
    method: 'GET',
    endpoint: '/users/usr_5Wm9kR/score',
    status: 500,
    duration: 850,
    environment: 'sandbox',
    appName: 'Risk Analytics',
    errorMessage: 'Internal server error. Please try again later.',
    createdAt: daysAgo(2, 1, 20),
  },
  {
    id: '9',
    requestId: 'req_g3h4i5j6',
    method: 'POST',
    endpoint: '/developer/fraud',
    status: 201,
    duration: 210,
    environment: 'sandbox',
    appName: 'Fraud Guard',
    createdAt: daysAgo(2, 4, 0),
  },
  {
    id: '10',
    requestId: 'req_k7l8m9n0',
    method: 'GET',
    endpoint: '/passport/pass_8Jd4wX',
    status: 200,
    duration: 135,
    environment: 'production',
    appName: 'TrustLayer Core',
    createdAt: daysAgo(3, 0, 30),
  },
  {
    id: '11',
    requestId: 'req_o1p2q3r4',
    method: 'POST',
    endpoint: '/secure/verify-id',
    status: 400,
    duration: 67,
    environment: 'production',
    appName: 'ID Verify Demo',
    errorMessage: 'Bad request: document type not supported.',
    createdAt: daysAgo(3, 6, 15),
  },
  {
    id: '12',
    requestId: 'req_s5t6u7v8',
    method: 'DELETE',
    endpoint: '/users/usr_1Bn7oS',
    status: 200,
    duration: 53,
    environment: 'sandbox',
    appName: 'Admin Panel',
    createdAt: daysAgo(4, 2, 0),
  },
  {
    id: '13',
    requestId: 'req_w9x0y1z2',
    method: 'GET',
    endpoint: '/developer/fraud',
    status: 200,
    duration: 176,
    environment: 'production',
    appName: 'Fraud Guard',
    createdAt: daysAgo(5, 0, 45),
  },
  {
    id: '14',
    requestId: 'req_a3b4c5d6',
    method: 'POST',
    endpoint: '/passport/pass_4Qf9vZ',
    status: 500,
    duration: 620,
    environment: 'sandbox',
    appName: 'TrustLayer Core',
    errorMessage: 'Database connection timeout.',
    createdAt: daysAgo(6, 1, 30),
  },
  {
    id: '15',
    requestId: 'req_e7f8g9h0',
    method: 'GET',
    endpoint: '/users/usr_6Tp0lU/score',
    status: 201,
    duration: 88,
    environment: 'sandbox',
    appName: 'Risk Analytics',
    createdAt: daysAgo(7, 3, 0),
  },
];

const PAGE_SIZE = 25;

function timeAgo(isoString: string): string {
  const date = new Date(isoString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return 'bg-green-100 text-green-800 border border-green-300';
  }
  if (status >= 400 && status < 500) {
    return 'bg-amber-100 text-amber-800 border border-amber-300';
  }
  return 'bg-red-100 text-red-800 border border-red-300';
}

function getMethodColor(method: string): string {
  switch (method) {
    case 'GET':
      return 'bg-blue-600 text-white';
    case 'POST':
      return 'bg-green-600 text-white';
    case 'DELETE':
      return 'bg-red-600 text-white';
    default:
      return 'bg-zinc-600 text-white';
  }
}

function exportCSV(logs: ApiLog[]) {
  const headers = ['Request ID', 'Method', 'Endpoint', 'Status', 'App Name', 'Environment', 'Duration (ms)', 'Time'];
  const rows = logs.map((log) => [
    log.requestId,
    log.method,
    log.endpoint,
    log.status.toString(),
    log.appName,
    log.environment,
    log.duration.toString(),
    new Date(log.createdAt).toISOString(),
  ]);
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `api-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DeveloperLogs() {
  const { isGuest } = useGuest();

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [envFilter, setEnvFilter] = useState<'all' | 'sandbox' | 'production'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isGuest) throw new Error('Guest mode');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user session');

      const params = new URLSearchParams({
        userId: user.id,
        page: currentPage.toString(),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(envFilter !== 'all' ? { environment: envFilter } : {}),
      });

      const response = await fetch(`${API_BASE}/developer/logs?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      setLogs(data.logs ?? data);
    } catch {
      // Fall back to mock data
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply client-side filters
  const filteredLogs = logs.filter((log) => {
    if (envFilter !== 'all' && log.environment !== envFilter) return false;
    if (statusFilter === 'success' && !(log.status >= 200 && log.status < 300)) return false;
    if (statusFilter === 'error' && log.status < 400) return false;
    if (searchQuery && !log.endpoint.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Stats
  const totalRequests = filteredLogs.length;
  const successCount = filteredLogs.filter((l) => l.status >= 200 && l.status < 300).length;
  const errorCount = filteredLogs.filter((l) => l.status >= 400).length;
  const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : '0.0';
  const avgLatency =
    filteredLogs.length > 0
      ? Math.round(filteredLogs.reduce((sum, l) => sum + l.duration, 0) / filteredLogs.length)
      : 0;

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFilterChange = (type: 'env' | 'status', value: string) => {
    setCurrentPage(1);
    if (type === 'env') setEnvFilter(value as 'all' | 'sandbox' | 'production');
    if (type === 'status') setStatusFilter(value as 'all' | 'success' | 'error');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="w-7 h-7" style={{ color: 'var(--text-primary)' }} />
              <h1 className="font-display text-3xl uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
                API Logs
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Monitor all incoming API requests and responses in real time.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="brutal-btn bg-brutal-yellow flex items-center gap-2 px-4 py-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-display text-sm uppercase">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 border-[3px] border-black bg-red-100 text-red-800 rounded">
          <p className="font-semibold text-sm">{error} — Showing mock data.</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Requests */}
        <div className="brutal-card p-4">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            Total Requests
          </p>
          <p className="font-display text-3xl" style={{ color: 'var(--text-primary)' }}>
            {totalRequests}
          </p>
        </div>
        {/* Success Rate */}
        <div className="brutal-card p-4">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            Success Rate
          </p>
          <p className="font-display text-3xl text-green-600">{successRate}%</p>
        </div>
        {/* Avg Latency */}
        <div className="brutal-card p-4">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            Avg Latency
          </p>
          <p className="font-display text-3xl" style={{ color: 'var(--text-primary)' }}>
            {avgLatency}
            <span className="text-base font-sans font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>
              ms
            </span>
          </p>
        </div>
        {/* Error Count */}
        <div className="brutal-card p-4">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            Error Count
          </p>
          <p className="font-display text-3xl text-red-600">{errorCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="brutal-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Environment Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Env:
            </span>
            <div className="flex border border-slate-200 dark:border-zinc-800 overflow-hidden rounded-sm shadow-sm">
              {(['all', 'sandbox', 'production'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => handleFilterChange('env', val)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border-r border-slate-200 dark:border-zinc-800 last:border-r-0 ${
                    envFilter === val ? 'bg-brutal-yellow text-black' : 'bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {val === 'all' ? 'All' : val.charAt(0).toUpperCase() + val.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Status:
            </span>
            <div className="flex border border-slate-200 dark:border-zinc-800 overflow-hidden rounded-sm shadow-sm">
              {([
                { value: 'all', label: 'All' },
                { value: 'success', label: 'Success (2xx)' },
                { value: 'error', label: 'Error (4xx/5xx)' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleFilterChange('status', value)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors border-r border-slate-200 dark:border-zinc-800 last:border-r-0 ${
                    statusFilter === value ? 'bg-brutal-yellow text-black' : 'bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-yellow-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[180px] relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              placeholder="Filter by endpoint..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-zinc-800 rounded-sm bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={() => exportCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="brutal-btn bg-brutal-green flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="font-display text-xs uppercase">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Log Table */}
      <div className="border-[3px] border-black shadow-md overflow-hidden mb-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--text-secondary)' }} />
              <p className="font-display text-sm uppercase" style={{ color: 'var(--text-secondary)' }}>
                Loading logs...
              </p>
            </div>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <Activity className="w-12 h-12 mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
            <p className="font-display text-lg uppercase mb-2" style={{ color: 'var(--text-primary)' }}>
              No API Logs Yet
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No API logs yet. Make your first API call.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b-[3px] border-black bg-brutal-yellow">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-black">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-black">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-black">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-black">
                    App
                  </th>
                  <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-black">
                    Env
                  </th>
                  <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-black">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-black">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const isExpanded = expandedRows.has(log.id);
                  return (
                    <>
                      <tr
                        key={log.id}
                        className="border-b border-slate-200 dark:border-zinc-800/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        onClick={() => toggleRow(log.id)}
                      >
                        {/* Expand Toggle */}
                        <td className="px-3 py-3 text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 mx-auto" style={{ color: 'var(--text-secondary)' }} />
                          ) : (
                            <ChevronRight className="w-4 h-4 mx-auto" style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${getStatusColor(log.status)}`}
                          >
                            {log.status}
                          </span>
                        </td>

                        {/* Method Badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${getMethodColor(log.method)}`}
                          >
                            {log.method}
                          </span>
                        </td>

                        {/* Endpoint */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <span
                            className="font-mono text-xs truncate block"
                            style={{ color: 'var(--text-primary)' }}
                            title={log.endpoint}
                          >
                            {log.endpoint}
                          </span>
                        </td>

                        {/* App Name */}
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {log.appName}
                          </span>
                        </td>

                        {/* Environment Badge */}
                        <td className="px-4 py-3">
                          {log.environment === 'sandbox' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brutal-yellow text-black border border-slate-200 dark:border-zinc-800/20">
                              sandbox
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-brutal-blue text-white">
                              production
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-mono font-semibold ${
                              log.duration > 500
                                ? 'text-red-600'
                                : log.duration > 200
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }`}
                          >
                            {log.duration}ms
                          </span>
                        </td>

                        {/* Time */}
                        <td className="px-4 py-3">
                          <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                            {timeAgo(log.createdAt)}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr key={`${log.id}-expanded`} className="border-b border-slate-200 dark:border-zinc-800/10">
                          <td colSpan={8} className="px-0 py-0">
                            <div className="bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Full Endpoint */}
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    Full Endpoint
                                  </p>
                                  <p className="font-mono text-xs break-all" style={{ color: 'var(--text-primary)' }}>
                                    {log.endpoint}
                                  </p>
                                </div>

                                {/* Request ID */}
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    Request ID
                                  </p>
                                  <p className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                                    {log.requestId}
                                  </p>
                                </div>

                                {/* Error Message */}
                                {log.errorMessage && (
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1 text-red-600">
                                      Error Message
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 border border-red-200 dark:border-red-700">
                                      {log.errorMessage}
                                    </p>
                                  </div>
                                )}

                                {/* Timestamp */}
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    Timestamp
                                  </p>
                                  <p className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                                    {new Date(log.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredLogs.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Showing{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredLogs.length)}–
              {Math.min(currentPage * PAGE_SIZE, filteredLogs.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {filteredLogs.length}
            </span>{' '}
            results
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="brutal-btn bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-primary)' }}
            >
              ← Prev
            </button>
            <span className="font-display text-sm uppercase px-2" style={{ color: 'var(--text-secondary)' }}>
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="brutal-btn bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-primary)' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
