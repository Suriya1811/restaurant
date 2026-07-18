import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle,
    Search,
    Edit,
    CheckCircle2,
    XCircle,
    Loader2,
    Percent,
    AlertCircle,
    X,
    Trash2,
    Download,
    Printer,
    Save
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const TaxMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [taxes, setTaxes] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sales_account_id: '',
        purchase_account_id: '',
        tax_type: 'TAXABLE',
        local_central: 'LOCAL',
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        gst_sales_ledger_id: '',
        gst_purchase_ledger_id: '',
        igst_sales_ledger_id: '',
        igst_purchase_ledger_id: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleFormSubmitRequest = () => {
        setShowSaveConfirm(true);
    };

    const { formRef, handleKeyDown } = useFormNavigation([showDrawer], handleFormSubmitRequest);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchTaxes = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/taxes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTaxes(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch taxes", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLedgers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/ledgers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLedgers(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch Duties & Taxes ledgers", err);
        }
    };

    useEffect(() => {
        fetchTaxes();
        fetchLedgers();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/taxes/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/taxes`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    sales_account_id: formData.sales_account_id || null,
                    purchase_account_id: formData.purchase_account_id || null,
                    tax_type: formData.tax_type,
                    local_central: formData.local_central,
                    cgst_rate: formData.local_central === 'LOCAL' ? Number(formData.cgst_rate || 0) : 0,
                    sgst_rate: formData.local_central === 'LOCAL' ? Number(formData.sgst_rate || 0) : 0,
                    igst_rate: formData.local_central === 'CENTRAL' ? Number(formData.igst_rate || 0) : 0,
                    gst_sales_ledger_id: formData.gst_sales_ledger_id || null,
                    gst_purchase_ledger_id: formData.gst_purchase_ledger_id || null,
                    igst_sales_ledger_id: formData.igst_sales_ledger_id || null,
                    igst_purchase_ledger_id: formData.igst_purchase_ledger_id || null
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || result.message);
            }

            fetchTaxes();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmSave = () => {
        setShowSaveConfirm(false);
        handleSubmit();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleDelete = async (tax) => {
        if (!window.confirm(`Are you sure you want to delete the tax "${tax.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/taxes/${tax._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchTaxes();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting tax:', err);
            alert('An error occurred while deleting the tax.');
        }
    };

    const handleEdit = (tax) => {
        setFormData({
            ...tax,
            sales_account_id: tax.sales_account_id?._id || tax.sales_account_id || '',
            purchase_account_id: tax.purchase_account_id?._id || tax.purchase_account_id || '',
            gst_sales_ledger_id: tax.gst_sales_ledger_id?._id || tax.gst_sales_ledger_id || '',
            gst_purchase_ledger_id: tax.gst_purchase_ledger_id?._id || tax.gst_purchase_ledger_id || '',
            igst_sales_ledger_id: tax.igst_sales_ledger_id?._id || tax.igst_sales_ledger_id || '',
            igst_purchase_ledger_id: tax.igst_purchase_ledger_id?._id || tax.igst_purchase_ledger_id || ''
        });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            sales_account_id: '',
            purchase_account_id: '',
            tax_type: 'TAXABLE',
            local_central: 'LOCAL',
            cgst_rate: 0,
            sgst_rate: 0,
            igst_rate: 0,
            gst_sales_ledger_id: '',
            gst_purchase_ledger_id: '',
            igst_sales_ledger_id: '',
            igst_purchase_ledger_id: ''
        });
        setIsEditing(false);
        setError('');
    };

    const filteredTaxes = taxes.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? t.is_active !== false : t.is_active === false);
        return matchesSearch && matchesStatus;
    });


    const exportCols = ['#', 'Tax Name', 'Type', 'CGST %', 'SGST %', 'IGST %'];
    const getExportRows = () => filteredTaxes.map((t, i) => [i + 1, t.name, t.tax_type || '-', t.cgst_rate || 0, t.sgst_rate || 0, t.igst_rate || 0]);
    const handleExcelExport = () => exportToCSV('Tax Master', exportCols, getExportRows(), 'Tax_Master');
    const handlePDFExport = () => exportToPDF('Tax Master', exportCols, getExportRows(), 'Tax_Master');
    const handlePrint = () => printTable('Tax Master', `Total: ${filteredTaxes.length}`, exportCols, getExportRows());

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Tax Master"
                    actions={
                        <>

                            <button
                                type="button"
                                className="btn-export excel"
                                onClick={handleExcelExport}
                                title="Export to Excel"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black text-emerald-500">Excel</span>
                            </button>
                            <button
                                type="button"
                                className="btn-export pdf"
                                onClick={handlePDFExport}
                                title="Export to PDF"
                            >
                                <Download size={14} />
                                <span className="text-[10px] uppercase font-black text-rose-500">PDF</span>
                            </button>
                            <button
                                type="button"
                                className="btn-export print"
                                onClick={handlePrint}
                                title="Print"
                            >
                                <Printer size={14} />
                                <span className="text-[10px] uppercase font-black text-blue-500">Print</span>
                            </button>
                            <button className="btn-action-add " onClick={() => { resetForm(); setShowDrawer(true); }}>
                                <PlusCircle size={18} />
                                <span className="text-[10px] uppercase font-black">Add New Tax</span>
                            </button>
                        </>
                    }
                />
                <div className="master-content-layout fade-in">
                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search taxes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-premium !py-1.5 !px-3 font-bold text-slate-700 cursor-pointer"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px', minWidth: '110px' }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>
                            <span className="whitespace-nowrap text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                TOTAL : {filteredTaxes.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>GST Name</th>
                                    <th>GST %</th>
                                    <th>Sales Account</th>
                                    <th>Purchase Account</th>
                                    <th>Taxable / Exempted</th>
                                    <th>Local Tax / Central Tax</th>
                                    <th>GST Classification</th>
                                    <th>CGST %</th>
                                    <th>SGST %</th>
                                    <th>IGST %</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="11" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Archives...</p>
                                        </td>
                                    </tr>
                                ) : filteredTaxes.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Percent size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No taxes found.</p>
                                        </td>
                                    </tr>
                                ) : filteredTaxes.map((tax) => (
                                    <tr key={tax._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4 ml-auto">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Percent size={18} />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{tax.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-semibold text-slate-600">
                                                {tax.percentage}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-semibold text-slate-700">
                                                {tax.sales_account_id?.name || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-semibold text-slate-700">
                                                {tax.purchase_account_id?.name || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${tax.tax_type === 'TAXABLE'
                                                ? 'bg-green-50 text-green-700 border border-green-100'
                                                : 'bg-slate-50 text-slate-700 border border-slate-100'
                                                }`}>
                                                {tax.tax_type === 'TAXABLE' ? 'Taxable' : 'Exempted'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${tax.local_central === 'LOCAL'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                : 'bg-purple-50 text-purple-700 border border-purple-100'
                                                }`}>
                                                {tax.local_central === 'LOCAL' ? 'Local Tax' : 'Central Tax'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-bold text-slate-600">
                                                {tax.local_central === 'LOCAL' ? 'Regular GST' : 'IGST'}
                                            </span>
                                        </td>
                                        <td>{tax.local_central === 'LOCAL' ? `${tax.cgst_rate || 0}%` : '-'}</td>
                                        <td>{tax.local_central === 'LOCAL' ? `${tax.sgst_rate || 0}%` : '-'}</td>
                                        <td>{tax.local_central === 'CENTRAL' ? `${tax.igst_rate || 0}%` : '-'}</td>
                                        <td>
                                            <ActionDropdown item={tax} onEdit={handleEdit} onDelete={handleDelete} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <div className="absolute inset-0 bg-white z-[999] flex flex-col overflow-hidden animate-in fade-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 shadow-sm">
                            <h2 className="text-[20px] font-black text-slate-900 tracking-tighter uppercase">{isEditing ? 'GST ALTERATION' : 'GST CREATION'}</h2>
                            <button
                                onClick={() => { resetForm(); setShowDrawer(false); }}
                                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-xl font-bold transition-colors"
                            >
                                <XCircle size={20} />
                                <span className="text-sm tracking-wide">CLOSE</span>
                            </button>
                        </div>

                        <div className="bg-white p-4 flex flex-col flex-1 overflow-hidden relative">
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded flex items-center gap-2 text-rose-700 font-medium text-xs mb-3 flex-shrink-0 animate-in fade-in duration-200">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form id="tax-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-5">

                                    <div>
                                        <div className="w-full mb-1">
                                            <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider">Tax Details</h3>
                                        </div>
                                        <hr className="border-t border-orange-500 mt-1 mb-2" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 relative">
                                            {/* Left Column */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">GST Name <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            required
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold"
                                                            placeholder="Enter GST name"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">Purchase Account <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <select
                                                            required
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.purchase_account_id}
                                                            onChange={(e) => setFormData({ ...formData, purchase_account_id: e.target.value })}
                                                        >
                                                            <option value="">Select purchase account</option>
                                                            {ledgers.map(l => (
                                                                <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">Local / Central Tax <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <select
                                                            required
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.local_central}
                                                            onChange={(e) => setFormData({ ...formData, local_central: e.target.value })}
                                                        >
                                                            <option value="">Select local / central</option>
                                                            <option value="LOCAL">Local</option>
                                                            <option value="CENTRAL">Central</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">CGST Percentage (%) <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            disabled={formData.local_central !== 'LOCAL'}
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold disabled:opacity-50 disabled:bg-slate-50"
                                                            placeholder="0.00"
                                                            value={formData.cgst_rate}
                                                            onChange={(e) => setFormData({ ...formData, cgst_rate: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">IGST Percentage (%) <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            disabled={formData.local_central !== 'CENTRAL'}
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold disabled:opacity-50 disabled:bg-slate-50"
                                                            placeholder="0.00"
                                                            value={formData.igst_rate}
                                                            onChange={(e) => setFormData({ ...formData, igst_rate: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">Sales Account <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <select
                                                            required
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.sales_account_id}
                                                            onChange={(e) => setFormData({ ...formData, sales_account_id: e.target.value })}
                                                        >
                                                            <option value="">Select sales account</option>
                                                            {ledgers.map(l => (
                                                                <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">Taxable / Exempted <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <select
                                                            required
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.tax_type}
                                                            onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                                                        >
                                                            <option value="">Select taxable / exempted</option>
                                                            <option value="TAXABLE">Taxable</option>
                                                            <option value="EXEMPTED">Exempted</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">Registration Type <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <select
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                        >
                                                            <option value="REGULAR">Select registration type</option>
                                                            <option value="REGULAR">Regular</option>
                                                            <option value="COMPOSITION">Composition</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">SGST Percentage (%) <span className="text-red-500">*</span></label>
                                                    <div className="col-span-8">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            disabled={formData.local_central !== 'LOCAL'}
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold disabled:opacity-50 disabled:bg-slate-50"
                                                            placeholder="0.00"
                                                            value={formData.sgst_rate}
                                                            onChange={(e) => setFormData({ ...formData, sgst_rate: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="w-full mb-1 mt-2">
                                            <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider">Additional Ledger Mapping</h3>
                                        </div>
                                        <hr className="border-t border-orange-500 mt-1 mb-2" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 relative">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">GST Sales</label>
                                                    <div className="col-span-8">
                                                        <select
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.gst_sales_ledger_id}
                                                            onChange={(e) => setFormData({ ...formData, gst_sales_ledger_id: e.target.value })}
                                                        >
                                                            <option value="">Select Ledger</option>
                                                            {ledgers.map(l => (
                                                                <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">IGST Sales</label>
                                                    <div className="col-span-8">
                                                        <select
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.igst_sales_ledger_id}
                                                            onChange={(e) => setFormData({ ...formData, igst_sales_ledger_id: e.target.value })}
                                                        >
                                                            <option value="">Select Ledger</option>
                                                            {ledgers.map(l => (
                                                                <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">GST Purchase</label>
                                                    <div className="col-span-8">
                                                        <select
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.gst_purchase_ledger_id}
                                                            onChange={(e) => setFormData({ ...formData, gst_purchase_ledger_id: e.target.value })}
                                                        >
                                                            <option value="">Select Ledger</option>
                                                            {ledgers.map(l => (
                                                                <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <label className="col-span-4 text-[14px] font-bold text-slate-800">IGST Purchase</label>
                                                    <div className="col-span-8">
                                                        <select
                                                            className="w-full px-3 py-2 bg-white border border-orange-400 rounded text-sm outline-none focus:ring-1 focus:ring-orange-500 transition-all font-semibold cursor-pointer appearance-none"
                                                            value={formData.igst_purchase_ledger_id}
                                                            onChange={(e) => setFormData({ ...formData, igst_purchase_ledger_id: e.target.value })}
                                                        >
                                                            <option value="">Select Ledger</option>
                                                            {ledgers.map(l => (
                                                                <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button type="submit" form="tax-form" disabled={submitting} className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-2.5 rounded font-bold transition-all text-sm">
                                        {submitting ? <Loader2 className="animate-spin" size={16} /> : (
                                            <>
                                                <Save size={16} />
                                                <span className="uppercase tracking-wider">{isEditing ? 'UPDATE' : 'SAVE'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <SaveConfirmationModal
                    isOpen={showSaveConfirm}
                    onConfirm={confirmSave}
                    onCancel={cancelSave}
                />
            </main>
        </div>
    );
};

export default TaxMaster;
