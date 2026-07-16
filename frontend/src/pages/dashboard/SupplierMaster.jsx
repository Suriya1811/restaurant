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
    ChevronRight,
    Activity,
    X
, Download, Printer} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';


const SupplierMaster = () => {
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
        gst_number: '',
        address: '',
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
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Supplier Master"
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
                            <span className="text-[10px] uppercase font-black">Register Vendor</span>
                        </button>
                    </>
}
                />
                <div className="master-content-layout fade-in">
                    {/* Header relocated */}


                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input type="text" placeholder="Search vendor registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                            {filteredSuppliers.length} Vendors
                        </span>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Vendor Entity</th>
                                    <th>Contact Intelligence</th>
                                    <th>Compliance & Capital</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
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
                                        <td>
                                            <div className="flex items-center gap-4">
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
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(sup)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleToggleStatus(sup)} className="action-icon-btn" style={{ background: sup.is_active ? '#fff7ed' : '#f0fdf4', color: sup.is_active ? '#9a3412' : '#15803d' }}>
                                                    {sup.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                                </button>
                                                <button onClick={() => handleDelete(sup)} className="action-icon-btn delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium !max-w-[820px]">
                            <div className="drawer-header-premium !bg-amber-950 !border-none">
                                <div>
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] mb-1">Vendor Intelligence</p>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{isEditing ? 'Modify Vendor' : 'Register Vendor'}</h3>
                                </div>
                                <button onClick={() => { resetForm(); setShowDrawer(false); }} className="w-12 h-12 rounded-lg bg-white/10 hover:bg-rose-500 flex items-center justify-center transition-all">
                                    <X size={32} className="text-white" />
                                </button>
                            </div>
                            <div className="drawer-body-premium !bg-slate-50">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-8">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="supplier-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-10 pb-10">
                                    {/* Entity Block */}
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Building2 className="text-amber-600" size={20} />
                                            <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">Corporate Identity</h4>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Vendor Trade Name *</label>
                                            <input type="text" required className="input-premium !text-xl" placeholder="e.g. RELIABLE PROVISIONS CO." value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                                        </div>
                                    </div>

                                    {/* Contact Block */}
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <User className="text-amber-600" size={20} />
                                            <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">Communication Matrix</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="form-group-premium">
                                                <label>Point of Contact</label>
                                                <input type="text" className="input-premium" placeholder="e.g. JOHN DOE" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value.toUpperCase() })} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Primary Link Number</label>
                                                <div className="relative">
                                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="text" className="input-premium !pl-12" placeholder="9876543210" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium md:col-span-2">
                                                <label>Mail Protocol</label>
                                                <div className="relative">
                                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="email" className="input-premium !pl-12" placeholder="vendor@domain.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compliance Block */}
                                    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-slate-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Activity className="text-amber-600" size={20} />
                                            <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">Compliance & Financials</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="form-group-premium">
                                                <label>GST Identification</label>
                                                <div className="relative">
                                                    <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="text" className="input-premium !pl-12 uppercase" placeholder="27AAAAA0000A1Z5" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Opening Payable Balance</label>
                                                <div className="relative">
                                                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="number" className="input-premium !pl-12" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium md:col-span-2">
                                                <label>Geospatial Location (Address)</label>
                                                <div className="relative">
                                                    <MapPin size={18} className="absolute left-4 top-4 text-slate-300" />
                                                    <textarea className="input-premium !pl-12 !h-24 !pt-4" placeholder="Full vendor address..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium !bg-amber-950 !border-white/5 !pb-10">
                                <button type="submit" form="supplier-form" disabled={submitting} className="btn-action-add !bg-amber-400 !text-amber-950 !flex-1 !justify-center !py-5 !text-base !rounded-[2rem] hover:!bg-white transition-all transform hover:scale-[0.98]">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'COMMIT VENDOR DATA' : 'REGISTER VENDOR')}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setShowDrawer(false); }} className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-xs tracking-widest rounded-[2rem] border border-white/10 transition-all">CANCEL</button>
                            </div>
                        </div>
                        <SaveConfirmationModal 
                            isOpen={showSaveConfirm} 
                            onConfirm={confirmSave} 
                            onCancel={cancelSave} 
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default SupplierMaster;
