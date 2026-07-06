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
    X
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';

const CustomerMaster = () => {
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

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Customer Master"
                    actions={
                        <button className="btn-premium-primary !py-1.5 !px-4" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} /> 
                            <span className="text-[10px] uppercase font-black">Onboard Customer</span>
                        </button>
                    }
                />
                <div className="master-content-layout fade-in">
                    {/* Header relocated */}

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
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Registry</span>
                                <span className="text-lg font-bold text-slate-800">{filteredCustomers.length} <span className="text-xs text-slate-400">Profiles</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Corporate Entity</th>
                                    <th>Contact Data</th>
                                    <th>Capital & Loyalty</th>
                                    <th>Registry Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
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
                                                {customer.email && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Mail size={10}/>{customer.email}</p>}
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
                                            <td className="px-4 py-3 border-b border-slate-100 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(customer)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                    <button onClick={() => handleDelete(customer)} className="action-icon-btn delete"><Trash2 size={18} /></button>
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
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium !max-w-2xl">
                            <div className="drawer-header-premium !bg-slate-900 !text-white !border-none">
                                <div>
                                    <h3 className="text-xl font-bold text-white uppercase">{isEditing ? 'Modify Profile' : 'Onboard Profile'}</h3>
                                    <p className="text-xs font-semibold text-indigo-400 mt-1 uppercase tracking-widest italic">Institutional CRM Registry</p>
                                </div>
                                <button onClick={() => { resetForm(); setShowDrawer(false); }} className="w-12 h-12 rounded-lg bg-white/10 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                    <X size={32} />
                                </button>
                            </div>
                            <div className="drawer-body-premium !bg-slate-50">
                                {error && (
                                    <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-700 font-black text-sm mb-10 shadow-xl shadow-rose-100/50">
                                        <div className="p-3 bg-rose-600 text-white rounded-2xl"><AlertCircle size={24} /></div>
                                        {error}
                                    </div>
                                )}

                                <form id="customer-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-6 pb-6">
                                    <div className="premium-card bg-white p-6 rounded-2xl premium-shadow border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <User className="text-indigo-600" size={18} />
                                            <h4 className="text-lg font-bold text-slate-800 uppercase">Primary Identity</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group-premium col-span-full">
                                                <label>Global Personnel Label *</label>
                                                <input type="text" name="name" required className="input-premium !text-sm" placeholder="e.g. MICHAEL SCOFIELD" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Phone Architecture *</label>
                                                <div className="relative">
                                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="text" required className="input-premium !pl-10" placeholder="Primary link" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Mail Protocol</label>
                                                <div className="relative">
                                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                    <input type="email" className="input-premium !pl-10" placeholder="Contact address" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="premium-card bg-white p-6 rounded-2xl premium-shadow border border-slate-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Activity className="text-indigo-600" size={18} />
                                                <h4 className="text-lg font-bold text-slate-800 uppercase">Financial Matrix</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="form-group-premium">
                                                    <label>Opening Capital Balance (Dr/Cr)</label>
                                                    <div className="relative">
                                                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                        <input type="number" className="input-premium !pl-10" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 })} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Loyalty Points Weight</label>
                                                    <div className="relative">
                                                        <Award size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                        <input type="number" className="input-premium !pl-10" value={formData.loyalty_points} onChange={(e) => setFormData({ ...formData, loyalty_points: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="premium-card bg-white p-6 rounded-2xl premium-shadow border border-slate-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <FileText className="text-indigo-600" size={18} />
                                                <h4 className="text-lg font-bold text-slate-800 uppercase">Legal Meta</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="form-group-premium">
                                                    <label>GST Identification Reference</label>
                                                    <input type="text" className="input-premium uppercase !text-sm" placeholder="GSTN-XXXX" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label>Geospatial Location (Address)</label>
                                                    <div className="relative">
                                                        <MapPin size={16} className="absolute left-4 top-3 text-slate-300" />
                                                        <textarea className="input-premium !pl-10 !h-20 !pt-3" placeholder="Full residential/corporate ref..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium !bg-slate-900 !border-white/5 !p-4 flex gap-4">
                                <button type="submit" form="customer-form" disabled={submitting} className="btn-premium-primary !bg-white !text-slate-900 flex-1 justify-center py-3 text-sm rounded-xl font-bold hover:!bg-indigo-500 hover:!text-white transition-all">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'COMMIT MODIFICATIONS' : 'INITIALIZE PROFILE')}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setShowDrawer(false); }} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-xs rounded-xl border border-white/10 transition-all">TERMINATE</button>
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

export default CustomerMaster;
