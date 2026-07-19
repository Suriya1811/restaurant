import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import {
    Shield, Users, Plus, Edit2, Trash2, Save, X, Check,
    ChevronDown, ChevronRight, Eye, EyeOff, UserPlus,
    Lock, User, Key, ToggleLeft, ToggleRight, Search,
    AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import './AccessControlPage.css';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

// Fallback pages config in case API doesn't load
const FALLBACK_PAGES_CONFIG = [
    {
        page_key: 'dashboard',
        page_label: 'Dashboard',
        features: [
            { feature_key: 'view_stats', feature_label: 'View Statistics' },
            { feature_key: 'view_charts', feature_label: 'View Charts' },
            { feature_key: 'view_recent_bills', feature_label: 'View Recent Bills' }
        ]
    },
    // ENTRY
    {
        page_key: 'kot',
        page_label: 'KOT',
        features: [
            { feature_key: 'kot_print', feature_label: 'KOT Print' }
        ]
    },
    {
        page_key: 'sales_bill',
        page_label: 'Sales Bill',
        features: [
            { feature_key: 'create_bill', feature_label: 'Create New Bill' },
            { feature_key: 'apply_discount', feature_label: 'Apply Discount' },
            { feature_key: 'hold_bill', feature_label: 'Hold Bill' },
            { feature_key: 'print_bill', feature_label: 'Print Bill' },
            { feature_key: 'split_bill', feature_label: 'Split Bill' },
            { feature_key: 'complimentary', feature_label: 'Complimentary' },
            { feature_key: 'sales_return', feature_label: 'Sales Return' }
        ]
    },
    {
        page_key: 'display',
        page_label: 'Display',
        features: []
    },
    {
        page_key: 'party_master',
        page_label: 'Party Master',
        features: []
    },
    {
        page_key: 'purchase',
        page_label: 'Purchase Entry',
        features: [
            { feature_key: 'view_purchases', feature_label: 'View Purchases' },
            { feature_key: 'add_purchase', feature_label: 'Add Purchase' },
            { feature_key: 'delete_purchase', feature_label: 'Delete Purchase' }
        ]
    },
    {
        page_key: 'receipts',
        page_label: 'Receipt Entry',
        features: []
    },
    {
        page_key: 'payments',
        page_label: 'Payment Entry',
        features: []
    },
    {
        page_key: 'vouchers',
        page_label: 'Voucher Master',
        features: [
            { feature_key: 'view_vouchers', feature_label: 'View Vouchers' },
            { feature_key: 'add_voucher', feature_label: 'Add Voucher' },
            { feature_key: 'delete_voucher', feature_label: 'Delete Voucher' }
        ]
    },
    // MASTER
    {
        page_key: 'products',
        page_label: 'Item',
        features: [
            { feature_key: 'view_products', feature_label: 'View Products' },
            { feature_key: 'add_product', feature_label: 'Add Product' },
            { feature_key: 'edit_product', feature_label: 'Edit Product' },
            { feature_key: 'delete_product', feature_label: 'Delete Product' },
            { feature_key: 'import_products', feature_label: 'Import Products' }
        ]
    },
    {
        page_key: 'categories',
        page_label: 'Category',
        features: [
            { feature_key: 'view_categories', feature_label: 'View Categories' },
            { feature_key: 'add_category', feature_label: 'Add Category' },
            { feature_key: 'edit_category', feature_label: 'Edit Category' },
            { feature_key: 'delete_category', feature_label: 'Delete Category' }
        ]
    },
    {
        page_key: 'function_type',
        page_label: 'Function Type',
        features: []
    },
    {
        page_key: 'brands',
        page_label: 'Brand',
        features: [
            { feature_key: 'view_brands', feature_label: 'View Brands' },
            { feature_key: 'add_brand', feature_label: 'Add Brand' },
            { feature_key: 'edit_brand', feature_label: 'Edit Brand' },
            { feature_key: 'delete_brand', feature_label: 'Delete Brand' }
        ]
    },
    {
        page_key: 'units',
        page_label: 'Unit',
        features: []
    },
    {
        page_key: 'taxes',
        page_label: 'Tax',
        features: []
    },
    {
        page_key: 'tables',
        page_label: 'Table',
        features: [
            { feature_key: 'view_tables', feature_label: 'View Tables' },
            { feature_key: 'add_table', feature_label: 'Add Table' },
            { feature_key: 'edit_table', feature_label: 'Edit Table' },
            { feature_key: 'delete_table', feature_label: 'Delete Table' }
        ]
    },
    {
        page_key: 'table_types',
        page_label: 'Table Type',
        features: []
    },
    {
        page_key: 'staff',
        page_label: 'Captain/Waiter',
        features: [
            { feature_key: 'view_staff', feature_label: 'View Staff' },
            { feature_key: 'add_staff', feature_label: 'Add Staff' },
            { feature_key: 'edit_staff', feature_label: 'Edit Staff' },
            { feature_key: 'delete_staff', feature_label: 'Delete Staff' }
        ]
    },
    {
        page_key: 'ledgers',
        page_label: 'Ledger',
        features: [
            { feature_key: 'view_ledgers', feature_label: 'View Ledgers' },
            { feature_key: 'add_ledger', feature_label: 'Add Ledger' },
            { feature_key: 'edit_ledger', feature_label: 'Edit Ledger' },
            { feature_key: 'delete_ledger', feature_label: 'Delete Ledger' }
        ]
    },
    {
        page_key: 'ledger_groups',
        page_label: 'Ledger Group',
        features: []
    },
    // REPORT
    {
        page_key: 'reports',
        page_label: 'Report',
        features: [
            { feature_key: 'view_reports', feature_label: 'View Reports' },
            { feature_key: 'export_reports', feature_label: 'Export Reports' },
            { feature_key: 'daily_report', feature_label: 'Daily Report' },
            { feature_key: 'monthly_report', feature_label: 'Monthly Report' }
        ]
    },
    // ACCOUNTS
    {
        page_key: 'daybook',
        page_label: 'Daybook',
        features: []
    },
    {
        page_key: 'ledger_statement',
        page_label: 'Ledger Statement',
        features: [
            { feature_key: 'view_statement', feature_label: 'View Ledger Statement' }
        ]
    },
    {
        page_key: 'cash_bank',
        page_label: 'Cash & Bank',
        features: []
    },
    // SETTINGS
    {
        page_key: 'settings_general',
        page_label: 'General',
        features: [
            { feature_key: 'view_settings', feature_label: 'View Settings' }
        ]
    },
    {
        page_key: 'counters',
        page_label: 'Counter',
        features: [
            { feature_key: 'view_counters', feature_label: 'View Counters' },
            { feature_key: 'add_counter', feature_label: 'Add Counter' },
            { feature_key: 'edit_counter', feature_label: 'Edit Counter' },
            { feature_key: 'delete_counter', feature_label: 'Delete Counter' }
        ]
    },
    {
        page_key: 'kitchen_printers',
        page_label: 'Kitchen & Printers',
        features: [
            { feature_key: 'printer_settings', feature_label: 'Printer Settings' }
        ]
    },
    {
        page_key: 'user_rights',
        page_label: 'User Rights',
        features: []
    },
    {
        page_key: 'order_integration',
        page_label: 'Order Integration',
        features: []
    },
    {
        page_key: 'bill_series',
        page_label: 'Bill Series',
        features: [
            { feature_key: 'bill_settings', feature_label: 'Bill Settings' }
        ]
    },
    {
        page_key: 'generated_bills',
        page_label: 'Generated Bills',
        features: [
            { feature_key: 'view_bills', feature_label: 'View Bills' },
            { feature_key: 'edit_bill', feature_label: 'Edit Bill' },
            { feature_key: 'delete_bill', feature_label: 'Delete Bill' },
            { feature_key: 'export_bills', feature_label: 'Export Bills' }
        ]
    },
    {
        page_key: 'coupons',
        page_label: 'Coupons',
        features: []
    },
    {
        page_key: 'loyalty',
        page_label: 'Loyalty',
        features: []
    },
    {
        page_key: 'system_modules',
        page_label: 'System Modules',
        features: []
    }
];

const MENU_GROUPS = [
    {
        label: 'Dashboard',
        keys: ['dashboard'],
        mandatory: true
    },
    {
        label: 'Entry',
        keys: ['kot', 'sales_bill', 'display', 'party_master', 'purchase'],
        subGroups: [
            {
                label: 'Voucher',
                keys: ['receipts', 'payments', 'vouchers']
            }
        ]
    },
    {
        label: 'Master',
        keys: ['products', 'categories', 'function_type', 'brands', 'units', 'taxes', 'tables', 'table_types', 'staff', 'ledgers', 'ledger_groups']
    },
    {
        label: 'Report',
        keys: ['reports']
    },
    {
        label: 'Accounts',
        keys: ['daybook', 'ledger_statement', 'cash_bank']
    },
    {
        label: 'Settings',
        keys: ['settings_general', 'counters', 'kitchen_printers', 'user_rights', 'order_integration'],
        subGroups: [
            {
                label: 'Bill',
                keys: ['bill_series', 'generated_bills']
            },
            {
                label: 'Extra Modules',
                keys: ['coupons', 'loyalty', 'system_modules']
            }
        ]
    }
];

const AccessControlPage = () => {
    const { user } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Inline credential creation within role modal
    const [createCredentials, setCreateCredentials] = useState(false);
    const [credentialForm, setCredentialForm] = useState({
        staffName: '', staffUsername: '', staffPassword: '', staffConfirmPassword: ''
    });
    const [showStaffPassword, setShowStaffPassword] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'users'

    // Roles state
    const [roles, setRoles] = useState([]);
    const [pagesConfig, setPagesConfig] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleForm, setRoleForm] = useState({ name: '', description: '', pages: [] });

    // Users state
    const [subUsers, setSubUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: '', username: '', password: '', confirmPassword: '',
        email: '', mobile: '', custom_role_id: '', password_enabled: true
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [expandedPages, setExpandedPages] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const getAuthHeaders = useCallback(() => ({
        headers: { Authorization: `Bearer ${user?.token}` }
    }), [user]);

    // Fetch data
    useEffect(() => {
        fetchRoles();
        fetchPagesConfig();
        fetchSubUsers();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/roles`, getAuthHeaders());
            if (!res.ok) {
                console.error('Fetch roles failed:', res.status);
                return;
            }
            const data = await res.json();
            if (data.success) setRoles(data.data);
        } catch (err) {
            console.error('Fetch roles error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPagesConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/roles/pages-config`, getAuthHeaders());
            if (!res.ok) {
                console.error('Fetch pages config failed:', res.status, '- using fallback');
                setPagesConfig(FALLBACK_PAGES_CONFIG);
                return;
            }
            const data = await res.json();
            if (data.success) {
                setPagesConfig(data.data);
            } else {
                setPagesConfig(FALLBACK_PAGES_CONFIG);
            }
        } catch (err) {
            console.error('Fetch pages config error:', err);
            setPagesConfig(FALLBACK_PAGES_CONFIG);
        }
    };

    const fetchSubUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/roles/users`, getAuthHeaders());
            if (!res.ok) {
                console.error('Fetch sub-users failed:', res.status);
                return;
            }
            const data = await res.json();
            if (data.success) setSubUsers(data.data);
        } catch (err) {
            console.error('Fetch sub-users error:', err);
        }
    };

    // Role handlers
    const openCreateRole = () => {
        const config = pagesConfig.length > 0 ? pagesConfig : FALLBACK_PAGES_CONFIG;
        const initialPages = config.map(page => ({
            page_key: page.page_key,
            page_label: page.page_label,
            has_access: page.page_key === 'dashboard',
            features: page.features.map(f => ({
                feature_key: f.feature_key,
                feature_label: f.feature_label,
                enabled: page.page_key === 'dashboard'
            }))
        }));
        setRoleForm({ name: '', description: '', pages: initialPages });
        setEditingRole(null);
        setShowRoleModal(true);
        // Auto-expand all pages for easier selection
        const expanded = {};
        config.forEach(p => { expanded[p.page_key] = true; });
        setExpandedPages(expanded);
        // Reset credential form
        setCreateCredentials(false);
        setCredentialForm({ staffName: '', staffUsername: '', staffPassword: '', staffConfirmPassword: '' });
        setShowStaffPassword(false);
        setError('');
    };

    const openEditRole = (role) => {
        const config = pagesConfig.length > 0 ? pagesConfig : FALLBACK_PAGES_CONFIG;
        // Merge with default config to ensure all pages/features are present
        const mergedPages = config.map(configPage => {
            const existingPage = role.pages.find(p => p.page_key === configPage.page_key);
            return {
                page_key: configPage.page_key,
                page_label: configPage.page_label,
                has_access: configPage.page_key === 'dashboard' ? true : (existingPage?.has_access || false),
                features: configPage.features.map(cf => {
                    const existingFeature = existingPage?.features?.find(f => f.feature_key === cf.feature_key);
                    return {
                        feature_key: cf.feature_key,
                        feature_label: cf.feature_label,
                        enabled: configPage.page_key === 'dashboard' ? true : (existingFeature?.enabled || false)
                    };
                })
            };
        });

        setRoleForm({
            name: role.name,
            description: role.description || '',
            pages: mergedPages
        });
        setEditingRole(role);
        setShowRoleModal(true);
        // Auto-expand all pages for easier viewing
        const expanded = {};
        config.forEach(p => { expanded[p.page_key] = true; });
        setExpandedPages(expanded);
        setError('');
    };

    const togglePageAccess = (pageIndex) => {
        const updatedPages = [...roleForm.pages];
        if (updatedPages[pageIndex].page_key === 'dashboard') return;
        const newAccess = !updatedPages[pageIndex].has_access;
        updatedPages[pageIndex].has_access = newAccess;
        // If disabling page access, disable all features
        if (!newAccess) {
            updatedPages[pageIndex].features = updatedPages[pageIndex].features.map(f => ({
                ...f, enabled: false
            }));
        } else {
            // If enabling page access, enable all features by default
            updatedPages[pageIndex].features = updatedPages[pageIndex].features.map(f => ({
                ...f, enabled: true
            }));
        }
        setRoleForm({ ...roleForm, pages: updatedPages });
    };

    const toggleFeature = (pageIndex, featureIndex) => {
        const updatedPages = [...roleForm.pages];
        if (updatedPages[pageIndex].page_key === 'dashboard') return;
        updatedPages[pageIndex].features[featureIndex].enabled =
            !updatedPages[pageIndex].features[featureIndex].enabled;
        setRoleForm({ ...roleForm, pages: updatedPages });
    };

    const toggleAllPages = (enable) => {
        const updatedPages = roleForm.pages.map(page => ({
            ...page,
            has_access: page.page_key === 'dashboard' ? true : enable,
            features: page.features.map(f => ({ ...f, enabled: page.page_key === 'dashboard' ? true : enable }))
        }));
        setRoleForm({ ...roleForm, pages: updatedPages });
    };

    const toggleGroupPages = (keys, enable) => {
        const updatedPages = roleForm.pages.map(page => {
            if (keys.includes(page.page_key) && page.page_key !== 'dashboard') {
                return {
                    ...page,
                    has_access: enable,
                    features: page.features.map(f => ({ ...f, enabled: enable }))
                };
            }
            return page;
        });
        setRoleForm({ ...roleForm, pages: updatedPages });
    };

    const toggleExpandPage = (pageKey) => {
        setExpandedPages(prev => ({ ...prev, [pageKey]: !prev[pageKey] }));
    };

    const saveRole = async () => {
        if (!roleForm.name.trim()) {
            setError('Role name is required');
            return;
        }

        // Validate credentials if enabled
        if (createCredentials && !editingRole) {
            if (!credentialForm.staffName.trim()) {
                setError('Staff name is required');
                return;
            }
            if (!credentialForm.staffUsername.trim()) {
                setError('Staff username is required');
                return;
            }
            if (!credentialForm.staffPassword) {
                setError('Staff password is required');
                return;
            }
            if (credentialForm.staffPassword.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (credentialForm.staffPassword !== credentialForm.staffConfirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        try {
            setSaving(true);
            setError('');

            const url = editingRole
                ? `${API_URL}/roles/${editingRole._id}`
                : `${API_URL}/roles`;

            const method = editingRole ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify(roleForm)
            });

            let data;
            try {
                data = await res.json();
            } catch (parseErr) {
                setError(`Server error (${res.status}). Please check if backend is running.`);
                return;
            }

            if (data.success) {
                const roleId = data.data._id;
                let successMsg = editingRole ? 'Role updated successfully!' : 'Role created successfully!';

                // Create staff user if credentials were provided
                if (createCredentials && !editingRole && credentialForm.staffUsername.trim()) {
                    try {
                        const userRes = await fetch(`${API_URL}/roles/users`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${user?.token}`
                            },
                            body: JSON.stringify({
                                name: credentialForm.staffName,
                                username: credentialForm.staffUsername,
                                password: credentialForm.staffPassword,
                                custom_role_id: roleId
                            })
                        });
                        const userData = await userRes.json();
                        if (userData.success) {
                            successMsg = `Role "${roleForm.name}" created with user "${credentialForm.staffUsername}"!`;
                            fetchSubUsers();
                        } else {
                            successMsg = `Role created! But user creation failed: ${userData.message}`;
                        }
                    } catch (userErr) {
                        successMsg = `Role created! But user creation failed: ${userErr.message}`;
                    }
                }

                setSuccess(successMsg);
                setShowRoleModal(false);
                fetchRoles();
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(data.message || `Failed to save role (${res.status})`);
            }
        } catch (err) {
            console.error('Save role error:', err);
            setError(`Network error: ${err.message}. Check if backend server is running.`);
        } finally {
            setSaving(false);
        }
    };

    const deleteRole = async (roleId) => {
        try {
            setSaving(true);
            const res = await fetch(`${API_URL}/roles/${roleId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Role deleted successfully!');
                fetchRoles();
                setDeleteConfirm(null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message);
                setDeleteConfirm(null);
            }
        } catch (err) {
            setError('Failed to delete role');
            setDeleteConfirm(null);
        } finally {
            setSaving(false);
        }
    };

    // User handlers
    const openCreateUser = () => {
        setUserForm({
            name: '', username: '', password: '', confirmPassword: '',
            email: '', mobile: '', custom_role_id: ''
        });
        setEditingUser(null);
        setShowUserModal(true);
        setShowPassword(false);
        setError('');
    };

    const openEditUser = (u) => {
        setUserForm({
            name: u.name,
            username: u.username || '',
            password: '',
            confirmPassword: '',
            email: u.email || '',
            mobile: u.mobile || '',
            custom_role_id: u.custom_role_id?._id || u.custom_role_id || '',
            password_enabled: u.password_enabled !== false
        });
        setEditingUser(u);
        setShowUserModal(true);
        setShowPassword(false);
        setError('');
    };

    const saveUser = async () => {
        if (!userForm.name.trim() || !userForm.username.trim() || !userForm.custom_role_id) {
            setError('Name, username and role are required');
            return;
        }

        if (!editingUser && userForm.password_enabled && !userForm.password) {
            setError('Password is required when password protection is enabled');
            return;
        }

        if (userForm.password_enabled && userForm.password && userForm.password !== userForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (userForm.password_enabled && userForm.password && userForm.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const payload = {
                name: userForm.name,
                username: userForm.username,
                email: userForm.email,
                mobile: userForm.mobile,
                custom_role_id: userForm.custom_role_id,
                password_enabled: userForm.password_enabled
            };

            if (userForm.password_enabled && userForm.password) {
                payload.password = userForm.password;
            }

            const url = editingUser
                ? `${API_URL}/roles/users/${editingUser._id}`
                : `${API_URL}/roles/users`;

            const method = editingUser ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
                setShowUserModal(false);
                fetchSubUsers();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to save user');
            }
        } catch (err) {
            setError('Failed to save user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const deleteUser = async (userId) => {
        try {
            setSaving(true);
            const res = await fetch(`${API_URL}/roles/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('User deleted successfully!');
                fetchSubUsers();
                setDeleteConfirm(null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message);
                setDeleteConfirm(null);
            }
        } catch (err) {
            setError('Failed to delete user');
            setDeleteConfirm(null);
        } finally {
            setSaving(false);
        }
    };

    const toggleUserActive = async (u) => {
        try {
            const res = await fetch(`${API_URL}/roles/users/${u._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({ is_active: !u.is_active })
            });
            const data = await res.json();
            if (data.success) {
                fetchSubUsers();
                setSuccess(`User ${u.is_active ? 'deactivated' : 'activated'} successfully!`);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Failed to update user status');
        }
    };

    // Filter
    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = subUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getAccessCount = (role) => {
        if (!role.pages) return '0 pages';
        const count = role.pages.filter(p => p.has_access).length;
        return `${count} page${count !== 1 ? 's' : ''}`;
    };

    return (
        <div className="dashboard-layout">
            <Sidebar
                isCollapsed={sidebarCollapsed}
                isMobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
            />

            {mobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
            )}

            <main className={`dashboard-main overflow-hidden font-sans flex flex-col h-screen ${sidebarCollapsed ? 'expanded' : ''}`}>
                <Header toggleSidebar={() => window.innerWidth <= 768 ? setMobileSidebarOpen(!mobileSidebarOpen) : setSidebarCollapsed(!sidebarCollapsed)} title="Access Control Hub" />

                <div className="fade-in px-3 lg:px-4 py-0 max-w-[2000px] mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden mt-3">

                    {/* Notifications */}
                    {success && (
                        <div className="mb-3 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center gap-2">
                            <CheckCircle size={18} />
                            <span className="font-medium text-sm flex-1">{success}</span>
                            <button onClick={() => setSuccess('')} className="opacity-50 hover:opacity-100"><X size={14} /></button>
                        </div>
                    )}
                    {error && !showRoleModal && !showUserModal && (
                        <div className="mb-3 px-4 py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span className="font-medium text-sm flex-1">{error}</span>
                            <button onClick={() => setError('')} className="opacity-50 hover:opacity-100"><X size={14} /></button>
                        </div>
                    )}
                    
                    {/* Integrated Compact Navigation Hub */}
                    <div className="bg-white border border-slate-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)] rounded-[1.5rem] p-1.5 mb-3 z-20 relative flex flex-col gap-1.5 flex-shrink-0">
                        {/* Category Selector (Compact Tabs) */}
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 bg-slate-50/50 rounded-xl">
                            <button
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'roles' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                                onClick={() => { setActiveTab('roles'); setSearchQuery(''); }}
                            >
                                <span style={{ color: activeTab === 'roles' ? '#f59e0b' : '#94a3b8' }}><Shield size={18} /></span>
                                Roles & Permissions
                            </button>
                            <button
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                                onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                            >
                                <span style={{ color: activeTab === 'users' ? '#10b981' : '#94a3b8' }}><Users size={18} /></span>
                                Staff Users
                            </button>
                        </div>

                        {/* Filter Chip Hub (Very Compact) */}
                        <div className="flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none px-1">
                            <div className="flex flex-1 max-w-sm items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white transition-colors">
                                <Search size={14} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'roles' ? 'Search roles...' : 'Search users...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs w-full font-medium"
                                />
                            </div>
                            <button
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                                onClick={activeTab === 'roles' ? openCreateRole : openCreateUser}
                            >
                                <Plus size={14} />
                                {activeTab === 'roles' ? 'Create Role' : 'Add User'}
                            </button>
                        </div>
                    </div>

                    {/* Report Content Container */}
                    <div className="flex-1 bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden relative min-h-0 flex flex-col mb-6">
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                            {loading ? (
                                <div className="ac-loading">
                                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                                    <p className="text-slate-500 font-medium text-sm mt-2">Loading...</p>
                                </div>
                            ) : activeTab === 'roles' ? (
                                <div className="ac-grid">
                                    {filteredRoles.length === 0 ? (
                                        <div className="ac-empty">
                                            <Shield size={48} className="text-slate-300" />
                                            <h3>No Roles Created</h3>
                                            <p>Create your first role to define page and feature access levels.</p>
                                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 mt-2" onClick={openCreateRole}>
                                                <Plus size={16} /> Create First Role
                                            </button>
                                        </div>
                                    ) : (
                                        filteredRoles.map(role => (
                                            <div key={role._id} className="ac-role-card">
                                                <div className="ac-role-header">
                                                    <div className="ac-role-info">
                                                        <div className="ac-role-avatar">
                                                            <Shield size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="ac-role-name">{role.name}</h3>
                                                            {role.description && (
                                                                <p className="ac-role-desc">{role.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ac-role-actions">
                                                        <button onClick={() => openEditRole(role)} className="ac-icon-btn ac-icon-edit" title="Edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {deleteConfirm === role._id ? (
                                                            <div className="ac-delete-confirm">
                                                                <button onClick={() => deleteRole(role._id)} className="ac-icon-btn ac-icon-danger">
                                                                    <Check size={16} />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirm(null)} className="ac-icon-btn">
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirm(role._id)}
                                                                className="ac-icon-btn ac-icon-danger"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ac-role-meta">
                                                    <span className="ac-meta-item">
                                                        <Eye size={14} />
                                                        {getAccessCount(role)}
                                                    </span>
                                                    <span className="ac-meta-item">
                                                        <Users size={14} />
                                                        {role.userCount || 0} user{(role.userCount || 0) !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                {/* Page pills */}
                                                <div className="ac-page-pills">
                                                    {role.pages?.filter(p => p.has_access).map(p => (
                                                        <span key={p.page_key} className="ac-pill">{p.page_label}</span>
                                                    ))}
                                                    {(!role.pages || role.pages.filter(p => p.has_access).length === 0) && (
                                                        <span className="ac-pill ac-pill-muted">No pages assigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="ac-table-wrapper">
                                    {filteredUsers.length === 0 ? (
                                        <div className="ac-empty">
                                            <UserPlus size={48} className="text-slate-300" />
                                            <h3>No Staff Users</h3>
                                            <p>Create staff users and assign roles to control their access.</p>
                                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 mt-2" onClick={openCreateUser}>
                                                <Plus size={16} /> Add First User
                                            </button>
                                        </div>
                                    ) : (
                                        <table className="ac-table">
                                            <thead>
                                                <tr>
                                                    <th>User</th>
                                                    <th>Username</th>
                                                    <th>Role</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map(u => (
                                                    <tr key={u._id}>
                                                        <td>
                                                            <div className="ac-user-cell">
                                                                <div className="ac-user-avatar">
                                                                    {u.name?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <span className="ac-user-name">{u.name}</span>
                                                                    {u.email && <span className="ac-user-email">{u.email}</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="ac-username-badge">@{u.username}</span>
                                                        </td>
                                                        <td>
                                                            <span className="ac-role-badge">
                                                                {u.custom_role_id?.name || 'Unassigned'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                onClick={() => toggleUserActive(u)}
                                                                className={`ac-status-toggle ${u.is_active !== false ? 'active' : 'inactive'}`}
                                                            >
                                                                {u.is_active !== false ? (
                                                                    <><ToggleRight size={20} /> Active</>
                                                                ) : (
                                                                    <><ToggleLeft size={20} /> Inactive</>
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <div className="ac-actions-cell">
                                                                <button onClick={() => openEditUser(u)} className="ac-icon-btn ac-icon-edit" title="Edit">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                {deleteConfirm === u._id ? (
                                                                    <div className="ac-delete-confirm">
                                                                        <button onClick={() => deleteUser(u._id)} className="ac-icon-btn ac-icon-danger">
                                                                            <Check size={16} />
                                                                        </button>
                                                                        <button onClick={() => setDeleteConfirm(null)} className="ac-icon-btn">
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setDeleteConfirm(u._id)}
                                                                        className="ac-icon-btn ac-icon-danger"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Role Modal */}
            {showRoleModal && (
                <div className="ac-modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="ac-modal ac-role-modal" onClick={e => e.stopPropagation()}>
                        <div className="ac-modal-header">
                            <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
                            <button onClick={() => setShowRoleModal(false)} className="ac-modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ac-modal-body">
                            {error && (
                                <div className="ac-notification ac-error">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="ac-form-section">
                                <div className="ac-form-group">
                                    <label>Role Name *</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="e.g., Billing Counter, Stock Manager"
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="ac-form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Brief description of this role..."
                                        value={roleForm.description}
                                        onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="ac-permissions-section">
                                <div className="ac-permissions-header">
                                    <h3>Page & Feature Permissions</h3>
                                    <div className="ac-quick-actions">
                                        <button
                                            className="ac-btn-small ac-btn-outline"
                                            onClick={() => toggleAllPages(true)}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            className="ac-btn-small ac-btn-outline"
                                            onClick={() => toggleAllPages(false)}
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>

                                <div className="ac-permissions-list">
                                    {MENU_GROUPS.map((group) => {
                                        const groupPages = roleForm.pages.filter(p => group.keys.includes(p.page_key));
                                        const hasSubGroupPages = group.subGroups && group.subGroups.some(sg => roleForm.pages.some(p => sg.keys.includes(p.page_key)));
                                        
                                        if (groupPages.length === 0 && !hasSubGroupPages) return null;
                                        
                                        const renderPage = (page, isMandatory = false) => {
                                            const pageIndex = roleForm.pages.findIndex(p => p.page_key === page.page_key);
                                            return (
                                                <div key={page.page_key} className={`ac-perm-page ${page.has_access ? 'enabled' : ''}`} style={isMandatory ? {opacity: 0.8} : {}}>
                                                    <div className="ac-perm-page-header">
                                                        <div className="ac-perm-page-left">
                                                            <label className="ac-checkbox-wrapper">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={page.has_access}
                                                                    onChange={() => togglePageAccess(pageIndex)}
                                                                    disabled={isMandatory}
                                                                />
                                                                <span className="ac-checkmark" style={isMandatory ? {borderColor: 'var(--primary)', background: 'var(--primary)', opacity: 0.7} : {}}></span>
                                                            </label>
                                                            <span className="ac-perm-page-label">{page.page_label}</span>
                                                        </div>
                                                        {page.has_access && (
                                                            <span className="ac-feature-count-badge">
                                                                {page.features.filter(f => f.enabled).length}/{page.features.length} features
                                                            </span>
                                                        )}
                                                    </div>

                                                    {page.has_access && (
                                                        <div className="ac-features-grid">
                                                            {page.features.map((feature, featureIndex) => (
                                                                <label key={feature.feature_key} className="ac-feature-item" style={isMandatory ? {opacity: 0.8} : {}}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={feature.enabled}
                                                                        onChange={() => toggleFeature(pageIndex, featureIndex)}
                                                                        disabled={isMandatory}
                                                                    />
                                                                    <span className="ac-feature-checkmark" style={isMandatory ? {borderColor: 'var(--primary)', background: 'var(--primary)', opacity: 0.7} : {}}></span>
                                                                    <span>{feature.feature_label}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        };

                                        return (
                                            <div key={group.label} className="ac-perm-group">
                                                <div className="ac-perm-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <h4 className="ac-perm-group-title" style={{ marginBottom: 0 }}>
                                                        {group.label} {group.mandatory && <span style={{fontSize: '0.7rem', color: 'var(--galaxy-muted)', textTransform: 'none', marginLeft: '0.5rem'}}>(Mandatory)</span>}
                                                    </h4>
                                                    {!group.mandatory && groupPages.length > 0 && (
                                                        <button 
                                                            className="ac-btn-small ac-btn-outline"
                                                            onClick={(e) => { e.preventDefault(); toggleGroupPages(group.keys, true); }}
                                                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: 'auto' }}
                                                        >
                                                            Select All
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {groupPages.map((page) => renderPage(page, group.mandatory))}
                                                
                                                {group.subGroups && group.subGroups.map(subGroup => {
                                                    const subGroupPages = roleForm.pages.filter(p => subGroup.keys.includes(p.page_key));
                                                    if (subGroupPages.length === 0) return null;
                                                    return (
                                                        <div key={subGroup.label} className="ac-perm-subgroup" style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
                                                            <div className="ac-perm-subgroup-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-light)' }}>
                                                                <h5 className="ac-perm-subgroup-title" style={{ fontSize: '0.85rem', color: 'var(--galaxy-muted)', marginBottom: 0 }}>
                                                                    {subGroup.label}
                                                                </h5>
                                                                <button 
                                                                    className="ac-btn-small ac-btn-outline"
                                                                    onClick={(e) => { e.preventDefault(); toggleGroupPages(subGroup.keys, true); }}
                                                                    style={{ padding: '2px 8px', fontSize: '0.7rem', height: 'auto' }}
                                                                >
                                                                    Select All
                                                                </button>
                                                            </div>
                                                            {subGroupPages.map((page) => renderPage(page, false))}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Handle any unmapped pages in an 'Other' group */}
                                    {(() => {
                                        const mappedKeys = MENU_GROUPS.flatMap(g => g.keys);
                                        const otherPages = roleForm.pages.filter(p => !mappedKeys.includes(p.page_key));
                                        if (otherPages.length === 0) return null;
                                        
                                        return (
                                            <div key="Other" className="ac-perm-group">
                                                <h4 className="ac-perm-group-title">Other Pages</h4>
                                                {otherPages.map((page) => {
                                                    const pageIndex = roleForm.pages.findIndex(p => p.page_key === page.page_key);
                                                    return (
                                                        <div key={page.page_key} className={`ac-perm-page ${page.has_access ? 'enabled' : ''}`}>
                                                            <div className="ac-perm-page-header">
                                                                <div className="ac-perm-page-left">
                                                                    <label className="ac-checkbox-wrapper">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={page.has_access}
                                                                            onChange={() => togglePageAccess(pageIndex)}
                                                                        />
                                                                        <span className="ac-checkmark"></span>
                                                                    </label>
                                                                    <span className="ac-perm-page-label">{page.page_label}</span>
                                                                </div>
                                                                {page.has_access && (
                                                                    <span className="ac-feature-count-badge">
                                                                        {page.features.filter(f => f.enabled).length}/{page.features.length} features
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {page.has_access && (
                                                                <div className="ac-features-grid">
                                                                    {page.features.map((feature, featureIndex) => (
                                                                        <label key={feature.feature_key} className="ac-feature-item">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={feature.enabled}
                                                                                onChange={() => toggleFeature(pageIndex, featureIndex)}
                                                                            />
                                                                            <span className="ac-feature-checkmark"></span>
                                                                            <span>{feature.feature_label}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Inline Credential Creation - only on new role */}
                            {!editingRole && (
                                <div className="ac-credentials-section">
                                    <div className="ac-credentials-toggle">
                                        <label className="ac-checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={createCredentials}
                                                onChange={() => setCreateCredentials(!createCredentials)}
                                            />
                                            <span className="ac-checkmark"></span>
                                        </label>
                                        <div>
                                            <span className="ac-credentials-label">
                                                <UserPlus size={16} /> Create Staff User Credentials
                                            </span>
                                            <p className="ac-credentials-hint">Create a login account for a staff member with this role</p>
                                        </div>
                                    </div>

                                    {createCredentials && (
                                        <div className="ac-credentials-form">
                                            <div className="ac-form-grid">
                                                <div className="ac-form-group">
                                                    <label><User size={14} /> Staff Name *</label>
                                                    <input
                                                        type="text"
                                                        className="ac-input"
                                                        placeholder="e.g., John Doe"
                                                        value={credentialForm.staffName}
                                                        onChange={(e) => setCredentialForm({ ...credentialForm, staffName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="ac-form-group">
                                                    <label><Key size={14} /> Username *</label>
                                                    <input
                                                        type="text"
                                                        className="ac-input"
                                                        placeholder="e.g., john_billing"
                                                        value={credentialForm.staffUsername}
                                                        onChange={(e) => setCredentialForm({ ...credentialForm, staffUsername: e.target.value })}
                                                    />
                                                    <p className="ac-form-hint">Staff will login with this username</p>
                                                </div>
                                                <div className="ac-form-group">
                                                    <label><Lock size={14} /> Password *</label>
                                                    <div className="ac-password-input">
                                                        <input
                                                            type={showStaffPassword ? 'text' : 'password'}
                                                            className="ac-input"
                                                            placeholder="Min 6 characters"
                                                            value={credentialForm.staffPassword}
                                                            onChange={(e) => setCredentialForm({ ...credentialForm, staffPassword: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowStaffPassword(!showStaffPassword)}
                                                            className="ac-password-toggle"
                                                        >
                                                            {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="ac-form-group">
                                                    <label><Lock size={14} /> Confirm Password *</label>
                                                    <input
                                                        type={showStaffPassword ? 'text' : 'password'}
                                                        className="ac-input"
                                                        placeholder="Re-enter password"
                                                        value={credentialForm.staffConfirmPassword}
                                                        onChange={(e) => setCredentialForm({ ...credentialForm, staffConfirmPassword: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="ac-modal-footer">
                            <button onClick={() => setShowRoleModal(false)} className="ac-btn ac-btn-ghost">
                                Cancel
                            </button>
                            <button onClick={saveRole} className="ac-btn ac-btn-primary" disabled={saving}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {editingRole ? 'Update Role' : (createCredentials ? 'Create Role & User' : 'Create Role')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {showUserModal && (
                <div className="ac-modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="ac-modal ac-user-modal" onClick={e => e.stopPropagation()}>
                        <div className="ac-modal-header">
                            <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
                            <button onClick={() => setShowUserModal(false)} className="ac-modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ac-modal-body">
                            {error && (
                                <div className="ac-notification ac-error">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="ac-form-grid">
                                <div className="ac-form-group">
                                    <label><User size={14} /> Full Name *</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Staff member's name"
                                        value={userForm.name}
                                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group">
                                    <label><Key size={14} /> Username *</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Login username"
                                        value={userForm.username}
                                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group">
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Require Password on Login</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">If disabled, the user can login using only their username.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={userForm.password_enabled} 
                                                onChange={(e) => setUserForm({ ...userForm, password_enabled: e.target.checked })} 
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {userForm.password_enabled && (
                                    <>
                                        <div className="ac-form-group">
                                            <label><Lock size={14} /> Password {!editingUser && '*'}</label>
                                            <div className="ac-password-input">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="ac-input"
                                                    placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                                                    value={userForm.password}
                                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    className="ac-password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="ac-form-group">
                                            <label><Lock size={14} /> Confirm Password</label>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="ac-input"
                                                placeholder={editingUser ? 'Leave blank to keep current' : 'Confirm password'}
                                                value={userForm.confirmPassword}
                                                onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="ac-form-group">
                                    <label>Email (Optional)</label>
                                    <input
                                        type="email"
                                        className="ac-input"
                                        placeholder="user@example.com"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group">
                                    <label>Mobile (Optional)</label>
                                    <input
                                        type="text"
                                        className="ac-input"
                                        placeholder="Mobile number"
                                        value={userForm.mobile}
                                        onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                                    />
                                </div>

                                <div className="ac-form-group ac-form-full">
                                    <label><Shield size={14} /> Assign Role *</label>
                                    <select
                                        className="ac-input ac-select"
                                        value={userForm.custom_role_id}
                                        onChange={(e) => setUserForm({ ...userForm, custom_role_id: e.target.value })}
                                    >
                                        <option value="">Select a role...</option>
                                        {roles.map(r => (
                                            <option key={r._id} value={r._id}>{r.name}</option>
                                        ))}
                                    </select>
                                    {roles.length === 0 && (
                                        <p className="ac-form-hint">
                                            No roles exist yet. Create a role first in the "Roles & Permissions" tab.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="ac-modal-footer">
                            <button onClick={() => setShowUserModal(false)} className="ac-btn ac-btn-ghost">
                                Cancel
                            </button>
                            <button onClick={saveUser} className="ac-btn ac-btn-primary" disabled={saving}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessControlPage;
