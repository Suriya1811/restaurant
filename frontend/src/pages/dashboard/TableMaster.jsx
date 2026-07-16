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
    Grid,
    Users,
    Activity,
    Layers,
    X
    , Download, Printer
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';

const TableMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [captains, setCaptains] = useState([]);
    const [waiters, setWaiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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

            fetchTables();
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

    const filteredTables = tables.filter(t =>
        t.table_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'AVAILABLE': return { bg: '#dcfce7', text: '#166534', label: 'OPTIMAL' };
            case 'OCCUPIED': return { bg: '#fee2e2', text: '#991b1b', label: 'ENGAGED' };
            case 'RESERVED': return { bg: '#fef9c3', text: '#854d0e', label: 'COMMITTED' };
            case 'MAINTENANCE': return { bg: '#f1f5f9', text: '#475569', label: 'OFFLINE' };
            default: return { bg: '#f1f5f9', text: '#475569', label: 'UNKNOWN' };
        }
    };

    const buildGroups = () => {
        const map = {};
        tableTypes.forEach(tt => { map[tt.name] = []; });
        filteredTables.forEach(t => {
            const key = (t.table_type || '').trim() || 'Other';
            if (!map[key]) map[key] = [];
            map[key].push(t);
        });
        return Object.entries(map).filter(([, rows]) => rows.length > 0);
    };

    const groups = buildGroups();


    const exportCols = ['#', 'Table Name', 'Capacity', 'Status'];
    const getExportRows = () => filteredTables.map((t, i) => [i + 1, t.name, t.capacity || '-', t.status || '-']);
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
                    title="Table Creation"
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
                                <span className="text-[10px] uppercase font-black">Add New Table</span>
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
                                placeholder="Search spatial identifiers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Floor Capacity</span>
                                <span className="text-xl font-black text-slate-800">{filteredTables.reduce((acc, t) => acc + t.seating_capacity, 0)} <span className="text-xs text-slate-300">Guests</span></span>
                            </div>
                        </div>
                    </div>

                    <div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                                {Array(10).fill(0).map((_, i) => (
                                    <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[2rem]"></div>
                                ))}
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="py-20 text-center">
                                <Grid size={80} className="text-slate-100 mx-auto mb-6" />
                                <p className="text-xl font-black text-slate-300 uppercase tracking-[0.2em]">Floor Void Detected</p>
                            </div>
                        ) : groups.map(([groupName, groupTables]) => (
                            <div key={groupName} className="mb-12">
                                <div className="flex items-center gap-4 mb-6">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">{groupName}</h3>
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{groupTables.length} Tables</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                    {groupTables.map(table => {
                                        const isAvail = table.status === 'AVAILABLE';
                                        const isOccupied = table.status === 'OCCUPIED';
                                        const isPrinted = table.status === 'PRINTED';
                                        const isReserved = table.status === 'RESERVED';
                                        const isActive = isOccupied || isPrinted;

                                        const colorScheme = isOccupied
                                            ? { border: '#fdba74', bg: '#fffaf5', text: '#ea580c', glow: '#fb923c22' }
                                            : isPrinted
                                                ? { border: '#86efac', bg: '#f0fdf4', text: '#16a34a', glow: '#22c55e22' }
                                                : isReserved
                                                    ? { border: '#c4b5fd', bg: '#fbfaff', text: '#7c3aed', glow: '#a78bfa22' }
                                                    : { border: '#e2e8f0', bg: '#ffffff', text: '#334155', glow: 'transparent' };

                                        const { border, bg, text, glow } = colorScheme;

                                        return (
                                            <div key={table._id} style={{ display: 'flex', flexDirection: 'row', gap: '6px', flexShrink: 0, width: '164px', height: '108px', opacity: table.is_active ? 1 : 0.6, filter: table.is_active ? 'none' : 'grayscale(100%)', transition: 'all 0.2s ease' }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                                            >
                                                {/* Main Table Square */}
                                                <div
                                                    style={{
                                                        flex: 1, height: '100%', border: `1px solid ${border}`,
                                                        borderRadius: '12px', background: bg,
                                                        display: 'flex', flexDirection: 'column',
                                                        padding: '10px', position: 'relative',
                                                        boxShadow: isActive || isReserved ? `0 4px 16px ${glow}` : '0 2px 4px rgba(0,0,0,0.02)',
                                                        justifyContent: 'space-between'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: '18px', fontWeight: 900, color: text, lineHeight: 1 }}>{table.table_number}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
                                                            <Users size={12} strokeWidth={3} /> {table.seating_capacity || '-'}
                                                        </span>
                                                    </div>

                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                                        {table.captain && (
                                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                <span style={{ color: '#cbd5e1', marginRight: '3px' }}>C:</span>{table.captain}
                                                            </div>
                                                        )}
                                                        {table.waiter && (
                                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                <span style={{ color: '#cbd5e1', marginRight: '3px' }}>W:</span>{table.waiter}
                                                            </div>
                                                        )}
                                                        {!table.captain && !table.waiter && (
                                                            <div style={{ fontSize: '10px', fontWeight: 800, color: '#cbd5e1' }}>Unassigned</div>
                                                        )}
                                                    </div>

                                                    <div style={{ height: '14px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%' }}>
                                                        <span style={{ fontSize: '9px', fontWeight: 900, color: text, letterSpacing: '0.05em' }}>{table.status}</span>
                                                    </div>
                                                </div>

                                                {/* Actions Column */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '42px', height: '100%' }}>
                                                    <button onClick={() => handleEdit(table)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#6366f1', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                        title="Edit Table"
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                                        <Edit size={16} strokeWidth={2.5} />
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(table)} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: table.is_active ? '#15803d' : '#9a3412', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                        title={table.is_active ? "Deactivate" : "Activate"}
                                                        onMouseEnter={e => { e.currentTarget.style.background = table.is_active ? '#f0fdf4' : '#fff7ed'; e.currentTarget.style.borderColor = table.is_active ? '#bbf7d0' : '#ffedd5'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                                        {table.is_active ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <XCircle size={16} strokeWidth={2.5} />}
                                                    </button>
                                                    <button onClick={() => handleDelete(table)} style={{ flex: 1.2, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                        title="Delete Table"
                                                        onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                                                        onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}>
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium">
                            <div className="drawer-header-premium">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Spatial Unit' : 'Configure Spatial Unit'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Floor Master Definition</p>
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
                                <form id="table-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Table Name *</label>
                                            <input
                                                type="text"
                                                required
                                                className="input-premium"
                                                placeholder="e.g. G1"
                                                value={formData.table_number}
                                                onChange={(e) => setFormData({ ...formData, table_number: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Persons</label>
                                            <input
                                                type="number"
                                                className="input-premium"
                                                value={formData.seating_capacity}
                                                onChange={(e) => setFormData({ ...formData, seating_capacity: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group-premium">
                                            <label>Captain</label>
                                            <select
                                                className="input-premium"
                                                value={formData.captain}
                                                onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                                            >
                                                <option value="">-- Select Captain --</option>
                                                {captains.map(c => (
                                                    <option key={c._id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group-premium">
                                            <label>Waiter</label>
                                            <select
                                                className="input-premium"
                                                value={formData.waiter}
                                                onChange={(e) => setFormData({ ...formData, waiter: e.target.value })}
                                            >
                                                <option value="">-- Select Waiter --</option>
                                                {waiters.map(w => (
                                                    <option key={w._id} value={w.name}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group-premium">
                                        <label>Table Type</label>
                                        <div className="relative">
                                            <Layers size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <select
                                                className="input-premium !pl-12 !appearance-none"
                                                value={formData.table_type}
                                                onChange={(e) => setFormData({ ...formData, table_type: e.target.value })}
                                            >
                                                <option value="">-- Select Table Type --</option>
                                                {tableTypes.map(type => (
                                                    <option key={type._id} value={type.name}>{type.name}</option>
                                                ))}
                                                {tableTypes.length === 0 && (
                                                    <option disabled>No types yet — create in Table Type Master</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group-premium hidden">
                                        <label>Operational Status</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'].map(st => (
                                                <button key={st} type="button" onClick={() => setFormData({ ...formData, status: st })} className={`p-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.status === st ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 text-slate-400'}`}>
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="table-form" disabled={submitting} className="btn-action-add flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Commit Configuration' : 'Launch Unit')}
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

export default TableMaster;
