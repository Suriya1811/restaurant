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
    Pocket,
    AlertCircle,
    Phone,
    UserCircle,
    Activity,
    ShieldCheck,
    Smartphone,
    MapPin,
    Calendar,
    Upload,
    Camera,
    CreditCard,
    X
    , Download, Printer
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const CaptainMaster = () => {
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
        cell_no_2: '',
        address: '',
        joining_date: new Date().toISOString().split('T')[0],
        id_proof_type: 'NONE',
        image: ''
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
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="Captain Master"
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
                                <span className="text-[10px] uppercase font-black">Register New Captain</span>
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
                                placeholder="Search personnel archives..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-premium w-40 !py-1.5 !px-3"
                                style={{ height: '32px', minHeight: '32px', fontSize: '12px' }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="DEACTIVE">Deactive</option>
                            </select>
                            
                        </div>
                    </div>

                    <div className="table-container-premium">
                        <table className="table-premium">
                            <thead>
                                <tr>
                                    <th>Personnel Identity</th>
                                    <th>Communication Ref</th>
                                    <th>Registry Status</th>
                                    <th style={{ textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Personnel Files...</p>
                                        </td>
                                    </tr>
                                ) : filteredCaptains.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <UserCircle size={64} className="text-slate-100 mx-auto mb-4" />
                                            <p className="font-bold text-slate-400">No personnel records found.</p>
                                        </td>
                                    </tr>
                                ) : filteredCaptains.map((cap) => (
                                    <tr key={cap._id} className="group">
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
                                        <td>
                                            <ActionDropdown item={cap} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
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
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{isEditing ? 'Modify Personnel' : 'Architect Personnel'}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Human Asset Registry</p>
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
                                <form id="captain-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-group-premium">
                                            <label>Personnel Identifier Label *</label>
                                            <div className="relative">
                                                <UserCircle size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
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
                                            <label>Personnel Photo</label>
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
                                            <label>Cell No (Primary) *</label>
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
                                            <label>Cell No 2 (Secondary)</label>
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
                                        <label>Residential Address</label>
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
                                            <label>Joining Date</label>
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
                                            <label>ID Proof Verification</label>
                                            <div className="relative">
                                                <CreditCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <select
                                                    className="input-premium !pl-12 !appearance-none"
                                                    value={formData.id_proof_type}
                                                    onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value })}
                                                >
                                                    <option value="NONE">SELECT ID PROOF</option>
                                                    <option value="ADHAR CARD">ADHAR CARD</option>
                                                    <option value="VOTER ID">VOTER ID</option>
                                                    <option value="DRIVING LICENSE">DRIVING LICENSE</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer-premium">
                                <button type="submit" form="captain-form" disabled={submitting} className="btn-action-add flex-1 justify-center py-4">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'COMMIT PERSONNEL' : 'DEPLOY PERSONNEL')}
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

export default CaptainMaster;
