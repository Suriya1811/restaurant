import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import {
    Search, Plus, Calendar, FileText, ChevronDown,
    ArrowDownCircle, ArrowUpCircle, X, Download, Save, Loader2, Edit, Trash2, XCircle, FileSpreadsheet, FileIcon, Printer, AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const VouchersPage = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    // Data states
    const [vouchers, setVouchers] = useState([]);
    const [voucherSeries, setVoucherSeries] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [cancelFilter, setCancelFilter] = useState('ALL');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    // Form state
    const [formData, setFormData] = useState({
        voucher_type: '', // dynamically selected from series
        voucher_number: '', // dynamically generated preview
        date: new Date().toISOString().split('T')[0],
        party_ledger: '', // For PARTY NAME (credit or debit depending on type, but let's map it simply)
        amount: '',
        payment_ledger: '', // For TYPE (Cash/Bank)
        narration: ''
    });

    // Mock metrics calculation
    const calculateMetrics = () => {
        let cashIn = 0, bankIn = 0, cashOut = 0, bankOut = 0;
        vouchers.forEach(v => {
            // Very simplified logic based on mock data requirement.
            // In a real app, this depends heavily on the debit/credit ledger's group.
            if (v.voucher_type === 'Receipt') cashIn += v.amount;
            else if (v.voucher_type === 'Payment') cashOut += v.amount;
        });
        return { cashIn, bankIn, cashOut, bankOut };
    };

    const metrics = calculateMetrics();

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const [vouchRes, seriesRes, ledgRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/vouchers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/voucher-series`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/ledgers`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            
            const vouchData = vouchRes.ok ? await vouchRes.json() : { data: [] };
            const seriesData = seriesRes.ok ? await seriesRes.json() : [];
            const ledgData = ledgRes.ok ? await ledgRes.json() : { data: [] };
            
            if (vouchData.success) setVouchers(vouchData.data);
            setVoucherSeries(Array.isArray(seriesData) ? seriesData : []);
            if (ledgData.success) setLedgers(ledgData.data);
            
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // When voucher type changes, update the preview voucher number
    useEffect(() => {
        if (formData.voucher_type) {
            const series = voucherSeries.find(s => s.series_name === formData.voucher_type);
            if (series) {
                const numStr = String(series.next_number).padStart(4, '0');
                const vnum = series.prefix ? `${series.prefix}${series.suffix}${numStr}` : `${numStr}`;
                setFormData(prev => ({ ...prev, voucher_number: vnum }));
            }
        }
    }, [formData.voucher_type, voucherSeries]);

    const handleCreateClick = () => {
        setError('');
        // set default type to first available series if any
        const defaultType = voucherSeries.length > 0 ? voucherSeries[0].series_name : '';
        setFormData({
            voucher_type: defaultType,
            voucher_number: '',
            date: new Date().toISOString().split('T')[0],
            party_ledger: '',
            amount: '',
            payment_ledger: '',
            narration: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.voucher_type || !formData.party_ledger || !formData.amount || !formData.payment_ledger) {
            return setError("Please fill all required fields.");
        }
        
        setSubmitting(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            // Map the simplified form to the double-entry backend payload.
            // Simplified logic: 
            // If Receipt: Debit is Cash/Bank (Payment Ledger), Credit is Party
            // If Payment: Debit is Party, Credit is Cash/Bank (Payment Ledger)
            // Realistically we need more robust logic, but keeping it simple for the UI implementation.
            let debit_ledger, credit_ledger;
            if (formData.voucher_type.toLowerCase().includes('receipt')) {
                debit_ledger = formData.payment_ledger;
                credit_ledger = formData.party_ledger;
            } else {
                debit_ledger = formData.party_ledger;
                credit_ledger = formData.payment_ledger;
            }

            const payload = {
                voucher_type: formData.voucher_type,
                date: formData.date,
                amount: Number(formData.amount),
                debit_ledger,
                credit_ledger,
                narration: formData.narration
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/vouchers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.success) {
                fetchData();
                setShowModal(false);
            } else {
                setError(result.error || result.message || "Failed to create voucher");
            }
        } catch (err) {
            setError("Connection failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this voucher?")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/vouchers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (err) { console.error(err); }
    };

    // Filter logic
    const filteredVouchers = vouchers.filter(v => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (
                v.voucher_number?.toLowerCase().includes(searchLower) ||
                v.narration?.toLowerCase().includes(searchLower) ||
                v.voucher_type?.toLowerCase().includes(searchLower)
            );
            if (!matchesSearch) return false;
        }
        if (filterType !== 'ALL' && v.voucher_type !== filterType) {
            return false;
        }
        if (fromDate && new Date(v.date).toISOString().split('T')[0] < fromDate) {
            return false;
        }
        if (toDate && new Date(v.date).toISOString().split('T')[0] > toDate) {
            return false;
        }
        // Cancel type filter
        if (cancelFilter === 'ACTIVE' && v.is_deleted) return false;
        if (cancelFilter === 'CANCELLED' && !v.is_deleted) return false;
        return true;
    });

    const exportToCSV = () => {
        if (!filteredVouchers.length) {
            alert('No records to export');
            return;
        }
        
        const headers = ["Date", "Voucher Number", "Voucher Type", "Particulars", "Cash In", "Cash Out", "Type"];
        
        const rows = filteredVouchers.map((v) => {
            const dateStr = new Date(v.voucher_date).toLocaleDateString('en-GB');
            const typeClass = (v.voucher_type === 'Receipt' || v.voucher_type === 'Sales') ? 'IN' : 'OUT';
            const amount = parseFloat(v.total_amount) || 0;
            let cashIn = '-', cashOut = '-';
            
            if (typeClass === 'IN') cashIn = amount.toFixed(2);
            if (typeClass === 'OUT') cashOut = amount.toFixed(2);

            return [
                dateStr,
                v.voucher_number || '-',
                v.voucher_type || '-',
                v.narration || '-',
                cashIn,
                cashOut,
                typeClass
            ].map(cell => `"${cell}"`).join(',');
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Vouchers_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (!filteredVouchers.length) {
            alert('No records to export');
            return;
        }

        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Vouchers Report', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
        
        const head = [["Date", "Voucher Number", "Voucher Type", "Particulars", "Cash In", "Cash Out", "Type"]];
        
        const body = filteredVouchers.map((v) => {
            const dateStr = new Date(v.voucher_date).toLocaleDateString('en-GB');
            const typeClass = (v.voucher_type === 'Receipt' || v.voucher_type === 'Sales') ? 'IN' : 'OUT';
            const amount = parseFloat(v.total_amount) || 0;
            let cashIn = '-', cashOut = '-';
            
            if (typeClass === 'IN') cashIn = amount.toFixed(2);
            if (typeClass === 'OUT') cashOut = amount.toFixed(2);

            return [
                dateStr,
                v.voucher_number || '-',
                v.voucher_type || '-',
                v.narration || '-',
                cashIn,
                cashOut,
                typeClass
            ];
        });

        autoTable(doc, {
            startY: 36,
            head: head,
            body: body,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        doc.save(`Vouchers_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    isCollapsed={isCollapsed} 
                    headerActions={
                        <>
                            <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm">
                                <FileSpreadsheet size={16} /> Excel
                            </button>
                            <button onClick={exportToPDF} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors shadow-sm">
                                <FileIcon size={16} /> PDF
                            </button>
                            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm">
                                <Printer size={16} /> Print
                            </button>
                        </>
                    }
                />
                
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        
                        {/* Header & Filters */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <h1 className="text-xl font-bold text-slate-800">Voucher</h1>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end no-print">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Filter By</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700"
                                        value={filterType}
                                        onChange={e => setFilterType(e.target.value)}
                                    >
                                        <option value="ALL">All</option>
                                        {voucherSeries.map(s => (
                                            <option key={s._id} value={s.series_name}>{s.series_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Cancel Type</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700"
                                        value={cancelFilter}
                                        onChange={e => setCancelFilter(e.target.value)}
                                    >
                                        <option value="ALL">All</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Search By</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Voucher Number / Particulars"
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 col-span-1 md:col-span-2 no-print">
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">From Date</label>
                                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">To Date</label>
                                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="flex-none flex items-end">
                                        <button onClick={handleCreateClick} className="h-[38px] px-4 bg-[#FF5722] hover:bg-[#F4511E] text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
                                            <Plus size={16} /> Create Voucher
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                                    <ArrowDownCircle size={24} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cash Inflow</div>
                                    <div className="text-xl font-black text-slate-800">₹ {metrics.cashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                                    <ArrowDownCircle size={24} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Inflow</div>
                                    <div className="text-xl font-black text-slate-800">₹ {metrics.bankIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-rose-100 p-4 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                                    <ArrowUpCircle size={24} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cash Outflow</div>
                                    <div className="text-xl font-black text-slate-800">₹ {metrics.cashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-fuchsia-100 p-4 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-500 border border-fuchsia-100">
                                    <ArrowUpCircle size={24} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Outflow</div>
                                    <div className="text-xl font-black text-slate-800">₹ {metrics.bankOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200">
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700">Date</th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700">Voucher Number</th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700">Voucher Type</th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700">Particulars</th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700">Cash In</th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700">Cash Out</th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700">Type</th>
                                            <th className="py-3 px-4 text-xs font-bold text-slate-700 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr><td colSpan="8" className="py-8 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" size={20} /> Loading...</td></tr>
                                        ) : filteredVouchers.length === 0 ? (
                                            <tr><td colSpan="8" className="py-8 text-center text-slate-400">No vouchers found</td></tr>
                                        ) : (
                                            filteredVouchers.map((v) => {
                                                const isReceipt = v.voucher_type?.toLowerCase().includes('receipt');
                                                const cashIn = isReceipt ? v.amount : '-';
                                                const cashOut = !isReceipt ? v.amount : '-';
                                                const typeStr = 'Cash'; // simplified for mock
                                                return (
                                                    <tr key={v._id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="py-3 px-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                                                            {new Date(v.date).toLocaleDateString('en-GB')}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{v.voucher_number}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{v.voucher_type}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-800">{v.narration || '-'}</td>
                                                        <td className="py-3 px-4 text-sm font-medium text-slate-800">{cashIn !== '-' ? cashIn.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '-'}</td>
                                                        <td className="py-3 px-4 text-sm font-medium text-slate-800">{cashOut !== '-' ? cashOut.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '-'}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600">{typeStr}</td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex justify-center">
                                                                <button onClick={() => handleDelete(v._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-500 flex justify-between items-center no-print">
                                <span>Showing 1 to {filteredVouchers.length} of {filteredVouchers.length} entries</span>
                                <div className="flex items-center gap-1">
                                    <button className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-400">&lt;</button>
                                    <button className="px-2 py-1 border border-[#FF5722] rounded bg-[#FF5722] text-white">1</button>
                                    <button className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50">&gt;</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* Create Voucher Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full slide-up">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Create Voucher</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 font-semibold text-sm transition-colors border border-rose-100">
                                <XCircle size={16} /> Close
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto bg-slate-50/30 flex-1">
                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-start gap-3">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <div className="text-sm font-medium">{error}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {/* Voucher Type */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Voucher Type <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium appearance-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                            value={formData.voucher_type}
                                            onChange={e => setFormData({...formData, voucher_type: e.target.value})}
                                        >
                                            <option value="">Select Type</option>
                                            {voucherSeries.map(s => (
                                                <option key={s._id} value={s.series_name}>{s.series_name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                </div>

                                {/* Voucher Number Preview */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Voucher Number <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 font-semibold shadow-sm"
                                        value={formData.voucher_number || 'Select type first'}
                                        readOnly
                                        disabled
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Date <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                            value={formData.date}
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {/* Party Name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Party Name <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium appearance-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                            value={formData.party_ledger}
                                            onChange={e => setFormData({...formData, party_ledger: e.target.value})}
                                        >
                                            <option value="">Select Party</option>
                                            {ledgers.map(l => (
                                                <option key={l._id} value={l._id}>{l.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                    <div className="mt-2 px-1 text-sm font-medium text-blue-600 bg-blue-50/50 rounded py-1 inline-block">Balance: ₹ 0.00</div>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Amount <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</div>
                                        <input 
                                            type="number" 
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                            value={formData.amount}
                                            onChange={e => setFormData({...formData, amount: e.target.value})}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Type (Payment Ledger) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Type <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select 
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium appearance-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                            value={formData.payment_ledger}
                                            onChange={e => setFormData({...formData, payment_ledger: e.target.value})}
                                        >
                                            <option value="">Select Cash/Bank</option>
                                            {ledgers.filter(l => l.group?.name?.toLowerCase().includes('cash') || l.group?.name?.toLowerCase().includes('bank')).map(l => (
                                                <option key={l._id} value={l._id}>{l.name}</option>
                                            ))}
                                            {/* Fallback if no specific groups found */}
                                            {ledgers.length > 0 && !ledgers.find(l => l.group?.name?.toLowerCase().includes('cash')) && (
                                                ledgers.slice(0,5).map(l => (
                                                    <option key={l._id} value={l._id}>{l.name}</option>
                                                ))
                                            )}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Narration */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Narration <span className="text-rose-500">*</span></label>
                                <textarea 
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm resize-none h-24"
                                    value={formData.narration}
                                    onChange={e => setFormData({...formData, narration: e.target.value})}
                                    placeholder="Enter narration details..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-center shrink-0">
                            <button 
                                onClick={handleSubmit}
                                disabled={submitting || !formData.voucher_type || !formData.party_ledger || !formData.amount || !formData.payment_ledger}
                                className="bg-[#FF5722] hover:bg-[#F4511E] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[160px] justify-center"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {submitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VouchersPage;
