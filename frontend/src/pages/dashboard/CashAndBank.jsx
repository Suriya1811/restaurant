import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import ReportToolbar, { printReport } from '@/components/common/ReportToolbar';
import { Loader2, Eye, X, FileText, Printer, Wallet, Landmark, Activity, Info, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CashAndBank = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState({
        openingCash: 0,
        openingBank: 0,
        totalOpening: 0,
        closingBalance: 0,
        snapshots: []
    });

    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchAudit = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const q = new URLSearchParams(filters).toString();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/accounts/cash-bank?${q}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
                setSummary(result.summary);
            }
        } catch (err) {
            console.error("Failed to fetch cash-bank audit", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fmt = (num) => (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const exportToCSV = () => {
        const headers = ["Date", "Transaction No", "Name", "Received", "Paid", "Cash Movement", "Bank Movement", "Balance", "Narration"];
        const rows = [
            [new Date(filters.startDate).toLocaleDateString(), '-', 'OPENING BALANCE', '-', '-', summary.openingCash, summary.openingBank, summary.totalOpening, '-'],
            ...data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.party || d.type,
                d.received || '-',
                d.paid || '-',
                d.cash_impact || '-',
                d.bank_impact || '-',
                d.balance,
                d.narration || '-'
            ])
        ];
        
        const totalReceived = data.reduce((a,b)=>a+(b.received||0), 0);
        const totalPaid = data.reduce((a,b)=>a+(b.paid||0), 0);
        
        rows.push(["Total", "", "", totalReceived, totalPaid, "", "", summary.closingBalance, ""]);
        
        const csvContent = "data:text/csv;charset=utf-8," + 
            "Cash & Bank Statement\n" + 
            `Filters - From: ${filters.startDate} | To: ${filters.endDate}\n\n` +
            [headers, ...rows].map(e => e.join(",")).join("\n");
            
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `CashBank_${filters.startDate}_to_${filters.endDate}.csv`);
        link.click();
    };
    
    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Cash & Bank Statement', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
        doc.setFontSize(10);
        doc.text(`Filters - From: ${filters.startDate} | To: ${filters.endDate}`, 14, 36);
        
        const head = [['Date', 'Ref', 'Entity / Description', 'Inflow', 'Outflow', 'Cash Link', 'Bank Link', 'Position']];
        
        const body = [
            [
                new Date(filters.startDate).toLocaleDateString(), 
                '-', 
                'OPENING BALANCE', 
                '-', 
                '-', 
                fmt(summary.openingCash), 
                fmt(summary.openingBank), 
                fmt(summary.totalOpening)
            ],
            ...data.map(d => [
                new Date(d.date).toLocaleDateString(),
                d.voucher_no,
                d.party || d.type,
                d.received ? fmt(d.received) : '-',
                d.paid ? fmt(d.paid) : '-',
                d.cash_impact ? fmt(d.cash_impact) : '-',
                d.bank_impact ? fmt(d.bank_impact) : '-',
                fmt(d.balance)
            ])
        ];
        
        const totalReceived = data.reduce((a,b)=>a+(b.received||0), 0);
        const totalPaid = data.reduce((a,b)=>a+(b.paid||0), 0);

        body.push([
            { content: 'Total', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } }, 
            { content: fmt(totalReceived), styles: { fontStyle: 'bold' } }, 
            { content: fmt(totalPaid), styles: { fontStyle: 'bold' } }, 
            "", 
            "", 
            { content: fmt(summary.closingBalance), styles: { fontStyle: 'bold' } }
        ]);

        autoTable(doc, {
            startY: 40,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], halign: 'center' },
            styles: { fontSize: 9 },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' }
            }
        });

        doc.save(`CashBank_${filters.startDate}_to_${filters.endDate}.pdf`);
    };

    const handlePrint = () => {
        const headers = ['Date', 'Ref', 'Entity / Description', 'Inflow (Rs)', 'Outflow (Rs)', 'Cash Link', 'Bank Link', 'Position (Rs)'];
        const rows = [
            [new Date(filters.startDate).toLocaleDateString('en-GB'), '-', 'OPENING BALANCE', '-', '-', fmt(summary.openingCash), fmt(summary.openingBank), fmt(summary.totalOpening)],
            ...data.map(d => [
                new Date(d.date).toLocaleDateString('en-GB'),
                d.voucher_no,
                d.party || d.type,
                d.received ? fmt(d.received) : '-',
                d.paid ? fmt(d.paid) : '-',
                d.cash_impact ? fmt(d.cash_impact) : '-',
                d.bank_impact ? fmt(d.bank_impact) : '-',
                fmt(d.balance)
            ])
        ];
        const totalRec = data.reduce((a,b) => a+(b.received||0), 0);
        const totalPaid = data.reduce((a,b) => a+(b.paid||0), 0);
        printReport(
            'Cash & Bank Statement',
            `From: ${filters.startDate} | To: ${filters.endDate}`,
            headers,
            rows,
            { label: 'Closing Balance', cells: [fmt(totalRec), fmt(totalPaid), '', '', fmt(summary.closingBalance)] }
        );
    };

    const handleRowClick = (tx) => {
        setSelectedTransaction(tx);
        setIsDrawerOpen(true);
    };

    return (
        <div className="dashboard-layout bg-slate-50 font-sans min-h-screen">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay z-40 fixed inset-0 bg-black/50" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <style>{`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body, html, #root { background: white !important; height: auto !important; overflow: visible !important; min-height: 0 !important; }
                    .no-print, aside, nav, .sidebar, .mobile-overlay, .top-bar { display: none !important; }
                    .dashboard-main { padding: 0 !important; margin: 0 !important; background: white !important; height: auto !important; overflow: visible !important; }
                    .print-section { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; }
                    table { border-collapse: collapse !important; width: 100% !important; }
                    th, td { padding: 8px !important; }
                }
            `}</style>

            <main className="dashboard-main flex flex-col h-screen overflow-hidden bg-slate-50 relative">
                <ReportToolbar 
                    title="Cash & Bank"
                    toggleSidebar={toggleSidebar}
                    filters={filters}
                    setFilters={setFilters}
                    loading={loading}
                    onRefresh={fetchAudit}
                    onExportCSV={exportToCSV}
                    onExportPDF={exportToPDF}
                    onPrint={handlePrint}
                />

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 print-section relative">
                    <div className="hidden print:block mb-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">Cash & Bank Statement</h2>
                        <p className="text-slate-600 font-medium">Audit Trail of Cash and Bank Movements</p>
                        <p className="text-slate-600 text-sm mt-1">Filters - From: {filters.startDate} | To: {filters.endDate}</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-4 mb-6">
                        <div className="flex-1 bg-orange-50 border border-orange-100 rounded-lg p-4 flex flex-col justify-center items-center shadow-sm min-w-[200px]">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Wallet size={12} /> Cash in Hand
                            </span>
                            <span className="text-xl font-black text-orange-600">₹ {fmt(summary.snapshots.find(s => s.name.toLowerCase().includes('cash'))?.balance || summary.openingCash)}</span>
                        </div>
                        
                        {summary.snapshots.filter(s => s.name.toLowerCase().includes('bank')).map((bank, i) => (
                            <div key={i} className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col justify-center items-center shadow-sm min-w-[200px]">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Landmark size={12} /> {bank.name}
                                </span>
                                <span className="text-xl font-black text-blue-600">₹ {fmt(bank.balance)}</span>
                            </div>
                        ))}

                        <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex flex-col justify-center items-center shadow-sm min-w-[200px]">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Activity size={12} /> Total Balance
                            </span>
                            <span className="text-xl font-black text-emerald-600">₹ {fmt(summary.closingBalance)}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col relative min-h-[300px]">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left min-w-[900px]">
                                <thead className="bg-[#0f172a] text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-orange-500 border-r border-slate-700 whitespace-nowrap">Date</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-orange-500 border-r border-slate-700 text-center">Ref</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-orange-500 border-r border-slate-700">Entity / Description</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-emerald-500 border-r border-slate-700 text-right">Inflow (₹)</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-rose-500 border-r border-slate-700 text-right">Outflow (₹)</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-orange-500 border-r border-slate-700 text-right">Cash Link</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-orange-500 border-r border-slate-700 text-right">Bank Link</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-orange-500 text-right border-r border-slate-700">Current Position</th>
                                        <th className="px-2 py-3 w-10 border-slate-700 text-[10px] font-black uppercase tracking-wider text-orange-500 text-center no-print">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {/* Opening Row */}
                                    <tr className="bg-slate-50">
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{new Date(filters.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-4 py-3 text-xs text-center text-slate-400">---</td>
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700 uppercase">Opening Audit Position</td>
                                        <td className="px-4 py-3 text-xs text-right text-slate-400">—</td>
                                        <td className="px-4 py-3 text-xs text-right text-slate-400">—</td>
                                        <td className="px-4 py-3 text-xs text-right font-medium text-slate-500">{fmt(summary.openingCash)}</td>
                                        <td className="px-4 py-3 text-xs text-right font-medium text-slate-500">{fmt(summary.openingBank)}</td>
                                        <td className="px-4 py-3 text-xs text-right font-bold text-slate-900">{fmt(summary.totalOpening)}</td>
                                        <td className="px-2 py-3 text-center text-slate-300 no-print"><Info size={12} className="mx-auto" /></td>
                                    </tr>

                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                                                <Loader2 size={24} className="animate-spin mb-2 mx-auto text-indigo-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-wider">Querying Audit Archive...</p>
                                            </td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                                No liquidity movement found
                                            </td>
                                        </tr>
                                    ) : data.map((d, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleRowClick(d)}>
                                            <td className="px-4 py-3 text-xs font-semibold text-slate-700">{new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-3 text-xs text-center text-slate-600">
                                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">#{d.voucher_no}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                                                    <span className="text-xs font-semibold text-slate-800 uppercase">{d.party || d.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-right font-medium text-emerald-600 bg-emerald-50/20">{d.received > 0 ? fmt(d.received) : '—'}</td>
                                            <td className="px-4 py-3 text-xs text-right font-medium text-rose-600 bg-rose-50/20">{d.paid > 0 ? fmt(d.paid) : '—'}</td>
                                            <td className="px-4 py-3 text-xs text-right font-medium text-slate-500">
                                                {d.cash_impact !== 0 ? (d.cash_impact > 0 ? `+${fmt(d.cash_impact)}` : fmt(d.cash_impact)) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-right font-medium text-slate-500">
                                                {d.bank_impact !== 0 ? (d.bank_impact > 0 ? `+${fmt(d.bank_impact)}` : fmt(d.bank_impact)) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-right font-bold text-slate-900 bg-slate-50/40">{fmt(d.balance)}</td>
                                            <td className="px-2 py-3 text-center opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                                <div className="w-5 h-5 rounded bg-slate-200 text-slate-600 flex items-center justify-center mx-auto hover:bg-slate-800 hover:text-white transition-colors">
                                                    <Eye size={10} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[#fff7ed] sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t-2 border-orange-100">
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-black text-slate-900 uppercase" colSpan={3}>Closing Liquidity Snapshot</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">₹ {fmt(data.reduce((a,b)=>a+(b.received||0), 0))}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-rose-600">₹ {fmt(data.reduce((a,b)=>a+(b.paid||0), 0))}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">₹ {fmt(summary.closingBalance)}</td>
                                        <td className="px-2 py-3 no-print"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Audit Drawer - Entry Intelligence Overlay */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
                    <div className={`absolute top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-500 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        {selectedTransaction && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-black">Audit Detail</p>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">#{selectedTransaction.voucher_no}</h3>
                                    </div>
                                    <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</span>
                                            <span className="text-sm font-black text-slate-900 uppercase">{selectedTransaction.party || 'System'}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeline</span>
                                            <span className="text-sm font-bold text-slate-900">{new Date(selectedTransaction.date).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Class</span>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest">{selectedTransaction.type}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 rounded-3xl space-y-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Breakdown</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Wallet size={14} className="text-emerald-500" />
                                                    <span className="text-xs font-bold text-slate-600">Cash Flow</span>
                                                </div>
                                                <span className={`text-sm font-black ${selectedTransaction.cash_impact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {selectedTransaction.cash_impact !== 0 ? `₹${fmt(selectedTransaction.cash_impact)}` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Landmark size={14} className="text-indigo-500" />
                                                    <span className="text-xs font-bold text-slate-600">Bank Flow</span>
                                                </div>
                                                <span className={`text-sm font-black ${selectedTransaction.bank_impact >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                    {selectedTransaction.bank_impact !== 0 ? `₹${fmt(selectedTransaction.bank_impact)}` : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Narration / Memo</p>
                                        <div className="p-8 bg-slate-50 rounded-3xl italic text-slate-600 text-sm font-medium border-l-4 border-slate-200">
                                            "{selectedTransaction.narration || 'No memorandums recorded for this entry.'}"
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-50 grid grid-cols-2 gap-4">
                                    <button className="h-14 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-900 transition-all flex items-center justify-center gap-2">
                                        <Download size={16} /> Receipt
                                    </button>
                                    <button className="h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                        <Printer size={16} /> Print Audit
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

export default CashAndBank;
