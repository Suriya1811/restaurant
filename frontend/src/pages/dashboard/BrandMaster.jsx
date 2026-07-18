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
    Tag,
    AlertCircle,
    Award,
    X,
    Download,
    Printer
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const BrandMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '' });
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

    const fetchBrands = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/brands`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setBrands(data.data);
        } catch (err) {
            console.error("Failed to fetch brands", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBrands(); }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/brands/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/brands`;
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || result.message);
            fetchBrands();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (brand) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/brands/${brand._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchBrands();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (brand) => {
        if (!window.confirm(`Are you sure you want to delete the brand "${brand.name}"?`)) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/brands/${brand._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) fetchBrands();
            else alert(`Error: ${result.error}`);
        } catch (err) {
            console.error('Error deleting brand:', err);
            alert('An error occurred while deleting the brand.');
        }
    };

    const handleEdit = (brand) => { setFormData(brand); setIsEditing(true); setShowDrawer(true); };
    const resetForm = () => { setFormData({ name: '' }); setIsEditing(false); setError(''); };
    const confirmSave = () => { setShowSaveConfirm(false); handleSubmit(); };
    const cancelSave = () => { setShowSaveConfirm(false); };

    const filteredBrands = brands.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? b.is_active !== false : b.is_active === false);
        return matchesSearch && matchesStatus;
    });

    const COLS = ['#', 'Brand Name', 'Status'];
    const getRows = () => filteredBrands.map((b, i) => [i + 1, b.name, b.is_active ? 'Active' : 'Inactive']);
    const handleExcelExport = () => exportToCSV('Brand Master', COLS, getRows(), 'Brand_Master');
    const handlePDFExport   = () => exportToPDF('Brand Master', COLS, getRows(), 'Brand_Master');
    const handlePrint       = () => printTable('Brand Master', `Total: ${filteredBrands.length}`, COLS, getRows());

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Brand Creation"
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
                                <span className="text-[10px] uppercase font-black">Add New Brand</span>
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
                                placeholder="Search manufacturing brands..."
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
                                TOTAL : {filteredBrands.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Brand Identity</th>
                                    <th>Registry Status</th>
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
                                ) : filteredBrands.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Tag size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No brand definitions found.</p>
                                        </td>
                                    </tr>
                                ) : filteredBrands.map((brand) => (
                                    <tr key={brand._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4 ml-auto">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Tag size={18} />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{brand.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${brand.is_active ? 'active' : 'disabled'}`}>
                                                {brand.is_active ? 'ACTIVE' : 'DEACTIVE'}
                                            </span>
                                        </td>
                                        <td>
                                                            <ActionDropdown item={brand} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <div className="fixed inset-0 md:pl-[260px] bg-white z-50 overflow-hidden flex flex-col animate-in fade-in duration-200">
                        <div className="flex justify-between items-center px-8 py-4 border-b border-slate-100 bg-white shrink-0">
                            <h2 className="text-xl font-bold text-black tracking-tight">
                                {isEditing ? 'Modify Brand' : 'Brand Creation'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => { resetForm(); setShowDrawer(false); }}
                                className="px-4 py-1.5 rounded flex items-center gap-2 font-bold hover:bg-red-50 text-sm outline-none transition-colors"
                                style={{ border: '1px solid #ef4444', color: '#ef4444' }}
                            >
                                <X size={16} /> CLOSE
                            </button>
                        </div>

                        <div className="px-8 py-8 w-full flex flex-col overflow-y-auto">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 p-3 mb-4 rounded flex items-center gap-3 text-rose-600 font-bold text-sm shrink-0">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <form id="brand-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex flex-col flex-1">
                                <div className="flex flex-col gap-6 max-w-3xl">
                                    <div className="flex items-center">
                                        <label className="w-48 shrink-0 text-sm font-bold text-slate-800">
                                            Brand Name <span className="text-[#f97316]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            placeholder="Enter brand name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="flex-1 rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316]"
                                            style={{ border: '1px solid #f97316' }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-12 w-full max-w-5xl absolute bottom-8 right-8">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="font-bold px-8 py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-white shadow-sm hover:opacity-90"
                                        style={{ backgroundColor: '#f97316' }}
                                    >
                                        {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <SaveConfirmationModal
                            isOpen={showSaveConfirm}
                            onConfirm={confirmSave}
                            onCancel={cancelSave}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default BrandMaster;
