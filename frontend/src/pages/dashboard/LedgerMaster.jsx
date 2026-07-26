import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';
import {
    Save, X, Calendar, User, Phone, Mail, Hash, CreditCard,
    MapPin, Building, Briefcase, ChevronLeft, Layers,
    ChevronDown, Search, PlusCircle, Edit, Trash2,
    Loader2, AlertCircle, CheckCircle2, XCircle, ChevronRight,
    ArrowRight, Globe, Info, Clock, MoreVertical, RefreshCw, FileText, Printer, Download, Settings
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { STANDARD_GROUPS, getNatureForGroup } from '../../utils/standardGroups';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const API = import.meta.env.VITE_API_URL;
const getToken = () => JSON.parse(localStorage.getItem('user'))?.token;

const ALL_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'print_name', label: 'Print Name' },
    { key: 'under', label: 'Under' },
    { key: 'opening_balance', label: 'Opening Balance' },
    { key: 'mobile1', label: 'Mobile No 1' },
    { key: 'mobile2', label: 'Mobile No 2' },
    { key: 'address1', label: 'Address Line 1' },
    { key: 'address2', label: 'Address Line 2' },
    { key: 'address3', label: 'Address Line 3' },
    { key: 'address4', label: 'Address Line 4' },
    { key: 'address5', label: 'Address Line 5' },
    { key: 'gst', label: 'GST Number' },
    { key: 'reg_type', label: 'Registration Type' },
    { key: 'state', label: 'State' },
    { key: 'action', label: 'Action' }
];

const DEFAULT_COLUMNS = ['name', 'print_name', 'under', 'opening_balance', 'mobile1', 'address1', 'gst', 'reg_type', 'state', 'action'];

const mapUIGroupToStandard = (uiGroup) => {
    switch (uiGroup) {
        case 'Purchase Account': return 'Purchase Accounts';
        case 'Sales Account': return 'Sales Accounts';
        case 'Expenses': return 'Indirect Expenses';
        case 'Income': return 'Indirect Incomes';
        case 'Assets': return 'Current Assets';
        case 'Liabilities': return 'Current Liabilities';
        default: return uiGroup;
    }
};

const mapStandardGroupToUI = (stdGroup) => {
    switch (stdGroup) {
        case 'Purchase Accounts': return 'Purchase Account';
        case 'Sales Accounts': return 'Sales Account';
        case 'Indirect Expenses':
        case 'Direct Expenses':
            return 'Expenses';
        case 'Indirect Incomes':
        case 'Direct Incomes':
            return 'Income';
        case 'Current Assets': return 'Assets';
        case 'Current Liabilities': return 'Liabilities';
        default: return stdGroup;
    }
};

export default function LedgerMaster({ defaultOpenCreate = false }) {
    const nameInputRef = useRef(null);
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [groupFilter, setGroupFilter] = useState('All Groups');
    const [activeTypeFilter, setActiveTypeFilter] = useState('All');

    // Column selection states
    const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
    const [tempVisibleColumns, setTempVisibleColumns] = useState(DEFAULT_COLUMNS);
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);

    // Context menu states
    const [activeActionMenuId, setActiveActionMenuId] = useState(null);

    // Form/Drawer states
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        print_name: '',
        group: 'Sundry Debtors',
        opening_balance: '',
        balance_type: 'DR',
        phone: '',
        mobile2: '',
        email: '',
        gstin: '',
        pan_number: '',
        registration_type: 'Regular',
        state: '',
        address_line_1: '',
        address_line_2: '',
        address_line_3: '',
        address_line_4: '',
        address_line_5: '',
        bank_name: '',
        bank_account_number: '',
        ifsc_code: '',
        branch: '',
        account_holder_name: '',
        same_as_billing: true,
        billing_address: '',
        shipping_address: '',
        party_category: ''
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchLedgers = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API}/ledgers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLedgers(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch ledgers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedgers();
        if (defaultOpenCreate) {
            resetForm();
            setShowDrawer(true);
        }
    }, [defaultOpenCreate]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const n = !isCollapsed;
            setIsCollapsed(n);
            localStorage.setItem('sidebarCollapsed', n);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return alert("Name is required");
        if (!formData.group) return alert("Group is required");

        setSaving(true);
        setError('');
        try {
            const token = getToken();
            const url = isEditing ? `${API}/ledgers/${formData._id}` : `${API}/ledgers`;
            const method = isEditing ? 'PUT' : 'POST';

            // Sync print name if empty
            const payload = {
                ...formData,
                print_name: formData.print_name || formData.name
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                resetForm();
                fetchLedgers();
                setTimeout(() => {
                    if (nameInputRef.current) nameInputRef.current.focus();
                }, 100);
            } else {
                setError(data.error || 'Failed to save ledger');
            }
        } catch (err) {
            setError('Failed to save data. ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (ledger) => {
        setFormData({
            ...ledger,
            print_name: ledger.print_name || ledger.name,
            mobile2: ledger.mobile2 || '',
            address_line_1: ledger.address_line_1 || '',
            address_line_2: ledger.address_line_2 || '',
            address_line_3: ledger.address_line_3 || '',
            address_line_4: ledger.address_line_4 || '',
            address_line_5: ledger.address_line_5 || '',
            bank_name: ledger.bank_name || '',
            bank_account_number: ledger.bank_account_number || '',
            ifsc_code: ledger.ifsc_code || '',
            branch: ledger.branch || ''
        });
        setIsEditing(true);
        setShowDrawer(true);
        setActiveActionMenuId(null);
    };

    const handleDelete = async (ledger) => {
        const id = ledger._id || ledger.id;
        if (!window.confirm("Are you sure you want to delete this ledger?")) return;
        try {
            const token = getToken();
            const res = await fetch(`${API}/ledgers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchLedgers();
                setActiveActionMenuId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const token = getToken();
            const res = await fetch(`${API}/ledgers/${id}/toggle-status`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchLedgers();
                setActiveActionMenuId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            print_name: '',
            group: 'Sundry Debtors',
            opening_balance: '',
            balance_type: 'DR',
            phone: '',
            mobile2: '',
            email: '',
            gstin: '',
            pan_number: '',
            registration_type: 'Regular',
            state: '',
            address_line_1: '',
            address_line_2: '',
            address_line_3: '',
            address_line_4: '',
            address_line_5: '',
            bank_name: '',
            bank_account_number: '',
            ifsc_code: '',
            branch: '',
            account_holder_name: '',
            same_as_billing: true,
            billing_address: '',
            shipping_address: '',
            party_category: ''
        });
        setIsEditing(false);
        setError('');
    };

    const exportToCSV = () => {
        if (!filteredLedgers.length) {
            alert('No records to export');
            return;
        }
        const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key) && c.key !== 'action');
        const headers = activeColumns.map(c => c.label);

        const rows = filteredLedgers.map((l, index) => {
            return activeColumns.map(col => {
                switch (col.key) {
                    case 'name': return l.name;
                    case 'print_name': return l.print_name || l.name;
                    case 'under': return l.group;
                    case 'opening_balance': return `${l.opening_balance || 0} ${l.balance_type || 'DR'}`;
                    case 'mobile1': return l.phone || '—';
                    case 'mobile2': return l.mobile2 || '—';
                    case 'address1': return l.address_line_1 || '—';
                    case 'address2': return l.address_line_2 || '—';
                    case 'address3': return l.address_line_3 || '—';
                    case 'address4': return l.address_line_4 || '—';
                    case 'address5': return l.address_line_5 || '—';
                    case 'gst': return l.gstin || '—';
                    case 'reg_type': return l.registration_type || 'Regular';
                    case 'state': return l.state || '—';
                    default: return '';
                }
            }).map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
        });

        const filterText = `Filters - Group: ${groupFilter} | Active Type: ${activeTypeFilter}${searchTerm ? ` | Search: "${searchTerm}"` : ''}`;
        const csvContent = "data:text/csv;charset=utf-8," +
            "Ledger Master Report\n" +
            filterText + "\n\n" +
            headers.join(',') + "\n" + rows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Ledger_Master_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (!filteredLedgers.length) {
            alert('No records to export');
            return;
        }

        const doc = new jsPDF('landscape');

        doc.setFontSize(18);
        doc.text('Ledger Master Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);

        const filterText = `Filters - Group: ${groupFilter} | Active Type: ${activeTypeFilter}${searchTerm ? ` | Search: "${searchTerm}"` : ''}`;
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(filterText, 14, 36);

        const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key) && c.key !== 'action');
        const head = [activeColumns.map(c => c.label)];

        const body = filteredLedgers.map((l, index) => {
            return activeColumns.map(col => {
                switch (col.key) {
                    case 'name': return l.name;
                    case 'print_name': return l.print_name || l.name;
                    case 'under': return l.group;
                    case 'opening_balance': return `${l.opening_balance || 0} ${l.balance_type || 'DR'}`;
                    case 'mobile1': return l.phone || '—';
                    case 'mobile2': return l.mobile2 || '—';
                    case 'address1': return l.address_line_1 || '—';
                    case 'address2': return l.address_line_2 || '—';
                    case 'address3': return l.address_line_3 || '—';
                    case 'address4': return l.address_line_4 || '—';
                    case 'address5': return l.address_line_5 || '—';
                    case 'gst': return l.gstin || '—';
                    case 'reg_type': return l.registration_type || 'Regular';
                    case 'state': return l.state || '—';
                    default: return '';
                }
            });
        });

        autoTable(doc, {
            startY: 42,
            head: head,
            body: body,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        doc.save(`Ledger_Master_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`);
    };

    // Filter Logic
    const filteredLedgers = ledgers.filter(l => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || (
            l.name.toLowerCase().includes(term) ||
            (l.print_name || '').toLowerCase().includes(term) ||
            (l.phone || '').toLowerCase().includes(term) ||
            (l.mobile2 || '').toLowerCase().includes(term) ||
            (l.gstin || '').toLowerCase().includes(term)
        );

        const matchesGroup = groupFilter === 'All Groups' || l.group === groupFilter;

        const isActive = l.is_active !== false;
        const matchesActive = activeTypeFilter === 'All' ? true : (activeTypeFilter === 'Active' ? isActive : !isActive);

        return matchesSearch && matchesGroup && matchesActive;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredLedgers.length / pageSize);
    const paginatedLedgers = filteredLedgers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Unique groups for filtering
    const availableGroupsForFilter = [
        'All Groups',
        'Sundry Debtors',
        'Sundry Creditors',
        'Bank Accounts',
        'Cash-in-Hand',
        'Duties & Taxes',
        'Purchase Accounts',
        'Sales Accounts',
        'Direct Expenses',
        'Indirect Expenses'
    ];

    const columnVisible = (colKey) => visibleColumns.includes(colKey);

    const toggleTempColumn = (colKey) => {
        if (tempVisibleColumns.includes(colKey)) {
            setTempVisibleColumns(tempVisibleColumns.filter(c => c !== colKey));
        } else {
            setTempVisibleColumns([...tempVisibleColumns, colKey]);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main bg-slate-50/50">
                <style>{`
                    .filter-label {
                        font-size: 10px;
                        font-weight: 800;
                        color: #64748B;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 6px;
                    }
                    .ledger-action-menu {
                        position: absolute;
                        right: 24px;
                        margin-top: 4px;
                        background: white;
                        border: 1px solid #E2E8F0;
                        border-radius: 8px;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                        z-index: 40;
                        width: 130px;
                    }
                    .ledger-action-menu button {
                        width: 100%;
                        text-align: left;
                        padding: 8px 12px;
                        font-size: 12px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .ledger-action-menu button:hover {
                        background: #F8FAFC;
                    }
                    @media print {
                        @page { size: landscape; margin: 10mm; }
                        body, html, #root {
                            background: white !important;
                            height: auto !important;
                            min-height: 0 !important;
                            overflow: visible !important;
                            -webkit-print-color-adjust: exact;
                        }
                        .no-print, aside, nav, .sidebar, .mobile-overlay {
                            display: none !important;
                        }
                        .dashboard-layout {
                            display: block !important;
                            height: auto !important;
                            overflow: visible !important;
                        }
                        .dashboard-main {
                            display: block !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            height: auto !important;
                            min-height: 0 !important;
                            width: 100% !important;
                            background: white !important;
                            overflow: visible !important;
                        }
                        .dashboard-content {
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            overflow: visible !important;
                        }
                        .bg-white.rounded-xl.border.border-slate-200.shadow-sm.overflow-hidden.mb-6 {
                            border: none !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                            overflow: visible !important;
                        }
                        .overflow-x-auto, .overflow-hidden, [class*="overflow-"] {
                            overflow: visible !important;
                        }
                        table {
                            width: 100% !important;
                            page-break-inside: auto;
                        }
                        tr {
                            page-break-inside: avoid;
                            page-break-after: auto;
                        }
                        thead {
                            display: table-header-group;
                        }
                    }
                `}</style>

                {/* Header Section */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shadow-sm no-print">
                    <h2 className="text-xl font-bold text-black tracking-tight">Ledger Master</h2>
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn-export excel" onClick={exportToCSV} title="Export to Excel">
                            <Download size={14} />
                            <span className="text-[10px] uppercase font-black text-emerald-500">Excel</span>
                        </button>
                        <button type="button" className="btn-export pdf" onClick={exportToPDF} title="Export to PDF">
                            <Download size={14} />
                            <span className="text-[10px] uppercase font-black text-rose-500">PDF</span>
                        </button>
                        <button type="button" className="btn-export print" onClick={() => window.print()} title="Print">
                            <Printer size={14} />
                            <span className="text-[10px] uppercase font-black text-[#f97316]">Print</span>
                        </button>
                        <button
                            onClick={() => {
                                setTempVisibleColumns(visibleColumns);
                                setShowColumnDropdown(true);
                            }}
                            className="px-4 py-1.5 bg-[#0f172a] hover:bg-slate-900 border border-[#0f172a] rounded-[4px] font-bold text-[13px] uppercase tracking-wider flex items-center gap-1.5 transition-all text-white shadow-sm cursor-pointer"
                        >
                            <Settings size={14} /> COLUMN SETTINGS
                        </button>
                        <button onClick={() => { resetForm(); setShowDrawer(true); }} className="btn-action-add">
                            <PlusCircle size={16} /> Create Ledger
                        </button>
                        <button onClick={() => navigate('/dashboard/self-service/home')} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm">
                            <X size={14} /> CLOSE
                        </button>
                    </div>
                </div>

                <div className="dashboard-content print-section">
                    {/* Print Only Header */}
                    <div className="hidden print:block mb-6">
                        <h2 className="text-2xl font-bold text-black mb-2">Ledger Master Report</h2>
                        <p className="text-sm text-slate-500 mb-1">Generated on: {new Date().toLocaleString('en-GB')}</p>
                        <p className="text-sm text-slate-500 font-semibold">
                            Filters - Group: {groupFilter} | Active Type: {activeTypeFilter}
                            {searchTerm && ` | Search: "${searchTerm}"`}
                        </p>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="toolbar-premium mb-4">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search by Name, Mobile No, GST..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            <select
                                value={groupFilter}
                                onChange={e => { setGroupFilter(e.target.value); setCurrentPage(1); }}
                                className="input-premium !py-1.5 !px-3 font-bold text-slate-700 cursor-pointer"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px', minWidth: '110px' }}
                            >
                                {availableGroupsForFilter.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>

                            <select
                                value={activeTypeFilter}
                                onChange={e => { setActiveTypeFilter(e.target.value); setCurrentPage(1); }}
                                className="input-premium !py-1.5 !px-3 font-bold text-slate-700 cursor-pointer"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px', minWidth: '110px' }}
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Deactive">Deactive</option>
                            </select>
                            
                            <span className="whitespace-nowrap text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                TOTAL : {filteredLedgers.length}
                            </span>
                        </div>

                        {/* Columns Selection Dropdown */}
                        <div>

                            {showColumnDropdown && (
                                <>
                                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999]" onClick={() => setShowColumnDropdown(false)} />
                                    <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl border-l border-slate-200 z-[10000] flex flex-col animate-in slide-in-from-right duration-300">
                                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Column Settings</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select columns to display</p>
                                            </div>
                                            <button onClick={() => setShowColumnDropdown(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                            {ALL_COLUMNS.map(col => (
                                                <label key={col.key} className="flex items-center gap-3 cursor-pointer group py-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={tempVisibleColumns.includes(col.key)}
                                                        onChange={() => toggleTempColumn(col.key)}
                                                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                                                        style={{ accentColor: '#f97316' }}
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-orange-500 transition-colors uppercase tracking-tight">{col.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTempVisibleColumns(DEFAULT_COLUMNS)}
                                                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                                            >
                                                RESET
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVisibleColumns(tempVisibleColumns);
                                                    setShowColumnDropdown(false);
                                                }}
                                                className="flex-1 py-2 text-xs font-bold text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors"
                                            >
                                                APPLY
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="table-premium">
                                <thead>
                                    <tr className="bg-[#0b1727] border-b border-slate-200 text-[10px] font-black text-[#f97316] uppercase tracking-widest">
                                        {columnVisible('action') && <th style={{ width: '60px', textAlign: 'center' }}>Action</th>}
                                        {columnVisible('name') && <th>Name</th>}
                                        {columnVisible('print_name') && <th>Print Name</th>}
                                        {columnVisible('under') && <th>Group</th>}
                                        {columnVisible('opening_balance') && <th>Opening Balance</th>}
                                        {columnVisible('mobile1') && <th>Mobile 1</th>}
                                        {columnVisible('mobile2') && <th>Mobile 2</th>}
                                        {columnVisible('address1') && <th>Address Line 1</th>}
                                        {columnVisible('address2') && <th>Address Line 2</th>}
                                        {columnVisible('address3') && <th>Address Line 3</th>}
                                        {columnVisible('address4') && <th>Address Line 4</th>}
                                        {columnVisible('address5') && <th>Address Line 5</th>}
                                        {columnVisible('gst') && <th>GST Number</th>}
                                        {columnVisible('reg_type') && <th>Registration Type</th>}
                                        {columnVisible('state') && <th>State</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="15" className="py-12 text-center text-slate-400 font-semibold">
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={24} />
                                                Loading Ledgers...
                                            </td>
                                        </tr>
                                    ) : paginatedLedgers.length === 0 ? (
                                        <tr>
                                            <td colSpan="15" className="py-12 text-center text-slate-400 font-semibold">No ledger entries found.</td>
                                        </tr>
                                    ) : (
                                        paginatedLedgers.map((ledger) => (
                                            <tr key={ledger._id}>
                                                {columnVisible('action') && (
                                                    <td className="w-10 text-center">
                                                        <ActionDropdown item={ledger} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                                    </td>
                                                )}
                                                {columnVisible('name') && <td>{ledger.name}</td>}
                                                {columnVisible('print_name') && <td>{ledger.print_name || ledger.name}</td>}
                                                {columnVisible('under') && <td>{ledger.group}</td>}
                                                {columnVisible('opening_balance') && (
                                                    <td>
                                                        ₹{(ledger.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {ledger.balance_type || 'DR'}
                                                    </td>
                                                )}
                                                {columnVisible('mobile1') && <td>{ledger.phone || '—'}</td>}
                                                {columnVisible('mobile2') && <td>{ledger.mobile2 || '—'}</td>}
                                                {columnVisible('address1') && <td>{ledger.address_line_1 || '—'}</td>}
                                                {columnVisible('address2') && <td>{ledger.address_line_2 || '—'}</td>}
                                                {columnVisible('address3') && <td>{ledger.address_line_3 || '—'}</td>}
                                                {columnVisible('address4') && <td>{ledger.address_line_4 || '—'}</td>}
                                                {columnVisible('address5') && <td>{ledger.address_line_5 || '—'}</td>}
                                                {columnVisible('gst') && <td>{ledger.gstin || '—'}</td>}
                                                {columnVisible('reg_type') && (
                                                    <td>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${ledger.registration_type === 'Regular' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            ledger.registration_type === 'Composition' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                                'bg-amber-50 text-amber-600 border border-amber-100'
                                                            }`}>
                                                            {ledger.registration_type || 'Regular'}
                                                        </span>
                                                    </td>
                                                )}
                                                {columnVisible('state') && <td>{ledger.state || '—'}</td>}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {!loading && filteredLedgers.length > 0 && (
                        <div className="flex justify-between items-center mt-4 no-print">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredLedgers.length)} of {filteredLedgers.length} entries
                            </span>
                            <div className="flex items-center gap-4 ml-auto">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: totalPages }).map((_, idx) => {
                                        const p = idx + 1;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className={`w-8 h-8 rounded border text-xs font-bold uppercase ${currentPage === p
                                                    ? 'bg-[#f97316] border-[#f97316] text-white shadow'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <select
                                    value={pageSize}
                                    onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
                                    className="px-2.5 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 bg-white outline-none"
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={25}>25 / page</option>
                                    <option value={50}>50 / page</option>
                                    <option value={100}>100 / page</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Overhauled Ledger Creation Form Overlay */}
                {showDrawer && (
                    <div className="fixed inset-0 bg-white z-[999] overflow-hidden flex flex-col animate-in fade-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-4 border-b border-slate-100 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black uppercase tracking-tight text-black">
                                    {isEditing ? 'LEDGER ALTERATION' : 'LEDGER CREATION'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => { resetForm(); setShowDrawer(false); }}
                                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                            >
                                <XCircle size={18} />
                                <span className="text-sm tracking-wide">CLOSE</span>
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="px-8 py-4 w-full flex flex-col overflow-y-auto">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 p-3 mb-4 rounded flex items-center gap-3 text-rose-600 font-bold text-sm shrink-0">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="flex flex-col">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                                    {/* LEFT COLUMN */}
                                    <div className="flex flex-col gap-5">
                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>NAME <span className="text-red-500">*</span></span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                ref={nameInputRef}
                                                type="text"
                                                required
                                                value={formData.name || ''}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>PRINT NAME</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.print_name || ''}
                                                onChange={e => setFormData({ ...formData, print_name: e.target.value })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>UNDER <span className="text-red-500">*</span></span>
                                                <span>:</span>
                                            </label>
                                            <select
                                                required
                                                value={mapStandardGroupToUI(formData.group) || ''}
                                                onChange={e => setFormData({ ...formData, group: mapUIGroupToStandard(e.target.value) })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold bg-white transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            >
                                                <option value="" disabled>Select Under</option>
                                                <option value="Sundry Debtors">Sundry Debtors</option>
                                                <option value="Sundry Creditors">Sundry Creditors</option>
                                                <option value="Purchase Account">Purchase Account</option>
                                                <option value="Sales Account">Sales Account</option>
                                                <option value="Cash-in-Hand">Cash-in-Hand</option>
                                                <option value="Bank Accounts">Bank Accounts</option>
                                                <option value="Duties & Taxes">Duties & Taxes</option>
                                                <option value="Expenses">Expenses</option>
                                                <option value="Income">Income</option>
                                                <option value="Assets">Assets</option>
                                                <option value="Liabilities">Liabilities</option>
                                                <option value="Capital Account">Capital Account</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>EMAIL</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>GSTIN NO</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.gstin || ''}
                                                onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold uppercase transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>OPENING BALANCE <span className="text-red-500">*</span></span>
                                                <span>:</span>
                                            </label>
                                            <div className="flex-1 flex gap-3">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={formData.opening_balance || ''}
                                                    onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                                    className="w-full rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                    style={{ border: '1px solid #FF7A50' }}
                                                />
                                                <select
                                                    value={formData.balance_type || 'DR'}
                                                    onChange={e => setFormData({ ...formData, balance_type: e.target.value })}
                                                    className="w-32 rounded-md px-3 py-1.5 bg-white font-bold text-slate-700 outline-none text-sm transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                    style={{ border: '1px solid #FF7A50' }}
                                                >
                                                    <option value="DR">Select Type</option>
                                                    <option value="DR">DR</option>
                                                    <option value="CR">CR</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mt-2">
                                            <label className="text-xs font-bold text-black uppercase">
                                                ADDRESS (MAX 5 LINES)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.address_line_1 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                                                className="w-full rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_2 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                                                className="w-full rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_3 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_3: e.target.value })}
                                                className="w-full rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_4 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_4: e.target.value })}
                                                className="w-full rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_5 || ''}
                                                onChange={e => setFormData({ ...formData, address_line_5: e.target.value })}
                                                className="w-full rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN */}
                                    <div className="flex flex-col gap-5">
                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>CELL NO</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.phone || ''}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>CELL NO 1</span>
                                                <span>:</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.mobile2 || ''}
                                                onChange={e => setFormData({ ...formData, mobile2: e.target.value })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>REGISTERED TYPE</span>
                                                <span>:</span>
                                            </label>
                                            <select
                                                value={formData.registration_type || ''}
                                                onChange={e => setFormData({ ...formData, registration_type: e.target.value })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold bg-white transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            >
                                                <option value="" disabled>Select Registered Type</option>
                                                <option value="Composition">Composition</option>
                                                <option value="Regular">Registered</option>
                                                <option value="Unregistered">Unregistered</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center">
                                            <label className="w-40 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                <span>STATE</span>
                                                <span>:</span>
                                            </label>
                                            <select
                                                value={formData.state || ''}
                                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                                className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold bg-white transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                style={{ border: '1px solid #FF7A50' }}
                                            >
                                                <option value="" disabled>Select State</option>
                                                <option value="Tamil Nadu">Tamil Nadu</option>
                                                <option value="Kerala">Kerala</option>
                                                <option value="Karnataka">Karnataka</option>
                                                <option value="Andhra Pradesh">Andhra Pradesh</option>
                                                <option value="Telangana">Telangana</option>
                                                <option value="Maharashtra">Maharashtra</option>
                                                <option value="Gujarat">Gujarat</option>
                                            </select>
                                        </div>

                                        {/* Bank Details Fieldset */}
                                        <fieldset className="rounded-md p-4 pt-3 mt-2 flex flex-col gap-5" style={{ border: '1px solid #FF7A50' }}>
                                            <legend className="px-2 text-xs font-bold uppercase" style={{ color: '#FF5722' }}>
                                                BANK DETAILS
                                            </legend>

                                            <div className="flex items-center">
                                                <label className="w-36 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                    <span>BANK NAME</span>
                                                    <span>:</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.bank_name || ''}
                                                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                                    className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                    style={{ border: '1px solid #FF7A50' }}
                                                />
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-36 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                    <span>ACCOUNT NUMBER</span>
                                                    <span>:</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.bank_account_number || ''}
                                                    onChange={e => setFormData({ ...formData, bank_account_number: e.target.value })}
                                                    className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                    style={{ border: '1px solid #FF7A50' }}
                                                />
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-36 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                    <span>IFSC CODE</span>
                                                    <span>:</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.ifsc_code || ''}
                                                    onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                                    className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold uppercase transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                    style={{ border: '1px solid #FF7A50' }}
                                                />
                                            </div>

                                            <div className="flex items-center">
                                                <label className="w-36 shrink-0 text-xs font-bold text-black uppercase flex justify-between pr-4">
                                                    <span>BRANCH</span>
                                                    <span>:</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.branch || ''}
                                                    onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                                    className="flex-1 rounded-md px-3 py-1.5 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#FF5722]"
                                                    style={{ border: '1px solid #FF7A50' }}
                                                />
                                            </div>
                                        </fieldset>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end gap-4 mt-2 pt-2 shrink-0">
                                            <button
                                                type="button"
                                                className="font-bold px-6 py-2 rounded flex items-center gap-2 transition-colors uppercase text-sm shadow-sm hover:opacity-90"
                                                style={{ backgroundColor: '#FF5722', color: 'white' }}
                                            >
                                                <FileText size={16} /> OTHER DETAILS
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="font-bold px-8 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50 uppercase text-sm shadow-sm hover:opacity-90"
                                                style={{ backgroundColor: '#FF5722', color: 'white' }}
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} SAVE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
