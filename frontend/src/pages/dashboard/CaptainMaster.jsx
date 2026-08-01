import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import './Dashboard.css';
import {
    PlusCircle,
    Search,
    Edit,
    CheckCircle2,
    XCircle,
    Trash2,
    Loader2,
    Pocket,
    AlertCircle,
    Phone,
    UserCircle,
    Activity,
    ShieldCheck,
    Smartphone,
    MapPin,
    Building2,
    Calendar,
    Camera,
    Check,
    ChevronDown,
    Download,
    Printer,
    Save
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import SearchableSelect from '../../components/common/SearchableSelect';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const CaptainMaster = () => {
    const nameInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [captains, setCaptains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        phone2: '',
        address: '',
        image: '',
        is_active: true
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Selection & Bulk Action State
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkMenu, setShowBulkMenu] = useState(false);

    const toggleSelectAll = () => {
        const currentIds = filteredCaptains.map(c => c._id);
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
            for (const id of selectedIds) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/captains/${id}`, { method: 'DELETE', headers });
                } catch (err) { }
            }
            fetchCaptains();
        } else if (actionType === 'ACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/captains/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: true }) });
                } catch (err) { }
            }
            fetchCaptains();
        } else if (actionType === 'DEACTIVATE') {
            for (const id of selectedIds) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/captains/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_active: false }) });
                } catch (err) { }
            }
            fetchCaptains();
        } else if (actionType === 'CANCEL') {
            if (!window.confirm(`Are you sure you want to cancel ${selectedIds.length} selected record(s)?`)) return;
            for (const id of selectedIds) {
                try {
                    await fetch(`${import.meta.env.VITE_API_URL}/captains/${id}`, { method: 'PUT', headers, body: JSON.stringify({ is_cancelled: true, is_active: false }) });
                } catch (err) { }
            }
            fetchCaptains();
        }
        setSelectedIds([]);
        setShowBulkMenu(false);
    };

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

    const fetchCaptains = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/captains`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCaptains(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch captains", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCaptains();
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/captains/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/captains`;

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

            fetchCaptains();
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

    const confirmSave = () => {
        setShowSaveConfirm(false);
        handleSubmit();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleToggleStatus = async (captain) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            await fetch(`${import.meta.env.VITE_API_URL}/captains/${captain._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCaptains();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (captain) => {
        if (!window.confirm(`Are you sure you want to delete captain "${captain.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/captains/${captain._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchCaptains();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error('Error deleting captain:', err);
            alert('An error occurred while deleting the captain.');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/captains/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadData
            });

            const result = await response.json();
            if (result.success) {
                setFormData({ ...formData, image: result.data });
            } else {
                alert(result.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Error uploading image');
        }
    };

    const handleEdit = (captain) => {
        setFormData({
            ...captain,
            joining_date: captain.joining_date ? new Date(captain.joining_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            cell_no_2: '',
            address: '',
            joining_date: new Date().toISOString().split('T')[0],
            id_proof_type: 'NONE',
            image: ''
        });
        setIsEditing(false);
        setError('');
    };

    const filteredCaptains = captains.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm);
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? c.is_active !== false : c.is_active === false);
        return matchesSearch && matchesStatus;
    });


    const exportCols = ['#', 'Name', 'Phone', 'Address'];
    const getExportRows = () => filteredCaptains.map((c, i) => [i + 1, c.name, c.phone || '-', c.address || '-']);
    const handleExcelExport = () => exportToCSV('Captain Master', exportCols, getExportRows(), 'Captain_Master');
    const handlePDFExport = () => exportToPDF('Captain Master', exportCols, getExportRows(), 'Captain_Master');
    const handlePrint = () => printTable('Captain Master', `Total: ${filteredCaptains.length}`, exportCols, getExportRows());

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={!showDrawer ? "Captain Master" : (isEditing ? "CAPTAIN MODIFICATION" : "CAPTAIN CREATION")}
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
                                    <span className="text-[10px] uppercase font-black">Register New Captain</span>
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
                                    placeholder="Search personnel archives..."
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
                                                checked={filteredCaptains.length > 0 && filteredCaptains.every(c => selectedIds.includes(c._id))}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                                            />
                                        </th>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                        <th>Personnel Identity</th>
                                        <th>Communication Ref</th>
                                        <th>Registry Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Personnel Files...</p>
                                            </td>
                                        </tr>
                                    ) : filteredCaptains.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <UserCircle size={64} className="text-slate-100 mx-auto mb-4" />
                                                <p className="font-bold text-slate-400">No personnel records found.</p>
                                            </td>
                                        </tr>
                                    ) : filteredCaptains.map((cap) => (
                                        <tr key={cap._id} className="group">
                                            <td className="w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(cap._id)}
                                                    onChange={() => toggleSelectOne(cap._id)}
                                                    className="w-4 h-4 rounded accent-[#ff6b00] cursor-pointer"
                                                />
                                            </td>
                                            <td className="w-10 text-center">
                                                <ActionDropdown item={cap} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-4 ml-auto">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-900/10 group-hover:bg-indigo-600 transition-all overflow-hidden">
                                                        {cap.image ? (
                                                            <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${cap.image}`} alt={cap.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            cap.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{cap.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5 italic">Operational Lead</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {cap.phone ? (
                                                    <div className="flex items-center gap-2 text-slate-600 font-black tracking-widest">
                                                        <Smartphone size={14} className="text-slate-300" />
                                                        {cap.phone}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-200 tracking-widest">NO COMMS REGISTERED</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge-premium ${cap.is_active ? 'active' : 'disabled'}`}>
                                                    {cap.is_active ? 'ACTIVE' : 'DEACTIVE'}
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
                                <span className="text-sm">{filteredCaptains.length}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden bg-white animate-in fade-in duration-200">
                        <div className="px-8 py-8 w-full flex flex-col flex-1 overflow-y-auto relative bg-white">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-8 animate-in fade-in duration-300">
                                    <AlertCircle size={20} /> {error}
                                </div>
                            )}
                            <form id="captain-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-8 max-w-4xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group-premium">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Personnel Identifier Label *</label>
                                        <div className="relative">
                                            <UserCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                ref={nameInputRef}
                                                type="text"
                                                required
                                                className="input-premium !pl-12"
                                                placeholder="e.g. RAHUL SHARMA"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Personnel Photo</label>
                                        <div className="flex items-center gap-4 ml-auto">
                                            <div className="relative group/img w-14 h-14 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-indigo-300">
                                                {formData.image ? (
                                                    <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${formData.image}`} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera size={20} className="text-slate-300 group-hover/img:text-indigo-400" />
                                                )}
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={handleImageUpload}
                                                    accept="image/*"
                                                />
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                                                Recommended<br />1:1 Aspect Ratio
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group-premium">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Cell No (Primary) *</label>
                                        <div className="relative">
                                            <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                required
                                                className="input-premium !pl-12"
                                                placeholder="10-digit primary contact"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Cell No 2 (Secondary)</label>
                                        <div className="relative">
                                            <Smartphone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                className="input-premium !pl-12"
                                                placeholder="Secondary contact"
                                                value={formData.cell_no_2}
                                                onChange={(e) => setFormData({ ...formData, cell_no_2: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group-premium">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Residential Address</label>
                                    <div className="relative">
                                        <MapPin size={20} className="absolute left-4 top-4 text-slate-300" />
                                        <textarea
                                            className="input-premium !pl-12 min-h-[100px] py-4"
                                            placeholder="Enter full residential address..."
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group-premium">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Joining Date</label>
                                        <div className="relative">
                                            <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="date"
                                                className="input-premium !pl-12"
                                                value={formData.joining_date}
                                                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-premium">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">ID Proof Verification</label>
                                        <div className="relative">
                                            <SearchableSelect
                                                name="id_proof_type"
                                                value={formData.id_proof_type}
                                                options={[
                                                    { value: 'NONE', label: 'SELECT ID PROOF' },
                                                    { value: 'ADHAR CARD', label: 'ADHAR CARD' },
                                                    { value: 'VOTER ID', label: 'VOTER ID' },
                                                    { value: 'DRIVING LICENSE', label: 'DRIVING LICENSE' }
                                                ]}
                                                placeholder="SELECT ID PROOF"
                                                onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-12 w-full max-w-4xl pt-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#f97316]/20 transition-all cursor-pointer"
                                    >
                                        {submitting ? <Loader2 size={18} className="animate-spin" /> : (
                                            <>
                                                <Save size={20} />
                                                <span className="uppercase tracking-wider">{isEditing ? 'UPDATE' : 'SAVE'}</span>
                                            </>
                                        )}
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
        </DashboardPageShell>
    );
};

export default CaptainMaster;
