import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
    CalendarDays, FileText, ClipboardList, DollarSign, Landmark,
    RefreshCw, FileSpreadsheet, FileIcon, Printer, XCircle, ChevronDown, CheckSquare,
    ChevronLeft, ChevronRight, Edit, Trash2, Settings
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';

const ALL_COLUMNS = [
    { id: 'sno', label: 'S.No' },
    { id: 'type', label: 'Type' },
    { id: 'kot_bill_no', label: 'KOT / Bill No.' },
    { id: 'date', label: 'Date' },
    { id: 'time', label: 'Time' },
    { id: 'customer_name', label: 'Customer Name' },
    { id: 'mobile_no', label: 'Mobile Number' },
    { id: 'captain', label: 'Captain' },
    { id: 'waiter', label: 'Waiter' },
    { id: 'table', label: 'Table No.' },
    { id: 'amount', label: 'Amount' },
    { id: 'cash_amount', label: 'Cash Amount' },
    { id: 'card_amount', label: 'Card Amount' },
    { id: 'upi_amount', label: 'UPI Amount' },
    { id: 'action', label: 'Action' }
];

const DisplayPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const formatDisplayNumber = (type, rawNumber) => {
        if (!rawNumber || rawNumber === '-') return '-';
        const digits = String(rawNumber).replace(/\D/g, '');
        if (!digits) return rawNumber;
        const padded = digits.padStart(5, '0');
        return (type === 'KOT' || type === 'KOT_BILL') ? `KOT-${padded}` : `BILL-${padded}`;
    };

    // Layout State
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Data State
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter State
    const [salesType, setSalesType] = useState('ALL'); 
    const [filterBy, setFilterBy] = useState('ALL'); 
    const [selectedCaptain, setSelectedCaptain] = useState('ALL');
    const [selectedWaiter, setSelectedWaiter] = useState('ALL');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Action Filter State
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('displayPageColumns');
        return saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.id);
    });

    // Action Dropdown State
    const [openActionId, setOpenActionId] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    // Staff lists
    const [captains, setCaptains] = useState([]);
    const [waiters, setWaiters] = useState([]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    useEffect(() => {
        localStorage.setItem('displayPageColumns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setOpenActionId(null);
            }
            if (!event.target.closest('.column-filter-container')) {
                setShowColumnFilter(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStaff = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const [captainsRes, waitersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/captains`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL}/waiters`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const captainsData = await captainsRes.json();
            const waitersData = await waitersRes.json();

            if (captainsData.success) {
                setCaptains(captainsData.data.map(c => c.name));
            }
            if (waitersData.success) {
                setWaiters(waitersData.data.map(w => w.name));
            }
        } catch (error) {
            console.error("Failed to fetch staff", error);
        }
    };

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                const fetchedRecords = data.data.map((bill, index) => {
                    const isStrictKot = bill.status === 'DRAFT' || bill.type === 'KOT';
                    
                    let cashAmt = 0, cardAmt = 0, upiAmt = 0;
                    if (bill.payment_modes && Array.isArray(bill.payment_modes)) {
                        bill.payment_modes.forEach(pm => {
                            const pType = pm.type || pm.mode;
                            if (pType === 'CASH') cashAmt += (parseFloat(pm.amount) || 0);
                            else if (pType === 'CARD') cardAmt += (parseFloat(pm.amount) || 0);
                            else if (pType === 'UPI') upiAmt += (parseFloat(pm.amount) || 0);
                        });
                    } else if (bill.payment_mode) {
                        const amt = parseFloat(bill.grand_total || bill.amount || 0);
                        if (bill.payment_mode === 'CASH') cashAmt += amt;
                        else if (bill.payment_mode === 'CARD') cardAmt += amt;
                        else if (bill.payment_mode === 'UPI') upiAmt += amt;
                    }

                    // Backend permission mock (default true)
                    const canAlter = bill.can_alter ?? true;
                    const canCancel = bill.can_cancel ?? true;
                    const canDelete = bill.can_delete ?? true;

                    const dateObj = new Date(bill.createdAt || bill.delivery_date || new Date().toISOString());

                    let recordType = 'SALES_BILL';
                    if (isStrictKot) {
                        recordType = 'KOT';
                    } else if ((bill.kots && bill.kots.length > 0) || bill.table_no) {
                        recordType = 'KOT_BILL';
                    }

                    return {
                        id: bill._id || `rec-${index}`,
                        type: recordType,
                        kot_no: bill.kots && bill.kots.length > 0 ? bill.kots[0].kot_number : (bill.kot_number || (isStrictKot ? bill.bill_number : null) || '-'),
                        bill_no: bill.bill_number,
                        date: dateObj.toISOString(),
                        time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                        customer_name: bill.customer_name || '-',
                        mobile_no: bill.customer_phone || '-',
                        captain: bill.captain_name || 'N/A',
                        waiter: bill.waiter_name || 'N/A',
                        table: recordType === 'SALES_BILL' ? 'N/A' : (bill.table_no || (bill.type === 'PARTY_ORDER' ? 'Party' : bill.type) || 'N/A'),
                        amount: bill.grand_total || bill.sub_total || 0,
                        cashAmt,
                        cardAmt,
                        upiAmt,
                        status: isStrictKot ? 'Saved' : (bill.status === 'PAID' ? 'Paid' : 'Unpaid'),
                        canAlter,
                        canCancel,
                        canDelete
                    };
                });
                
                // Sort newest first
                fetchedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
                setRecords(fetchedRecords);
            }
        } catch (e) {
            console.error("Failed to fetch records", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
        fetchRecords();
    }, [fetchRecords]);

    const handleReset = () => {
        setSalesType('ALL');
        setFilterBy('ALL');
        setSelectedCaptain('ALL');
        setSelectedWaiter('ALL');
        setFromDate(new Date().toISOString().split('T')[0]);
        setToDate(new Date().toISOString().split('T')[0]);
        setCurrentPage(1);
    };

    // Filter Logic
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            // Date filtering
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            if (recordDate < fromDate || recordDate > toDate) return false;

            if (salesType !== 'ALL' && record.type !== salesType) return false;
            
            if (filterBy === 'CAPTAIN') {
                if (selectedCaptain !== 'ALL' && record.captain !== selectedCaptain) return false;
            } else if (filterBy === 'WAITER') {
                if (selectedWaiter !== 'ALL' && record.waiter !== selectedWaiter) return false;
            }

            return true;
        });
    }, [records, salesType, filterBy, fromDate, toDate, selectedCaptain, selectedWaiter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const paginatedRecords = filteredRecords.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    // Date Range Summary (uses filteredRecords)
    const rangeKotCount = filteredRecords.filter(r => r.type === 'KOT' || r.type === 'KOT_BILL').length;
    const rangeBillCount = filteredRecords.filter(r => r.type === 'SALES_BILL' || r.type === 'KOT_BILL').length;
    const rangePendingKotCount = filteredRecords.filter(r => r.type === 'KOT' && r.status === 'Saved').length; 
    
    const rangeSalesAmount = filteredRecords.filter(r => r.type === 'SALES_BILL' || r.type === 'KOT_BILL').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const rangeCashAmount = filteredRecords.filter(r => r.type === 'SALES_BILL' || r.type === 'KOT_BILL').reduce((acc, r) => acc + (parseFloat(r.cashAmt) || 0), 0);
    const rangeBankAmount = filteredRecords.filter(r => r.type === 'SALES_BILL' || r.type === 'KOT_BILL').reduce((acc, r) => acc + (parseFloat(r.cardAmt) || 0) + (parseFloat(r.upiAmt) || 0), 0);

    const exportToCSV = () => {
        if (!filteredRecords.length) {
            alert('No records to export');
            return;
        }
        
        const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id));
        const headers = activeColumns.map(c => c.label);
        
        const rows = filteredRecords.map((record, i) => {
            const formattedType = record.type === 'KOT' ? 'KOT' : record.type === 'KOT_BILL' ? 'KOT Bill' : 'Sales Bill';
            const formattedNumber = formatDisplayNumber(record.type, record.type === 'KOT' ? record.kot_no : record.bill_no);
            const dateStr = new Date(record.date).toLocaleDateString('en-GB');
            
            return activeColumns.map(col => {
                switch(col.id) {
                    case 'sno': return i + 1;
                    case 'type': return formattedType;
                    case 'kot_bill_no': return formattedNumber;
                    case 'date': return dateStr;
                    case 'time': return record.time || '-';
                    case 'customer_name': return record.customer_name || '-';
                    case 'mobile_no': return record.mobile_no || '-';
                    case 'captain': return record.captain || 'N/A';
                    case 'waiter': return record.waiter || 'N/A';
                    case 'table': return record.table || 'N/A';
                    case 'amount': return record.payment_mode === 'NA' ? 'NA' : parseFloat(record.amount || 0).toFixed(2);
                    case 'cash_amount': return (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : parseFloat(record.cashAmt || 0).toFixed(2)) : '-';
                    case 'card_amount': return (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : parseFloat(record.cardAmt || 0).toFixed(2)) : '-';
                    case 'upi_amount': return (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : parseFloat(record.upiAmt || 0).toFixed(2)) : '-';
                    default: return '-';
                }
            }).map(cell => `"${cell}"`).join(',');
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Sales_Display_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (!filteredRecords.length) {
            alert('No records to export');
            return;
        }

        const doc = new jsPDF('landscape');
        
        doc.setFontSize(18);
        doc.text('Sales Display Report', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
        
        const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id));
        const head = [activeColumns.map(c => c.label)];
        
        const body = filteredRecords.map((record, i) => {
            const formattedType = record.type === 'KOT' ? 'KOT' : record.type === 'KOT_BILL' ? 'KOT Bill' : 'Sales Bill';
            const formattedNumber = formatDisplayNumber(record.type, record.type === 'KOT' ? record.kot_no : record.bill_no);
            const dateStr = new Date(record.date).toLocaleDateString('en-GB');
            
            return activeColumns.map(col => {
                switch(col.id) {
                    case 'sno': return i + 1;
                    case 'type': return formattedType;
                    case 'kot_bill_no': return formattedNumber;
                    case 'date': return dateStr;
                    case 'time': return record.time || '-';
                    case 'customer_name': return record.customer_name || '-';
                    case 'mobile_no': return record.mobile_no || '-';
                    case 'captain': return record.captain || 'N/A';
                    case 'waiter': return record.waiter || 'N/A';
                    case 'table': return record.table || 'N/A';
                    case 'amount': return record.payment_mode === 'NA' ? 'NA' : parseFloat(record.amount || 0).toFixed(2);
                    case 'cash_amount': return (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : parseFloat(record.cashAmt || 0).toFixed(2)) : '-';
                    case 'card_amount': return (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : parseFloat(record.cardAmt || 0).toFixed(2)) : '-';
                    case 'upi_amount': return (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : parseFloat(record.upiAmt || 0).toFixed(2)) : '-';
                    default: return '-';
                }
            });
        });

        autoTable(doc, {
            startY: 36,
            head: head,
            body: body,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        doc.save(`Sales_Display_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`);
    };

    const handlePrint = () => {
        const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.id));
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        
        const rows = filteredRecords.map((record, i) => {
            const formattedType = record.type === 'KOT' ? 'KOT' : record.type === 'KOT_BILL' ? 'KOT Bill' : 'Sales Bill';
            const formattedNumber = formatDisplayNumber(record.type, record.type === 'KOT' ? record.kot_no : record.bill_no);
            const dateStr = new Date(record.date).toLocaleDateString('en-GB');
            return `<tr>${activeColumns.map(col => {
                let val = '-';
                switch(col.id) {
                    case 'sno': val = i + 1; break;
                    case 'type': val = formattedType; break;
                    case 'kot_bill_no': val = formattedNumber; break;
                    case 'date': val = dateStr; break;
                    case 'time': val = record.time || '-'; break;
                    case 'customer_name': val = record.customer_name || '-'; break;
                    case 'mobile_no': val = record.mobile_no || '-'; break;
                    case 'captain': val = record.captain || 'N/A'; break;
                    case 'waiter': val = record.waiter || 'N/A'; break;
                    case 'table': val = record.table || 'N/A'; break;
                    case 'amount': val = record.payment_mode === 'NA' ? 'NA' : `Rs.${parseFloat(record.amount||0).toFixed(2)}`; break;
                    case 'cash_amount': val = (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : `Rs.${parseFloat(record.cashAmt||0).toFixed(2)}`) : '-'; break;
                    case 'card_amount': val = (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : `Rs.${parseFloat(record.cardAmt||0).toFixed(2)}`) : '-'; break;
                    case 'upi_amount': val = (record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : `Rs.${parseFloat(record.upiAmt||0).toFixed(2)}`) : '-'; break;
                    default: val = '-';
                }
                return `<td>${val}</td>`;
            }).join('')}</tr>`;
        }).join('');

        const totalSales = filteredRecords.filter(r => r.type === 'SALES_BILL' || r.type === 'KOT_BILL').reduce((a,r) => a + parseFloat(r.amount||0), 0);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sales Display Report</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; padding: 16px; }
                    h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
                    .meta { font-size: 11px; color: #555; margin-bottom: 4px; }
                    .summary { display: flex; gap: 24px; margin: 12px 0; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
                    .summary span { font-size: 12px; font-weight: bold; }
                    .summary .label { color: #64748b; font-weight: normal; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    th { background: #0f172a; color: white; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 7px 8px; text-align: left; }
                    td { padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
                    tr:nth-child(even) td { background: #f8fafc; }
                    .total-row td { font-weight: bold; background: #fff7ed; border-top: 2px solid #f97316; }
                    @page { size: landscape; margin: 10mm; }
                </style>
            </head>
            <body>
                <h1>Sales Display Report</h1>
                <p class="meta">Generated on: ${new Date().toLocaleString('en-GB')} &nbsp;|&nbsp; From: ${fromDate} To: ${toDate} &nbsp;|&nbsp; Total Records: ${filteredRecords.length}</p>
                <div class="summary">
                    <span><span class="label">KOT: </span>${rangeKotCount}</span>
                    <span><span class="label">Bills: </span>${rangeBillCount}</span>
                    <span><span class="label">Today Sales: </span>Rs.${rangeSalesAmount.toFixed(2)}</span>
                    <span><span class="label">Cash: </span>Rs.${rangeCashAmount.toFixed(2)}</span>
                    <span><span class="label">Bank: </span>Rs.${rangeBankAmount.toFixed(2)}</span>
                </div>
                <table>
                    <thead><tr>${activeColumns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="${activeColumns.length - 1}" style="text-align:right">TOTAL SALES</td>
                            <td>Rs.${totalSales.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    const headerActions = (
        <div className="flex items-center gap-2">
            <button 
                onClick={exportToCSV}
                className="btn-export excel">
                <FileSpreadsheet size={16} /> Excel
            </button>
            <button 
                onClick={exportToPDF}
                className="btn-export pdf">
                <FileIcon size={16} /> PDF
            </button>
            <button 
                onClick={handlePrint}
                className="btn-export print">
                <Printer size={16} /> Print
            </button>
        </div>
    );

    return (
        <div className="dashboard-layout bg-slate-50 print:bg-white print:block">
            <div className="print:hidden">
                <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            </div>
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay print:hidden" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            
            <main className="dashboard-main flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible print:block">
                <div className="print:hidden">
                    <Header toggleSidebar={toggleSidebar} title="SALES DISPLAY" actions={headerActions} />
                </div>
                
                <div className="flex flex-col h-full bg-slate-50 relative flex-1 overflow-y-auto print:overflow-visible print:h-auto print:bg-white print:block">
                    
                    <div className="p-6 space-y-4 flex-1 w-full mx-auto max-w-[1400px] print:p-0 print:max-w-none">
                        
                        {/* Filters Row */}
                        <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 print:hidden">
                            {/* Type Filter */}
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                                <label className="text-[12px] font-bold text-slate-700">Sales Type</label>
                                <select 
                                    value={salesType} 
                                    onChange={(e) => { setSalesType(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 h-[42px] border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer bg-white"
                                >
                                    <option value="ALL">All</option>
                                    <option value="KOT">KOT</option>
                                    <option value="KOT_BILL">KOT Bill</option>
                                    <option value="SALES_BILL">Sales Bill</option>
                                </select>
                            </div>

                            {/* Filter By */}
                            <div className="flex flex-col gap-1.5 flex-[1.5] min-w-[240px]">
                                <label className="text-[12px] font-bold text-slate-700">Filter By</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={filterBy} 
                                        onChange={(e) => { 
                                            setFilterBy(e.target.value); 
                                            setSelectedCaptain('ALL');
                                            setSelectedWaiter('ALL');
                                            setCurrentPage(1); 
                                        }}
                                        className="w-[120px] px-3 h-[42px] border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer bg-white"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="CAPTAIN">Captain</option>
                                        <option value="WAITER">Waiter</option>
                                    </select>
                                    
                                    {filterBy === 'CAPTAIN' && (
                                        <select 
                                            value={selectedCaptain} 
                                            onChange={(e) => { setSelectedCaptain(e.target.value); setCurrentPage(1); }}
                                            className="flex-1 px-3 h-[42px] border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer bg-white"
                                        >
                                            <option value="ALL">All Captains</option>
                                            {captains.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    )}
                                    
                                    {filterBy === 'WAITER' && (
                                        <select 
                                            value={selectedWaiter} 
                                            onChange={(e) => { setSelectedWaiter(e.target.value); setCurrentPage(1); }}
                                            className="flex-1 px-3 h-[42px] border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer bg-white"
                                        >
                                            <option value="ALL">All Waiters</option>
                                            {waiters.map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                    )}

                                    {filterBy === 'ALL' && (
                                        <div className="flex-1 h-[42px] border border-slate-100 bg-slate-50 rounded-lg flex items-center px-3">
                                            <span className="text-[13px] text-slate-400 font-medium">Select type first</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                                <label className="text-[12px] font-bold text-slate-700">From Date</label>
                                <input 
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 h-[42px] border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                                <label className="text-[12px] font-bold text-slate-700">To Date</label>
                                <input 
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                                    className="w-full px-3 h-[42px] border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer"
                                />
                            </div>

                            {/* Action / Refresh Buttons */}
                            <div className="flex flex-col gap-1.5 ml-auto">
                                <label className="text-[12px] font-bold text-transparent select-none pointer-events-none">Actions</label>
                                <div className="flex items-center gap-3 relative">
                                    <button onClick={handleReset} className="flex items-center gap-2 px-4 h-[42px] border border-slate-200 bg-white text-slate-700 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                        <RefreshCw size={15} /> Refresh
                                    </button>
                                    
                                    <div className="relative column-filter-container">
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowColumnFilter(!showColumnFilter);
                                            }} 
                                            className="flex items-center gap-2 px-4 h-[42px] border border-slate-200 bg-white text-slate-700 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                        >
                                            <Settings size={15} /> Action <ChevronDown size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 print:hidden">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                    <CalendarDays size={30} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Total KOT</span>
                                    <span className="text-3xl font-black text-slate-800 leading-none mt-2">{rangeKotCount}</span>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                    <FileText size={30} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Total Bills</span>
                                    <span className="text-3xl font-black text-slate-800 leading-none mt-2">{rangeBillCount}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                    <ClipboardList size={30} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Pending KOT</span>
                                    <span className="text-3xl font-black text-slate-800 leading-none mt-2">{rangePendingKotCount}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                                    <DollarSign size={30} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Today Sales</span>
                                    <span className="text-2xl font-black text-green-600 leading-none mt-2">₹ {rangeSalesAmount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                    <Landmark size={30} />
                                </div>
                                <div className="flex flex-col gap-2 w-full max-w-[120px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">CASH</span>
                                        <span className="text-[15px] font-black text-green-600">₹ {rangeCashAmount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">BANK</span>
                                        <span className="text-[15px] font-black text-purple-600">₹ {rangeBankAmount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col pb-4 flex-1 print:border-none print:shadow-none print:overflow-visible print:block">
                            <div className="overflow-x-auto custom-scrollbar flex-1 print:overflow-visible print:block">
                                <table className="w-full text-left border-collapse min-w-[1500px] print:min-w-full print:text-[10px]">
                                    <thead className="sticky top-0 bg-white z-10 shadow-sm print:static">

                                        <tr className="border-b border-slate-200">
                                            {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => (
                                                <th key={col.id} className="py-4 px-5 text-[12px] font-bold text-slate-800 uppercase tracking-wide bg-slate-50/50">
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={visibleColumns.length} className="py-16 text-center text-slate-400">
                                                    <RefreshCw className="animate-spin mx-auto mb-3 text-blue-500" size={28} />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Loading Records...</span>
                                                </td>
                                            </tr>
                                        ) : paginatedRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={visibleColumns.length} className="py-16 text-center text-slate-400">
                                                    <FileText className="mx-auto mb-3 text-slate-300" size={36} />
                                                    <span className="text-xs font-bold uppercase tracking-widest">No Records Found</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedRecords.map((record, index) => (
                                                <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                                                    {visibleColumns.includes('sno') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-600">
                                                            {String((currentPage - 1) * recordsPerPage + index + 1)}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('type') && (
                                                        <td className="py-3.5 px-5">
                                                            <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wide ${record.type === 'KOT' ? 'bg-orange-50 text-orange-600 border border-orange-200/50' : record.type === 'KOT_BILL' ? 'bg-purple-50 text-purple-600 border border-purple-200/50' : 'bg-green-50 text-green-600 border border-green-200/50'}`}>
                                                                {record.type === 'KOT' ? 'KOT' : record.type === 'KOT_BILL' ? 'KOT Bill' : 'Sales Bill'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('kot_bill_no') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-800 whitespace-nowrap">
                                                            {formatDisplayNumber(record.type, record.type === 'KOT' ? record.kot_no : record.bill_no)}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('date') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-600 whitespace-nowrap">
                                                            {new Date(record.date).toLocaleDateString('en-GB')}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('time') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-600 whitespace-nowrap">
                                                            {record.time}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('customer_name') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-700">{record.customer_name}</td>
                                                    )}
                                                    {visibleColumns.includes('mobile_no') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-700">{record.mobile_no}</td>
                                                    )}
                                                    {visibleColumns.includes('captain') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-700">{record.captain}</td>
                                                    )}
                                                    {visibleColumns.includes('waiter') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-700">{record.waiter}</td>
                                                    )}
                                                    {visibleColumns.includes('table') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-slate-700">{record.table}</td>
                                                    )}
                                                    {visibleColumns.includes('amount') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-black text-slate-800">
                                                            {record.payment_mode === 'NA' ? 'NA' : `₹ ${parseFloat(record.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('cash_amount') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-green-600">
                                                            {(record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : `₹ ${parseFloat(record.cashAmt).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`) : '-'}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('card_amount') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-blue-600">
                                                            {(record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : `₹ ${parseFloat(record.cardAmt).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`) : '-'}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('upi_amount') && (
                                                        <td className="py-3.5 px-5 text-[13px] font-bold text-purple-600">
                                                            {(record.type === 'SALES_BILL' || record.type === 'KOT_BILL') ? (record.payment_mode === 'NA' ? 'NA' : `₹ ${parseFloat(record.upiAmt).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`) : '-'}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('action') && (
                                                        <td className="py-3.5 px-5 relative">
                                                            {(record.canAlter || record.canCancel || record.canDelete) ? (
                                                                <div className="inline-block action-dropdown-container">
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenActionId(openActionId === record.id ? null : record.id);
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 rounded-lg text-[12px] font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                                                                    >
                                                                        Action <ChevronDown size={14} className={`transform transition-transform ${openActionId === record.id ? 'rotate-180' : ''}`} />
                                                                    </button>

                                                                    {openActionId === record.id && (
                                                                        <div className="absolute right-5 top-full mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2">
                                                                            {record.canAlter && (
                                                                                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                                                                    <Edit size={15} /> Alter
                                                                                </button>
                                                                            )}
                                                                            {record.canCancel && (
                                                                                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition-colors">
                                                                                    <XCircle size={15} /> Cancel
                                                                                </button>
                                                                            )}
                                                                            {record.canDelete && (
                                                                                <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                                                                                    <Trash2 size={15} /> Delete
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[12px] font-medium text-slate-400 italic">No Action</span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="pt-4 px-6 mt-auto flex items-center justify-between border-t border-slate-100">
                                <span className="text-[13px] font-bold text-slate-500">
                                    Showing {filteredRecords.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} to {Math.min(currentPage * recordsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const page = idx + 1;
                                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                            return (
                                                <button 
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all shadow-sm ${currentPage === page ? 'bg-orange-500 text-white border-orange-500 hover:shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow'}`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="text-slate-400 px-2 text-sm font-bold">...</span>;
                                        }
                                        return null;
                                    })}
                                    
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </main>

            {/* Column Selection Modal */}
            {showColumnFilter && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 column-filter-container">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-[15px] font-bold text-slate-800">Select Columns</h3>
                            <button 
                                onClick={() => setShowColumnFilter(false)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {ALL_COLUMNS.map(col => (
                                <div 
                                    key={col.id} 
                                    onClick={() => setVisibleColumns(prev => 
                                        prev.includes(col.id) 
                                            ? prev.filter(id => id !== col.id)
                                            : [...prev, col.id]
                                    )}
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-slate-100"
                                >
                                    <span className="text-[14px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{col.label}</span>
                                    <div className={`w-[20px] h-[20px] rounded-[6px] flex items-center justify-center border transition-all ${visibleColumns.includes(col.id) ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20' : 'border-slate-300'}`}>
                                        {visibleColumns.includes(col.id) && <CheckSquare size={14} className="text-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
                            <button 
                                onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
                                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-[14px] font-bold hover:bg-slate-100 hover:border-slate-300 transition-all"
                            >
                                Reset
                            </button>
                            <button 
                                onClick={() => setShowColumnFilter(false)}
                                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-[14px] font-bold hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisplayPage;

