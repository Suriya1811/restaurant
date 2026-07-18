import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import { PlusCircle, Search, Edit, Trash2, Loader2, AlertCircle, XCircle, CheckCircle2, Layers, ChevronDown, ChevronRight, Info, TrendingUp, TrendingDown, Package, Wallet, Triangle, X , Download, Printer, ChevronLeft, ArrowLeft} from 'lucide-react';
import { STANDARD_GROUPS, getNatureForGroup, ACCOUNT_NATURES } from '../../utils/standardGroups';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

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
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [filterNature, setFilterNature] = useState('ALL');
    const [filterActive, setFilterActive] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '', parent: '', nature: 'ASSETS', description: ''
    });
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const toggleExpand = (name) => setExpandedGroups(p => ({...p, [name]: !p[name]}));

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

    const handleStatusChange = async (group, newStatus) => {
        try {
            const res = await fetch(`${API}/ledger-groups/${group._id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}` 
                },
                body: JSON.stringify({ is_active: newStatus })
            });
            const data = await res.json();
            if (data.success) fetchGroups();
            else alert(data.error || 'Error updating status.');
        } catch (err) { alert('Error updating status.'); }
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
    const buildTree = (allGroups) => {
        const map = {};
        const roots = [];
        allGroups.forEach(g => { map[g.name] = { ...g, children: [] }; });
        allGroups.forEach(g => {
            if (g.parent && map[g.parent]) {
                map[g.parent].children.push(map[g.name]);
            } else {
                roots.push(map[g.name]);
            }
        });
        return roots;
    };

    const filterTree = (nodes, term, nature, active) => {
        if (!nodes) return [];
        return nodes.map(node => {
            const matchesTerm = node.name.toLowerCase().includes(term.toLowerCase());
            const matchesNature = nature === 'ALL' || node.nature === nature;
            
            let matchesActive = true;
            if (active === 'ACTIVE') matchesActive = node.is_active !== false;
            if (active === 'DEACTIVE') matchesActive = node.is_active === false;

            const filteredChildren = filterTree(node.children, term, nature, active);
            
            if ((matchesTerm && matchesNature && matchesActive) || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        }).filter(Boolean);
    };

    const treeData = filterTree(buildTree(groups), searchTerm, filterNature, filterActive);

    const renderTreeRow = (node, depth = 0) => {
        const isExpanded = expandedGroups[node.name];
        const hasChildren = node.children && node.children.length > 0;
        const cfg = NATURE_CONFIG[node.nature] || NATURE_CONFIG.ASSETS;

        return (
            <React.Fragment key={node._id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group/row">
                    <td className="py-3 px-4" style={{ paddingLeft: `${depth * 30 + 16}px` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-5 flex justify-center shrink-0">
                                {hasChildren ? (
                                    <button onClick={() => toggleExpand(node.name)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                ) : (
                                    <span className="w-5"></span>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-[14px] text-slate-800">{node.name}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-orange-50 text-[#f97316]">
                            {cfg.label}
                        </span>
                    </td>
                    <td>
                                                            <ActionDropdown item={node} onEdit={handleEdit} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                                                        </td>
                </tr>
                {isExpanded && hasChildren && node.children.map(child => renderTreeRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main flex flex-col h-screen relative bg-slate-50 font-sans">
                {/* Custom Header matching the screenshot */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">GROUP MASTER</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" className="btn-export excel" onClick={exportToCSV} title="Export to Excel">
                            <Download size={14} />
                            <span className="text-[10px] uppercase font-black text-emerald-500">Excel</span>
                        </button>
                        <button type="button" className="btn-export pdf" onClick={exportToPDF} title="Export to PDF">
                            <Download size={14} />
                            <span className="text-[10px] uppercase font-black text-rose-500">PDF</span>
                        </button>
                        <button type="button" className="btn-export print" onClick={() => window.print()} title="Print">
                            <Printer size={14} />
                            <span className="text-[10px] uppercase font-black text-[#f97316]">Print</span>
                        </button>
                        <button className="btn-action-add" onClick={() => { resetForm(); setShowDrawer(true); }}>
                            <PlusCircle size={18} />
                            <span className="text-[10px] uppercase font-black">Add New Group</span>
                        </button>
                        <button className="btn-action-close ml-2" onClick={() => window.history.back()} title="Close and Return to Home">
                            <X size={16} /> <span className="text-[10px] uppercase font-black">CLOSE</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
                    
                    {/* Search and Filter Bar */}
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
                        <div className="flex items-center gap-4 ml-auto">
                            <select 
                                value={filterNature}
                                onChange={e => setFilterNature(e.target.value)}
                                className="input-premium !py-1.5 !px-3 font-bold text-slate-700 cursor-pointer"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px', minWidth: '110px' }}
                            >
                                <option value="ALL">All Natures</option>
                                <option value="ASSETS">Assets</option>
                                <option value="LIABILITIES">Liabilities</option>
                                <option value="INCOME">Income</option>
                                <option value="EXPENSES">Expenses</option>
                            </select>

                            <select 
                                value={filterActive}
                                onChange={e => setFilterActive(e.target.value)}
                                className="input-premium !py-1.5 !px-3 font-bold text-slate-700 cursor-pointer"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px', minWidth: '110px' }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>
                            <span className="whitespace-nowrap text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 italic">
                                TOTAL : {treeData.length}
                            </span>
                        </div>
                    </div>

                    {/* Tree Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th>GROUP NAME</th>
                                        <th>NATURE</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-12">
                                                <Loader2 className="animate-spin text-[#f97316] mb-3 mx-auto" size={32} />
                                                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Loading Hierarchy...</p>
                                            </td>
                                        </tr>
                                    ) : treeData.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-12">
                                                <Layers size={40} className="mx-auto mb-3 text-slate-200" />
                                                <p className="font-black text-slate-400 uppercase tracking-widest text-[12px]">No Groups Found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        treeData.map(node => renderTreeRow(node, 0))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Keep existing Modals intact */}

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
                                            className="w-full h-11 px-3 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-[#f97316] transition-colors bg-white"
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
                                            className="w-full h-11 px-3 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-[#f97316] transition-colors bg-white cursor-pointer"
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
                                <button type="submit" form="group-form" disabled={submitting} className="flex-1 h-11 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
