import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './SettingsPage.css';
import './ProfilePage.css';
import {
    User, Key, Save, CheckCircle, AlertCircle, Loader2,
    Building2, Phone, Mail, Database,
    FileJson, HardDrive, Clock, ShieldCheck, ArrowLeft, Sliders, X,
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
    const [backupPath, setBackupPath] = useState(() => localStorage.getItem('backup_path') || 'C:/RestoBoard/Backups');
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
            if (result.success && result.data.lastBackup) {
                setLastBackup(new Date(result.data.lastBackup.timestamp).toLocaleString());
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
        // Reset view sub-states when navigating away from profile info
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
                if (wasNew) {
                    alert("New profile created! Application will refresh.");
                    window.location.reload();
                }
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else { setErrors(prev => ({ ...prev, profile: result.message })); }
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

    const handleBackupPathChange = (val) => {
        setBackupPath(val);
        localStorage.setItem('backup_path', val);
    };

    const handleAutoBackupToggle = (val) => {
        setAutoBackupOnClose(val);
        localStorage.setItem('auto_backup_on_close', val);
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

    const getInitials = () => {
        const name = profileForm.store_name || profileForm.businessName || user?.email || 'POS';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <User className="animate-pulse text-indigo-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Loading profile...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header toggleSidebar={toggleSidebar} title="Profile" restaurantName={profileForm.businessName || profileForm.store_name} />
                <div className="profile-spacious-layout fade-in">



                    {/* Content Section Split */}
                    <div className="profile-main-grid">

                        {/* Left Side Content Area */}
                        <div className="profile-content-area">
                            {activeTab === 'view' && (
                                (isNewProfile || isEditing) ? (
                                    /* EDIT FORM */
                                    <div className="profile-detail-card fade-in">
                                        <div className="mb-6 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                                    {isNewProfile ? 'Create New Store Profile' : 'Edit Store Details'}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 uppercase tracking-[0.24em] mt-1">
                                                    Update profile parameters below
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => { setIsNewProfile(false); setIsEditing(false); }}
                                                className="btn-premium-primary !bg-slate-100 !text-slate-700 !border-slate-200 !py-2 !px-4 !text-xs !rounded-[1.2rem] hover:!bg-slate-200"
                                            >
                                                <ArrowLeft size={14} className="mr-1.5 inline" /> CANCEL
                                            </button>
                                        </div>

                                        {errors.profile && (
                                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6">
                                                <AlertCircle size={18} /> {errors.profile}
                                            </div>
                                        )}

                                        <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleFormSubmitRequest(); }} className="w-full mb-10">
                                            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">

                                                    {/* LEFT COLUMN */}
                                                    <div className="flex flex-col gap-3">
                                                        <h4 className="text-xs font-bold text-[#0F172A] mb-1 uppercase tracking-wider">Business Information</h4>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Company Name <span className="text-[#0F172A]">*</span></label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="businessName" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.businessName} onChange={handleProfileChange} placeholder="Company Legal Name" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Store Name <span className="text-[#0F172A]">*</span></label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="store_name" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.store_name} onChange={handleProfileChange} placeholder="Operating Store Name" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Print Name <span className="text-[#0F172A]">*</span></label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="print_name" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.print_name} onChange={handleProfileChange} placeholder="Name on Bills" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Business Type</label>
                                                            <div className="w-2/3">
                                                                <select name="restaurantType" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.restaurantType} onChange={handleProfileChange}>
                                                                    <option value="SMART">SMART POS</option>
                                                                    <option value="EFFICIENT">EFFICIENT POS</option>
                                                                    <option value="ENTERPRISE">ENTERPRISE POS</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Owner Name <span className="text-[#0F172A]">*</span></label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="ownerName" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.ownerName} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Email ID</label>
                                                            <div className="w-2/3">
                                                                <input type="email" name="email" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.email} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Mobile Number</label>
                                                            <div className="w-2/3">
                                                                <input type="tel" name="mobile" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.mobile} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Company Logo</label>
                                                            <div className="w-2/3">
                                                                <input type="file" name="logo_url" accept=".jpg,.jpeg,.pdf" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" onChange={handleProfileChange} />
                                                                {profileForm.logo_url && (
                                                                    <div className="mt-2 flex items-center gap-3">
                                                                        <img src={profileForm.logo_url} alt="Logo Preview" style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setProfileForm(prev => ({ ...prev, logo_url: '' }));
                                                                                const input = document.getElementsByName('logo_url')[0];
                                                                                if (input) input.value = '';
                                                                            }}
                                                                            className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer bg-white flex items-center gap-1.5"
                                                                        >
                                                                            <Trash2 size={13} /> Remove Logo
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A] pt-1">Full Address</label>
                                                            <div className="w-2/3">
                                                                <textarea name="address" rows={3} className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors resize-none" value={profileForm.address} onChange={handleProfileChange} placeholder="Registered Business Address" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT COLUMN */}
                                                    <div className="flex flex-col gap-3">
                                                        <h4 className="text-xs font-bold text-[#0F172A] mb-1 uppercase tracking-wider">Tax & Compliance</h4>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">GSTIN / Tax No</label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="gstin" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors uppercase" value={profileForm.gstin} onChange={handleProfileChange} placeholder="Tax Identifier" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">FSSAI License No</label>
                                                            <div className="w-2/3">
                                                                <input type="text" name="fssai_no" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.fssai_no} onChange={handleProfileChange} placeholder="Food License No" />
                                                            </div>
                                                        </div>

                                                        <h4 className="text-xs font-bold text-[#0F172A] mt-2 mb-1 uppercase tracking-wider">Financial Year</h4>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Year Start</label>
                                                            <div className="w-2/3">
                                                                <input type="date" name="financial_year_start" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.financial_year_start} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Year End</label>
                                                            <div className="w-2/3">
                                                                <input type="date" name="financial_year_end" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.financial_year_end} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center">
                                                            <label className="w-1/3 text-sm font-semibold text-[#0F172A]">Books Commencing</label>
                                                            <div className="w-2/3">
                                                                <input type="date" name="books_from" className="w-full px-2 py-1.5 bg-white border-2 border-slate-300 rounded-sm text-sm text-[#0F172A] outline-none hover:border-[#0F172A] focus:border-[#0F172A] transition-colors" value={profileForm.books_from} onChange={handleProfileChange} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <button type="submit" disabled={saving.profile} className="btn-action-save !py-2.5 !px-10 flex items-center gap-2">
                                                    {saving.profile ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                    {isNewProfile ? 'CREATE PROFILE' : 'UPDATE DETAILS'}
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
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Profile Directory</h3>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Directory of storefront records</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setIsEditing(true); setActiveTab('view'); }} className="btn-premium-outline !py-1.5 !px-4 !text-xs">EDIT DETAILS</button>
                                            </div>
                                        </div>

                                        {/* Two-column display card */}
                                        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                                                {/* LEFT COLUMN */}
                                                <div className="p-6">
                                                    <div className="flex items-center gap-2 mb-5">
                                                        <div className="w-1 h-4 rounded-full bg-slate-800"></div>
                                                        <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.18em]">Business Information</h4>
                                                    </div>

                                                    <div className="flex flex-col gap-0">
                                                        {[
                                                            { label: 'Company Legal Name', value: profileForm.businessName },
                                                            { label: 'Storefront Name', value: profileForm.store_name },
                                                            { label: 'Name on Bills', value: profileForm.print_name },
                                                            { label: 'Business Type', value: profileForm.restaurantType ? `${profileForm.restaurantType} POS` : null },
                                                            { label: 'Owner Name', value: profileForm.ownerName },
                                                            { label: 'Email Address', value: profileForm.email },
                                                            { label: 'Mobile Number', value: profileForm.mobile },
                                                            { label: 'Full Address', value: profileForm.address },
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="flex items-start py-3.5 border-b border-slate-50 last:border-0 group hover:bg-slate-50/60 -mx-2 px-2 rounded transition-colors">
                                                                <span className="w-[42%] text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-0.5 flex-shrink-0">{label}</span>
                                                                <strong className="w-[58%] text-sm font-semibold text-slate-800 break-words leading-snug">
                                                                    {value || <span className="text-slate-300 font-normal italic text-xs">Not configured</span>}
                                                                </strong>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* RIGHT COLUMN */}
                                                <div className="p-6">
                                                    <div className="flex items-center gap-2 mb-5">
                                                        <div className="w-1 h-4 rounded-full bg-indigo-500"></div>
                                                        <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.18em]">Tax & Compliance</h4>
                                                    </div>

                                                    <div className="flex flex-col gap-0">
                                                        {[
                                                            { label: 'GSTIN / Tax Code', value: profileForm.gstin },
                                                            { label: 'FSSAI License No', value: profileForm.fssai_no },
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="flex items-start py-3.5 border-b border-slate-50 group hover:bg-slate-50/60 -mx-2 px-2 rounded transition-colors">
                                                                <span className="w-[42%] text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-0.5 flex-shrink-0">{label}</span>
                                                                <strong className="w-[58%] text-sm font-semibold text-slate-800 break-words leading-snug">
                                                                    {value || <span className="text-slate-300 font-normal italic text-xs">Not configured</span>}
                                                                </strong>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-7 mb-5">
                                                        <div className="w-1 h-4 rounded-full bg-emerald-500"></div>
                                                        <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.18em]">Financial Year</h4>
                                                    </div>

                                                    <div className="flex flex-col gap-0">
                                                        {[
                                                            { label: 'Year Start', value: profileForm.financial_year_start },
                                                            { label: 'Year End', value: profileForm.financial_year_end },
                                                            { label: 'Books Commencing', value: profileForm.books_from },
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="flex items-start py-3.5 border-b border-slate-50 last:border-0 group hover:bg-slate-50/60 -mx-2 px-2 rounded transition-colors">
                                                                <span className="w-[42%] text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-0.5 flex-shrink-0">{label}</span>
                                                                <strong className="w-[58%] text-sm font-semibold text-slate-800 break-words leading-snug">
                                                                    {value || <span className="text-slate-300 font-normal italic text-xs">Not configured</span>}
                                                                </strong>
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
                                <div className="profile-detail-card fade-in">
                                    <div className="flex justify-between items-start mb-8 pb-4 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">System Backup Control</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-1">Configure database export rules and manual triggers</p>
                                        </div>
                                        {lastBackup && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                                <Clock size={12} className="text-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase">Last Backup: {lastBackup}</span>
                                            </div>
                                        )}
                                    </div>

                                    {diskSpaceWarning && (
                                        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4 text-amber-800 mb-6 shadow-sm">
                                            <AlertCircle size={24} className="shrink-0 text-amber-500" />
                                            <div>
                                                <p className="font-black text-sm uppercase">Disk Space warning!</p>
                                                <p className="text-xs font-bold opacity-80 mt-1">Storage space is extremely low. Backup might fail if not resolved.</p>
                                            </div>
                                        </div>
                                    )}

                                    {success.backup && (
                                        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center gap-4 text-emerald-800 mb-6 shadow-sm">
                                            <CheckCircle size={24} className="text-emerald-500" />
                                            <div>
                                                <p className="font-black text-sm uppercase">Backup Archive created</p>
                                                <p className="text-xs font-bold opacity-80">Backup generated and stored in specified path.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6 backup-card-body">
                                        <div className="profile-form-group">
                                            <label className="!text-indigo-600 flex items-center gap-2"><Folder size={14} /> Local Backup Path</label>
                                            <div className="flex gap-3">
                                                <div className="relative flex-1">
                                                    <HardDrive size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input type="text" className="profile-form-input !pl-12 font-mono text-xs" value={backupPath} onChange={e => handleBackupPathChange(e.target.value)} />
                                                </div>
                                                <button className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all hover:bg-white hover:shadow-lg">
                                                    <Folder size={18} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">Tip: We recommend pointing this to a cloud-synced folder or external disk.</p>
                                        </div>

                                        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                                                        <RefreshCw size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase text-slate-700">Auto-Backup on Close</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perform automatic archive export when you sign out</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={autoBackupOnClose} onChange={e => handleAutoBackupToggle(e.target.checked)} className="sr-only peer" />
                                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-8 bg-indigo-50/50 p-5 rounded-[1.5rem] border border-indigo-100/50">
                                        <button onClick={handleBackup} disabled={saving.backup} className="btn-premium-primary !bg-indigo-600 !text-white !border-transparent !py-3.5 !px-10 shadow-xl shadow-indigo-100 flex items-center gap-2">
                                            {saving.backup ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />} RUN MANUAL EXPORT
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* RESTORE TAB */}
                            {activeTab === 'restore' && (
                                <div className="profile-detail-card fade-in">
                                    <div className="mb-6 pb-4 border-b border-slate-100">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Database Restoration</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1">Reload database parameters from a local JSON backup</p>
                                    </div>

                                    <div className="restore-toggle-grid mb-6">
                                        <button onClick={() => setRestoreType('BACKUP')}
                                            className={`restore-toggle-btn ${restoreType === 'BACKUP' ? 'active' : ''}`}>
                                            <Download className="mx-auto mb-2" size={24} />
                                            <p className="font-black text-sm uppercase">Full Database File</p>
                                            <p className="text-[10px] font-bold opacity-60 uppercase mt-0.5">Overwrite entire database</p>
                                        </button>
                                        <button onClick={() => setRestoreType('DATA')}
                                            className={`restore-toggle-btn ${restoreType === 'DATA' ? 'active-emerald' : ''}`}>
                                            <FileJson className="mx-auto mb-2" size={24} />
                                            <p className="font-black text-sm uppercase">Import Records</p>
                                            <p className="text-[10px] font-bold opacity-60 uppercase mt-0.5">Append specific data records</p>
                                        </button>
                                    </div>

                                    <div className="restore-drop-zone text-center py-10 px-6 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:border-indigo-400 transition-all group">
                                        <Upload className={`mx-auto mb-3 ${restoreType === 'BACKUP' ? 'text-indigo-400' : 'text-emerald-400'} group-hover:scale-110 transition-transform`} size={42} />
                                        <p className="font-black text-slate-700 uppercase">Drop {restoreType.toLowerCase()} file here</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-5">Supported formats: .json, .archive</p>
                                        <input type="file" id="restore-file" className="hidden" accept=".json" onChange={handleFileSelect} />
                                        <label htmlFor="restore-file" className="btn-premium-primary !bg-white !text-slate-700 !border-slate-200 cursor-pointer inline-flex shadow-sm hover:shadow-md transition-all font-bold">
                                            CHOOSE LOCAL FILE
                                        </label>
                                        {selectedFile && (
                                            <div className="mt-5 flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs uppercase bg-emerald-50 px-4 py-2 rounded-full w-fit mx-auto border border-emerald-100">
                                                <CheckCircle size={14} /> File loaded successfully! Ready to restore
                                            </div>
                                        )}
                                    </div>

                                    <div className="restore-footer flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                                        <div className="restore-warning flex items-center gap-3 text-rose-600 bg-rose-50 px-4 py-3 rounded-2xl border border-rose-100">
                                            <AlertCircle size={20} className="shrink-0" />
                                            <p className="text-[10px] font-black uppercase leading-[1.3] max-w-[240px]">
                                                Warning: Restoration overwrites your existing transactions. Back up your data first!
                                            </p>
                                        </div>
                                        <button onClick={handleRestore} disabled={saving.restore || !selectedFile} className={`btn-premium-primary !py-3.5 !px-8 ${restoreType === 'BACKUP' ? '!bg-indigo-600' : '!bg-emerald-600'} !text-white shadow-xl flex items-center gap-2`}>
                                            {saving.restore ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                            RUN RESTORATION
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
