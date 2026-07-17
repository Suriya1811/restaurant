import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle,
    Search,
    Edit,
    XCircle,
    Trash2,
    Loader2,
    Grid,
    AlertCircle,
    Activity,
    Layers,
    X
, Download, Printer} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const TableTypeMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [tableTypes, setTableTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        captain: '',
        waiter: ''
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

    const fetchTableTypes = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/table-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTableTypes(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch table types", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableTypes();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/table-types/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/table-types`;

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

            fetchTableTypes();
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

    const handleDelete = async (type) => {
        if (!window.confirm(`Are you sure you want to delete "${type.name}"? This will affect tables assigned to this zone.`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/table-types/${type._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchTableTypes();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting table type:', err);
            alert('An error occurred while deleting.');
        }
    };

    const handleEdit = (type) => {
        setFormData(type);
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({ name: '', captain: '', waiter: '' });
        setIsEditing(false);
        setError('');
    };

    const filteredTableTypes = tableTypes.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const exportCols = ['#', 'Table Type Name'];
    const getExportRows = () => filteredTableTypes.map((t, i) => [i + 1, t.name]);
    const handleExcelExport = () => exportToCSV('Table Type Master', exportCols, getExportRows(), 'TableType_Master');
    const handlePDFExport   = () => exportToPDF('Table Type Master', exportCols, getExportRows(), 'TableType_Master');
    const handlePrint       = () => printTable('Table Type Master', `Total: ${filteredTableTypes.length}`, exportCols, getExportRows());

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Table Type Creation"
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
                            <span className="text-[10px] uppercase font-black">Create New TableType</span>
                        </button>
                    </>
}
                />
                <div className="master-content-layout fade-in">
                    {/* Header relocated */}


                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search spatial zones..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                Active Zones: {filteredTableTypes.length}
                            </span>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Zone Identity</th>
                                    <th>Asset Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Data...</p>
                                        </td>
                                    </tr>
                                ) : filteredTableTypes.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Grid size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No spatial zones defined.</p>
                                        </td>
                                    </tr>
                                ) : filteredTableTypes.map((type) => (
                                    <tr key={type._id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Layers size={18} />
                                                </div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{type.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge-premium ${type.is_active !== false ? 'active' : 'disabled'}`}>
                                                {type.is_active !== false ? 'Operational' : 'Restricted'}
                                            </span>
                                        </td>
                                        <td>
                                                            <ActionDropdown item={type} onEdit={handleEdit} onDelete={handleDelete} />
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
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Zone' : 'Architect Zone'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Spatial Entity Definition</p>
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
                                <form id="table-type-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-8">
                                    <div className="form-group-premium">
                                        <label>Zone Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-premium"
                                            placeholder="e.g. GARDEN / AC HALL"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Assigned Captain</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. RAJESH"
                                            value={formData.captain || ''}
                                            onChange={(e) => setFormData({ ...formData, captain: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Assigned Waiter</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            placeholder="e.g. CHANDRU"
                                            value={formData.waiter || ''}
                                            onChange={(e) => setFormData({ ...formData, waiter: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="table-type-form" disabled={submitting} className="btn-action-add flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Commit Changes' : 'Launch Zone')}
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

export default TableTypeMaster;
