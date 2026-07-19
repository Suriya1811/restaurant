import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle, Search, Edit, CheckCircle2, XCircle, Trash2, Loader2,
    Grid, AlertCircle, Filter, Activity, ChevronRight, X, Download, Printer, Save
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const CategoryMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'FOOD', hsn_code: '', hsn_description: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleFormSubmitRequest = () => { setShowSaveConfirm(true); };
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

    const fetchCategories = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setCategories(data.data);
        } catch (err) {
            console.error("Failed to fetch categories", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/categories/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/categories`;
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            fetchCategories();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (category) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/categories/${category._id}/toggle-status`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCategories();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/${category._id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) fetchCategories();
            else alert(`Error: ${result.error}`);
        } catch (err) {
            console.error('Error deleting category:', err);
            alert('An error occurred while deleting the category.');
        }
    };

    const handleEdit = (cat) => { setFormData(cat); setIsEditing(true); setShowDrawer(true); };
    const resetForm = () => { setFormData({ name: '', type: 'FOOD', hsn_code: '', hsn_description: '' }); setIsEditing(false); setError(''); };
    const confirmSave = () => { setShowSaveConfirm(false); handleSubmit(); };
    const cancelSave = () => { setShowSaveConfirm(false); };

    const filteredCategories = categories.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? c.is_active !== false : c.is_active === false);
        return matchesSearch && matchesStatus;
    });

    const COLS = ['#', 'Category Name', 'Type', 'HSN Code', 'Status'];
    const getRows = () => filteredCategories.map((c, i) => [i + 1, c.name, c.type || '-', c.hsn_code || '-', c.is_active ? 'Active' : 'Inactive']);
    const handleExcelExport = () => exportToCSV('Category Master', COLS, getRows(), 'Category_Master');
    const handlePDFExport   = () => exportToPDF('Category Master', COLS, getRows(), 'Category_Master');
    const handlePrint       = () => printTable('Category Master', `Total: ${filteredCategories.length}`, COLS, getRows());

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Category Creation"
                    actions={
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
                            <button className="btn-action-add" onClick={() => { resetForm(); setShowDrawer(true); }}>
                                <PlusCircle size={18} />
                                <span className="text-[10px] uppercase font-black">Add New Category</span>
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
                                placeholder="Search inventory categories..."
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
                                TOTAL : {filteredCategories.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Category Entity</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Querying Archives...</p>
                                        </td>
                                    </tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Grid size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No category definitions found.</p>
                                        </td>
                                    </tr>
                                ) : filteredCategories.map((cat) => (
                                    <tr key={cat._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4 ml-auto">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Grid size={18} />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${cat.is_active ? 'active' : 'disabled'}`}>
                                                {cat.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                                            <ActionDropdown item={cat} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <div className="absolute inset-0 bg-white z-[999] flex flex-col overflow-hidden animate-in fade-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 shadow-sm">
                            <h2 className="text-[22px] font-black text-slate-900 tracking-tighter uppercase">{isEditing ? 'Modify Category' : 'CATEGORY CREATION'}</h2>
                            <button 
                                onClick={() => { resetForm(); setShowDrawer(false); }}
                                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-2.5 rounded-xl font-bold transition-colors"
                            >
                                <XCircle size={20} />
                                <span className="text-sm tracking-wide">CLOSE</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
                            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-8 animate-in fade-in duration-300">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="category-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-0">
                                    
                                    {/* Row 1: Group Name */}
                                    <div className="flex flex-col md:flex-row md:items-center py-6 border-b border-slate-100/60">
                                        <label className="w-48 font-black text-slate-800 text-sm mb-2 md:mb-0">GROUP NAME *</label>
                                        <input
                                            type="text"
                                            required
                                            className="flex-1 input-premium !border-[#f97316] focus:ring-[#f97316]/20 rounded-lg px-4 py-3 bg-white text-slate-800"
                                            placeholder="Enter Group Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>



                                    {/* Row 3: HSN Code */}
                                    <div className="flex flex-col md:flex-row md:items-center py-6 border-b border-slate-100/60">
                                        <label className="w-48 font-black text-slate-800 text-sm mb-2 md:mb-0">HSN CODE *</label>
                                        <input
                                            type="text"
                                            required
                                            className="flex-1 input-premium !border-[#f97316] focus:ring-[#f97316]/20 rounded-lg px-4 py-3 bg-white text-slate-800"
                                            placeholder="Enter HSN Code"
                                            value={formData.hsn_code}
                                            onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                                        />
                                    </div>

                                    {/* Row 4: HSN Description */}
                                    <div className="flex flex-col md:flex-row md:items-center py-6 border-b border-slate-100/60">
                                        <label className="w-48 font-black text-slate-800 text-sm mb-2 md:mb-0">HSN DESCRIPTION *</label>
                                        <input
                                            type="text"
                                            required
                                            className="flex-1 input-premium !border-[#f97316] focus:ring-[#f97316]/20 rounded-lg px-4 py-3 bg-white text-slate-800"
                                            placeholder="Enter HSN Description"
                                            value={formData.hsn_description}
                                            onChange={(e) => setFormData({ ...formData, hsn_description: e.target.value })}
                                        />
                                    </div>

                                </form>

                                <div className="mt-10 flex justify-end">
                                    <button type="submit" form="category-form" disabled={submitting} className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#f97316]/20 transition-all">
                                        {submitting ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <Save size={20} />
                                                <span className="uppercase tracking-wider">{isEditing ? 'UPDATE' : 'SAVE'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
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

export default CategoryMaster;
