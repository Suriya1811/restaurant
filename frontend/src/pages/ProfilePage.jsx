import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../components/dashboard/DashboardPageShell';
import './SettingsPage.css';
import {
    User, Key, Save, CheckCircle, AlertCircle, Loader2,
    Building2, Phone, Mail, Database, Edit2, Edit,
    FileJson, HardDrive, Clock, ShieldCheck, ArrowLeft, Sliders, X, XCircle,
    Plus, Folder, RefreshCw, Download, Upload, Trash2
} from 'lucide-react';
import { useFormNavigation } from '@/hooks/useFormNavigation';
import SaveConfirmationModal from '@/components/common/SaveConfirmationModal';

const ProfilePage = () => {
    const { user, logout, setUser } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const initialTab = new URLSearchParams(location.search).get('tab') || 'view';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Profile State
    const [isNewProfile, setIsNewProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        ownerName: '',
        email: '',
        mobile: '',
        businessName: '',
        store_name: '',
        print_name: '',
        restaurantType: 'SMART',
        address: '',
        fssai_no: '',
        gstin: '',
        financial_year_start: '',
        financial_year_end: '',
        books_from: ''
    });

    // Backup State
    const [backupPath, setBackupPath] = useState(() => localStorage.getItem('backup_path') || '');
    const [autoBackupOnClose, setAutoBackupOnClose] = useState(() => localStorage.getItem('auto_backup_on_close') === 'true');
    const [lastBackup, setLastBackup] = useState(null);
    const [diskSpaceWarning, setDiskSpaceWarning] = useState(false);

    // Restore State
    const [restoreType, setRestoreType] = useState('BACKUP'); // BACKUP or DATA
    const [selectedFile, setSelectedFile] = useState(null);

    const [saving, setSaving] = useState({});
    const [success, setSuccess] = useState({});
    const [errors, setErrors] = useState({});
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const handleFormSubmitRequest = () => {
        setShowSaveConfirm(true);
    };

    const { formRef, handleKeyDown } = useFormNavigation([isEditing, isNewProfile], handleFormSubmitRequest);

    const fetchProfile = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success && result.data) {
                const profile = result.data.profile || {};
                const restaurant = result.data.restaurant || {};
                
                if (setUser) {
                     const currentUser = JSON.parse(localStorage.getItem('user')) || user;
                     const updatedUser = {
                          ...currentUser,
                          email: currentUser.email || profile.email || '',
                          phone: currentUser.phone || profile.mobile || profile.phone || '',
                          contact_person: currentUser.contact_person || currentUser.name || profile.ownerName || ''
                     };
                     setUser(updatedUser);
                     localStorage.setItem('user', JSON.stringify(updatedUser));
                }

                setProfileForm({
                    ownerName: profile.ownerName || '',
                    email: profile.email || '',
                    mobile: profile.mobile || profile.phone || '',
                    businessName: profile.businessName || '',
                    store_name: restaurant.store_name || '',
                    print_name: restaurant.print_name || '',
                    restaurantType: restaurant.restaurant_type || 'SMART',
                    address: restaurant.address || '',
                    fssai_no: restaurant.fssai_no || '',
                    gstin: restaurant.gstin || '',
                    financial_year_start: restaurant.financial_year_start ? new Date(restaurant.financial_year_start).toISOString().split('T')[0] : '',
                    financial_year_end: restaurant.financial_year_end ? new Date(restaurant.financial_year_end).toISOString().split('T')[0] : '',
                    books_from: restaurant.books_from ? new Date(restaurant.books_from).toISOString().split('T')[0] : '',
                    logo_url: restaurant.logo_url || ''
                });
            }
        } catch (err) { console.error("Failed to fetch profile", err); }
        finally { setLoading(false); }
    };

    const fetchBackupStatus = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/backup/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success && result.data) {
                if (result.data.lastBackup) {
                    setLastBackup(new Date(result.data.lastBackup.timestamp).toLocaleString());
                }
                const dir = result.data.backup_directory || result.data.default_directory;
                if (dir) {
                    setBackupPath(dir);
                    localStorage.setItem('backup_path', dir);
                }
                if (result.data.settings) {
                    setAutoBackupOnClose(!!result.data.settings.on_exit);
                }
            }
        } catch (err) { console.error("Failed to fetch backup status", err); }
    };

    useEffect(() => {
        fetchProfile();
        fetchBackupStatus();
    }, []);

    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab');
        setActiveTab(tab || 'view');
        if (tab && tab !== 'view') {
            setIsNewProfile(false);
            setIsEditing(false);
        }
    }, [location.search]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const handleProfileChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setProfileForm(prev => ({ ...prev, [name]: reader.result }));
                };
                reader.readAsDataURL(file);
            } else {
                setProfileForm(prev => ({ ...prev, [name]: '' }));
            }
            return;
        }

        setProfileForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, profile: '' }));
    };

    const saveProfile = async () => {
        setSaving(prev => ({ ...prev, profile: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const wasNew = isNewProfile;
            const endpoint = wasNew ? '/settings/new-profile' : '/settings/profile';
            const method = wasNew ? 'POST' : 'PUT';

            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileForm)
            });
            const result = await response.json();
            if (result.success) {
                if (setUser) {
                    const updatedUser = { 
                        ...user, 
                        logo_url: profileForm.logo_url !== undefined ? profileForm.logo_url : user?.logo_url,
                        businessName: profileForm.businessName || user?.businessName,
                        store_name: profileForm.store_name || user?.store_name,
                        email: profileForm.email || user?.email,
                        phone: profileForm.mobile || user?.phone,
                        contact_person: profileForm.ownerName || user?.contact_person
                    };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
                
                setSuccess(prev => ({ ...prev, profile: true }));
                setIsNewProfile(false);
                setIsEditing(false);
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else {
                setErrors(prev => ({ ...prev, profile: result.message || 'Validation failed' }));
            }
        } catch (err) { setErrors(prev => ({ ...prev, profile: 'Failed to update profile' })); }
        finally { setSaving(prev => ({ ...prev, profile: false })); }
    };

    const confirmSave = () => {
        setShowSaveConfirm(false);
        saveProfile();
    };

    const cancelSave = () => {
        setShowSaveConfirm(false);
    };

    const handleBackup = async () => {
        setSaving(prev => ({ ...prev, backup: true }));
        setDiskSpaceWarning(false);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ backupPath })
            });
            const result = await response.json();
            if (result.success) {
                setLastBackup(new Date().toLocaleString());
                setSuccess(prev => ({ ...prev, backup: true }));
                fetchBackupStatus();
                setTimeout(() => setSuccess(prev => ({ ...prev, backup: false })), 5000);
            } else {
                if (result.message?.toLowerCase().includes('space') || result.message?.toLowerCase().includes('full')) {
                    setDiskSpaceWarning(true);
                }
                setErrors(prev => ({ ...prev, backup: result.message }));
            }
        } catch (err) { setErrors(prev => ({ ...prev, backup: 'Failed to create backup' })); }
        finally { setSaving(prev => ({ ...prev, backup: false })); }
    };

    const handleBackupPathChange = async (val) => {
        setBackupPath(val);
        localStorage.setItem('backup_path', val);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/backup/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ backup_dir: val })
            });
        } catch (err) { console.error("Failed to save backup path", err); }
    };

    const handleAutoBackupToggle = async (val) => {
        setAutoBackupOnClose(val);
        localStorage.setItem('auto_backup_on_close', val);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/backup/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ on_exit: val })
            });
        } catch (err) { console.error("Failed to save auto backup settings", err); }
    };

    const handleDeleteProfile = async () => {
        const confirmed = window.confirm("Are you sure you want to delete this profile completely?");
        if (!confirmed) return;

        setSaving(prev => ({ ...prev, delete: true }));
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/profile`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if (result.success) {
                alert('Profile deleted successfully.');
                localStorage.clear();
                if (logout) logout();
                window.location.href = '/login';
            } else {
                alert('Failed to delete profile: ' + (result.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Delete profile error:', err);
            alert('Failed to delete profile. Please try again.');
        } finally {
            setSaving(prev => ({ ...prev, delete: false }));
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    setSelectedFile(data);
                } catch (err) {
                    alert('Invalid backup file format');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) return alert('Please select a backup file');
        if (!window.confirm('WARNING: This will overwrite your current data. Continue?')) return;

        setSaving(prev => ({ ...prev, restore: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ backupData: selectedFile })
            });
            const result = await response.json();
            if (result.success) {
                alert('Database restored successfully! The application will now reload.');
                window.location.reload();
            } else { setErrors(prev => ({ ...prev, restore: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, restore: 'Failed to restore data' })); }
        finally { setSaving(prev => ({ ...prev, restore: false })); }
    };

    const TABS = [
        { id: 'view', label: 'PROFILE DETAILS' },
        { id: 'backup', label: 'BACKUP SETTINGS' },
        { id: 'restore', label: 'RESTORE DATA' }
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <User className="animate-spin text-orange-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Loading Profile...</p>
            </div>
        </div>
    );

    return (
        <DashboardPageShell>
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main flex flex-col h-screen overflow-hidden">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="PROFILE"
                    isMaster={true}
                    showClose={false}
                    headerActions={
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-red-500 border border-red-300 bg-white hover:bg-red-50 rounded shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                            <XCircle size={15} className="text-red-500" />
                            <span>CLOSE</span>
                        </button>
                    }
                    tabs={TABS.map(tab => ({
                        id: tab.id,
                        label: tab.label,
                        active: activeTab === tab.id,
                        onClick: () => { setActiveTab(tab.id); navigate(`/dashboard/self-service/profile?tab=${tab.id}`, { replace: true }); }
                    }))}
                />
                
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 fade-in">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div>
                            {/* PROFILE TAB */}
                            {activeTab === 'view' && (
                                (isNewProfile || isEditing) ? (
                                    /* EDIT FORM */
                                    <div className="fade-in">
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                                    {isNewProfile ? 'Create New Store Profile' : 'Edit Store Details'}
                                                </h3>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                                                    Update store identity and tax configuration
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => { setIsNewProfile(false); setIsEditing(false); }}
                                                className="btn-premium-outline !py-1.5 !px-4 !text-xs flex items-center gap-1.5"
                                            >
                                                <ArrowLeft size={13} /> CANCEL
                                            </button>
                                        </div>

                                        {errors.profile && (
                                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6">
                                                <AlertCircle size={18} /> {errors.profile}
                                            </div>
                                        )}

                                        <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="w-full">
                                            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">

                                                    {/* LEFT COLUMN */}
                                                    <div className="flex flex-col gap-3">
                                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Business Information</h4>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Company Name <span className="text-orange-600">*</span></label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="businessName" className="input-premium !rounded" value={profileForm.businessName} onChange={handleProfileChange} placeholder="Company Legal Name" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Store Name <span className="text-orange-600">*</span></label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="store_name" className="input-premium !rounded" value={profileForm.store_name} onChange={handleProfileChange} placeholder="Operating Store Name" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Print Name <span className="text-orange-600">*</span></label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="print_name" className="input-premium !rounded" value={profileForm.print_name} onChange={handleProfileChange} placeholder="Name on Bills" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Business Type</label>
                                                            <div className="w-2/3">
                                                                <select name="restaurantType" className="input-premium !rounded" value={profileForm.restaurantType} onChange={handleProfileChange}>
                                                                    <option value="SMART">SMART POS</option>
                                                                    <option value="EFFICIENT">EFFICIENT POS</option>
                                                                    <option value="ENTERPRISE">ENTERPRISE POS</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start mt-1">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700 pt-2">Address</label>
                                                            <div className="w-2/3">
                                                                <textarea name="address" className="input-premium !h-20 !rounded" value={profileForm.address} onChange={handleProfileChange} placeholder="Full Store Address..." />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT COLUMN */}
                                                    <div className="flex flex-col gap-3">
                                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Tax & Contact Details</h4>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Contact Person</label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="ownerName" className="input-premium !rounded" value={profileForm.ownerName} onChange={handleProfileChange} placeholder="Owner / Manager Name" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Email</label>
                                                            <div className="w-2/3">
                                                                <input type="email" name="email" className="input-premium !rounded" value={profileForm.email} onChange={handleProfileChange} placeholder="store@example.com" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Mobile</label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="mobile" className="input-premium !rounded" value={profileForm.mobile} onChange={handleProfileChange} placeholder="+91 98765 43210" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">GSTIN No</label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="gstin" className="input-premium uppercase !rounded" value={profileForm.gstin} onChange={handleProfileChange} placeholder="27AAAAA0000A1Z5" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">FSSAI License</label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="fssai_no" className="input-premium !rounded" value={profileForm.fssai_no} onChange={handleProfileChange} placeholder="10000000000000" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Year Start</label>
                                                            <div className="w-2/3">
                                                                <input type="date" name="financial_year_start" className="input-premium !rounded" value={profileForm.financial_year_start} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Year End</label>
                                                            <div className="w-2/3">
                                                                <input type="date" name="financial_year_end" className="input-premium !rounded" value={profileForm.financial_year_end} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-slate-700">Books From</label>
                                                            <div className="w-2/3">
                                                                <input type="date" name="books_from" className="input-premium !rounded" value={profileForm.books_from} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-6">
                                                {!isNewProfile && (user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                                                    <button
                                                        type="button"
                                                        onClick={handleDeleteProfile}
                                                        disabled={saving.delete}
                                                        className="btn-premium-primary !bg-rose-600 !text-white hover:!bg-rose-700 !border-transparent !py-2.5 !px-6 flex items-center gap-2 font-bold text-xs rounded-lg shadow-sm transition-all"
                                                    >
                                                        {saving.delete ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                        DELETE PROFILE
                                                    </button>
                                                )}
                                                <button type="submit" disabled={saving.profile} className="btn-premium-primary !py-2.5 !px-8 flex items-center gap-2 ml-auto">
                                                    {saving.profile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                    {isNewProfile ? 'CREATE PROFILE' : 'SAVE CHANGES'}
                                                </button>
                                            </div>
                                        </form>
                                        <SaveConfirmationModal 
                                            isOpen={showSaveConfirm} 
                                            onConfirm={confirmSave} 
                                            onCancel={cancelSave} 
                                        />
                                    </div>
                                ) : (
                                    /* VIEW MODE */
                                    <div className="fade-in">

                                        {/* Header Controls */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Store Profile</h3>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Overview of registered store details</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setIsEditing(true); setActiveTab('view'); }} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                    <Edit2 size={13} /> EDIT DETAILS
                                                </button>
                                            </div>
                                        </div>

                                        {success.profile && (
                                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6">
                                                <CheckCircle size={18} /> Profile details saved successfully!
                                            </div>
                                        )}

                                        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                
                                                {/* LEFT COLUMN */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-5">
                                                        <div className="w-1 h-4 rounded-full bg-orange-600"></div>
                                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">General Information</h4>
                                                    </div>

                                                    <div className="space-y-4 text-xs">
                                                        {[
                                                            { label: 'Company Legal Name', value: profileForm.businessName },
                                                            { label: 'Operating Store Name', value: profileForm.store_name },
                                                            { label: 'Name on Receipt', value: profileForm.print_name },
                                                            { label: 'System Type', value: profileForm.restaurantType + ' POS' },
                                                            { label: 'Store Address', value: profileForm.address },
                                                            { label: 'Contact Person', value: profileForm.ownerName },
                                                            { label: 'Email Address', value: profileForm.email },
                                                            { label: 'Phone Number', value: profileForm.mobile }
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                                                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{label}</span>
                                                                <span className="font-bold text-slate-800 text-right">{value || 'Not set'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* RIGHT COLUMN */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-5">
                                                        <div className="w-1 h-4 rounded-full bg-orange-600"></div>
                                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tax & Financial Settings</h4>
                                                    </div>

                                                    <div className="space-y-4 text-xs">
                                                        {[
                                                            { label: 'GSTIN / Tax Code', value: profileForm.gstin },
                                                            { label: 'FSSAI License No', value: profileForm.fssai_no },
                                                            { label: 'Financial Year Start', value: profileForm.financial_year_start },
                                                            { label: 'Financial Year End', value: profileForm.financial_year_end },
                                                            { label: 'Books Commencing', value: profileForm.books_from }
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                                                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{label}</span>
                                                                <span className="font-bold text-slate-800 text-right">{value || 'Not set'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                    </div>
                                )
                            )}

                            {/* BACKUP TAB */}
                            {activeTab === 'backup' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Backup Storage & Configuration</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Configure software installation directory backups and manual export</p>
                                        </div>
                                        {lastBackup && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                                <Clock size={13} className="text-emerald-600 animate-pulse" />
                                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Last Backup: {lastBackup}</span>
                                            </div>
                                        )}
                                    </div>

                                    {diskSpaceWarning && (
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 mb-6 text-xs font-bold shadow-sm">
                                            <AlertCircle size={20} className="shrink-0 text-amber-600" />
                                            <div>
                                                <p className="uppercase">Low Disk Space Warning!</p>
                                                <p className="opacity-80 font-medium">Storage space is extremely low. Free up disk space before creating new backups.</p>
                                            </div>
                                        </div>
                                    )}

                                    {success.backup && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6 shadow-sm">
                                            <CheckCircle size={18} /> Backup archive created successfully!
                                        </div>
                                    )}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Folder size={16} className="text-orange-600" /> Backup Path
                                            </h4>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative flex-1">
                                                    <HardDrive size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text" 
                                                        className="pef-f-input !h-10 font-mono font-bold w-full !pl-10 text-xs" 
                                                        value={backupPath} 
                                                        onChange={e => handleBackupPathChange(e.target.value)} 
                                                        placeholder="Application Installation Path/Backup" 
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const customPath = prompt("Enter or select backup directory path (e.g., D:\\RestaurantBackup):", backupPath || '');
                                                        if (customPath && customPath.trim() !== '') {
                                                            handleBackupPathChange(customPath.trim());
                                                        }
                                                    }} 
                                                    className="px-4 h-10 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                                                >
                                                    <Folder size={14} /> BROWSE...
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                ★ Default location stores backups in a dedicated <code className="bg-slate-200 px-1 py-0.5 rounded text-orange-700 font-bold">Backup</code> folder inside the software installation directory.
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded border border-slate-100">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight text-sm">Auto-Backup On Close</p>
                                                <p className="text-xs font-bold text-slate-400 mt-0.5">Perform automatic timestamped database backup when closing software</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={autoBackupOnClose} onChange={e => handleAutoBackupToggle(e.target.checked)} className="sr-only peer" />
                                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                            </label>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button onClick={handleBackup} disabled={saving.backup} className="btn-premium-primary !py-2.5 !px-8 flex items-center gap-2">
                                                {saving.backup ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                                                RUN MANUAL BACKUP NOW
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* RESTORE TAB */}
                            {activeTab === 'restore' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Database Restoration</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Restore database state or attach external data file</p>
                                        </div>
                                    </div>

                                    {errors.restore && (
                                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-xs mb-6">
                                            <AlertCircle size={16} /> {errors.restore}
                                        </div>
                                    )}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div 
                                                onClick={() => setRestoreType('BACKUP')}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${restoreType === 'BACKUP' ? 'border-orange-500 bg-orange-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-black text-xs uppercase text-slate-800 flex items-center gap-2">
                                                        <Download size={16} className="text-orange-600" /> Full Database Restore
                                                    </span>
                                                    {restoreType === 'BACKUP' && <span className="w-3 h-3 rounded-full bg-orange-600"></span>}
                                                </div>
                                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                                    Restore full database state from an existing backup JSON file. Replaces current records.
                                                </p>
                                            </div>

                                            <div 
                                                onClick={() => setRestoreType('DATA')}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${restoreType === 'DATA' ? 'border-orange-500 bg-orange-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-black text-xs uppercase text-slate-800 flex items-center gap-2">
                                                        <FileJson size={16} className="text-orange-600" /> Attach / Merge Data
                                                    </span>
                                                    {restoreType === 'DATA' && <span className="w-3 h-3 rounded-full bg-orange-600"></span>}
                                                </div>
                                                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                                    Attach external database/data file. Merges data seamlessly without purging existing system records.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:border-orange-400 transition-all">
                                            <Upload className="mx-auto mb-3 text-orange-500" size={36} />
                                            <p className="font-black text-slate-800 text-sm uppercase mb-1">Select {restoreType === 'BACKUP' ? 'Backup' : 'Data'} JSON File</p>
                                            <p className="text-xs text-slate-400 font-semibold mb-4">Click below to browse for valid backup file</p>
                                            <input type="file" id="restore-file-input" className="hidden" accept=".json" onChange={handleFileSelect} />
                                            <label htmlFor="restore-file-input" className="btn-premium-primary !py-2 !px-6 cursor-pointer inline-flex items-center gap-2 font-bold text-xs shadow-sm">
                                                <Folder size={14} /> BROWSE BACKUP FILE
                                            </label>
                                            {selectedFile && (
                                                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-700 font-bold text-xs uppercase bg-emerald-50 px-4 py-2 rounded-full w-fit mx-auto border border-emerald-100">
                                                    <CheckCircle size={14} /> File Loaded & Ready for Restoration!
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
                                                <AlertCircle size={16} />
                                                <span>Restoration overwrites existing data records. Keep a backup before proceeding.</span>
                                            </div>
                                            <button 
                                                onClick={handleRestore} 
                                                disabled={saving.restore || !selectedFile} 
                                                className="btn-premium-primary !py-2.5 !px-8 flex items-center gap-2"
                                            >
                                                {saving.restore ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                                EXECUTE RESTORATION
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
                </div>
            </main>
        </DashboardPageShell>
    );
};

export default ProfilePage;
