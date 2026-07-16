import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ReportNavigationDropdown from '@/components/dashboard/ReportNavigationDropdown';
import {
    Calendar, RefreshCw, Loader2, Download, Database,
    TrendingUp, FileText, AlertCircle, Search
} from 'lucide-react';

// ─── Smart column detection ────────────────────────────────────────────────────
// Looks at the first data row and decides which columns to render + how to style them.
const detectColumns = (rows) => {
    if (!rows || rows.length === 0) return [];
    const s = rows[0]; // sample row
    const k = Object.keys(s);

    // ── Item-wise sales (has salesQty + netValue)
    if (k.includes('salesQty') && k.includes('netValue')) return [
        { key: 'code',        label: 'Code',         type: 'badge' },
        { key: 'name',        label: 'Item Name',    type: 'primary' },
        { key: 'category',    label: 'Group',        type: 'tag' },
        { key: 'brand',       label: 'Brand',        type: 'text' },
        { key: 'salesQty',    label: 'Sold Qty',     type: 'num-center' },
        { key: 'salesValue',  label: 'Gross Value',  type: 'amt' },
        { key: 'returnQty',   label: 'Return Qty',   type: 'num-danger' },
        { key: 'returnValue', label: 'Return Value', type: 'amt-danger' },
        { key: 'netQty',      label: 'Net Qty',      type: 'num-success' },
        { key: 'netValue',    label: 'Net Value',    type: 'amt-success' },
    ];

    // ── Day-wise sales (has date + cash + card)
    if (k.includes('date') && k.includes('cash') && k.includes('card')) return [
        { key: 'date',      label: 'Date',   type: 'primary' },
        { key: 'billCount', label: 'Bills',  type: 'num-center' },
        { key: 'cash',      label: 'Cash',   type: 'amt-success' },
        { key: 'card',      label: 'Card',   type: 'amt' },
        { key: 'upi',       label: 'UPI',    type: 'amt' },
        { key: 'credit',    label: 'Credit', type: 'amt-danger' },
        { key: 'total',     label: 'Total',  type: 'amt-primary' },
    ];

    // ── Month-wise (has month + totalSales)
    if (k.includes('month') && k.includes('totalSales')) return [
        { key: 'month',      label: 'Month',     type: 'primary' },
        { key: 'billCount',  label: 'Documents', type: 'num-center' },
        { key: 'totalSales', label: 'Revenue',   type: 'amt-primary' },
    ];

    // ── Outstanding (has balance + name)
    if (k.includes('balance') && k.includes('name')) return [
        { key: 'name',    label: 'Party Name', type: 'primary' },
        { key: 'phone',   label: 'Contact',    type: 'text' },
        { key: 'balance', label: 'Outstanding',type: 'amt-danger' },
    ];

    // ── Aging / receivable-payable (has agingBucket or daysOverdue)
    if (k.includes('agingBucket') || k.includes('daysOverdue')) return [
        { key: 'name',        label: 'Party',       type: 'primary' },
        { key: 'agingBucket', label: 'Aging Bucket',type: 'tag' },
        { key: 'daysOverdue', label: 'Days Due',     type: 'num-center' },
        { key: 'balance',     label: 'Balance',      type: 'amt-danger' },
    ];

    // ── Purchase day-wise (has purchaseDate or purchaseCount)
    if (k.includes('purchaseDate') || (k.includes('date') && k.includes('totalAmount'))) return [
        { key: k.includes('purchaseDate') ? 'purchaseDate' : 'date', label: 'Date', type: 'primary' },
        { key: 'billCount',   label: 'Invoices',       type: 'num-center' },
        { key: 'totalAmount', label: 'Total Purchase', type: 'amt-primary' },
    ];

    // ── Generic group-by (brand/captain/supplier/category + amount)
    const nameKey = k.find(x => ['name', 'brand', 'captain', 'category', 'supplier', 'group', 'item', 'month'].includes(x));
    const qtyKey  = k.find(x => ['count', 'qty', 'itemCount', 'billCount', 'transactionCount', 'quantity'].includes(x));
    const amtKey  = k.find(x => ['amount', 'totalSales', 'total_amount', 'totalAmount', 'netSales', 'grandTotal'].includes(x));

    return [
        nameKey ? { key: nameKey, label: 'Classification', type: 'primary' } : null,
        qtyKey  ? { key: qtyKey,  label: 'Volume',         type: 'num-center' } : null,
        amtKey  ? { key: amtKey,  label: 'Amount',         type: 'amt-primary' } : null,
    ].filter(Boolean);
};

// ─── Column cell renderer ─────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const renderCell = (row, col) => {
    const val = row[col.key];
    switch (col.type) {
        case 'primary':
            return <span className="font-bold text-slate-900 uppercase tracking-tight">{val ?? '—'}</span>;
        case 'text':
            return <span className="text-slate-500 font-medium">{val || '—'}</span>;
        case 'badge':
            return val ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">{val}</span> : <span className="text-slate-300">—</span>;
        case 'tag':
            return val ? <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase border border-slate-200">{val}</span> : <span className="text-slate-300">—</span>;
        case 'num-center':
            return <span className="font-bold text-slate-900">{val ?? 0}</span>;
        case 'num-danger':
            return <span className="font-bold text-rose-500">{val ?? 0}</span>;
        case 'num-success':
            return <span className="font-bold text-emerald-600">{val ?? 0}</span>;
        case 'amt':
            return <span className="font-black text-slate-900">₹{fmt(val)}</span>;
        case 'amt-primary':
            return <span className="font-black text-indigo-600">₹{fmt(val)}</span>;
        case 'amt-success':
            return <span className="font-black text-emerald-600">₹{fmt(val)}</span>;
        case 'amt-danger':
            return <span className="font-black text-rose-600">₹{fmt(val)}</span>;
        default:
            return <span className="text-slate-600">{val ?? '—'}</span>;
    }
};

const cellAlign = (type) => {
    if (type.startsWith('amt') || type.startsWith('num')) return 'text-right';
    if (type === 'num-center') return 'text-center';
    return 'text-left';
};

// ─── Compute summary stats from data ─────────────────────────────────────────
const computeSummary = (rows, cols) => {
    if (!rows.length) return [];
    const amtCols = cols.filter(c => c.type.startsWith('amt'));
    const numCols = cols.filter(c => c.type.startsWith('num'));

    const stats = [{ label: 'Total Records', value: rows.length.toLocaleString(), color: 'indigo' }];

    numCols.slice(0, 1).forEach(c => {
        const total = rows.reduce((s, r) => s + (r[c.key] || 0), 0);
        stats.push({ label: c.label, value: total.toLocaleString(), color: 'slate' });
    });

    amtCols.slice(0, 2).forEach(c => {
        const total = rows.reduce((s, r) => s + (r[c.key] || 0), 0);
        const colorMap = { 'amt-primary': 'indigo', 'amt-success': 'emerald', 'amt-danger': 'rose', 'amt': 'slate' };
        stats.push({ label: c.label, value: `₹${fmt(total)}`, color: colorMap[c.type] || 'slate' });
    });

    return stats;
};

const STAT_COLORS = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const GenericSummaryReport = ({ title, subtitle, endpoint, groupBy, isEmbedded = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);
    const [data, setData]     = useState([]);
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end:   new Date().toISOString().split('T')[0],
    });

    // Build URL — handle endpoints that already contain a `?`
    const buildUrl = useCallback(() => {
        const base = import.meta.env.VITE_API_URL;
        const sep  = endpoint.includes('?') ? '&' : '?';
        let url = `${base}${endpoint}${sep}startDate=${dateRange.start}&endDate=${dateRange.end}`;
        if (groupBy) url += `&groupBy=${groupBy}`;
        return url;
    }, [endpoint, groupBy, dateRange]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const saved = localStorage.getItem('user');
            if (!saved) { setLoading(false); return; }
            const { token } = JSON.parse(saved);
            const res    = await fetch(buildUrl(), { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            if (result.success) {
                // Some endpoints wrap data in a nested key (e.g. monthlyBreakdown)
                const raw = result.data;
                setData(
                    Array.isArray(raw) ? raw :
                    raw?.monthlyBreakdown ?? raw?.items ?? raw?.records ?? []
                );
            } else {
                setError(result.message || 'Failed to load report data.');
            }
        } catch (e) {
            console.error('[GenericSummaryReport]', e);
            setError('Network error — could not reach the server.');
        } finally {
            setLoading(false);
        }
    }, [buildUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(p => !p);
        else {
            const n = !isCollapsed;
            setIsCollapsed(n);
            localStorage.setItem('sidebarCollapsed', n);
        }
    };

    // Detect columns from first data row
    const columns = detectColumns(data);

    // Client-side search across all string values
    const filteredData = search.trim()
        ? data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
        : data;

    const summary = computeSummary(filteredData, columns);

    // CSV export
    const exportCSV = () => {
        if (!filteredData.length || !columns.length) return;
        const headers = columns.map(c => c.label);
        const rows    = filteredData.map(row => columns.map(c => {
            const v = row[c.key];
            return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
        }));
        const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${title.replace(/\s+/g, '_')}_${dateRange.start}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Content ───────────────────────────────────────────────────────────────
    const content = (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Top Toolbar */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-widest hidden sm:block">{title}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors"
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                            className="bg-white border-2 border-slate-300 rounded-sm py-1.5 px-2 text-sm text-slate-700 outline-none hover:border-slate-800 focus:border-slate-800 transition-colors"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="px-4 py-1.5 bg-slate-800 text-white rounded-sm font-semibold text-xs hover:bg-slate-900 transition-colors flex items-center gap-2"
                    >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : "Refresh"}
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={!filteredData.length}
                        className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-sm font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Download size={14} /> Export
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="btn-export print"
                    >
                        <FileText size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {!loading && !error && summary.length > 0 && (
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar">
                        {summary.map((stat, i) => (
                            <div key={i} className="flex-1 min-w-[150px]">
                                <div className="text-xs text-slate-500 font-semibold mb-1">{stat.label}</div>
                                <div className={`text-xl font-bold ${
                                    stat.color === 'indigo' ? 'text-indigo-600' :
                                    stat.color === 'emerald' ? 'text-emerald-600' :
                                    stat.color === 'rose' ? 'text-rose-600' :
                                    'text-slate-800'
                                }`}>{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search bar */}
            {!loading && !error && data.length > 0 && (
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-slate-200 rounded-sm text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Table area */}
            <div className="flex-1 flex flex-col p-4 bg-slate-50 min-h-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-slate-600" size={32} />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Report...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <AlertCircle className="text-red-500" size={32} />
                        <p className="text-sm font-bold text-slate-700">{error}</p>
                        <button onClick={fetchData} className="px-4 py-2 bg-slate-800 text-white rounded-sm text-xs font-semibold">Retry</button>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Database className="text-slate-300" size={32} />
                        <p className="text-sm font-bold text-slate-500">{search ? 'No matches found.' : 'No data available for this period.'}</p>
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="overflow-auto flex-1 custom-scrollbar w-full">
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
                                <thead className="sticky top-0 bg-[#F8FAFC] z-10 border-b border-slate-200 shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="py-3 px-4 w-10">#</th>
                                        {columns.map(col => (
                                            <th
                                                key={col.key}
                                                className={`py-3 px-4 ${
                                                    col.type.startsWith('amt') ? 'text-right' :
                                                    col.type === 'num-center' ? 'text-center' : 'text-left'
                                                }`}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredData.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors text-sm text-slate-700">
                                            <td className="py-3 px-4 font-semibold text-slate-400">{i + 1}</td>
                                            {columns.map(col => (
                                                <td
                                                    key={col.key}
                                                    className={`py-3 px-4 ${
                                                        col.type.startsWith('amt') ? 'text-right' :
                                                        col.type.includes('center') ? 'text-center' : 'text-left'
                                                    }`}
                                                >
                                                    {renderCell(row, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                                {columns.some(c => c.type.startsWith('amt')) && (
                                    <tfoot className="sticky bottom-0 bg-slate-800 text-white">
                                        <tr>
                                            <td className="py-3 px-4" />
                                            {columns.map(col => {
                                                if (col.type.startsWith('amt')) {
                                                    const total = filteredData.reduce((s, r) => s + (r[col.key] || 0), 0);
                                                    return (
                                                        <td key={col.key} className="py-3 px-4 text-right font-black text-sm">
                                                            ₹{fmt(total)}
                                                        </td>
                                                    );
                                                }
                                                if (col.type.startsWith('num')) {
                                                    const total = filteredData.reduce((s, r) => s + (r[col.key] || 0), 0);
                                                    return (
                                                        <td key={col.key} className="py-3 px-4 text-center font-black text-sm">
                                                            {total.toLocaleString()}
                                                        </td>
                                                    );
                                                }
                                                if (col === columns.find(c => !c.type.startsWith('amt') && !c.type.startsWith('num'))) {
                                                    return (
                                                        <td key={col.key} className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-300">
                                                            TOTAL
                                                        </td>
                                                    );
                                                }
                                                return <td key={col.key} className="py-3 px-4" />;
                                            })}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50">
                            <span className="text-xs font-semibold text-slate-500">
                                {search && filteredData.length !== data.length
                                    ? `Showing ${filteredData.length} of ${data.length} records`
                                    : `${filteredData.length} Records Total`}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (isEmbedded) return content;

    return (
        <div className="dashboard-layout bg-white">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} />
            )}
            <main className="dashboard-main flex-1 overflow-hidden font-sans flex flex-col bg-slate-50">
                <Header toggleSidebar={toggleSidebar} title={title} />
                <div className="px-2 lg:px-4 pt-2 lg:pt-4">
                    <ReportNavigationDropdown />
                </div>
                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {content}
                </div>
            </main>
        </div>
    );
};

export default GenericSummaryReport;
