import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import './Dashboard.css';
import {
    PlusCircle, Search, Edit, CheckCircle2, XCircle, Trash2, Loader2,
    Grid, AlertCircle, Filter, Activity, ChevronRight, ChevronDown, X, Download, Printer, Save
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const CategoryMaster = () => {
    const nameInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        hsn_code: '',
        hsn_description: '',
        is_active: true
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkMenu, setShowBulkMenu] = useState(false);

    const toggleSelectAll = () => {
        const currentIds = filteredCategories.map(c => c._id);
        const allSelected = currentIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
        } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkAction = async (actionType) => {
        if (selectedIds.length === 0) {
            alert("Please select at least one record.");
            return;
        }
        const savedUser = localStorage.getItem('user');
        const { token } = JSON.parse(savedUser || '{}');
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        if (actionType === 'DELETE') {
            if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)?`)) return;
            let blockedMsg = '';
            for (const id of selectedIds) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/categories/${id}`, { method: 'DELETE', headers });
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                        blockedMsg = data.message || data.error;
                    }
                } catch (err) { }
            }
            if (blockedMsg) alert(blockedMsg);
            fetchCategories();
        } else if (actionType === 'ACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/categories/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: true }) });
                } catch (err) { }
            }
            fetchCategories();
        } else if (actionType === 'DEACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/categories/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: false }) });
                } catch (err) { }
            }
            fetchCategories();
        } else if (actionType === 'CANCEL') {
            if (!window.confirm(`Are you sure you want to cancel ${selectedIds.length} selected record(s)?`)) return;
            for (const id of selectedIds) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/categories/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_cancelled: true, is_active: false }) });
                } catch (err) { }
            }
            fetchCategories();
        }
        setSelectedIds([]);
        setShowBulkMenu(false);
    };

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
            setLoading(true);
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
    const handlePDFExport = () => exportToPDF('Category Master', COLS, getRows(), 'Category_Master');
    const handlePrint = () => printTable('Category Master', `Total: ${filteredCategories.length}`, COLS, getRows());

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={!showDrawer ? "Category Master" : (isEditing ? "CATEGORY MODIFICATION" : "CATEGORY CREATION")}
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
                                <button className="btn-action-add" onClick={() => { resetForm(); setShowDrawer(true); }}>
                                    <PlusCircle size={18} />
                                    <span className="text-[10px] uppercase font-black">Add New Category</span>
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
                                <div className="relative ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkMenu(!showBulkMenu)}
                                        className="px-4 py-2 bg-white border border-orange-400 text-[#ea580c] rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors shadow-sm uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                                    >
                                        Actions {selectedIds.length > 0 && <span className="bg-[#ea580c] text-white px-1.5 py-0.5 rounded-full text-[10px]">{selectedIds.length}</span>}
                                        <ChevronDown size={14} />
                                    </button>
                                    {showBulkMenu && (
                                        <div className="absolute right-0 mt-1 w-40 bg-white border border-orange-200 rounded-lg shadow-xl z-50 py-1 font-bold text-xs">
                                            <button onClick={() => handleBulkAction('ACTIVATE')} className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 transition-colors">Activate</button>
                                            <button onClick={() => handleBulkAction('DEACTIVATE')} className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700 transition-colors">Deactivate</button>
                                            <button onClick={() => handleBulkAction('DELETE')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="table-container-premium flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 275px)' }}>
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px', textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={filteredCategories.length > 0 && filteredCategories.every(c => selectedIds.includes(c._id))}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                                            />
                                        </th>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                        <th>Category Entity</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            </td>
                                        </tr>
                                    ) : filteredCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Grid size={64} className="text-slate-100 mx-auto mb-4" />
                                                <p className="font-bold text-slate-400">No category definitions found.</p>
                                            </td>
                                        </tr>
                                    ) : filteredCategories.map((cat) => (
                                        <tr key={cat._id} className="group">
                                            <td className="w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(cat._id)}
                                                    onChange={() => toggleSelectOne(cat._id)}
                                                    className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                                                />
                                            </td>
                                            <td className="w-10 text-center">
                                                <ActionDropdown item={cat} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                            </td>
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Bottom Total Buttons */}
                        <div className="mt-2 flex items-center justify-end gap-3 flex-shrink-0">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-400 text-[#ea580c] rounded-lg shadow-sm text-xs font-black uppercase tracking-wider">
                                <span>TOTAL RECORDS:</span>
                                <span className="text-sm">{filteredCategories.length}</span>
                            </div>
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

                            <form id="category-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                                    <div className="flex flex-col gap-6 max-w-4xl">
                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                Group Name <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <input
                                                    ref={nameInputRef}
                                                    type="text"
                                                    required
                                                    placeholder="Enter Group Name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316]"
                                                    style={{ border: '1px solid #f97316' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                HSN Code <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Enter HSN Code"
                                                    value={formData.hsn_code}
                                                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316]"
                                                    style={{ border: '1px solid #f97316' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                HSN Description <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Enter HSN Description"
                                                    value={formData.hsn_description}
                                                    onChange={(e) => setFormData({ ...formData, hsn_description: e.target.value })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316]"
                                                    style={{ border: '1px solid #f97316' }}
                                                />
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

export default CategoryMaster;
