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
    Trash2
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';

const TaxMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        percentage: 0
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

    useEffect(() => {
        fetchTaxes();
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
                    percentage: Number(formData.percentage)
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
        setFormData(tax);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', percentage: 0 });
        setIsEditing(false);
        setError('');
    };

    const filteredTaxes = taxes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                    title="Tax Master"
                    actions={
                        <button className="btn-premium-primary !py-1.5 !px-4" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} />
                            <span className="text-[10px] uppercase font-black">Add New Tax</span>
                        </button>
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
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                Scoped Result: {filteredTaxes.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Tax Name</th>
                                    <th>Percentage</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Archives...</p>
                                        </td>
                                    </tr>
                                ) : filteredTaxes.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Percent size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No taxes found.</p>
                                        </td>
                                    </tr>
                                ) : filteredTaxes.map((tax) => (
                                    <tr key={tax._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
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
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(tax)} className="action-icon-btn edit"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(tax)} className="action-icon-btn delete"><Trash2 size={18} /></button>
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
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium">
                            <div className="drawer-header-premium">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Tax' : 'Register Tax'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Master Entity Registry</p>
                                </div>
                                <button onClick={() => { resetForm(); setShowDrawer(false); }} className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all">
                                    <X size={32} className="text-slate-500 hover:text-slate-800" />
                                </button>
                            </div>
                            <div className="drawer-body-premium">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-8 animate-in fade-in duration-300">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="tax-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-8">
                                    <div className="form-group-premium">
                                        <label>Tax Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="input-premium"
                                            placeholder="e.g. GST 5%"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Percentage *</label>
                                        <input
                                            type="number"
                                            name="percentage"
                                            min="0"
                                            step="0.01"
                                            required
                                            className="input-premium"
                                            placeholder="e.g. 5"
                                            value={formData.percentage}
                                            onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="tax-form" disabled={submitting} className="btn-premium-primary flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Confirm Changes' : 'Execute Registration')}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setShowDrawer(false); }} className="btn-premium-outline">Discard</button>
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

export default TaxMaster;
