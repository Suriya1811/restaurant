import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';
import { 
    Save, X, Calendar, User, Phone, Mail, Hash, CreditCard, 
    MapPin, Building, Briefcase, ChevronLeft, Layers, 
    ChevronDown, Search, PlusCircle, Edit, Trash2, 
    Loader2, AlertCircle, CheckCircle2, XCircle, ChevronRight,
    ArrowRight, Globe, Info, Clock, MoreVertical, RefreshCw, FileText, Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { STANDARD_GROUPS, getNatureForGroup } from '../../utils/standardGroups';

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
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState('All Groups');
    const [activeTypeFilter, setActiveTypeFilter] = useState('Active');

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
                setShowDrawer(false);
                resetForm();
                fetchLedgers();
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

    const handleDelete = async (id) => {
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
        
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
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
            startY: 36,
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
        const matchesActive = activeTypeFilter === 'Active' ? isActive : !isActive;

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
                `}</style>

                {/* Header Section */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ledger Master</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToCSV} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors">
                            <RefreshCw size={14} className="text-emerald-500" /> Excel
                        </button>
                        <button onClick={exportToPDF} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors">
                            <FileText size={14} className="text-rose-500" /> PDF
                        </button>
                        <button onClick={() => window.print()} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors">
                            <Printer size={14} className="text-blue-500" /> Print
                        </button>
                        <button onClick={() => { resetForm(); setShowDrawer(true); }} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm uppercase tracking-wide">
                            <PlusCircle size={16} /> Create Ledger
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors uppercase tracking-wide">
                            <X size={16} /> Close
                        </button>
                    </div>
                </div>

                <div className="dashboard-content">
                    {/* Filters Toolbar */}
                    <div className="flex items-end justify-between gap-4 flex-wrap mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                            {/* Search bar */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by Name, Print Name, Mobile No, GST No..." 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors"
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>

                            {/* Group Filter */}
                            <div className="flex flex-col">
                                <span className="filter-label">Group Filter</span>
                                <select 
                                    value={groupFilter} 
                                    onChange={e => { setGroupFilter(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white font-semibold text-slate-700 focus:border-indigo-500 outline-none"
                                >
                                    {availableGroupsForFilter.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Active type filter */}
                            <div className="flex flex-col">
                                <span className="filter-label">Active Type</span>
                                <select 
                                    value={activeTypeFilter} 
                                    onChange={e => { setActiveTypeFilter(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white font-semibold text-slate-700 focus:border-indigo-500 outline-none"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Deactive">Deactive</option>
                                </select>
                            </div>

                            {/* Refresh */}
                            <button onClick={fetchLedgers} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 transition-colors self-end" title="Refresh List">
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {/* Columns Selection Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    setTempVisibleColumns(visibleColumns);
                                    setShowColumnDropdown(!showColumnDropdown);
                                }}
                                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-md font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all text-slate-700 bg-white"
                            >
                                ⚙️ Column Selection
                            </button>

                            {showColumnDropdown && (
                                <div className="absolute right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl w-60 z-30 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Visible Columns</h4>
                                    <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
                                        {ALL_COLUMNS.map(col => (
                                            <label key={col.key} className="flex items-center gap-2 cursor-pointer py-0.5 hover:bg-slate-50 rounded px-1 transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={tempVisibleColumns.includes(col.key)} 
                                                    onChange={() => toggleTempColumn(col.key)}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                                                />
                                                <span className="text-xs font-semibold text-slate-700">{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex justify-between border-t border-slate-100 pt-3">
                                        <button 
                                            onClick={() => setTempVisibleColumns(DEFAULT_COLUMNS)} 
                                            className="px-3 py-1 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50 uppercase tracking-wide"
                                        >
                                            Reset
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setVisibleColumns(tempVisibleColumns);
                                                setShowColumnDropdown(false);
                                            }} 
                                            className="px-4 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 uppercase tracking-wide"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {columnVisible('name') && <th className="py-3.5 px-5">Name</th>}
                                        {columnVisible('print_name') && <th className="py-3.5 px-5">Print Name</th>}
                                        {columnVisible('under') && <th className="py-3.5 px-5">Under</th>}
                                        {columnVisible('opening_balance') && <th className="py-3.5 px-5">Opening Balance</th>}
                                        {columnVisible('mobile1') && <th className="py-3.5 px-5">Mobile No 1</th>}
                                        {columnVisible('mobile2') && <th className="py-3.5 px-5">Mobile No 2</th>}
                                        {columnVisible('address1') && <th className="py-3.5 px-5">Address Line 1</th>}
                                        {columnVisible('address2') && <th className="py-3.5 px-5">Address Line 2</th>}
                                        {columnVisible('address3') && <th className="py-3.5 px-5">Address Line 3</th>}
                                        {columnVisible('address4') && <th className="py-3.5 px-5">Address Line 4</th>}
                                        {columnVisible('address5') && <th className="py-3.5 px-5">Address Line 5</th>}
                                        {columnVisible('gst') && <th className="py-3.5 px-5">GST Number</th>}
                                        {columnVisible('reg_type') && <th className="py-3.5 px-5">Registration Type</th>}
                                        {columnVisible('state') && <th className="py-3.5 px-5">State</th>}
                                        {columnVisible('action') && <th className="py-3.5 px-5 text-center w-24">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
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
                                            <tr key={ledger._id} className="hover:bg-slate-50/50 transition-colors">
                                                {columnVisible('name') && (
                                                    <td className="py-4 px-5">
                                                        <button 
                                                            onClick={() => handleEdit(ledger)} 
                                                            className="font-bold text-blue-600 hover:underline text-left outline-none"
                                                        >
                                                            {ledger.name}
                                                        </button>
                                                    </td>
                                                )}
                                                {columnVisible('print_name') && <td className="py-4 px-5 font-semibold text-slate-800">{ledger.print_name || ledger.name}</td>}
                                                {columnVisible('under') && <td className="py-4 px-5 font-semibold text-slate-500">{ledger.group}</td>}
                                                {columnVisible('opening_balance') && (
                                                    <td className="py-4 px-5 font-mono font-bold text-slate-600">
                                                        ₹{(ledger.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {ledger.balance_type || 'DR'}
                                                    </td>
                                                )}
                                                {columnVisible('mobile1') && <td className="py-4 px-5 font-medium">{ledger.phone || '—'}</td>}
                                                {columnVisible('mobile2') && <td className="py-4 px-5 font-medium">{ledger.mobile2 || '—'}</td>}
                                                {columnVisible('address1') && <td className="py-4 px-5 font-medium text-slate-500">{ledger.address_line_1 || '—'}</td>}
                                                {columnVisible('address2') && <td className="py-4 px-5 font-medium text-slate-500">{ledger.address_line_2 || '—'}</td>}
                                                {columnVisible('address3') && <td className="py-4 px-5 font-medium text-slate-500">{ledger.address_line_3 || '—'}</td>}
                                                {columnVisible('address4') && <td className="py-4 px-5 font-medium text-slate-500">{ledger.address_line_4 || '—'}</td>}
                                                {columnVisible('address5') && <td className="py-4 px-5 font-medium text-slate-500">{ledger.address_line_5 || '—'}</td>}
                                                {columnVisible('gst') && <td className="py-4 px-5 font-mono font-semibold uppercase text-slate-600">{ledger.gstin || '—'}</td>}
                                                {columnVisible('reg_type') && (
                                                    <td className="py-4 px-5 font-bold">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                                            ledger.registration_type === 'Regular' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            ledger.registration_type === 'Composition' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}>
                                                            {ledger.registration_type || 'Regular'}
                                                        </span>
                                                    </td>
                                                )}
                                                {columnVisible('state') && <td className="py-4 px-5 font-semibold text-slate-600">{ledger.state || '—'}</td>}
                                                {columnVisible('action') && (
                                                    <td className="py-4 px-5 text-center relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveActionMenuId(activeActionMenuId === ledger._id ? null : ledger._id);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors outline-none"
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>

                                                        {activeActionMenuId === ledger._id && (
                                                            <div className="ledger-action-menu">
                                                                <button onClick={() => handleEdit(ledger)} className="text-blue-600">
                                                                    ✏️ Alter
                                                                </button>
                                                                {ledger.is_active !== false ? (
                                                                    <button onClick={() => handleToggleStatus(ledger._id)} className="text-amber-600">
                                                                        ⚠️ Deactivate
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => handleToggleStatus(ledger._id)} className="text-emerald-600">
                                                                        ✅ Activate
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleDelete(ledger._id)} className="text-rose-600 border-t border-slate-100">
                                                                    🗑️ Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {!loading && filteredLedgers.length > 0 && (
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredLedgers.length)} of {filteredLedgers.length} entries
                            </span>
                            <div className="flex items-center gap-4">
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
                                                className={`w-8 h-8 rounded border text-xs font-bold uppercase ${
                                                    currentPage === p 
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow'
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
                    <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-in fade-in duration-200">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                            <h2 className="text-xl font-bold uppercase tracking-wide text-slate-800">
                                {isEditing ? 'Modify Account Details' : 'Ledger Creation'}
                            </h2>
                            <button 
                                onClick={() => { resetForm(); setShowDrawer(false); }} 
                                className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                            >
                                <X size={16} /> Close
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group-premium">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Name <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                            placeholder="Enter Name"
                                        />
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Print Name <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.print_name}
                                            onChange={e => setFormData({ ...formData, print_name: e.target.value })}
                                            className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                            placeholder="Enter Print Name"
                                        />
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Under <span className="text-rose-500">*</span></label>
                                        <select
                                            value={mapStandardGroupToUI(formData.group)}
                                            onChange={e => setFormData({ ...formData, group: mapUIGroupToStandard(e.target.value) })}
                                            className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold bg-white"
                                        >
                                            <option value="" disabled>Select Ledger Group</option>
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

                                    <div className="form-group-premium">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Opening Balance <span className="text-rose-500">*</span></label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                required
                                                value={formData.opening_balance}
                                                onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                                className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Opening Balance"
                                            />
                                            <select
                                                value={formData.balance_type}
                                                onChange={e => setFormData({ ...formData, balance_type: e.target.value })}
                                                className="w-24 border border-slate-200 rounded px-3 py-2 bg-slate-50 font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm"
                                            >
                                                <option value="DR">DR</option>
                                                <option value="CR">CR</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Address (Max 5 Lines) Left Column */}
                                    <div className="form-group-premium col-span-1">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Address (Max 5 Lines)</label>
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="text"
                                                value={formData.address_line_1}
                                                onChange={e => setFormData({ ...formData, address_line_1: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Address Line 1"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_2}
                                                onChange={e => setFormData({ ...formData, address_line_2: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Address Line 2"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_3}
                                                onChange={e => setFormData({ ...formData, address_line_3: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Address Line 3"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_4}
                                                onChange={e => setFormData({ ...formData, address_line_4: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Address Line 4"
                                            />
                                            <input
                                                type="text"
                                                value={formData.address_line_5}
                                                onChange={e => setFormData({ ...formData, address_line_5: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Address Line 5"
                                            />
                                        </div>
                                    </div>

                                    {/* Cell Numbers Right Column */}
                                    <div className="flex flex-col gap-4 col-span-1 justify-start">
                                        <div className="form-group-premium">
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Cell Number 1 <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Cell Number 1"
                                            />
                                        </div>

                                        <div className="form-group-premium">
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Cell Number 2</label>
                                            <input
                                                type="text"
                                                value={formData.mobile2}
                                                onChange={e => setFormData({ ...formData, mobile2: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Cell Number 2"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-premium col-span-1">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">GST Number</label>
                                        <input
                                            type="text"
                                            value={formData.gstin}
                                            onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                            className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold uppercase"
                                            placeholder="Enter GST Number"
                                        />
                                    </div>

                                    <div className="form-group-premium col-span-1">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">Registered Type <span className="text-rose-500">*</span></label>
                                        <select
                                            value={formData.registration_type}
                                            onChange={e => setFormData({ ...formData, registration_type: e.target.value })}
                                            className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold bg-white"
                                        >
                                            <option value="" disabled>Select Registered Type</option>
                                            <option value="Composition">Composition</option>
                                            <option value="Regular">Registered</option>
                                            <option value="Unregistered">Unregistered</option>
                                        </select>
                                    </div>

                                    <div className="form-group-premium col-span-1">
                                        <label className="text-xs font-bold text-slate-700 block mb-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                            placeholder="Enter State"
                                        />
                                    </div>
                                    <div className="col-span-1"></div>
                                </div>

                                {/* Bank details */}
                                <div className="border-t border-slate-200 pt-6 mt-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">BANK DETAILS</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="form-group-premium">
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Bank Name</label>
                                            <input
                                                type="text"
                                                value={formData.bank_name}
                                                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Bank Name"
                                            />
                                        </div>

                                        <div className="form-group-premium">
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Account Number</label>
                                            <input
                                                type="text"
                                                value={formData.bank_account_number}
                                                onChange={e => setFormData({ ...formData, bank_account_number: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Account Number"
                                            />
                                        </div>

                                        <div className="form-group-premium">
                                            <label className="text-xs font-bold text-slate-700 block mb-1">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={formData.ifsc_code}
                                                onChange={e => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                                className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold uppercase"
                                                placeholder="Enter IFSC Code"
                                            />
                                        </div>

                                        <div className="form-group-premium">
                                            <label className="text-xs font-bold text-slate-700 block mb-1">Branch</label>
                                            <input
                                                type="text"
                                                value={formData.branch}
                                                onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                                className="w-full border border-slate-200 rounded px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                                                placeholder="Enter Branch"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-center mt-8 border-t border-slate-100 pt-6">
                                    <button 
                                        type="submit" 
                                        disabled={saving} 
                                        className="px-10 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} SAVE
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
