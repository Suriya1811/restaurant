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
    User,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
    FileText,
    DollarSign,
    Award,
    Contact,
    ChevronRight,
    Star,
    X, 
    Download, 
    Printer,
    Save
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';


const CustomerMaster = () => {
    const nameInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gst_number: '',
        opening_balance: 0,
        loyalty_points: 0
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

    const fetchCustomers = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCustomers(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch customers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/customers/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/customers`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || result.message);
            }

            fetchCustomers();
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

    const handleToggleStatus = async (customer) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/customers/${customer._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (customer) => {
        if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/customers/${customer._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchCustomers();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert('An error occurred while deleting the customer.');
        }
    };

    const handleEdit = (customer) => {
        setFormData(customer);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            gst_number: '',
            opening_balance: 0,
            loyalty_points: 0
        });
        setIsEditing(false);
        setError('');
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportCols = ['#', 'Name', 'Phone', 'Email', 'GST', 'Balance', 'Points'];
    const getExportRows = () => filteredCustomers.map((c, i) => [i + 1, c.name, c.phone || '-', c.email || '-', c.gst_number || '-', c.opening_balance || 0, c.loyalty_points || 0]);
    const handleExcelExport = () => exportToCSV('Customer Master', exportCols, getExportRows(), 'Customer_Master');
    const handlePDFExport   = () => exportToPDF('Customer Master', exportCols, getExportRows(), 'Customer_Master');
    const handlePrint       = () => printTable('Customer Master', `Total: ${filteredCustomers.length}`, exportCols, getExportRows());

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title={!showDrawer ? "Customer Master" : (isEditing ? "CUSTOMER MODIFICATION" : "CUSTOMER CREATION")}
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
                                    <span className="text-[10px] uppercase font-black">Onboard Customer</span>
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
                                <input
                                    type="text"
                                    placeholder="Search client registry..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="ml-auto flex-shrink-0">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-xs text-xs font-black uppercase tracking-wider" style={{ height: '32px' }}>
                                    <span>TOTAL RECORDS:</span>
                                    <span className="text-sm font-black text-slate-900">{filteredCustomers.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="table-container-premium flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 235px)' }}>
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                        <th>Corporate Entity</th>
                                        <th>Contact Data</th>
                                        <th>Capital & Loyalty</th>
                                        <th>Registry Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing CRM Database...</p>
                                            </td>
                                        </tr>
                                    ) : filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Contact size={64} className="text-slate-100 mx-auto mb-4" />
                                                <p className="font-bold text-slate-400">Registry is currently void.</p>
                                            </td>
                                        </tr>
                                    ) : filteredCustomers.map((customer) => (
                                            <tr key={customer._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-4 py-3 border-b border-slate-100 text-center w-10">
                                                    <ActionDropdown item={customer} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                                </td>
                                                <td className="px-4 py-3 border-b border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{customer.name}</p>
                                                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={10}/>{customer.address ? (customer.address.length > 20 ? customer.address.substring(0, 20) + '...' : customer.address) : 'No geospatial data'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-b border-slate-100">
                                                    <p className="text-sm font-medium text-slate-700">{customer.phone}</p>
                                                </td>
                                                <td className="px-4 py-3 text-center border-b border-slate-100">
                                                    <p className="text-sm font-bold text-slate-800">₹{customer.opening_balance?.toFixed(2) || '0.00'}</p>
                                                    <p className="text-[10px] font-bold text-amber-500 mt-0.5 flex items-center justify-center gap-1"><Star size={10}/>{customer.loyalty_points || 0} PTS</p>
                                                </td>
                                                <td className="px-4 py-3 text-center border-b border-slate-100">
                                                    <button onClick={() => handleToggleStatus(customer)} className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors ${customer.is_active !== false ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                                        {customer.is_active !== false ? 'Active' : 'Inactive'}
                                                    </button>
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

                            <form id="customer-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <User className="text-indigo-600" size={18} />
                                            <h4 className="text-base font-bold text-slate-800 uppercase">Primary Identity</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group-premium col-span-full">
                                                <label className="text-xs font-bold text-slate-700">Customer Name *</label>
                                                <input ref={nameInputRef} type="text" name="name" required className="input-premium !text-sm" placeholder="e.g. MICHAEL SCOFIELD" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                                                <div className="relative">
                                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input type="text" required className="input-premium !pl-9" placeholder="Primary link" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label className="text-xs font-bold text-slate-700">Email Address</label>
                                                <div className="relative">
                                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input type="email" className="input-premium !pl-9" placeholder="Contact address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Activity className="text-indigo-600" size={18} />
                                                <h4 className="text-base font-bold text-slate-800 uppercase">Financial Matrix</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-700">Opening Balance (Dr/Cr)</label>
                                                    <div className="relative">
                                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input type="number" className="input-premium !pl-9" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-700">Loyalty Points</label>
                                                    <div className="relative">
                                                        <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input type="number" className="input-premium !pl-9" value={formData.loyalty_points} onChange={(e) => setFormData({ ...formData, loyalty_points: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <FileText className="text-indigo-600" size={18} />
                                                <h4 className="text-base font-bold text-slate-800 uppercase">Legal Meta</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-700">GST Number</label>
                                                    <input type="text" className="input-premium uppercase !text-sm" placeholder="GSTN-XXXX" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-700">Address</label>
                                                    <div className="relative">
                                                        <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                                        <textarea className="input-premium !pl-9 !h-20 !pt-3" placeholder="Full address..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                                                    </div>
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
            </main>
        </DashboardPageShell>
    );
};

export default CustomerMaster;
