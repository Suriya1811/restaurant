import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ActionDropdown from '../../components/dashboard/ActionDropdown';
import './Dashboard.css';
import {
    PlusCircle,
    Search,
    Edit,
    CheckCircle2,
    XCircle,
    Trash2,
    Loader2,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    FileText,
    DollarSign,
    Building2,
    User,
    Truck,
    X,
    ChevronRight,
    Download,
    Printer,
    Save
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';


const SupplierMaster = () => {
    const nameInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        contact_number: '',
        email: '',
        address: '',
        gst_number: '',
        opening_balance: 0
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

    const fetchSuppliers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setSuppliers(data.data);
        } catch (err) {
            console.error("Failed to fetch suppliers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/suppliers/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/suppliers`;
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || result.message);
            fetchSuppliers();
            resetForm();
            setTimeout(() => {
                if (nameInputRef.current) nameInputRef.current.focus();
            }, 100);
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

    const handleToggleStatus = async (supplier) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/suppliers/${supplier._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchSuppliers();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (supplier) => {
        if (!window.confirm(`Delete "${supplier.name}"?`)) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers/${supplier._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) fetchSuppliers();
            else alert(`Error: ${result.error || result.message}`);
        } catch (err) { console.error(err); }
    };

    const handleEdit = (supplier) => { setFormData(supplier); setIsEditing(true); setShowDrawer(true); };
    const resetForm = () => {
        setFormData({ name: '', contact_person: '', contact_number: '', email: '', gst_number: '', address: '', opening_balance: 0 });
        setIsEditing(false);
        setError('');
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportCols = ['#', 'Vendor Entity', 'Contact Person', 'Phone', 'GST', 'Balance'];
    const getExportRows = () => filteredSuppliers.map((s, i) => [i + 1, s.name, s.contact_person || '-', s.contact_number || '-', s.gst_number || '-', s.opening_balance || 0]);
    const handleExcelExport = () => exportToCSV('Supplier Master', exportCols, getExportRows(), 'Supplier_Master');
    const handlePDFExport   = () => exportToPDF('Supplier Master', exportCols, getExportRows(), 'Supplier_Master');
    const handlePrint       = () => printTable('Supplier Master', `Total: ${filteredSuppliers.length}`, exportCols, getExportRows());

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title={!showDrawer ? "Supplier Master" : (isEditing ? "SUPPLIER MODIFICATION" : "SUPPLIER CREATION")}
                    onClose={!showDrawer ? undefined : () => { resetForm(); setShowDrawer(false); }}
                    actions={
                        !showDrawer ? (
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
                                    <span className="text-[10px] uppercase font-black">Register Vendor</span>
                                </button>
                            </>
                        ) : null
                    }
                />
                {!showDrawer ? (
                    <div className="master-content-layout fade-in flex flex-col">
                        <div className="toolbar-premium">
                            <div className="search-premium">
                                <Search size={20} />
                                <input type="text" placeholder="Search vendor registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="ml-auto flex-shrink-0">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-xs text-xs font-black uppercase tracking-wider" style={{ height: '32px' }}>
                                    <span>TOTAL RECORDS:</span>
                                    <span className="text-sm font-black text-slate-900">{filteredSuppliers.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="table-container-premium flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 235px)' }}>
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                        <th>Vendor Entity</th>
                                        <th>Contact Intelligence</th>
                                        <th>Compliance & Capital</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Syncing Vendor Network...</p>
                                        </td></tr>
                                    ) : filteredSuppliers.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Truck size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No vendor contracts on file.</p>
                                        </td></tr>
                                    ) : filteredSuppliers.map((sup) => (
                                        <tr key={sup._id} className="group">
                                            <td className="w-10 text-center">
                                                <ActionDropdown item={sup} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-4 ml-auto">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        {sup.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{sup.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                                                            <ChevronRight size={10} className="text-amber-300" />
                                                            {sup.contact_person || 'No Contact Person'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-tighter">
                                                        <Phone size={14} className="text-slate-300" /> {sup.contact_number || '—'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Mail size={14} className="text-slate-300" /> {sup.email || 'NO_MAIL@VENDOR'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        GST: {sup.gst_number || 'UNREGISTERED'}
                                                    </div>
                                                    <div className="text-sm font-black text-rose-500">
                                                        ₹{(sup.opening_balance || 0).toLocaleString()} Due
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge-premium ${sup.is_active ? 'active' : 'disabled'}`}>
                                                    {sup.is_active ? 'CONTRACTED' : 'TERMINATED'}
                                                </span>
                                            </td>
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
                                <div className="bg-rose-50 border border-rose-100 p-3 mb-4 rounded flex items-center gap-3 text-rose-600 font-bold text-sm shrink-0">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form id="supplier-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                    {/* Entity Block */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Building2 className="text-amber-600" size={18} />
                                            <h4 className="text-base font-black text-slate-800 tracking-tight uppercase">Corporate Identity</h4>
                                        </div>
                                        <div className="form-group-premium">
                                            <label className="text-xs font-bold text-slate-700">Vendor Trade Name *</label>
                                            <input ref={nameInputRef} type="text" required className="input-premium !text-base" placeholder="e.g. RELIABLE PROVISIONS CO." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                                        </div>
                                    </div>

                                    {/* Contact Block */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <User className="text-amber-600" size={18} />
                                            <h4 className="text-base font-black text-slate-800 tracking-tight uppercase">Communication Matrix</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group-premium">
                                                <label className="text-xs font-bold text-slate-700">Point of Contact</label>
                                                <input type="text" className="input-premium" placeholder="e.g. JOHN DOE" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value.toUpperCase() })} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label className="text-xs font-bold text-slate-700">Direct Phone Channel</label>
                                                <input type="text" className="input-premium" placeholder="e.g. +91 9876543210" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} />
                                            </div>
                                            <div className="form-group-premium col-span-full">
                                                <label className="text-xs font-bold text-slate-700">Email Interface</label>
                                                <input type="email" className="input-premium" placeholder="vendor@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fiscal Block */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <DollarSign className="text-amber-600" size={18} />
                                            <h4 className="text-base font-black text-slate-800 tracking-tight uppercase">Fiscal & Statutory</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group-premium">
                                                <label className="text-xs font-bold text-slate-700">GSTIN Tax Identification</label>
                                                <input type="text" className="input-premium uppercase" placeholder="22AAAAA0000A1Z5" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label className="text-xs font-bold text-slate-700">Opening Credit Balance (Dr/Cr)</label>
                                                <input type="number" className="input-premium" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} />
                                            </div>
                                            <div className="form-group-premium col-span-full">
                                                <label className="text-xs font-bold text-slate-700">Physical Infrastructure Address</label>
                                                <div className="relative">
                                                    <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                                    <textarea className="input-premium !pl-10 !h-20 !pt-3" placeholder="Full vendor address..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
                                    <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#f97316]/20 transition-all cursor-pointer">
                                        {submitting ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <Save size={20} />
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
        </DashboardPageShell>
    );
};

export default SupplierMaster;
