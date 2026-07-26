import { useState, useEffect, useRef } from 'react';
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
    Grid
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const TableMaster = () => {
    const numberInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [captains, setCaptains] = useState([]);
    const [waiters, setWaiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [tableTypeFilter, setTableTypeFilter] = useState('ALL');
    const [captainFilter, setCaptainFilter] = useState('ALL');
    const [waiterFilter, setWaiterFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        table_number: '',
        seating_capacity: 4,
        captain: '',
        waiter: '',
        table_type: 'G Floor',
        status: 'AVAILABLE'
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

    const fetchTables = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const [tableRes, typeRes, captRes, waitRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/tables`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/table-types`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/captains`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL}/waiters`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const tableData = await tableRes.json();
            const typeData = await typeRes.json();
            const captData = await captRes.json();
            const waitData = await waitRes.json();

            if (tableData.success) setTables(tableData.data);
            if (typeData.success) setTableTypes(typeData.data);
            if (captData.success) setCaptains(captData.data);
            if (waitData.success) setWaiters(waitData.data);

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/tables/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/tables`;

            const method = isEditing ? 'PUT' : 'POST';

            // Ensure status defaults to AVAILABLE on creation if empty
            const submissionData = {
                ...formData,
                status: formData.status || 'AVAILABLE'
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submissionData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || result.message);
            }

            fetchTables();
            if (isEditing) {
                setShowDrawer(false);
                resetForm();
            } else {
                resetForm();
                setTimeout(() => {
                    if (numberInputRef.current) numberInputRef.current.focus();
                }, 100);
            }
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

    const handleToggleStatus = async (table) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchTables();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (table) => {
        if (!window.confirm(`Are you sure you want to delete table "${table.table_number}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/tables/${table._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchTables();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting table:', err);
            alert('An error occurred while deleting the table.');
        }
    };

    const handleEdit = (table) => {
        setFormData(table);
        setIsEditing(true);
        setShowDrawer(true);
    };


    const resetForm = () => {
        setFormData({ table_number: '', seating_capacity: 4, captain: '', waiter: '', table_type: 'G Floor', status: 'AVAILABLE' });
        setIsEditing(false);
        setError('');
    };

    const filteredTables = tables.filter(t => {
        const matchesSearch = (t.table_number || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? t.is_active !== false : t.is_active === false);
        const matchesType = tableTypeFilter === 'ALL' ? true : t.table_type === tableTypeFilter;
        const matchesCaptain = captainFilter === 'ALL' ? true : t.captain === captainFilter;
        const matchesWaiter = waiterFilter === 'ALL' ? true : t.waiter === waiterFilter;
        return matchesSearch && matchesStatus && matchesType && matchesCaptain && matchesWaiter;
    });


    const exportCols = ['#', 'Table Name', 'Table Type', 'Persons', 'Captain', 'Waiter'];
    const getExportRows = () => filteredTables.map((t, i) => [i + 1, t.table_number, t.table_type || '-', t.seating_capacity || '-', t.captain || '-', t.waiter || '-']);
    const handleExcelExport = () => exportToCSV('Table Master', exportCols, getExportRows(), 'Table_Master');
    const handlePDFExport = () => exportToPDF('Table Master', exportCols, getExportRows(), 'Table_Master');
    const handlePrint = () => printTable('Table Master', `Total: ${filteredTables.length}`, exportCols, getExportRows());

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={!showDrawer ? "Table Display" : (isEditing ? "TABLE ALTERATION" : "TABLE CREATION")}
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
                                    <span className="text-[10px] uppercase font-black">Add New Table</span>
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
                                    placeholder="Search table..."
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
                                    TOTAL : {filteredTables.length}
                                </span>
                            </div>
                        </div>

                        <div className="table-container-premium">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                        <th>Table Identifier</th>
                                        <th>Seating Capacity</th>
                                        <th>Spatial Zone</th>
                                        <th>Assigned Captain</th>
                                        <th>Assigned Waiter</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Grid Data...</p>
                                            </td>
                                        </tr>
                                    ) : filteredTables.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Grid size={64} className="text-slate-100 mx-auto mb-4" />
                                                <p className="font-bold text-slate-400">No tables configured.</p>
                                            </td>
                                        </tr>
                                    ) : filteredTables.map((table) => (
                                        <tr key={table._id} className="group">
                                            <td className="w-10 text-center">
                                                <ActionDropdown item={table} onEdit={handleEdit} onDelete={handleDelete} />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-4 ml-auto">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                        <Grid size={18} />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{table.table_number}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-bold text-slate-900">{table.seating_capacity} Persons</span>
                                            </td>
                                            <td>
                                                <span className="badge-premium info">{table.table_type || 'G Floor'}</span>
                                            </td>
                                            <td>
                                                <span className="text-xs font-semibold text-slate-700">{table.captain || '-'}</span>
                                            </td>
                                            <td>
                                                <span className="text-xs font-semibold text-slate-700">{table.waiter || '-'}</span>
                                            </td>
                                            <td>
                                                <span className={`badge-premium ${table.is_active !== false ? 'active' : 'disabled'}`}>
                                                    {table.is_active !== false ? 'AVAILABLE' : 'DEACTIVE'}
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
                                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded flex items-center gap-2 text-rose-700 font-medium text-xs mb-3 flex-shrink-0 animate-in fade-in duration-200">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form id="table-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                                    <div className="flex flex-col gap-6 max-w-4xl">
                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                Table Name <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <input
                                                    ref={numberInputRef}
                                                    type="text"
                                                    required
                                                    placeholder="Enter table name"
                                                    value={formData.table_number}
                                                    onChange={(e) => setFormData({ ...formData, table_number: e.target.value.toUpperCase() })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316]"
                                                    style={{ border: '1px solid #f97316' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                Table Type <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <select
                                                    required
                                                    value={formData.table_type}
                                                    onChange={(e) => setFormData({ ...formData, table_type: e.target.value })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316] cursor-pointer"
                                                    style={{ border: '1px solid #f97316' }}
                                                >
                                                    <option value="">Select table type</option>
                                                    {tableTypes.map(type => (
                                                        <option key={type._id} value={type.name}>{type.name}</option>
                                                    ))}
                                                    {tableTypes.length === 0 && (
                                                        <option disabled>No types yet — create in Table Type Master</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                Persons <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <input
                                                    type="number"
                                                    required
                                                    placeholder="Enter number of persons"
                                                    value={formData.seating_capacity}
                                                    onChange={(e) => setFormData({ ...formData, seating_capacity: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316]"
                                                    style={{ border: '1px solid #f97316' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                Captain <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <select
                                                    required
                                                    value={formData.captain}
                                                    onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316] cursor-pointer"
                                                    style={{ border: '1px solid #f97316' }}
                                                >
                                                    <option value="">Select captain</option>
                                                    {captains.map(c => (
                                                        <option key={c._id} value={c.name}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800">
                                                Waiter <span className="text-[#f97316]">*</span>
                                            </label>
                                            <div className="col-span-9">
                                                <select
                                                    required
                                                    value={formData.waiter}
                                                    onChange={(e) => setFormData({ ...formData, waiter: e.target.value })}
                                                    className="w-full rounded-md px-4 py-2 outline-none text-sm font-semibold transition-shadow focus:ring-1 focus:ring-[#f97316] cursor-pointer"
                                                    style={{ border: '1px solid #f97316' }}
                                                >
                                                    <option value="">Select waiter</option>
                                                    {waiters.map(w => (
                                                        <option key={w._id} value={w.name}>{w.name}</option>
                                                    ))}
                                                </select>
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
        </div>
    );
};

export default TableMaster;
