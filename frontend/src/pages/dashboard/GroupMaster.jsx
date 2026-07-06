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

            <main className="dashboard-main overflow-hidden font-sans">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Group Master"
                    actions={
                        <button className="h-8 px-4 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-1.5 shadow-sm" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={13} /> New Group
                        </button>
                    }
                />

                <div className="dashboard-content fade-in p-3 max-w-[2000px] mx-auto w-full gap-3" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(100vh - 65px)' }}>

                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Layers size={18} className="text-indigo-500" />
                            <h2 className="text-base font-bold text-slate-800 tracking-tight">Ledger Groups</h2>
                            <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Master</span>
                        </div>
                        <p className="text-[11px] text-slate-400 hidden sm:block">Organize ledger accounts by group and nature classification.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
                        {Object.entries(NATURE_CONFIG).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => setFilterNature(filterNature === key ? 'ALL' : key)}
                                className={`bg-white p-2.5 rounded-xl border shadow-sm flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 text-left ${filterNature === key ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200/80'
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                                    {cfg.icon}
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{cfg.label}</p>
                                    <h4 className="text-base font-extrabold text-slate-800 leading-none mt-0.5">{natureCounts[key] || 0}</h4>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <input
                                type="text"
                                placeholder="Search groups..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                            {['ALL', 'ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'].map(n => (
                                <button key={n} onClick={() => setFilterNature(n)}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterNature === n ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                                        }`}>
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto border border-slate-100 rounded-xl bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="p-2.5 bg-slate-50">Group Name</th>
                                    <th className="p-2.5 bg-slate-50">Parent Group</th>
                                    <th className="p-2.5 bg-slate-50">Nature</th>
                                    <th className="p-2.5 bg-slate-50">Type</th>
                                    <th className="p-2.5 text-right bg-slate-50">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">
                                        <Loader2 className="animate-spin text-indigo-500 mb-2 mx-auto" size={24} />
                                        <p className="text-[9px] font-bold uppercase tracking-wider">Loading Groups...</p>
                                    </td></tr>
                                ) : filteredGroups.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center">
                                        <Layers size={36} className="mx-auto mb-2 text-slate-200" />
                                        <p className="font-bold text-slate-300 uppercase tracking-widest text-[9px]">No Groups Found</p>
                                    </td></tr>
                                ) : filteredGroups.map(group => {
                                    const cfg = NATURE_CONFIG[group.nature] || NATURE_CONFIG.ASSETS;
                                    return (
                                        <tr key={group._id} className="hover:bg-slate-50/40 group/row transition-all">
                                            <td className="p-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/row:scale-110"
                                                        style={{ background: cfg.bg, color: cfg.color }}>
                                                        <Layers size={13} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-[12px]">{group.name}</div>
                                                        {group.description && (
                                                            <div className="text-[9px] text-slate-400 mt-0.5 max-w-[200px] truncate">{group.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2.5">
                                                {group.parent ? (
                                                    <span className="px-2 py-0.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100">{group.parent}</span>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Primary</span>
                                                )}
                                            </td>
                                            <td className="p-2.5">
                                                <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                                    style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="p-2.5">
                                                {group.is_system ? (
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">System</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Custom</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-right">
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(group)}
                                                        className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all">
                                                        <Edit size={12} />
                                                    </button>
                                                    {!group.is_system && (
                                                        <button onClick={() => handleDelete(group)}
                                                            className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all">
                                                            <Trash2 size={12} />
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
                    <>
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[999]" onClick={() => setShowDrawer(false)}></div>
                        <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[1000] flex flex-col">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                            <Layers size={20} />
                                        </div>
                                        <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full">{isEditing ? 'EDIT GROUP' : 'NEW GROUP'}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {isEditing ? 'Modify Account Group' : 'Create Account Group'}
                                    </h3>
                                </div>
                                <button onClick={() => { resetForm(); setShowDrawer(false); }}
                                    className="w-12 h-12 rounded-full hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all bg-slate-100 text-slate-400">
                                    <X size={32} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}
                                <form id="group-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-8">
                                    <div className="form-group-premium">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Group Name *</label>
                                        <input
                                            required
                                            className="w-full bg-slate-50 border-0 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
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
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block">Parent Group *</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full bg-slate-50 border-0 rounded-xl py-3 px-4 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
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
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-8 border-t border-slate-50 flex gap-4">
                                <button type="submit" form="group-form" disabled={submitting}
                                    className="bg-slate-900 text-white flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> {isEditing ? 'Save Changes' : 'Create Group'}</>}
                                </button>
                                <button onClick={() => { resetForm(); setShowDrawer(false); }}
                                    className="w-16 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all">
                                    <X size={24} />
                                </button>
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

export default GroupMaster;
