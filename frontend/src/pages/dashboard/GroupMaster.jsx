import { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import { PlusCircle, Search, Edit, Trash2, Loader2, AlertCircle, XCircle, CheckCircle2, Layers, ChevronDown, Info, TrendingUp, TrendingDown, Package, Wallet, Triangle, X } from 'lucide-react';
import { STANDARD_GROUPS, getNatureForGroup, ACCOUNT_NATURES } from '../../utils/standardGroups';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';

const NATURE_CONFIG = {
    ASSETS: { label: 'Assets', color: '#6366f1', bg: '#eef2ff', icon: <Package size={14} /> },
    LIABILITIES: { label: 'Liabilities', color: '#f59e0b', bg: '#fffbeb', icon: <TrendingDown size={14} /> },
    INCOME: { label: 'Income', color: '#10b981', bg: '#d1fae5', icon: <TrendingUp size={14} /> },
    EXPENSES: { label: 'Expenses', color: '#ef4444', bg: '#fee2e2', icon: <Wallet size={14} /> }
};

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const GroupMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterNature, setFilterNature] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '', parent: '', nature: 'ASSETS', description: ''
    });
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleFormSubmitRequest = () => {
        setShowSaveConfirm(true);
    };

    const { formRef, handleKeyDown } = useFormNavigation([showDrawer], handleFormSubmitRequest);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/ledger-groups`, { headers: { Authorization: `Bearer ${getToken()}` } });
            const data = await res.json();
            if (data.success) setGroups(data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchGroups(); }, []);

    const resetForm = () => {
        setFormData({ name: '', parent: '', nature: 'ASSETS', description: '' });
        setIsEditing(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        // Auto-assign nature based on selected parent group
        const parentGroupObj = groups.find(g => g.name === formData.parent);
        const groupNature = formData.parent
            ? (parentGroupObj?.nature || getNatureForGroup(formData.parent) || 'ASSETS')
            : 'ASSETS';
        const payload = { ...formData, nature: groupNature };
        try {
            const url = isEditing ? `${API}/ledger-groups/${formData._id}` : `${API}/ledger-groups`;
            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error || result.message);
            fetchGroups();
            setShowDrawer(false);
            resetForm();
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    const confirmSave = () => {
        setShowSaveConfirm(false);
        handleSubmit();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleDelete = async (group) => {
        if (group.is_system) return alert('System groups cannot be deleted.');
        if (!window.confirm(`Delete group "${group.name}"?`)) return;
        try {
            const res = await fetch(`${API}/ledger-groups/${group._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) fetchGroups();
            else alert(data.error);
        } catch (err) { alert('Error deleting.'); }
    };

    const handleEdit = (group) => {
        setFormData({ ...group });
        setIsEditing(true);
        setShowDrawer(true);
    };

    // Build grouped structure for display
    const primaryGroups = groups.filter(g => !g.parent);
    const filteredGroups = groups.filter(g => {
        const nm = g.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const nt = filterNature === 'ALL' || g.nature === filterNature;
        return nm && nt;
    });

    // Group by nature for the summary cards
    const natureCounts = groups.reduce((acc, g) => {
        acc[g.nature] = (acc[g.nature] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex flex-col h-screen relative" style={{ overflowY: 'auto' }}>
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Group Master"
                    actions={
                        <button className="btn-premium-primary !py-1.5 !px-4" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} />
                            <span className="text-[10px] uppercase font-black">New Group</span>
                        </button>
                    }
                />

                <div className="p-6 bg-slate-100 fade-in flex flex-col gap-4">
                    
                    {/* Nature Cards Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        {Object.entries(NATURE_CONFIG).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => setFilterNature(filterNature === key ? 'ALL' : key)}
                                className={`bg-white p-3.5 rounded-xl border flex items-center gap-4 transition-all hover:shadow-md ${
                                    filterNature === key 
                                    ? 'border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm shadow-indigo-100' 
                                    : 'border-slate-200/80 shadow-sm'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                                    {cfg.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{cfg.label}</p>
                                    <h4 className="text-xl font-black text-slate-800 leading-none mt-1">{natureCounts[key] || 0}</h4>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="toolbar-premium">
                        <div className="search-premium">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search groups..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
                                {['ALL', 'ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'].map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => setFilterNature(n)}
                                        className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                                            filterNature === n 
                                            ? 'bg-white text-slate-900 shadow-sm font-black' 
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Group Name</th>
                                    <th style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Parent Group</th>
                                    <th style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Nature</th>
                                    <th style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Type</th>
                                    <th className="text-right" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-10 text-slate-400">
                                            <Loader2 className="animate-spin text-indigo-600 mb-2 mx-auto" size={24} />
                                            <p className="text-[10px] font-black uppercase tracking-wider">Loading Groups...</p>
                                        </td>
                                    </tr>
                                ) : filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-10">
                                            <Layers size={36} className="mx-auto mb-2 text-slate-200" />
                                            <p className="font-black text-slate-300 uppercase tracking-widest text-[10px]">No Groups Found</p>
                                        </td>
                                    </tr>
                                ) : filteredGroups.map(group => {
                                    const cfg = NATURE_CONFIG[group.nature] || NATURE_CONFIG.ASSETS;
                                    return (
                                        <tr key={group._id} className="group/row">
                                            <td style={{ fontSize: '13px' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-slate-500 group-hover/row:bg-indigo-50 group-hover/row:text-indigo-600 transition-colors">
                                                        <Layers size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[14px] text-[#0F172A]">{group.name}</div>
                                                        {group.description && (
                                                            <div className="text-[11px] text-slate-400 mt-0.5 max-w-[250px] truncate">{group.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '13px' }}>
                                                {group.parent ? (
                                                    <span className="px-2.5 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-600 border border-slate-200">{group.parent}</span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-300 uppercase">Primary</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '13px' }}>
                                                <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest"
                                                    style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '13px' }}>
                                                {group.is_system ? (
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase border border-blue-100">System</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase border border-emerald-100">Custom</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(group)}
                                                        className="action-icon-btn edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    {!group.is_system && (
                                                        <button onClick={() => handleDelete(group)}
                                                            className="action-icon-btn delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" style={{ maxHeight: '90vh' }}>
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{isEditing ? 'Modify Group' : 'New Group'}</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Master Entity Registry</p>
                                </div>
                                <button onClick={() => { resetForm(); setShowDrawer(false); }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-4 animate-in fade-in duration-300">
                                        <AlertCircle size={20} className="shrink-0" /> {error}
                                    </div>
                                )}
                                <form id="group-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-5">
                                    <div className="form-group-premium">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Group Name *</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full h-11 px-3 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors bg-white"
                                            placeholder="e.g. Sundry Debtors"
                                            value={formData.name}
                                            disabled={isEditing && formData.is_system}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                        {isEditing && formData.is_system && (
                                            <p className="text-[10px] text-amber-500 mt-2 font-bold">⚠ System group names cannot be changed.</p>
                                        )}
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Parent Group *</label>
                                        <select
                                            required
                                            className="w-full h-11 px-3 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors bg-white cursor-pointer"
                                            value={formData.parent || ''}
                                            onChange={e => setFormData({ ...formData, parent: e.target.value })}
                                        >
                                            <option value="" disabled>-- Select Standard Group --</option>
                                            {(() => {
                                                const grouped = {};
                                                Object.entries(STANDARD_GROUPS).forEach(([nat, gList]) => {
                                                    if (!grouped[nat]) grouped[nat] = new Set();
                                                    gList.forEach(g => grouped[nat].add(g));
                                                });
                                                if (groups && groups.length > 0) {
                                                    groups.forEach(g => {
                                                        const nat = g.nature || getNatureForGroup(g.name) || 'ASSETS';
                                                        if (!grouped[nat]) grouped[nat] = new Set();
                                                        grouped[nat].add(g.name);
                                                    });
                                                }
                                                return Object.entries(grouped).map(([nature, gSet]) => (
                                                    <optgroup key={nature} label={`── ${nature.toUpperCase()} ──`}>
                                                        {Array.from(gSet).sort().map(g => <option key={g} value={g}>{g}</option>)}
                                                    </optgroup>
                                                ));
                                            })()}
                                        </select>
                                    </div>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
                                <button type="submit" form="group-form" disabled={submitting} className="flex-1 h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? 'Confirm Changes' : 'Execute Registration')}
                                </button>
                                <button type="button" onClick={() => { resetForm(); setShowDrawer(false); }} className="px-5 h-11 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">Discard</button>
                            </div>
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

export default GroupMaster;
