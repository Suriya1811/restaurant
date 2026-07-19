import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import './SettingsPage.css';
import './ProfilePage.css';
import VoucherSeriesSettings from '@/components/settings/VoucherSeriesSettings';
import UserRightsSettings from '@/components/settings/UserRightsSettings';
import ExtraModulesSettings from '@/components/settings/ExtraModulesSettings';
import {
    User, Key, Printer, FileText, Eye, EyeOff,
    Save, CheckCircle, Palette, AlertCircle, Loader2,
    Building2, Phone, Mail, Lock, Settings, TestTube,
    LayoutTemplate, Shield, ChevronRight, Sliders, Hash, List, CalendarDays, Search, Wallet, ShieldCheck
} from 'lucide-react';

const SYSTEM_MODULES_CONFIG = [
    { key: 'pay_mode_enabled', title: 'Pay Mode', subtitle: 'Show Popup on Save' },
    { key: 'dashboard_enabled', title: 'Dashboard', subtitle: 'Analytics & Stats' },
    { key: 'stock_level_enabled', title: 'Stock Level', subtitle: 'Inventory Options' }
];

const SettingsPage = () => {
    const { user, setModuleSettings } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Read initial tab from URL or default to general
    const initialTab = new URLSearchParams(location.search).get('tab') || 'general';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab changes when URL changes (e.g., clicking sidebar link)
    useEffect(() => {
        const tab = new URLSearchParams(location.search).get('tab') || 'general';
        setActiveTab(tab);
    }, [location.search]);

    const [profileForm, setProfileForm] = useState({
        ownerName: '', email: '', mobile: '', businessName: '', restaurantType: '', billingLayout: 'SIDEBAR'
    });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordEnabled, setPasswordEnabled] = useState(true);
    const [printerForm, setPrinterForm] = useState({ enabled: false, width: '58mm' });
    const [billForm, setBillForm] = useState({ header: '', footer: '', gstNo: '', autoPrint: false });

    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [saving, setSaving] = useState({});
    const [success, setSuccess] = useState({});
    const [errors, setErrors] = useState({});
    const [moduleForm, setModuleForm] = useState({ coupon_enabled: false, loyalty_enabled: false });
    const [billSeriesForm, setBillSeriesForm] = useState({
        dine_in: { numbering_method: 'Automatic', prefix: 'DI', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        takeaway: { numbering_method: 'Automatic', prefix: 'TA', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        delivery: { numbering_method: 'Automatic', prefix: 'DE', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        parcel: { numbering_method: 'Automatic', prefix: 'PA', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' },
        party: { numbering_method: 'Automatic', prefix: 'PT', suffix: '', starting_number: 1, next_number: 1, restart_after: 'Never' }
    });

    // Bill History State
    const [billsHistory, setBillsHistory] = useState([]);
    const [loadingBills, setLoadingBills] = useState(false);
    const [billDateFilter, setBillDateFilter] = useState('TODAY');
    const [billTypeFilter, setBillTypeFilter] = useState('ALL');
    const [billSearchQuery, setBillSearchQuery] = useState('');

    const fetchSettings = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success && result.data) {
                setSettings(result.data);
                const profile = result.data.profile || {};
                const restaurant = result.data.restaurant || {};
                setProfileForm(prev => ({
                    ...prev,
                    ownerName: profile.ownerName || '',
                    email: profile.email || '',
                    mobile: profile.mobile || profile.phone || '',
                    businessName: profile.businessName || '',
                    restaurantType: restaurant.restaurant_type || '',
                    billingLayout: restaurant.billing_layout || 'SIDEBAR'
                }));
                if (profile.password_enabled !== undefined) {
                    setPasswordEnabled(profile.password_enabled);
                }
                if (result.data.printer) setPrinterForm(result.data.printer);
                if (result.data.billFormat) setBillForm(result.data.billFormat);
                if (result.data.modules) {
                    setModuleForm(result.data.modules);
                    setModuleSettings(result.data.modules);
                    localStorage.setItem('moduleSettings', JSON.stringify(result.data.modules));
                }
                if (result.data.billSeries) setBillSeriesForm(result.data.billSeries);
            }
        } catch (err) { console.error("Failed to fetch settings", err); }
        finally { setLoading(false); }
    };

    const fetchBillHistory = async () => {
        setLoadingBills(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);

            let start = new Date();
            let end = new Date();
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            const today = new Date();
            if (billDateFilter === 'WEEK') {
                start.setDate(today.getDate() - today.getDay());
            } else if (billDateFilter === 'MONTH') {
                start.setDate(1);
            } else if (billDateFilter === 'YEAR') {
                start.setMonth(0, 1);
            }

            let query = `?status=ALL`;
            if (billDateFilter !== 'ALL_TIME') {
                query += `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
            }
            if (billTypeFilter !== 'ALL') query += `&type=${billTypeFilter}`;
            if (billSearchQuery) query += `&search=${billSearchQuery}`;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/bills${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) setBillsHistory(result.data);
            else setBillsHistory([]);
        } catch (err) {
            console.error("Failed to fetch bill history", err);
            setBillsHistory([]);
        } finally {
            setLoadingBills(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    useEffect(() => {
        if (activeTab === 'bill_history') {
            fetchBillHistory();
        }
    }, [activeTab, billDateFilter, billTypeFilter]);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    const handleProfileChange = (e) => { const { name, value } = e.target; setProfileForm(prev => ({ ...prev, [name]: value })); clearError('profile'); };
    const handlePasswordChange = (e) => { const { name, value } = e.target; setPasswordForm(prev => ({ ...prev, [name]: value })); clearError('password'); };
    const handlePrinterChange = (e) => { const { name, value, type, checked } = e.target; setPrinterForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); clearError('printer'); };
    const handleBillChange = (e) => { const { name, value, type, checked } = e.target; setBillForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); clearError('bill'); };

    const clearError = (section) => { setErrors(prev => ({ ...prev, [section]: '' })); setSuccess(prev => ({ ...prev, [section]: false })); };

    const saveProfile = async () => {
        setSaving(prev => ({ ...prev, profile: true })); clearError('profile');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/profile`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profileForm)
            });
            const result = await response.json();
            if (result.success && result.data) {
                setSuccess(prev => ({ ...prev, profile: true }));
                const profile = result.data.profile || {};
                const restaurant = result.data.restaurant || {};
                setProfileForm({ ownerName: profile.ownerName || profileForm.ownerName, email: profile.email || profileForm.email, mobile: profile.mobile || profileForm.mobile, businessName: profile.businessName || profileForm.businessName, restaurantType: restaurant.restaurant_type || profileForm.restaurantType, billingLayout: restaurant.billing_layout || profileForm.billingLayout });
                if (restaurant.billing_layout) localStorage.setItem('cachedBillingLayout', restaurant.billing_layout);
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else { setErrors(prev => ({ ...prev, profile: result.message || 'Validation failed' })); }
        } catch (err) { setErrors(prev => ({ ...prev, profile: 'Failed to update profile' })); }
        finally { setSaving(prev => ({ ...prev, profile: false })); }
    };

    const saveLayout = async () => {
        setSaving(prev => ({ ...prev, profile: true })); setErrors(prev => ({ ...prev, profile: '' })); setSuccess(prev => ({ ...prev, profile: false }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/layout`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ billingLayout: profileForm.billingLayout })
            });
            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, profile: true }));
                localStorage.setItem('cachedBillingLayout', profileForm.billingLayout);
                setTimeout(() => setSuccess(prev => ({ ...prev, profile: false })), 3000);
            } else { setErrors(prev => ({ ...prev, profile: result.message || 'Failed to save layout' })); }
        } catch (err) { setErrors(prev => ({ ...prev, profile: 'Failed to save layout. Check your connection.' })); }
        finally { setSaving(prev => ({ ...prev, profile: false })); }
    };

    const changePassword = async () => {
        setSaving(prev => ({ ...prev, password: true })); clearError('password');
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { setErrors(prev => ({ ...prev, password: 'New passwords do not match' })); setSaving(prev => ({ ...prev, password: false })); return; }
        if (passwordForm.newPassword.length < 6) { setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' })); setSaving(prev => ({ ...prev, password: false })); return; }
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/password`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(passwordForm)
            });
            const result = await response.json();
            if (result.success) { 
                setSuccess(prev => ({ ...prev, password: true })); 
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); 
                // Set password enabled to true if they created a new one
                setPasswordEnabled(true);
                setTimeout(() => setSuccess(prev => ({ ...prev, password: false })), 3000); 
            }
            else { setErrors(prev => ({ ...prev, password: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, password: 'Failed to change password' })); }
        finally { setSaving(prev => ({ ...prev, password: false })); }
    };

    const togglePassword = async () => {
        setSaving(prev => ({ ...prev, passwordToggle: true })); clearError('passwordToggle');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const newEnabledState = !passwordEnabled;
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/toggle-password`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ enabled: newEnabledState, currentPassword: passwordForm.currentPassword })
            });
            const result = await response.json();
            if (result.success) { 
                setPasswordEnabled(result.data.password_enabled);
                setSuccess(prev => ({ ...prev, passwordToggle: true })); 
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setSuccess(prev => ({ ...prev, passwordToggle: false })), 3000); 
            }
            else { setErrors(prev => ({ ...prev, passwordToggle: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, passwordToggle: 'Failed to toggle password protection' })); }
        finally { setSaving(prev => ({ ...prev, passwordToggle: false })); }
    };

    const savePrinterSettings = async () => {
        setSaving(prev => ({ ...prev, printer: true })); clearError('printer');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/printer`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(printerForm)
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, printer: true })); setTimeout(() => setSuccess(prev => ({ ...prev, printer: false })), 3000); }
            else { setErrors(prev => ({ ...prev, printer: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, printer: 'Failed to update printer settings' })); }
        finally { setSaving(prev => ({ ...prev, printer: false })); }
    };

    const saveBillSettings = async () => {
        setSaving(prev => ({ ...prev, bill: true })); clearError('bill');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/bill-format`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(billForm)
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, bill: true })); setTimeout(() => setSuccess(prev => ({ ...prev, bill: false })), 3000); }
            else { setErrors(prev => ({ ...prev, bill: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, bill: 'Failed to update bill settings' })); }
        finally { setSaving(prev => ({ ...prev, bill: false })); }
    };

    const saveBillSeries = async () => {
        setSaving(prev => ({ ...prev, billSeries: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/bill-series`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ billSeries: billSeriesForm })
            });
            const result = await response.json();
            if (result.success) { setSuccess(prev => ({ ...prev, billSeries: true })); setTimeout(() => setSuccess(prev => ({ ...prev, billSeries: false })), 3000); }
            else { setErrors(prev => ({ ...prev, billSeries: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, billSeries: 'Failed to update bill series' })); }
        finally { setSaving(prev => ({ ...prev, billSeries: false })); }
    };

    const saveModuleSettings = async () => {
        setSaving(prev => ({ ...prev, general: true }));
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/modules`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(moduleForm)
            });
            const result = await response.json();
            if (result.success) { 
                if (result.data) {
                    setModuleSettings(result.data);
                    localStorage.setItem('moduleSettings', JSON.stringify(result.data));
                }
                setSuccess(prev => ({ ...prev, general: true })); 
                setTimeout(() => setSuccess(prev => ({ ...prev, general: false })), 3000); 
            }
            else { setErrors(prev => ({ ...prev, general: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, general: 'Failed to update module settings' })); }
        finally { setSaving(prev => ({ ...prev, general: false })); }
    };

    const TABS = [
        { id: 'general', icon: <Sliders size={18} />, label: 'General', sub: 'Enable modules' },
        { id: 'voucher_series', icon: <Wallet size={18} />, label: 'Voucher Series', sub: 'Dynamic vouchers' },
        { id: 'user_rights', icon: <Lock size={18} />, label: 'User Rights', sub: 'Roles & permissions' },
        { id: 'extra_modules', icon: <Settings size={18} />, label: 'Extra Modules', sub: 'Password protected modules' },
        { id: 'security', icon: <ShieldCheck size={18} />, label: 'Security', sub: 'Password protection' }
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <Settings className="animate-spin text-indigo-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Loading Configuration...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main flex flex-col h-screen overflow-hidden">
                <Header toggleSidebar={toggleSidebar} />
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 fade-in">
                    <div className="max-w-7xl mx-auto space-y-6">
                        
                        {/* Top Navigation Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm transition-all shadow-sm
                                        ${activeTab === tab.id 
                                            ? 'bg-indigo-600 text-white shadow-indigo-200' 
                                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div>
                            
                            {/* Printer Settings */}
                            {activeTab === 'printer' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Printer Config</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Thermal setup and specifications</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {printerForm.enabled && (
                                                <button onClick={() => alert('Test print feature')} className="btn-premium-outline !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                    <TestTube size={13} /> TEST PRINT
                                                </button>
                                            )}
                                            <button onClick={savePrinterSettings} disabled={saving.printer} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                {saving.printer ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} SAVE
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {errors.printer && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.printer}</div>}
                                    {success.printer && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Printer settings updated!</div>}
                                    
                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded border border-slate-100">
                                                <div>
                                                    <p className="font-black text-slate-800 uppercase tracking-tight text-sm">Enable Thermal Printer</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-1">Activate direct thermal receipt printing</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" name="enabled" checked={printerForm.enabled} onChange={handlePrinterChange} className="sr-only peer" />
                                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                                </label>
                                            </div>

                                            {printerForm.enabled && (
                                                <div className="form-group-premium">
                                                    <label>Paper Roll Width</label>
                                                    <div className="flex gap-3">
                                                        {['58mm', '80mm'].map(w => (
                                                            <button key={w} type="button" onClick={() => setPrinterForm(prev => ({ ...prev, width: w }))}
                                                                className={`flex-1 p-5 rounded border-2 font-black text-sm uppercase tracking-widest transition-all ${printerForm.width === w ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 text-slate-400'}`}>
                                                                {w} {w === '58mm' ? '— Compact' : '— Standard'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bill Format */}
                            {activeTab === 'bill' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Receipt Format</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Customize the layout and content</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={saveBillSettings} disabled={saving.bill} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                {saving.bill ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} SAVE
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {errors.bill && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.bill}</div>}
                                    {success.bill && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Bill format updated!</div>}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <div className="space-y-6">
                                            <div className="form-group-premium">
                                                <label>Bill Header Text</label>
                                                <textarea name="header" className="input-premium !h-24 !rounded" value={billForm.header} onChange={handleBillChange} placeholder="Text to appear at the top of all receipts..." />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Bill Footer Text</label>
                                                <textarea name="footer" className="input-premium !h-24 !rounded" value={billForm.footer} onChange={handleBillChange} placeholder="Thank you message or T&C at the bottom..." />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="form-group-premium">
                                                    <label>GST Registration Number</label>
                                                    <input type="text" name="gstNo" className="input-premium uppercase !rounded" value={billForm.gstNo} onChange={handleBillChange} placeholder="27AAAAA0000A1Z5" />
                                                </div>
                                                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded border border-slate-100 self-end">
                                                    <div>
                                                        <p className="font-black text-slate-700 text-sm uppercase tracking-tight">Auto-Print Bills</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Print automatically after each order</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer ml-auto">
                                                        <input type="checkbox" name="autoPrint" checked={billForm.autoPrint} onChange={handleBillChange} className="sr-only peer" />
                                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Security Settings</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Manage login security</p>
                                        </div>
                                    </div>

                                    {errors.passwordToggle && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.passwordToggle}</div>}
                                    {success.passwordToggle && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Password protection updated!</div>}
                                    
                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6 mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">Require Password on Login</h4>
                                                <p className="text-xs text-slate-500 mt-1">When enabled, users must enter a password to access the POS system.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={passwordEnabled} 
                                                    onChange={togglePassword} 
                                                    disabled={saving.passwordToggle}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                        {/* If disabling, might require current password based on backend logic */}
                                        {!passwordEnabled && (
                                            <div className="mt-4 p-4 bg-amber-50 rounded border border-amber-100 text-amber-700 text-xs">
                                                <AlertCircle size={14} className="inline mr-1" /> Login is currently passwordless. Anyone with the User ID can access the system.
                                            </div>
                                        )}
                                        {/* To disable we need current password if one is set, handled by UI prompt or inline */}
                                        {/* We will let the toggle trigger. If it fails due to no current password, the user can type it in the form below. */}
                                    </div>

                                    {errors.password && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.password}</div>}
                                    {success.password && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Password updated successfully!</div>}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <h4 className="font-bold text-slate-800 text-sm mb-4">Update Password</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="form-group-premium">
                                                <label>Current Password</label>
                                                <input 
                                                    type="password" 
                                                    name="currentPassword" 
                                                    className="input-premium !rounded" 
                                                    value={passwordForm.currentPassword} 
                                                    onChange={handlePasswordChange} 
                                                    placeholder="Required to change or disable password" 
                                                />
                                            </div>
                                            <div className="hidden md:block"></div>
                                            <div className="form-group-premium">
                                                <label>New Password</label>
                                                <input type="password" name="newPassword" className="input-premium !rounded" value={passwordForm.newPassword} onChange={handlePasswordChange} />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>Confirm New Password</label>
                                                <input type="password" name="confirmPassword" className="input-premium !rounded" value={passwordForm.confirmPassword} onChange={handlePasswordChange} />
                                            </div>
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button onClick={changePassword} disabled={saving.password} className="btn-premium-primary !py-2 !px-6 !text-sm flex items-center gap-2">
                                                {saving.password ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} UPDATE PASSWORD
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appearance */}
                            {activeTab === 'appearance' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Appearance & Layout</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Personalize the look and feel</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={saveLayout} disabled={saving.profile} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                {saving.profile ? <Loader2 size={13} className="animate-spin" /> : <Palette size={13} />} APPLY
                                            </button>
                                        </div>
                                    </div>

                                    {errors.profile && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.profile}</div>}
                                    {success.profile && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Layout preference saved!</div>}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <div className="form-group-premium">
                                            <label>Billing Page Layout Mode</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                                {[
                                                    { val: 'SIDEBAR', label: 'Sidebar Layout', sub: 'Categories in a left-side panel', icon: <LayoutTemplate size={28} /> },
                                                    { val: 'TOP_HEADER', label: 'Top Header Layout', sub: 'Categories displayed across the top', icon: <Sliders size={28} /> }
                                                ].map(({ val, label, sub, icon }) => (
                                                    <button key={val} type="button" onClick={() => setProfileForm(prev => ({ ...prev, billingLayout: val }))}
                                                        className={`p-8 rounded border-2 flex flex-col items-center gap-4 text-center transition-all ${profileForm.billingLayout === val ? 'border-indigo-600 bg-indigo-50/60 shadow-lg shadow-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                        <div className={`w-16 h-16 rounded flex items-center justify-center ${profileForm.billingLayout === val ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'} transition-all`}>{icon}</div>
                                                        <div>
                                                            <div className={`font-black text-base uppercase tracking-tight ${profileForm.billingLayout === val ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</div>
                                                            <div className="text-xs font-bold text-slate-400 mt-1">{sub}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">General Settings</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Application configuration</p>
                                        </div>
                                    </div>

                                    {errors.profile && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.profile}</div>}
                                    {success.profile && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Settings updated!</div>}



                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-slate-800 text-sm">System Modules</h4>
                                            <button onClick={saveModuleSettings} disabled={saving.general} className="btn-premium-outline !py-1 !px-3 !text-xs flex items-center gap-1.5">
                                                {saving.general ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} SAVE TOGGLES
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {SYSTEM_MODULES_CONFIG.map((toggle) => (
                                                <div key={toggle.key} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <h5 className="font-bold text-slate-800 text-sm">{toggle.title}</h5>
                                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{toggle.subtitle}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={moduleForm[toggle.key] ?? true} 
                                                            onChange={(e) => setModuleForm({ ...moduleForm, [toggle.key]: e.target.checked })} 
                                                            className="sr-only peer" 
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bill Numbering Settings */}
                            {activeTab === 'bill_numbering' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bill Number Series</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Configure separate sequences</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={saveBillSeries} disabled={saving.billSeries} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                {saving.billSeries ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} SAVE ALL
                                            </button>
                                        </div>
                                    </div>

                                    {errors.billSeries && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.billSeries}</div>}
                                    {success.billSeries && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Bill series updated successfully!</div>}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6">
                                        <div className="space-y-8">
                                            {Object.keys(billSeriesForm).map((key) => (
                                                <div key={key} className="p-6 bg-slate-50/50 rounded border border-slate-100">
                                                    <div className="flex items-center gap-2 mb-6">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{key.replace('_', ' ')} Series</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        <div className="form-group-premium">
                                                            <label>Numbering Method</label>
                                                            <select className="input-premium !rounded" 
                                                                value={billSeriesForm[key].numbering_method || 'Automatic'} 
                                                                onChange={e => setBillSeriesForm({
                                                                    ...billSeriesForm,
                                                                    [key]: { ...billSeriesForm[key], numbering_method: e.target.value }
                                                                })}>
                                                                <option value="Automatic">Automatic</option>
                                                                <option value="Manual">Manual</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Restart After</label>
                                                            <select className="input-premium !rounded" 
                                                                value={billSeriesForm[key].restart_after || 'Never'} 
                                                                onChange={e => setBillSeriesForm({
                                                                    ...billSeriesForm,
                                                                    [key]: { ...billSeriesForm[key], restart_after: e.target.value }
                                                                })}>
                                                                <option value="Yearly">Yearly (1st April)</option>
                                                                <option value="Monthly">Monthly</option>
                                                                <option value="Daily">Daily</option>
                                                                <option value="Never">Never</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Starting Number</label>
                                                            <input type="number" className="input-premium !rounded" 
                                                                value={billSeriesForm[key].starting_number || 1} 
                                                                onChange={e => setBillSeriesForm({
                                                                    ...billSeriesForm,
                                                                    [key]: { ...billSeriesForm[key], starting_number: parseInt(e.target.value) || 1 }
                                                                })} />
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Prefix</label>
                                                            <input type="text" className="input-premium uppercase !rounded" 
                                                                value={billSeriesForm[key].prefix || ''} 
                                                                onChange={e => setBillSeriesForm({
                                                                    ...billSeriesForm,
                                                                    [key]: { ...billSeriesForm[key], prefix: e.target.value.toUpperCase() }
                                                                })} 
                                                                placeholder="e.g. DI" />
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Suffix</label>
                                                            <input type="text" className="input-premium uppercase !rounded" 
                                                                value={billSeriesForm[key].suffix || ''} 
                                                                onChange={e => setBillSeriesForm({
                                                                    ...billSeriesForm,
                                                                    [key]: { ...billSeriesForm[key], suffix: e.target.value.toUpperCase() }
                                                                })} 
                                                                placeholder="e.g. 24-25" />
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label>Next Number (Current)</label>
                                                            <input type="number" className="input-premium !rounded" 
                                                                value={billSeriesForm[key].next_number || 1} 
                                                                onChange={e => setBillSeriesForm({
                                                                    ...billSeriesForm,
                                                                    [key]: { ...billSeriesForm[key], next_number: parseInt(e.target.value) || 1 }
                                                                })} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Voucher Series Settings */}
                            {activeTab === 'voucher_series' && (
                                <VoucherSeriesSettings />
                            )}

                            {/* User Rights Settings */}
                            {activeTab === 'user_rights' && (
                                <UserRightsSettings />
                            )}

                            {/* Extra Modules Settings */}
                            {activeTab === 'extra_modules' && (
                                <ExtraModulesSettings />
                            )}

                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default SettingsPage;
