import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || '/api';
};

// Global 401 interceptor — installed once, cleared on unmount
let globalInterceptorId = null;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [moduleSettings, setModuleSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [backupModal, setBackupModal] = useState({
        show: false,
        title: '',
        message: '',
        loading: false,
        onComplete: null
    });
    const logoutRef = useRef(null);

    const performLogout = () => {
        setUser(null);
        setPermissions(null);
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        localStorage.removeItem('moduleSettings');
        setBackupModal({ show: false, title: '', message: '', loading: false, onComplete: null });
        window.location.href = '/login';
    };

    const logout = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                if (parsedUser?.token) {
                    const apiBase = getApiBaseUrl();
                    const res = await axios.get(`${apiBase}/settings/backup/status`, {
                        headers: { 'Authorization': `Bearer ${parsedUser.token}` }
                    });

                    if (res.data?.success && res.data?.data?.settings?.on_exit) {
                        setBackupModal({
                            show: true,
                            title: 'Auto Backup on Exit',
                            message: 'Taking database backup before exit...',
                            loading: true,
                            onComplete: null
                        });

                        try {
                            await axios.post(`${apiBase}/settings/backup`, {}, {
                                headers: { 'Authorization': `Bearer ${parsedUser.token}` }
                            });
                        } catch (err) {
                            console.error("Auto backup on exit error:", err);
                        }

                        setBackupModal({
                            show: true,
                            title: 'Backup Successful',
                            message: 'Backup completed successfully.',
                            loading: false,
                            onComplete: () => {
                                performLogout();
                            }
                        });
                        return;
                    }
                }
            }
        } catch (err) {
            console.error("Logout auto-backup check failed:", err);
        }

        performLogout();
    };

    // Keep logoutRef in sync so the interceptor always calls the latest version
    logoutRef.current = logout;

    useEffect(() => {
        // Install a single global response interceptor
        if (globalInterceptorId !== null) {
            axios.interceptors.response.eject(globalInterceptorId);
        }
        globalInterceptorId = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const isAuthEndpoint = error?.config?.url?.includes('/auth/login');
                const isVerifyPasswordEndpoint = error?.config?.url?.includes('/verify-password');
                if (error?.response?.status === 401 && !isAuthEndpoint && !isVerifyPasswordEndpoint) {
                    // Token expired or invalid — force logout
                    logoutRef.current?.();
                }
                return Promise.reject(error);
            }
        );

        const savedUser = localStorage.getItem('user');
        const savedPermissions = localStorage.getItem('permissions');
        const savedModules = localStorage.getItem('moduleSettings');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                // Validate essential fields to prevent navigation loops
                if (parsedUser.token && parsedUser.role && parsedUser.restaurant_type) {
                    setUser(parsedUser);
                    if (savedPermissions) {
                        setPermissions(JSON.parse(savedPermissions));
                    }
                    if (savedModules) {
                        setModuleSettings(JSON.parse(savedModules));
                    }
                    // Fetch fresh settings in background
                    fetchModuleSettings(parsedUser.token);
                    checkStartupBackup(parsedUser.token);
                } else {
                    localStorage.removeItem('user');
                    localStorage.removeItem('permissions');
                }
            } catch (e) {
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
            }
        }
        setLoading(false);
    }, []);

    const checkStartupBackup = async (token) => {
        if (sessionStorage.getItem('startup_backup_done') === 'true') return;
        sessionStorage.setItem('startup_backup_done', 'true');

        try {
            const apiBase = getApiBaseUrl();
            const res = await axios.get(`${apiBase}/settings/backup/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data?.success && res.data?.data?.settings?.on_startup) {
                setBackupModal({
                    show: true,
                    title: 'Auto Backup on Startup',
                    message: 'Taking database backup on startup...',
                    loading: true,
                    onComplete: null
                });

                try {
                    await axios.post(`${apiBase}/settings/backup`, {}, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (err) {
                    console.error("Startup backup failed", err);
                }

                setBackupModal({
                    show: true,
                    title: 'Backup Successful',
                    message: 'Backup completed successfully.',
                    loading: false,
                    onComplete: () => {
                        setBackupModal({ show: false, title: '', message: '', loading: false, onComplete: null });
                        window.location.href = '/'; // Open Company Selection Screen
                    }
                });
            }
        } catch (e) {
            console.error("Failed to check startup backup status", e);
        }
    };

    const fetchModuleSettings = async (token) => {
        try {
            const apiBase = getApiBaseUrl();
            const res = await axios.get(`${apiBase}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success && res.data.data) {
                if (res.data.data.modules) {
                    setModuleSettings(res.data.data.modules);
                    localStorage.setItem('moduleSettings', JSON.stringify(res.data.data.modules));
                }
                
                if (res.data.data.profile) {
                    const profile = res.data.data.profile;
                    setUser(prev => {
                        if (!prev) return prev;
                        const updatedUser = {
                            ...prev,
                            email: prev.email || profile.email || '',
                            phone: prev.phone || profile.mobile || profile.phone || '',
                            contact_person: prev.contact_person || prev.name || profile.ownerName || ''
                        };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        return updatedUser;
                    });
                }
            }
        } catch (e) {
            // 401 handled globally by interceptor — don't log noise
            if (e?.response?.status !== 401) {
                console.error("Failed to fetch module settings", e);
            }
        }
    };

    // Automatic Silent Interval Backup Service
    useEffect(() => {
        if (!user || !user.token) return;

        let backupTimer = null;

        const initAutoBackup = async () => {
            try {
                const apiBase = getApiBaseUrl();
                const { data } = await axios.get(`${apiBase}/settings/backup/status`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });

                if (data.success && data.data?.settings) {
                    const { auto_interval } = data.data.settings;
                    if (auto_interval && auto_interval > 0) {
                        const intervalMs = auto_interval * 60 * 60 * 1000;
                        backupTimer = setInterval(async () => {
                            try {
                                await axios.post(`${apiBase}/settings/backup`, {}, {
                                    headers: { 'Authorization': `Bearer ${user.token}` }
                                });
                                console.log(`[SILENT BACKUP] Auto backup executed silently every ${auto_interval} hour(s).`);
                            } catch (err) {
                                console.error('[SILENT BACKUP ERROR]', err);
                            }
                        }, intervalMs);
                    }
                }
            } catch (err) {
                console.error('[AUTO BACKUP STATUS ERROR]', err);
            }
        };

        initAutoBackup();

        return () => {
            if (backupTimer) clearInterval(backupTimer);
        };
    }, [user?.token]);

    const register = async (userData) => {
        try {
            const apiBase = getApiBaseUrl();
            const { data } = await axios.post(`${apiBase}/auth/register`, userData);
            // DO NOT create a login session automatically
            return { success: true, data: data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const login = async (credentials) => {
        try {
            const apiBase = getApiBaseUrl();
            const { data } = await axios.post(`${apiBase}/auth/login`, credentials);
            // Backend login returns: { success, token, user, restaurant, permissions }
            const normalizedUser = {
                ...data.user,
                _id: data.user.id,
                token: data.token,
                restaurant_type: data.restaurant.restaurant_type,
                restaurant_name: data.restaurant.store_name || data.restaurant.name,
                logo_url: data.restaurant.logo_url
            };
            setUser(normalizedUser);
            localStorage.setItem('user', JSON.stringify(normalizedUser));

            // Store permissions for STAFF users
            if (data.permissions) {
                setPermissions(data.permissions);
                localStorage.setItem('permissions', JSON.stringify(data.permissions));
            } else {
                setPermissions(null);
                localStorage.removeItem('permissions');
            }

            return { success: true, data: normalizedUser };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };


    // Check if current user has access to a specific page
    const hasPageAccess = (pageKey) => {
        if (!user) return false;
        // OWNER and ADMIN have full access
        if (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
        // STAFF users check permissions
        if (!permissions) return false;
        const page = permissions.find(p => p.menu_key === pageKey);
        // Fallback for old format if necessary
        if (!page) {
            const oldPage = permissions.find(p => p.page_key === pageKey);
            return oldPage?.has_access || false;
        }
        return page.view;
    };

    // Check if current user has access to a specific feature within a page
    const hasFeatureAccess = (pageKey, featureKey) => {
        if (!user) return false;
        // OWNER and ADMIN have full access
        if (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
        // STAFF users check permissions
        if (!permissions) return false;
        
        const page = permissions.find(p => p.menu_key === pageKey);
        if (page) {
            if (!page.view) return false;
            // featureKey will be 'alter', 'cancel', or 'delete'
            if (featureKey === 'alter') return page.alter;
            if (featureKey === 'cancel') return page.cancel;
            if (featureKey === 'delete') return page.delete;
            return false;
        }

        // Fallback for old format
        const oldPage = permissions.find(p => p.page_key === pageKey);
        if (!oldPage?.has_access) return false;
        const feature = oldPage.features?.find(f => f.feature_key === featureKey);
        return feature?.enabled || false;
    };

    // Check if user is an admin (OWNER or ADMIN role)
    const isAdmin = () => {
        return user && (user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    };

    // Get the first accessible route for this user
    const getLandingPage = () => {
        if (!user) return '/login';
        if (isAdmin()) return '/dashboard/self-service/home';
        if (!permissions || permissions.length === 0) return '/login';

        // Find first page with view = true
        const firstPage = permissions.find(p => p.view || p.has_access);
        if (firstPage) {
            const firstPageKey = firstPage.menu_key || firstPage.page_key;
            // Map keys to actual routes
            const routeMap = {
                dashboard: '/dashboard/self-service/home',
                billing: '/dashboard/self-service/billing',
                bills_sales: '/dashboard/self-service/bills-sales',
                products: '/dashboard/self-service/products',
                categories: '/dashboard/self-service/categories',
                brands: '/dashboard/self-service/brands',
                tables: '/dashboard/self-service/tables',
                captains: '/dashboard/self-service/captains',
                waiters: '/dashboard/self-service/waiters',
                suppliers: '/dashboard/self-service/suppliers',
                customers: '/dashboard/self-service/customers',
                ledgers: '/dashboard/self-service/ledgers',
                purchase: '/dashboard/self-service/purchase',
                purchase_history: '/dashboard/self-service/purchase-history',
                advanced_reports: '/dashboard/self-service/advanced-reports',
                ledger_statement: '/dashboard/self-service/ledger-statement',
                vouchers: '/dashboard/self-service/vouchers',
                counters: '/dashboard/self-service/counters',
                stock: '/dashboard/self-service/stock',
                reports: '/dashboard/self-service/reports',
                settings: '/dashboard/self-service/settings'
            };
            return routeMap[firstPageKey] || '/dashboard/self-service/home';
        }
        return '/login';
    };

    // Check if a global module is enabled
    const hasModuleAccess = (moduleName) => {
        if (!moduleSettings) return true; // Default to true if not loaded
        // Mapping internal keys to module setting keys
        const map = {
            kitchen: 'kitchen_enabled',
            printer: 'printer_enabled',
            counter: 'counter_enabled',
            dashboard: 'dashboard_enabled',
            reports: 'reports_enabled',
            staff: 'staff_enabled',
            table: 'table_enabled',
            coupon: 'coupon_enabled',
            loyalty: 'loyalty_enabled',
            kot: 'kot_enabled',
            pay_mode: 'pay_mode_enabled',
            stock_level: 'stock_level_enabled',
            party_order: 'party_order_enabled',
            party: 'party_order_enabled'
        };
        const key = map[moduleName] || `${moduleName}_enabled`;
        return moduleSettings[key] !== false;
    };

    const contextValue = useMemo(() => ({
        user,
        setUser,
        permissions,
        moduleSettings,
        setModuleSettings,
        loading,
        register,
        login,
        logout,
        hasPageAccess,
        hasFeatureAccess,
        hasModuleAccess,
        isAdmin,
        getLandingPage
    }), [user, permissions, moduleSettings, loading]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
            {backupModal.show && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        width: '100%',
                        maxWidth: '400px',
                        overflow: 'hidden',
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '18px',
                            backgroundColor: backupModal.loading ? '#fff7ed' : '#ecfdf5',
                            border: backupModal.loading ? '1px solid #ffedd5' : '1px solid #a7f3d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            color: backupModal.loading ? '#ea580c' : '#059669'
                        }}>
                            {backupModal.loading ? (
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '3.5px solid #fed7aa',
                                    borderTopColor: '#ea580c',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            ) : (
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            )}
                        </div>
                        
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                            {backupModal.title}
                        </h3>
                        
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '1.5rem' }}>
                            {backupModal.message}
                        </p>

                        {!backupModal.loading && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (backupModal.onComplete) {
                                        backupModal.onComplete();
                                    } else {
                                        setBackupModal({ show: false, title: '', message: '', loading: false, onComplete: null });
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#ea580c',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    boxShadow: '0 10px 20px -5px rgba(234, 88, 12, 0.4)'
                                }}
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
