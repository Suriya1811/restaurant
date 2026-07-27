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
    Save,
    ChevronDown
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
        _id: '',
        name: '',
        registration_type: '',
        sales_account_id: '',
        purchase_account_id: '',
        tax_type: 'TAXABLE',
        local_central: 'LOCAL',
        sales_cgst_rate: 0,
        sales_sgst_rate: 0,
        purchase_cgst_rate: 0,
        purchase_sgst_rate: 0,
        sales_igst_rate: 0,
        purchase_igst_rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0
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
                    registration_type: formData.registration_type,
                    sales_account_id: formData.sales_account_id || null,
                    purchase_account_id: formData.purchase_account_id || null,
                    tax_type: formData.tax_type,
                    local_central: formData.local_central,
                    sales_cgst_rate: Number(formData.sales_cgst_rate || 0),
                    sales_sgst_rate: Number(formData.sales_sgst_rate || 0),
                    purchase_cgst_rate: Number(formData.purchase_cgst_rate || 0),
                    purchase_sgst_rate: Number(formData.purchase_sgst_rate || 0),
                    sales_igst_rate: Number(formData.sales_igst_rate || 0),
                    purchase_igst_rate: Number(formData.purchase_igst_rate || 0),
                    cgst_rate: Number(formData.sales_cgst_rate || 0),
                    sgst_rate: Number(formData.sales_sgst_rate || 0),
                    igst_rate: Number(formData.sales_igst_rate || 0)
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
            _id: tax._id,
            name: tax.name || '',
            registration_type: tax.registration_type || '',
            sales_account_id: tax.sales_account_id?._id || tax.sales_account_id || '',
            purchase_account_id: tax.purchase_account_id?._id || tax.purchase_account_id || '',
            local_central: tax.local_central || 'LOCAL',
            tax_type: tax.tax_type || 'TAXABLE',
            sales_cgst_rate: tax.sales_cgst_rate !== undefined ? tax.sales_cgst_rate : (tax.cgst_rate || 0),
            sales_sgst_rate: tax.sales_sgst_rate !== undefined ? tax.sales_sgst_rate : (tax.sgst_rate || 0),
            purchase_cgst_rate: tax.purchase_cgst_rate || 0,
            purchase_sgst_rate: tax.purchase_sgst_rate || 0,
            sales_igst_rate: tax.sales_igst_rate !== undefined ? tax.sales_igst_rate : (tax.igst_rate || 0),
            purchase_igst_rate: tax.purchase_igst_rate || 0,
            cgst_rate: tax.cgst_rate || 0,
            sgst_rate: tax.sgst_rate || 0,
            igst_rate: tax.igst_rate || 0
        });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({
            _id: '',
            name: '',
            registration_type: '',
            sales_account_id: '',
            purchase_account_id: '',
            tax_type: 'TAXABLE',
            local_central: 'LOCAL',
            sales_cgst_rate: 0,
            sales_sgst_rate: 0,
            purchase_cgst_rate: 0,
            purchase_sgst_rate: 0,
            sales_igst_rate: 0,
            purchase_igst_rate: 0,
            cgst_rate: 0,
            sgst_rate: 0,
            igst_rate: 0
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
                    title={!showDrawer ? "Tax Master" : (isEditing ? "GST ALTERATION" : "GST CREATION")}
                    onClose={!showDrawer ? undefined : () => { resetForm(); setShowDrawer(false); }}
                    actions={
                        !showDrawer ? (
                            <>
                                <button type="button" className="btn-export excel" onClick={handleExcelExport} title="Export to Excel">
                                    <Download size={14} />
                                    <span className="text-[10px] uppercase font-black text-emerald-500">Excel</span>
                                </button>
                                <button type="button" className="btn-export pdf" onClick={handlePDFExport} title="Export to PDF">
                                    <Download size={14} />
                                    <span className="text-[10px] uppercase font-black text-rose-500">PDF</span>
                                </button>
                                <button type="button" className="btn-export print" onClick={handlePrint} title="Print">
                                    <Printer size={14} />
                                    <span className="text-[10px] uppercase font-black text-blue-500">Print</span>
                                </button>
                                <button className="btn-action-add " onClick={() => { resetForm(); setShowDrawer(true); }}>
                                    <PlusCircle size={18} />
                                    <span className="text-[10px] uppercase font-black">Add New Tax</span>
                                </button>
                            </>
                        ) : null
                    }
                />

                {!showDrawer ? (
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
                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="11" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Database...</p>
                                            </td>
                                        </tr>
                                    ) : filteredTaxes.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Percent size={64} className="text-slate-100 mx-auto mb-4" />
                                                <p className="font-bold text-slate-400">No tax rates defined.</p>
                                            </td>
                                        </tr>
                                    ) : filteredTaxes.map((tax) => (
                                        <tr key={tax._id} className="group">
                                            <td className="w-10 text-center">
                                                <ActionDropdown item={tax} onEdit={handleEdit} onDelete={handleDelete} />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-4 ml-auto">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                        <Percent size={18} />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{tax.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-bold text-slate-900">{tax.rate}%</span>
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
                                        </tr>
                                    ))}
                                </tbody>
            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden bg-white animate-in fade-in duration-200">
                        <div className="p-6 flex flex-col flex-1 overflow-hidden relative bg-white">
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded flex items-center gap-2 text-rose-700 font-medium text-xs mb-3 flex-shrink-0 animate-in fade-in duration-200">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form id="tax-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-y-auto pr-2 gap-6">
                                <div className="space-y-6">
                                    {/* Top Section: 6 fields in 2 columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                                        {/* Left Column */}
                                        <div className="space-y-5">
                                            {/* GST Name * */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">GST Name <span className="text-red-500">*</span></label>
                                                <div className="col-span-8">
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        required
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full rounded-md px-3 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316]"
                                                        style={{ border: '1px solid #f97316' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Sales Account * */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Sales Account <span className="text-red-500">*</span></label>
                                                <div className="col-span-8 relative">
                                                    <select
                                                        required
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] transition-all font-semibold cursor-pointer appearance-none pr-8 text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.sales_account_id}
                                                        onChange={(e) => setFormData({ ...formData, sales_account_id: e.target.value })}
                                                    >
                                                        <option value="">Select sales account</option>
                                                        {ledgers.map(l => (
                                                            <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Local / Central Tax * */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Local / Central Tax <span className="text-red-500">*</span></label>
                                                <div className="col-span-8 relative">
                                                    <select
                                                        required
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] transition-all font-semibold cursor-pointer appearance-none pr-8 text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.local_central}
                                                        onChange={(e) => setFormData({ ...formData, local_central: e.target.value })}
                                                    >
                                                        <option value="LOCAL">Local</option>
                                                        <option value="CENTRAL">Central</option>
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-5">
                                            {/* Registration Type * */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Registration Type <span className="text-red-500">*</span></label>
                                                <div className="col-span-8 relative">
                                                    <select
                                                        required
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] transition-all font-semibold cursor-pointer appearance-none pr-8 text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.registration_type}
                                                        onChange={(e) => setFormData({ ...formData, registration_type: e.target.value })}
                                                    >
                                                        <option value="">Select registration type</option>
                                                        <option value="REGULAR">Regular</option>
                                                        <option value="COMPOSITION">Composition</option>
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Purchase Account * */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Purchase Account <span className="text-red-500">*</span></label>
                                                <div className="col-span-8 relative">
                                                    <select
                                                        required
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] transition-all font-semibold cursor-pointer appearance-none pr-8 text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.purchase_account_id}
                                                        onChange={(e) => setFormData({ ...formData, purchase_account_id: e.target.value })}
                                                    >
                                                        <option value="">Select purchase account</option>
                                                        {ledgers.map(l => (
                                                            <option key={l._id} value={l._id}>{l.name} ({l.group})</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* Taxable / Exempted * */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Taxable / Exempted <span className="text-red-500">*</span></label>
                                                <div className="col-span-8 relative">
                                                    <select
                                                        required
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] transition-all font-semibold cursor-pointer appearance-none pr-8 text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.tax_type}
                                                        onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                                                    >
                                                        <option value="TAXABLE">Taxable</option>
                                                        <option value="EXEMPTED">Exempted</option>
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GST DETAILS Section Header */}
                                    <div className="pt-2">
                                        <h3 className="text-base font-extrabold text-[#f97316] uppercase tracking-wider mb-1">GST DETAILS</h3>
                                        <hr className="border-t border-[#f97316]" />
                                    </div>

                                    {/* GST DETAILS Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                                        {/* Left Column */}
                                        <div className="space-y-5">
                                            {/* Sales CGST % */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Sales CGST %</label>
                                                <div className="col-span-8">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] font-semibold text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.sales_cgst_rate}
                                                        onChange={(e) => setFormData({ ...formData, sales_cgst_rate: e.target.value, cgst_rate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Purchase CGST % */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Purchase CGST %</label>
                                                <div className="col-span-8">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] font-semibold text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.purchase_cgst_rate}
                                                        onChange={(e) => setFormData({ ...formData, purchase_cgst_rate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Sales IGST % */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Sales IGST %</label>
                                                <div className="col-span-8">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] font-semibold text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.sales_igst_rate}
                                                        onChange={(e) => setFormData({ ...formData, sales_igst_rate: e.target.value, igst_rate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Purchase IGST % */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Purchase IGST %</label>
                                                <div className="col-span-8">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] font-semibold text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.purchase_igst_rate}
                                                        onChange={(e) => setFormData({ ...formData, purchase_igst_rate: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-5">
                                            {/* Sales SGST % */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Sales SGST %</label>
                                                <div className="col-span-8">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] font-semibold text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.sales_sgst_rate}
                                                        onChange={(e) => setFormData({ ...formData, sales_sgst_rate: e.target.value, sgst_rate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Purchase SGST % */}
                                            <div className="grid grid-cols-12 items-center gap-2">
                                                <label className="col-span-4 text-[14px] font-bold text-slate-800">Purchase SGST %</label>
                                                <div className="col-span-8">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-[#f97316] font-semibold text-slate-800"
                                                        style={{ border: '1px solid #f97316' }}
                                                        value={formData.purchase_sgst_rate}
                                                        onChange={(e) => setFormData({ ...formData, purchase_sgst_rate: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
                                    <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-[#f97316]/20 transition-all cursor-pointer">
                                        {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                                            <>
                                                <Save size={18} />
                                                <span className="uppercase tracking-wider font-extrabold text-sm">{isEditing ? 'UPDATE' : 'SAVE'}</span>
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
