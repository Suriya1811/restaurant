import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Global 401 interceptor — installed once, cleared on unmount
let globalInterceptorId = null;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [moduleSettings, setModuleSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const logoutRef = useRef(null);

    const logout = () => {
        setUser(null);
        setPermissions(null);
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        localStorage.removeItem('moduleSettings');
        // Redirect to login
        window.location.href = '/login';
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

    const fetchModuleSettings = async (token) => {
        try {
            const apiBase = import.meta.env.VITE_API_URL;
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

    const register = async (userData) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, userData);
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
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, credentials);
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
            stock_level: 'stock_level_enabled'
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
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
