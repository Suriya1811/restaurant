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
    Trash2,
    Loader2,
    AlertCircle,
    Phone,
    UserCircle,
    ShieldCheck,
    Smartphone,
    MapPin,
    Calendar,
    CreditCard,
    Users,
    Camera,
    X,
    Download,
    Printer,
    Save
} from 'lucide-react';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import SaveConfirmationModal from '../../components/common/SaveConfirmationModal';
import { exportToCSV, exportToPDF, printTable } from '../../utils/exportUtils';
import ActionDropdown from '../../components/dashboard/ActionDropdown';

const StaffMaster = ({ defaultType = 'CAPTAIN' }) => {
    const nameInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [staffType, setStaffType] = useState(defaultType); // 'CAPTAIN' or 'WAITER'

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

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const endpoint = staffType === 'CAPTAIN' ? 'captains' : 'waiters';
            const response = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStaff(data.data);
            }
        } catch (err) {
            console.error(`Failed to fetch ${staffType}`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [staffType]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const endpoint = staffType === 'CAPTAIN' ? 'captains' : 'waiters';
            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/${endpoint}/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/${endpoint}`;

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

            fetchStaff();
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

    const handleToggleStatus = async (member) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const endpoint = staffType === 'CAPTAIN' ? 'captains' : 'waiters';
            await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}/${member._id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchStaff();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (member) => {
        if (!window.confirm(`Are you sure you want to delete ${staffType.toLowerCase()} "${member.name}"?`)) {
            return;
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const endpoint = staffType === 'CAPTAIN' ? 'captains' : 'waiters';
            const response = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}/${member._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();

            if (result.success) {
                fetchStaff();
            } else {
                alert(`Error: ${result.error || result.message}`);
            }
        } catch (err) {
            console.error(`Error deleting ${staffType}:`, err);
            alert(`An error occurred while deleting the ${staffType.toLowerCase()}.`);
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

            const endpoint = staffType === 'CAPTAIN' ? 'captains' : 'waiters';
            const response = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}/upload`, {
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

    const handleEdit = (member) => {
        setFormData({
            ...member,
            joining_date: member.joining_date ? new Date(member.joining_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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

    const filteredStaff = staff.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm);
        const matchesStatus = statusFilter === 'ALL' ? true : (statusFilter === 'ACTIVE' ? s.is_active !== false : s.is_active === false);
        return matchesSearch && matchesStatus;
    });


    const exportCols = ['#', 'Name', 'Role', 'Phone'];
    const getExportRows = () => filteredStaff.map((s, i) => [i + 1, s.name, s.role || '-', s.phone || '-']);
    const handleExcelExport = () => exportToCSV('Staff Master', exportCols, getExportRows(), 'Staff_Master');
    const handlePDFExport = () => exportToPDF('Staff Master', exportCols, getExportRows(), 'Staff_Master');
    const handlePrint = () => printTable('Staff Master', `Total: ${filteredStaff.length}`, exportCols, getExportRows());

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title={!showDrawer ? (staffType === 'CAPTAIN' ? 'Captain Display' : 'Waiter Display') : (isEditing ? `MODIFY ${staffType}` : `${staffType} CREATION`)}
                    onClose={!showDrawer ? undefined : () => { resetForm(); setShowDrawer(false); }}
                    actions={
                        !showDrawer ? (
                            <div className="flex items-center gap-4 ml-auto">
                                <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                                    <button
                                        className={`px-6 py-1.5 rounded-lg text-[10px] font-black transition-all ${staffType === 'CAPTAIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        onClick={() => setStaffType('CAPTAIN')}
                                    >
                                        CAPTAINS
                                    </button>
                                    <button
                                        className={`px-6 py-1.5 rounded-lg text-[10px] font-black transition-all ${staffType === 'WAITER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        onClick={() => setStaffType('WAITER')}
                                    >
                                        WAITERS
                                    </button>
                                </div>
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
                                    <span className="text-[10px] uppercase font-black">Register New {staffType === 'CAPTAIN' ? 'Captain' : 'Waiter'}</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => { resetForm(); setShowDrawer(false); }}
                                className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                            >
                                <XCircle size={18} />
                                <span className="text-xs tracking-wide">CLOSE</span>
                            </button>
                        )
                    }
                />

                {!showDrawer ? (
                    <div className="master-content-layout fade-in">
                        <div className="toolbar-premium">
                            <div className="search-premium">
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder={`Search ${staffType.toLowerCase()} archives...`}
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
                                    TOTAL : {filteredStaff.length}
                                </span>
                            </div>
                        </div>

                        <div className="table-container-premium">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                                        <th>Personnel Identity</th>
                                        <th>Communication Ref</th>
                                        <th>Registry Status</th>
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
                                    ) : filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '100px 0' }}>
                                                <UserCircle size={64} className="text-slate-100 mx-auto mb-4" />
                                                <p className="font-bold text-slate-400">No {staffType.toLowerCase()} records found.</p>
                                            </td>
                                        </tr>
                                    ) : filteredStaff.map((member) => (
                                        <tr key={member._id} className="group">
                                            <td className="w-10 text-center">
                                                <ActionDropdown item={member} onEdit={handleEdit} onStatusChange={handleToggleStatus} onDelete={handleDelete} />
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-4 ml-auto">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-900/10 group-hover:bg-indigo-600 transition-all overflow-hidden">
                                                        {member.image ? (
                                                            <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${member.image}`} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            member.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{member.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5 italic">
                                                            {staffType === 'CAPTAIN' ? 'Operational Lead' : 'Service Personnel'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {member.phone ? (
                                                    <div className="flex items-center gap-2 text-slate-600 font-black tracking-widest">
                                                        <Smartphone size={14} className="text-slate-300" />
                                                        {member.phone}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-200 tracking-widest">NO COMMS REGISTERED</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge-premium ${member.is_active ? 'active' : 'disabled'}`}>
                                                    {member.is_active ? 'ACTIVE' : 'DEACTIVE'}
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
                        <div className="bg-white p-6 flex flex-col flex-1 overflow-hidden relative">
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded flex items-center gap-2 text-rose-700 font-medium text-xs mb-3 flex-shrink-0 animate-in fade-in duration-200">
                                    <AlertCircle size={16} className="shrink-0" /> {error}
                                </div>
                            )}

                            <form id="staff-form" ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="flex-1 flex flex-col justify-between overflow-hidden gap-4">
                                <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                                    <div>
                                        <div className="w-full mb-1">
                                            <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider">Personnel Details</h3>
                                        </div>
                                        <hr className="border-t border-orange-500 mt-1 mb-4" />

                                        <div className="flex flex-col gap-4 max-w-4xl">
                                            <div className="grid grid-cols-12 items-center gap-4">
                                                <label className="col-span-3 text-[14px] font-bold text-slate-800">Personnel Name <span className="text-red-500">*</span></label>
                                                <div className="col-span-9">
                                                    <input
                                                        ref={nameInputRef}
                                                        type="text"
                                                        required
                                                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-[14px] text-slate-800"
                                                        placeholder="e.g. RAHUL SHARMA"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 items-center gap-4">
                                                <label className="col-span-3 text-[14px] font-bold text-slate-800">Primary Cell No <span className="text-red-500">*</span></label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-[14px] text-slate-800"
                                                        placeholder="10-digit primary contact"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 items-center gap-4">
                                                <label className="col-span-3 text-[14px] font-bold text-slate-800">Secondary Cell No</label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="text"
                                                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-[14px] text-slate-800"
                                                        placeholder="Secondary contact"
                                                        value={formData.cell_no_2}
                                                        onChange={(e) => setFormData({ ...formData, cell_no_2: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 items-center gap-4">
                                                <label className="col-span-3 text-[14px] font-bold text-slate-800">Joining Date</label>
                                                <div className="col-span-9">
                                                    <input
                                                        type="date"
                                                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-[14px] text-slate-800"
                                                        value={formData.joining_date}
                                                        onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-12 items-center gap-4">
                                                <label className="col-span-3 text-[14px] font-bold text-slate-800">ID Proof</label>
                                                <div className="col-span-9">
                                                    <select
                                                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-[14px] text-slate-800 cursor-pointer"
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
                                            <div className="grid grid-cols-12 items-start gap-4">
                                                <label className="col-span-3 text-[14px] font-bold text-slate-800 pt-1.5">Residential Address</label>
                                                <div className="col-span-9">
                                                    <textarea
                                                        className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-[14px] text-slate-800 min-h-[60px]"
                                                        placeholder="Enter full residential address..."
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end bg-white pt-3 border-t border-slate-100">
                                    <button type="submit" form="staff-form" disabled={submitting} className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-colors">
                                        {submitting ? <Loader2 className="animate-spin" size={16} /> : 'SAVE'}
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

export default StaffMaster;
