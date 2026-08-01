import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import './Dashboard.css';
import { PlusCircle, Search, Edit, Trash2, Loader2, AlertCircle, XCircle, CheckCircle2, Layers, ChevronDown, ChevronRight, Info, TrendingUp, TrendingDown, Package, Wallet, Triangle, X, Download, Printer, ChevronLeft, ArrowLeft, Save } from 'lucide-react';
import { STANDARD_GROUPS, getNatureForGroup, ACCOUNT_NATURES } from '../../utils/standardGroups';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import SearchableSelect from '../../components/common/SearchableSelect';
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
    const nameInputRef = useRef(null);
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

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkMenu, setShowBulkMenu] = useState(false);

    const toggleSelectAll = () => {
        const currentIds = groups.map(g => g._id);
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
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };

        if (actionType === 'DELETE') {
            if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)?`)) return;
            for (const id of selectedIds) {
                try {
                    await fetch(`${API}/ledger-groups/${id}`, { method: 'DELETE', headers });
                } catch (err) { }
            }
            fetchGroups();
        } else if (actionType === 'ACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetch(`${API}/ledger-groups/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: true }) });
                } catch (err) { }
            }
            fetchGroups();
        } else if (actionType === 'DEACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetch(`${API}/ledger-groups/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: false }) });
                } catch (err) { }
            }
            fetchGroups();
        } else if (actionType === 'CANCEL') {
            if (!window.confirm(`Are you sure you want to cancel ${selectedIds.length} selected record(s)?`)) return;
            for (const id of selectedIds) {
                try {
                    await fetch(`${API}/ledger-groups/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_cancelled: true, is_active: false }) });
                } catch (err) { }
            }
            fetchGroups();
        }
        setSelectedIds([]);
        setShowBulkMenu(false);
    };

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
            resetForm();
            setTimeout(() => {
                if (nameInputRef.current && typeof nameInputRef.current.focus === 'function') {
                    try { nameInputRef.current.focus(); } catch (_) {}
                }
            }, 100);
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

    const exportCols = ['#', 'Group Name', 'Nature'];
    const getExportRows = () => groups.map((g, i) => [i + 1, g.name, g.nature || '-']);
    const handleExcelExport = () => exportToCSV('Ledger Group Master', exportCols, getExportRows(), 'Group_Master');
    const handlePDFExport = () => exportToPDF('Ledger Group Master', exportCols, getExportRows(), 'Group_Master');

    const renderTreeRow = (node, depth = 0) => {
        const isExpanded = expandedGroups[node.name];
        const hasChildren = node.children && node.children.length > 0;
        const cfg = NATURE_CONFIG[node.nature] || NATURE_CONFIG.ASSETS;

        return (
            <React.Fragment key={node._id}>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group/row">
                    <td className="w-10 text-center py-3 px-2">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(node._id)}
                            onChange={() => toggleSelectOne(node._id)}
                            className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                        />
                    </td>
                    <td className="w-10 text-center py-3 px-2">
                        <ActionDropdown item={node} onEdit={handleEdit} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                    </td>
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
                </tr>
                {isExpanded && hasChildren && node.children.map(child => renderTreeRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={!showDrawer ? "Ledger Group Creation" : (isEditing ? "LEDGER GROUP MODIFICATION" : "LEDGER GROUP CREATION")}
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
                                <button type="button" className="btn-export print" onClick={() => window.print()} title="Print">
                                    <Printer size={14} />
                                    <span className="text-[10px] uppercase font-black text-[#f97316]">Print</span>
                                </button>
                                <button onClick={() => { resetForm(); setShowDrawer(true); }} className="btn-action-add">
                                    <PlusCircle size={16} /> Create Group
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
                                                    checked={groups.length > 0 && groups.every(g => selectedIds.includes(g._id))}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                                                />
                                            </th>
                                            <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                            <th>GROUP NAME</th>
                                            <th>NATURE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-12">
                                                    <Loader2 className="animate-spin text-[#f97316] mb-3 mx-auto" size={32} />
                                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Loading Hierarchy...</p>
                                                </td>
                                            </tr>
                                        ) : treeData.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-12">
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

                        {/* Bottom Total Buttons */}
                        <div className="mt-2 flex items-center justify-end gap-3 flex-shrink-0">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-400 text-[#ea580c] rounded-lg shadow-sm text-xs font-black uppercase tracking-wider">
                                <span>TOTAL RECORDS:</span>
                                <span className="text-sm">{treeData.length}</span>
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

                            <form id="group-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                                    <div className="flex flex-col gap-6 max-w-4xl">
                                        <div className="grid grid-cols-12 items-center gap-4">
                                            <label className="col-span-3 text-[14px] font-bold text-slate-800 uppercase">Group Name <span className="text-[#f97316]">*</span></label>
                                            <div className="col-span-9">
                                                <input
                                                    ref={nameInputRef}
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Sundry Debtors"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-orange-500 text-sm font-semibold text-black focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 items-center gap-4">
                                             <label className="col-span-3 text-[14px] font-bold text-slate-800 uppercase">Parent Group (Under)</label>
                                             <div className="col-span-9">
                                                 <SearchableSelect
                                                     name="parent"
                                                     value={formData.parent || ''}
                                                     options={[
                                                         { value: '', label: 'Primary Group (No Parent)' },
                                                         ...(Array.isArray(groups) ? groups.map(g => ({ value: g.name, label: `${g.name} (${g.nature || getNatureForGroup(g.name) || 'ASSETS'})` })) : [])
                                                     ]}
                                                     placeholder="Primary Group (No Parent)"
                                                     onChange={(e) => {
                                                         const selParent = e.target.value;
                                                         const nat = getNatureForGroup(selParent) || formData.nature || 'ASSETS';
                                                         setFormData({ ...formData, parent: selParent, nature: nat });
                                                     }}
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
            </main>
            <SaveConfirmationModal isOpen={showSaveConfirm} onConfirm={confirmSave} onCancel={cancelSave} />
        </DashboardPageShell>
    );
};

export default GroupMaster;
