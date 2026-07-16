import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import ReportToolbar, { printReport } from '@/components/common/ReportToolbar';
import {
    Download,
    Loader2,
    Calendar,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    Wallet,
    Search,
    Info,
    RefreshCw,
    User,
    FileText,
    PieChart,
    ArrowRight,
    Eye,
    X,
    Filter,
    Layers,
    Activity,
    Printer,
    Building2,
    CreditCard,
    ArrowDownLeft,
    ArrowUpRight,
    Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const Daybook = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        totalTransactions: 0,
        paymentIn: 0,
        paymentOut: 0,
        totalCash: 0,
        totalCredit: 0
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: ''
    });

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchDaybook = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/daybook?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch daybook", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchDaybook();
    }, [fetchDaybook]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleRowClick = (entry) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const isBalanceRow = (row) => row.party?.toUpperCase().includes('BALANCE') || row.narration?.toUpperCase().includes('BALANCE');

    const exportToCSV = () => {
        const headers = ["Date", "Voucher No.", "Particulars", "Pay In (Rs)", "Pay Out (Rs)", "Remarks"];
        const rows = data.map(d => {
            const isBalance = isBalanceRow(d);
            return [
                new Date(d.date).toLocaleDateString('en-GB'),
                d.voucher_no || '-',
                (isBalance && !d.party ? d.narration : d.party || d.narration || '-').toUpperCase(),
                d.payment_in || '0',
                d.payment_out || '0',
                isBalance && !d.party ? 'Balance Entry' : d.narration || '-'
            ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
        });

        const filterText = `Filters - From: ${filters.startDate} | To: ${filters.endDate}`;
        const csvContent = "data:text/csv;charset=utf-8," +
            "Daybook Entry Report\n" +
            filterText + "\n\n" +
            headers.join(',') + "\n" + rows.join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Daybook_${filters.startDate}_to_${filters.endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');

        doc.setFontSize(18);
        doc.text('Daybook Entry Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);

        const filterText = `Filters - From: ${filters.startDate} | To: ${filters.endDate}`;
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(filterText, 14, 36);

        const head = [["Date", "Voucher No.", "Particulars", "Pay In (Rs)", "Pay Out (Rs)", "Remarks"]];
        const body = data.map(d => {
            const isBalance = isBalanceRow(d);
            return [
                new Date(d.date).toLocaleDateString('en-GB'),
                d.voucher_no || '-',
                (isBalance && !d.party ? d.narration : d.party || d.narration || '-').toUpperCase(),
                fmt(d.payment_in),
                fmt(d.payment_out),
                isBalance && !d.party ? 'Balance Entry' : d.narration || '-'
            ];
        });

        autoTable(doc, {
            startY: 42,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 8 }
        });

        doc.save(`Daybook_${filters.startDate}_to_${filters.endDate}.pdf`);
    };

    const handlePrint = () => {
        const headers = ['Date', 'Voucher No.', 'Particulars', 'Pay In (Rs)', 'Pay Out (Rs)', 'Remarks'];
        const rows = data.map(d => [
            new Date(d.date).toLocaleDateString('en-GB'),
            d.voucher_no || '-',
            (d.party || d.narration || '-').toUpperCase(),
            d.payment_in > 0 ? fmt(d.payment_in) : '-',
            d.payment_out > 0 ? fmt(d.payment_out) : '-',
            d.narration || '-'
        ]);
        const totalIn = data.reduce((a, b) => a + (b.payment_in || 0), 0);
        const totalOut = data.reduce((a, b) => a + (b.payment_out || 0), 0);
        printReport(
            'Daybook Entry Report',
            `From: ${filters.startDate} | To: ${filters.endDate}`,
            headers,
            rows,
            { label: 'Total', cells: [fmt(totalIn), fmt(totalOut), ''] }
        );
    };

    return (
        <div className="dashboard-layout bg-slate-50 font-sans min-h-screen">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body, html, #root { background: white !important; height: auto !important; overflow: visible !important; min-height: 0 !important; }
                    .no-print, aside, nav, .sidebar, .mobile-overlay, .top-bar, .summary-cards { display: none !important; }
                    .dashboard-main { padding: 0 !important; margin: 0 !important; background: white !important; height: auto !important; overflow: visible !important; }
                    .print-section { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
                    table { border-collapse: collapse !important; width: 100% !important; }
                    th, td { padding: 8px !important; }
                }
            `}</style>

            <main className="dashboard-main flex flex-col h-screen overflow-hidden bg-slate-50 relative">
                <ReportToolbar 
                    title="Daybook Entry"
                    toggleSidebar={toggleSidebar}
                    filters={filters}
                    setFilters={setFilters}
                    loading={loading}
                    onRefresh={fetchDaybook}
                    onExportCSV={exportToCSV}
                    onExportPDF={exportToPDF}
                    onPrint={handlePrint}
                />

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 print-section">
                    <div className="hidden print:block mb-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">Daybook Entry Report</h2>
                        <p className="text-slate-600 font-medium">Generated on: {new Date().toLocaleString('en-GB')}</p>
                        <p className="text-slate-600 text-sm mt-1">Filters - From: {filters.startDate} | To: {filters.endDate}</p>
                    </div>

                    <div className="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <FileText size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Total Transactions</p>
                                <p className="text-xl font-bold text-blue-600">{summary.totalTransactions}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                                <ArrowDownLeft size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Payment In</p>
                                <p className="text-xl font-bold text-slate-900">₹ {fmt(summary.paymentIn)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 border border-rose-100">
                                <ArrowUpRight size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Payment Out</p>
                                <p className="text-xl font-bold text-slate-900">₹ {fmt(summary.paymentOut)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100">
                                <Wallet size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Closing Cash Balance</p>
                                <p className="text-xl font-bold text-orange-500">₹ {fmt(summary.totalCash)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-white border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide text-center">Voucher No.</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide">Particulars</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide text-center">Pay In (₹)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide text-center">Pay Out (₹)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wide">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                                <Loader2 size={24} className="animate-spin mb-2 mx-auto text-indigo-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-wider">Loading Daybook...</p>
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                                No entries found for this date range
                                            </td>
                                        </tr>
                                    ) : data.map((d, i) => {
                                        const isBalance = isBalanceRow(d);
                                        return (
                                            <tr key={i} className={`hover:bg-slate-50 transition-colors cursor-pointer ${isBalance ? 'text-orange-500 font-bold' : 'text-slate-800 font-semibold'}`} onClick={() => handleRowClick(d)}>
                                                <td className="px-6 py-4 text-sm">
                                                    {new Date(d.date).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center">
                                                    {d.voucher_no || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm uppercase">
                                                    {isBalance && !d.party ? d.narration : d.party || d.narration || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center">
                                                    {fmt(d.payment_in)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center">
                                                    {fmt(d.payment_out)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {isBalance && !d.party ? 'Balance Entry' : d.narration || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-slate-200 px-6 py-4">
                            <span className="text-xs font-bold text-slate-500">
                                Showing 1 to {data.length} of {data.length} entries
                            </span>
                        </div>
                    </div>
                </div>

                {/* Audit Drawer - Journal Detail Overlay */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[420px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedEntry && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Journal Detail</p>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">VCH-{selectedEntry.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Hub</span>
                                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedEntry.type}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Point</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedEntry.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Counterparty</span>
                                            <span className="text-sm font-black text-slate-900 uppercase">{selectedEntry.party}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-slate-50 rounded-2xl space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Valuation</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment In</span>
                                                <span className="text-xl font-black text-emerald-600">₹{selectedEntry.payment_in > 0 ? fmt(selectedEntry.payment_in) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment Out</span>
                                                <span className="text-xl font-black text-rose-600">₹{selectedEntry.payment_out > 0 ? fmt(selectedEntry.payment_out) : '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Credit Volume</span>
                                                <span className="text-xl font-black text-amber-600">₹{selectedEntry.credit_amt > 0 ? fmt(selectedEntry.credit_amt) : '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Info size={14} className="text-slate-300" /> Memoranda / Narrative
                                        </p>
                                        <div className="p-6 bg-slate-50 rounded-2xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-200 leading-relaxed shadow-inner">
                                            "{selectedEntry.narration || 'No narrative description documented for this record.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-50 bg-slate-50 grid grid-cols-2 gap-3">
                                    <button className="h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <Download size={16} /> Save Record
                                    </button>
                                    <button className="btn-export print">
                                        <Printer size={16} /> Print Voucher
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Daybook;
