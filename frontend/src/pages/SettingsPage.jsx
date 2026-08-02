import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardPageShell from '../components/dashboard/DashboardPageShell';
import './SettingsPage.css';
import './ProfilePage.css';
import VoucherSeriesSettings from '@/components/settings/VoucherSeriesSettings';
import UserRightsSettings from '@/components/settings/UserRightsSettings';
import ExtraModulesSettings from '@/components/settings/ExtraModulesSettings';
import { fetchSystemPrinters } from '@/utils/printerUtils';
import {
    User, Key, Printer, FileText, Eye, EyeOff,
    Save, CheckCircle, Palette, AlertCircle, Loader2,
    Building2, Phone, Mail, Lock, Settings, TestTube,
    LayoutTemplate, Shield, ChevronRight, ChevronDown, Sliders, Hash, List, CalendarDays, Search, Wallet, ShieldCheck,
    Database, Folder, Clock, Download, HardDrive, RefreshCw, Paperclip, UploadCloud, XCircle
} from 'lucide-react';



const GENERAL_SETTINGS_ITEMS = [
    { key: 'pay_mode_enabled', label: 'Pay Mode in Sales', type: 'module' },
    { key: 'confirm_delete_enabled', label: 'Confirm Before Delete', type: 'module' },
    { key: 'allow_edit_after_save_enabled', label: 'Allow Edit After Save', type: 'module' },
    { key: 'direct_quantity_edit_enabled', label: 'Direct Quantity Edit', type: 'module' },
    { key: 'split_rate_tax_enabled', label: 'Split Rate from Tax', type: 'module' },
    { key: 'party_order_enabled', label: 'Party Order Module', type: 'module' },
    { key: 'show_remarks_enabled', label: 'Show Remarks in Sales Bill', type: 'module' },
    { key: 'on_exit', label: 'Auto Backup on Exit', type: 'backup' },
    { key: 'on_startup', label: 'Auto Backup on Startup', type: 'backup' }
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

    // System Printers state
    const [systemPrinters, setSystemPrinters] = useState([]);

    useEffect(() => {
        fetchSystemPrinters().then(printers => setSystemPrinters(printers));
    }, []);

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
    const [printerForm, setPrinterForm] = useState({
        enabled: true,
        width: '80mm',
        sales_bill_printer: 'Sales Bill Printer (POS-80)',
        kot_printer: 'KOT Kitchen Printer (KOT-80)',
        delivery_printer: 'Delivery Counter Printer (DEL-80)',
        print_format: 'NORMAL_3_INCH'
    });
    const [billForm, setBillForm] = useState({ header: '', footer: '', gstNo: '', autoPrint: false });
    const [backupForm, setBackupForm] = useState({
        backup_dir: '',
        on_startup: false,
        on_exit: false,
        auto_interval: 0
    });
    const [backupHistory, setBackupHistory] = useState([]);
    const [defaultDir, setDefaultDir] = useState('');
    const [restoreMode, setRestoreMode] = useState('RESTORE');
    const [selectedBackupFile, setSelectedBackupFile] = useState('');
    const [uploadedBackupData, setUploadedBackupData] = useState(null);

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

            try {
                const backupRes = await fetch(`${import.meta.env.VITE_API_URL}/settings/backup/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const backupResult = await backupRes.json();
                if (backupResult.success && backupResult.data) {
                    setBackupForm(backupResult.data.settings || {});
                    setBackupHistory(backupResult.data.history || []);
                    setDefaultDir(backupResult.data.default_directory || '');
                }
            } catch (backupErr) { console.error("Backup settings fetch failed", backupErr); }
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
            if (result.success) {
                localStorage.setItem('pos_printer_settings', JSON.stringify(printerForm));
                if (printerForm.sales_bill_printer) localStorage.setItem('pos_sales_bill_printer', printerForm.sales_bill_printer);
                if (printerForm.kot_printer) localStorage.setItem('pos_kot_printer', printerForm.kot_printer);
                setSuccess(prev => ({ ...prev, printer: true, general: true }));
                setTimeout(() => setSuccess(prev => ({ ...prev, printer: false, general: false })), 3000);
            }
            else { setErrors(prev => ({ ...prev, printer: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, printer: 'Failed to update printer settings' })); }
        finally { setSaving(prev => ({ ...prev, printer: false })); }
    };

    const saveBackupSettings = async () => {
        setSaving(prev => ({ ...prev, backup: true })); clearError('backup');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/backup/settings`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(backupForm)
            });
            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, backup: true }));
                setTimeout(() => setSuccess(prev => ({ ...prev, backup: false })), 3000);
            }
            else { setErrors(prev => ({ ...prev, backup: result.message })); }
        } catch (err) { setErrors(prev => ({ ...prev, backup: 'Failed to update backup settings' })); }
        finally { setSaving(prev => ({ ...prev, backup: false })); }
    };

    const handleCreateBackupNow = async () => {
        setSaving(prev => ({ ...prev, createBackup: true })); clearError('backup');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/backup`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ backupPath: backupForm.backup_dir })
            });
            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, backup: true }));
                fetchSettings();
                setTimeout(() => setSuccess(prev => ({ ...prev, backup: false })), 3000);
            } else {
                setErrors(prev => ({ ...prev, backup: result.message }));
            }
        } catch (err) { setErrors(prev => ({ ...prev, backup: 'Failed to create backup' })); }
        finally { setSaving(prev => ({ ...prev, createBackup: false })); }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                setUploadedBackupData(parsed);
                setSelectedBackupFile(file.name);
            } catch (err) {
                setErrors(prev => ({ ...prev, restore: 'Invalid JSON backup file format' }));
            }
        };
        reader.readAsText(file);
    };

    const handlePerformRestoreOrAttach = async () => {
        if (!selectedBackupFile && !uploadedBackupData) {
            setErrors(prev => ({ ...prev, restore: 'Please select a backup file or browse a JSON data file.' }));
            return;
        }
        setSaving(prev => ({ ...prev, restore: true })); clearError('restore');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const payload = {
                mode: restoreMode,
                filename: selectedBackupFile,
                backupData: uploadedBackupData
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                setSuccess(prev => ({ ...prev, restore: result.message }));
                setTimeout(() => setSuccess(prev => ({ ...prev, restore: false })), 4000);
            } else {
                setErrors(prev => ({ ...prev, restore: result.message }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, restore: 'Failed to process database restore / attach' }));
        } finally {
            setSaving(prev => ({ ...prev, restore: false }));
        }
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

    const handleToggleModuleSetting = async (key, checked) => {
        const updated = { ...moduleForm, [key]: checked };
        setModuleForm(updated);
        setModuleSettings(updated);
        localStorage.setItem('moduleSettings', JSON.stringify(updated));
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/modules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updated)
            });
            setSuccess(prev => ({ ...prev, general: true }));
            setTimeout(() => setSuccess(prev => ({ ...prev, general: false })), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleBackupSetting = async (key, checked) => {
        const updated = { ...backupForm, [key]: checked };
        setBackupForm(updated);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/backup/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updated)
            });
            setSuccess(prev => ({ ...prev, general: true }));
            setTimeout(() => setSuccess(prev => ({ ...prev, general: false })), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrinterSelectSetting = async (field, val) => {
        const updated = { ...printerForm, [field]: val };
        setPrinterForm(updated);
        if (field === 'sales_bill_printer') localStorage.setItem('pos_sales_bill_printer', val);
        if (field === 'kot_printer') localStorage.setItem('pos_kot_printer', val);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/printer`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updated)
            });
            setSuccess(prev => ({ ...prev, general: true }));
            setTimeout(() => setSuccess(prev => ({ ...prev, general: false })), 2000);
        } catch (err) {
            console.error(err);
        }
    };

    const TABS = [
        { id: 'general', label: 'GENERAL' },
        { id: 'voucher_series', label: 'VOUCHER SERIES' },
        { id: 'user_rights', label: 'USER RIGHTS' },
        { id: 'backup', label: 'BACKUP SETTINGS' },
        { id: 'extra_modules', label: 'EXTRA MODULES' }
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
                <Settings className="animate-spin text-orange-600 mx-auto mb-4" size={56} />
                <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Loading Configuration...</p>
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
                    title="SETTINGS"
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
                        onClick: () => { setActiveTab(tab.id); navigate(`/dashboard/self-service/settings?tab=${tab.id}`, { replace: true }); }
                    }))}
                />
                <div className={`flex-1 ${activeTab === 'general' || activeTab === 'voucher_series' ? 'overflow-hidden' : 'overflow-y-auto'} p-5 bg-slate-50 fade-in flex flex-col`}>
                    <div className="w-full max-w-6xl mx-auto h-full flex flex-col">

                        <div>

                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <div className="fade-in w-full space-y-4">
                                    {errors.general && (
                                        <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-2 text-rose-600 font-bold text-xs">
                                            <AlertCircle size={16} /> {errors.general}
                                        </div>
                                    )}
                                    {success.general && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-2 text-emerald-700 font-bold text-xs">
                                            <CheckCircle size={16} /> Settings saved successfully!
                                        </div>
                                    )}

                                    {/* Card 1: GENERAL SETTINGS */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                                        <div className="mb-4">
                                            <span className="inline-block px-3.5 py-1.5 bg-[#ff5a1f] text-white text-xs font-black uppercase tracking-wider rounded-[4px]">
                                                GENERAL SETTINGS
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                            {/* Left Column */}
                                            <div className="space-y-3 pr-0 md:pr-4">
                                                {[
                                                    { key: 'pay_mode_enabled', label: 'Pay Mode in Sales' },
                                                    { key: 'direct_quantity_edit_enabled', label: 'Direct Quantity Editing' },
                                                    { key: 'show_stock_alert_enabled', label: 'Show Stock Alert' },
                                                    { key: 'show_negative_stock_alert_enabled', label: 'Show Negative Stock Alert' },
                                                    { key: 'lock_stock_in_negative_enabled', label: 'Lock Stock in Negative' },
                                                    { key: 'show_item_image_in_sales_enabled', label: 'Show Item Image in Sales' },
                                                ].map(item => {
                                                    const isChecked = !!moduleForm[item.key];
                                                    return (
                                                        <label key={item.key} className="flex items-center justify-between py-1 cursor-pointer group select-none">
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(e) => handleToggleModuleSetting(item.key, e.target.checked)}
                                                                    className="w-4 h-4 rounded text-[#ff5a1f] focus:ring-[#ff5a1f] accent-[#ff5a1f] cursor-pointer"
                                                                    style={{ accentColor: '#ff5a1f' }}
                                                                />
                                                                <span className="text-[13px] font-bold text-slate-800 group-hover:text-[#ff5a1f] transition-colors">
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-3 pl-0 md:pl-8 pt-3 md:pt-0">
                                                {[
                                                    { key: 'show_customer_balance_enabled', label: 'Show Customer Balance in Sales Bill', isBackup: false },
                                                    { key: 'enable_barcode_scanning_enabled', label: 'Enable Barcode Scanning', isBackup: false },
                                                    { key: 'on_startup', label: 'Auto Backup on Startup', isBackup: true },
                                                    { key: 'on_exit', label: 'Auto Backup on Exit', isBackup: true },
                                                ].map(item => {
                                                    const isChecked = item.isBackup ? !!backupForm[item.key] : !!moduleForm[item.key];
                                                    return (
                                                        <label key={item.key} className="flex items-center justify-between py-1 cursor-pointer group select-none">
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        if (item.isBackup) handleToggleBackupSetting(item.key, e.target.checked);
                                                                        else handleToggleModuleSetting(item.key, e.target.checked);
                                                                    }}
                                                                    className="w-4 h-4 rounded text-[#ff5a1f] focus:ring-[#ff5a1f] accent-[#ff5a1f] cursor-pointer"
                                                                    style={{ accentColor: '#ff5a1f' }}
                                                                />
                                                                <span className="text-[13px] font-bold text-slate-800 group-hover:text-[#ff5a1f] transition-colors">
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* New Table Timeout Setting */}
                                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-[13px] font-bold text-slate-800">
                                                    New Table Auto-Release Timeout (Un-KOT Idle)
                                                </span>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    Automatically releases vacant tables if opened without any KOT generated within the selected timeframe.
                                                </p>
                                            </div>
                                            <div className="relative w-48">
                                                <select
                                                    value={moduleForm.new_table_timeout_minutes !== undefined ? moduleForm.new_table_timeout_minutes : 3}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        handleToggleModuleSetting('new_table_timeout_minutes', val);
                                                    }}
                                                    className="w-full appearance-none bg-white border border-orange-300 text-slate-800 text-[13px] font-bold py-1.5 px-3 pr-8 rounded-[6px] focus:outline-none focus:border-[#ff5a1f] cursor-pointer shadow-2xs"
                                                >
                                                    <option value={1}>1 Minute</option>
                                                    <option value={2}>2 Minutes</option>
                                                    <option value={3}>3 Minutes (Default)</option>
                                                    <option value={5}>5 Minutes</option>
                                                    <option value={10}>10 Minutes</option>
                                                    <option value={0}>Disabled</option>
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: PRINTER SETTINGS */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                                        <div className="mb-4">
                                            <span className="inline-block px-3.5 py-1.5 bg-[#ff5a1f] text-white text-xs font-black uppercase tracking-wider rounded-[4px]">
                                                PRINTER SETTINGS
                                            </span>
                                        </div>

                                        <div className="space-y-3 divide-y divide-slate-100">
                                            {/* Sales Bill Printer */}
                                            <div className="flex items-center justify-between py-2 first:pt-0">
                                                <span className="text-[13px] font-bold text-slate-800">
                                                    Default Printer for Sales Bill
                                                </span>
                                                <div className="relative w-72">
                                                    <select
                                                        value={printerForm.sales_bill_printer || ''}
                                                        onChange={e => handlePrinterSelectSetting('sales_bill_printer', e.target.value)}
                                                        className="w-full appearance-none bg-white border border-orange-300 text-slate-800 text-[13px] font-semibold py-2 px-3 pr-8 rounded-[6px] focus:outline-none focus:border-[#ff5a1f] cursor-pointer shadow-2xs"
                                                    >
                                                        <option value="">Select Printer</option>
                                                        {systemPrinters.map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>

                                            {/* KOT Printer */}
                                            <div className="flex items-center justify-between py-2 pt-3">
                                                <span className="text-[13px] font-bold text-slate-800">
                                                    Default Printer for KOT
                                                </span>
                                                <div className="relative w-72">
                                                    <select
                                                        value={printerForm.kot_printer || ''}
                                                        onChange={e => handlePrinterSelectSetting('kot_printer', e.target.value)}
                                                        className="w-full appearance-none bg-white border border-orange-300 text-slate-800 text-[13px] font-semibold py-2 px-3 pr-8 rounded-[6px] focus:outline-none focus:border-[#ff5a1f] cursor-pointer shadow-2xs"
                                                    >
                                                        <option value="">Select Printer</option>
                                                        {systemPrinters.map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Printer Settings */}
                            {activeTab === 'printer' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Printer Config & Format Settings</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Configure destination printers and thermal receipt formats</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {printerForm.enabled && (
                                                <button onClick={() => alert('Test print sent to selected Sales Bill Printer!')} className="btn-premium-outline !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                    <TestTube size={13} /> TEST PRINT
                                                </button>
                                            )}
                                            <button onClick={savePrinterSettings} disabled={saving.printer} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                {saving.printer ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} SAVE
                                            </button>
                                        </div>
                                    </div>

                                    {errors.printer && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.printer}</div>}
                                    {success.printer && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Printer settings & formats saved successfully!</div>}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded border border-slate-100">
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight text-sm">Enable Thermal Printer Module</p>
                                                <p className="text-xs font-bold text-slate-400 mt-1">Activate direct printing for POS billing, kitchen KOTs, and delivery notes</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" name="enabled" checked={printerForm.enabled} onChange={handlePrinterChange} className="sr-only peer" />
                                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                            </label>
                                        </div>

                                        {printerForm.enabled && (
                                            <>
                                                {/* Separate Printer Selection */}
                                                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Printer Destination Assignments</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="form-group-premium">
                                                            <label className="text-[11px] font-bold text-slate-600 uppercase">Sales Bill Printer</label>
                                                            <select
                                                                className="pef-f-input !h-10 font-bold bg-white cursor-pointer"
                                                                value={printerForm.sales_bill_printer || ''}
                                                                onChange={e => setPrinterForm({ ...printerForm, sales_bill_printer: e.target.value })}
                                                            >
                                                                <option value="">-- Select Installed System Printer --</option>
                                                                {systemPrinters.map(p => (
                                                                    <option key={p} value={p}>{p}</option>
                                                                ))}
                                                            </select>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Assigned for customer billing receipts</p>
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label className="text-[11px] font-bold text-slate-600 uppercase">KOT Printer</label>
                                                            <select
                                                                className="pef-f-input !h-10 font-bold bg-white cursor-pointer"
                                                                value={printerForm.kot_printer || ''}
                                                                onChange={e => setPrinterForm({ ...printerForm, kot_printer: e.target.value })}
                                                            >
                                                                <option value="">-- Select Installed System Printer --</option>
                                                                {systemPrinters.map(p => (
                                                                    <option key={p} value={p}>{p}</option>
                                                                ))}
                                                            </select>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Assigned for kitchen order tickets</p>
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label className="text-[11px] font-bold text-slate-600 uppercase">Delivery Printer</label>
                                                            <select
                                                                className="pef-f-input !h-10 font-bold bg-white cursor-pointer"
                                                                value={printerForm.delivery_printer || ''}
                                                                onChange={e => setPrinterForm({ ...printerForm, delivery_printer: e.target.value })}
                                                            >
                                                                <option value="">-- Select Installed System Printer --</option>
                                                                {systemPrinters.map(p => (
                                                                    <option key={p} value={p}>{p}</option>
                                                                ))}
                                                            </select>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Assigned for parcel & delivery notes</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Thermal Print Format Selection */}
                                                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Thermal Receipt Format</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div
                                                            onClick={() => setPrinterForm({ ...printerForm, print_format: 'NORMAL_3_INCH' })}
                                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${printerForm.print_format === 'NORMAL_3_INCH' ? 'border-orange-500 bg-orange-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-extrabold text-xs uppercase text-slate-800">Normal 3-Inch</span>
                                                                {printerForm.print_format === 'NORMAL_3_INCH' && <span className="w-3 h-3 rounded-full bg-orange-500"></span>}
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                                                Standard 80mm receipt with Company Details, Bill No, Date, Time, Item details, Quantities, Amounts, and Grand Total.
                                                            </p>
                                                        </div>

                                                        <div
                                                            onClick={() => setPrinterForm({ ...printerForm, print_format: 'NORMAL_3_INCH_WITH_TOKEN' })}
                                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${printerForm.print_format === 'NORMAL_3_INCH_WITH_TOKEN' ? 'border-orange-500 bg-orange-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="font-extrabold text-xs uppercase text-slate-800">Normal 3-Inch with Token</span>
                                                                {printerForm.print_format === 'NORMAL_3_INCH_WITH_TOKEN' && <span className="w-3 h-3 rounded-full bg-orange-500"></span>}
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                                                Prints standard 3-inch bill along with category-wise detachable tokens (e.g., Tea/Coffee, Biryani) below the receipt.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
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
                                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Backup Settings */}
                            {activeTab === 'backup' && (
                                <div className="fade-in">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Backup Settings & Automation</h3>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Configure software installation directory backups, schedules, and automatic triggers</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleCreateBackupNow} disabled={saving.createBackup} className="btn-premium-outline !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                {saving.createBackup ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} CREATE BACKUP NOW
                                            </button>
                                            <button onClick={saveBackupSettings} disabled={saving.backup} className="btn-premium-primary !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                                                {saving.backup ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} SAVE SETTINGS
                                            </button>
                                        </div>
                                    </div>

                                    {errors.backup && <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm mb-6"><AlertCircle size={18} /> {errors.backup}</div>}
                                    {success.backup && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6"><CheckCircle size={18} /> Backup created / settings updated successfully!</div>}

                                    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                                        {/* Storage Directory Selection */}
                                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Folder size={16} className="text-orange-600" /> Backup Storage Directory
                                            </h4>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    className="pef-f-input !h-10 font-mono font-bold flex-1"
                                                    value={backupForm.backup_dir || defaultDir || ''}
                                                    placeholder={defaultDir || 'Software Installation Directory/Backup'}
                                                    onChange={e => setBackupForm({ ...backupForm, backup_dir: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const customPath = prompt("Enter or select backup directory path (e.g., D:\\RestaurantBackup):", backupForm.backup_dir || defaultDir || '');
                                                        if (customPath && customPath.trim() !== '') {
                                                            setBackupForm({ ...backupForm, backup_dir: customPath.trim() });
                                                        }
                                                    }}
                                                    className="px-4 h-10 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                                                >
                                                    <Folder size={14} /> BROWSE...
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setBackupForm({ ...backupForm, backup_dir: defaultDir })}
                                                    className="px-4 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-md transition-colors shrink-0"
                                                >
                                                    RESET DEFAULT
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                ★ Default location stores backups in a dedicated <code className="bg-slate-200 px-1 py-0.5 rounded text-orange-700 font-bold">Backup</code> folder inside the software installation directory (not directly in C: root).
                                            </p>
                                        </div>

                                        {/* Timestamped Filename Format Preview */}
                                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-2">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Clock size={16} className="text-orange-600" /> Date & Time Timestamped Naming
                                            </h4>
                                            <p className="text-xs text-slate-600 font-medium">
                                                Each backup file is automatically generated with current Date & Time in filename:
                                            </p>
                                            <div className="bg-slate-900 text-orange-400 p-3 rounded-lg font-mono text-xs font-bold">
                                                resfin_backup_{new Date().toISOString().slice(0, 10)}_{new Date().toTimeString().slice(0, 8).replace(/:/g, '-')}.json
                                            </div>
                                        </div>

                                        {/* Automatic Backup Triggers & Intervals */}
                                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <HardDrive size={16} className="text-orange-600" /> Automatic Backup Triggers & Silent Intervals
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-orange-300 transition-all">
                                                    <div>
                                                        <span className="font-extrabold text-xs text-slate-800 uppercase block">Take Backup on Startup</span>
                                                        <span className="text-[11px] font-bold text-slate-400">Automatically take backup on startup then open company selection</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!backupForm.on_startup}
                                                        onChange={e => setBackupForm({ ...backupForm, on_startup: e.target.checked })}
                                                        className="w-4 h-4 text-orange-600 rounded accent-orange-600 cursor-pointer"
                                                    />
                                                </label>

                                                <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-orange-300 transition-all">
                                                    <div>
                                                        <span className="font-extrabold text-xs text-slate-800 uppercase block">Take Auto Backup on open / exit</span>
                                                        <span className="text-[11px] font-bold text-slate-400">Take backup on exit before closing software</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!backupForm.on_exit}
                                                        onChange={e => setBackupForm({ ...backupForm, on_exit: e.target.checked })}
                                                        className="w-4 h-4 text-orange-600 rounded accent-orange-600 cursor-pointer"
                                                    />
                                                </label>
                                            </div>

                                            <div className="form-group-premium pt-2">
                                                <label className="text-[11px] font-bold text-slate-600 uppercase">Silent Auto Backup Interval</label>
                                                <select
                                                    className="pef-f-input !h-10 font-bold"
                                                    value={backupForm.auto_interval || 0}
                                                    onChange={e => setBackupForm({ ...backupForm, auto_interval: parseInt(e.target.value, 10) || 0 })}
                                                >
                                                    <option value={0}>Disabled (Manual / Prompt Backup Only)</option>
                                                    <option value={1}>Every 1 Hour (Silent Background Backup)</option>
                                                    <option value={2}>Every 2 Hours (Silent Background Backup)</option>
                                                    <option value={4}>Every 4 Hours (Silent Background Backup)</option>
                                                    <option value={8}>Every 8 Hours (Silent Background Backup)</option>
                                                    <option value={12}>Every 12 Hours (Silent Background Backup)</option>
                                                    <option value={24}>Daily / Every 24 Hours (Silent Background Backup)</option>
                                                </select>
                                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Automatic backups run silently in the background without interrupting cashier billing or operations.</p>
                                            </div>
                                        </div>

                                        {/* Restore Backup & Attach Data Options */}
                                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-5">
                                            <div>
                                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                    <RefreshCw size={16} className="text-orange-600" /> Database Restore & Attach Data
                                                </h4>
                                                <p className="text-xs text-slate-500 font-medium mt-1">
                                                    By default, the software looks in the installation directory and its Backup folder. Select an option below to proceed.
                                                </p>
                                            </div>

                                            {errors.restore && <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold text-xs"><AlertCircle size={16} /> {errors.restore}</div>}
                                            {success.restore && <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 text-emerald-700 font-bold text-xs"><CheckCircle size={16} /> {success.restore}</div>}

                                            {/* Restore Options Selector */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div
                                                    onClick={() => setRestoreMode('RESTORE')}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${restoreMode === 'RESTORE' ? 'border-orange-600 bg-orange-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                                                            <RefreshCw size={15} className="text-orange-600" /> Restore Backup
                                                        </span>
                                                        {restoreMode === 'RESTORE' && <span className="w-3 h-3 rounded-full bg-orange-600"></span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                                        Restore full database state from an existing backup JSON file. (Replaces current records).
                                                    </p>
                                                </div>

                                                <div
                                                    onClick={() => setRestoreMode('ATTACH')}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${restoreMode === 'ATTACH' ? 'border-orange-600 bg-orange-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-extrabold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                                                            <Paperclip size={15} className="text-orange-600" /> Attach Data
                                                        </span>
                                                        {restoreMode === 'ATTACH' && <span className="w-3 h-3 rounded-full bg-orange-600"></span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                                        Attach external database/data file if a backup is unavailable. Merges data seamlessly without purging existing system records.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* File Selection & Direct Browse */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-slate-600 uppercase">Select From Installation Backup Folder</label>
                                                    <select
                                                        className="pef-f-input !h-10 font-mono font-bold"
                                                        value={selectedBackupFile}
                                                        onChange={e => {
                                                            setSelectedBackupFile(e.target.value);
                                                            setUploadedBackupData(null);
                                                        }}
                                                    >
                                                        <option value="">-- Choose file from Installation Directory Backup --</option>
                                                        {backupHistory.map((item, idx) => (
                                                            <option key={idx} value={item.filename}>{item.filename} ({(item.size / 1024).toFixed(1)} KB)</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-slate-600 uppercase">Or Browse Custom Local File</label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="px-4 h-10 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-md flex items-center gap-2 cursor-pointer transition-colors">
                                                            <UploadCloud size={15} /> BROWSE FILE
                                                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                                                        </label>
                                                        <span className="text-xs font-mono font-bold text-slate-600 truncate max-w-[200px]">
                                                            {selectedBackupFile || 'No file selected'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handlePerformRestoreOrAttach}
                                                    disabled={saving.restore}
                                                    className="btn-premium-primary !py-2.5 !px-6 !text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-orange-100"
                                                >
                                                    {saving.restore ? <Loader2 size={15} className="animate-spin" /> : (restoreMode === 'ATTACH' ? <Paperclip size={15} /> : <RefreshCw size={15} />)}
                                                    {restoreMode === 'ATTACH' ? 'ATTACH & MERGE DATA NOW' : 'RESTORE SYSTEM BACKUP NOW'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Backup History Table */}
                                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Recent Software Backups History</h4>
                                            {backupHistory.length === 0 ? (
                                                <p className="text-xs text-slate-400 font-bold py-2">No backup files created yet. Click "CREATE BACKUP NOW" above to create your first backup.</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead>
                                                            <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase">
                                                                <th className="py-2">FILE NAME</th>
                                                                <th className="py-2">DATE & TIME</th>
                                                                <th className="py-2 text-right">SIZE</th>
                                                                <th className="py-2 text-right">ACTION</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200">
                                                            {backupHistory.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-slate-100/50">
                                                                    <td className="py-2 font-mono font-bold text-slate-800">{item.filename}</td>
                                                                    <td className="py-2 font-bold text-slate-600">{new Date(item.mtime).toLocaleString()}</td>
                                                                    <td className="py-2 text-right font-mono font-bold text-slate-500">{(item.size / 1024).toFixed(1)} KB</td>
                                                                    <td className="py-2 text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedBackupFile(item.filename);
                                                                                setUploadedBackupData(null);
                                                                            }}
                                                                            className="text-[10px] font-black uppercase px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                                                        >
                                                                            SELECT
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
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
                                                        className={`p-8 rounded border-2 flex flex-col items-center gap-4 text-center transition-all ${profileForm.billingLayout === val ? 'border-orange-600 bg-orange-50/60 shadow-lg shadow-orange-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                                        <div className={`w-16 h-16 rounded flex items-center justify-center ${profileForm.billingLayout === val ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'} transition-all`}>{icon}</div>
                                                        <div>
                                                            <div className={`font-black text-base uppercase tracking-tight ${profileForm.billingLayout === val ? 'text-orange-700' : 'text-slate-700'}`}>{label}</div>
                                                            <div className="text-xs font-bold text-slate-400 mt-1">{sub}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
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
                                                        <div className="w-2 h-2 rounded-full bg-orange-600"></div>
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
        </DashboardPageShell>
    );
};

export default SettingsPage;
