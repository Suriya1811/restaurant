import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, memo } from 'react';
import {
    LayoutDashboard, PlusCircle, Box, Layers, Database, FileText,
    BarChart3, Settings, LogOut, Utensils, Store, Shield, Tag,
    Users, Pocket, UserCircle, Download, RefreshCw, User, Book, ShoppingCart, Wallet,
    History, BarChart, Grid, ChevronDown, ChevronRight, Calculator,
    PieChart, List, CreditCard, Landmark, Printer, ChefHat, Lock, Globe,
    TrendingUp, TrendingDown, Package, Monitor, Receipt, LayoutGrid, Hash,
    MinusCircle, AlertTriangle, ArrowUpRight, Activity, Calendar, Ticket, Gift, Workflow
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../pages/dashboard/Dashboard.css';
import logoSidebar from '../../assets/logo_sidebar.png';

const Sidebar = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, hasPageAccess, hasModuleAccess, isAdmin } = useAuth();
    const [expandedMenus, setExpandedMenus] = useState({});

    const logoutWithBackup = async () => {
        const autoBackup = localStorage.getItem('auto_backup_on_close') === 'true';
        if (autoBackup) {
            try {
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const { token } = JSON.parse(savedUser);
                    await fetch(`${import.meta.env.VITE_API_URL}/settings/backup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ backupPath: localStorage.getItem('backup_path') || 'C:/Yugam/Backups' })
                    });
                }
            } catch (err) { console.error("Auto backup failed", err); }
        }
        logout();
    };

    // Close sidebar on navigation on mobile (also respond to query changes)
    useEffect(() => {
        if (window.innerWidth <= 768 && onMobileClose) {
            onMobileClose();
        }
    }, [location.pathname, location.search]);

    const toggleMenu = (label, isSub = false) => {
        setExpandedMenus(prev => {
            if (!isSub) {
                // If clicking a top-level menu that is already open, close it
                if (prev[label]) {
                    return {};
                }
                // If opening a new top-level menu, close all others
                return { [label]: true };
            }
            // For sub-menus (like Voucher), just toggle their specific state without affecting parents
            return {
                ...prev,
                [label]: !prev[label]
            };
        });
    };

    const menuStructure = useMemo(() => [
        {
            label: "Entry",
            icon: <Shield size={18} />,
            subItems: [
                {
                    label: "KOT",
                    icon: <ChefHat size={16} />,
                    route: "/dashboard/self-service/table-select",
                    pageKey: "kot",
                    module: "kot"
                },
                {
                    label: "Kitchen Display",
                    icon: <Monitor size={16} />,
                    route: "/dashboard/self-service/kitchen-management",
                    pageKey: "kitchen_printers",
                    module: "kot"
                },
                {
                    label: "Sales Bill",
                    icon: <PlusCircle size={16} />,
                    route: "/dashboard/self-service/billing",
                    pageKey: "sales_bill"
                },
                {
                    label: "Display",
                    icon: <Monitor size={16} />,
                    route: "/dashboard/self-service/display",
                    pageKey: "display"
                },
                {
                    label: "Party Master",
                    icon: <Users size={16} />,
                    route: "/dashboard/self-service/bills-sales",
                    pageKey: "party_master"
                },
                { label: "Purchase Entry", route: "/dashboard/self-service/purchase", icon: <ShoppingCart size={16} />, pageKey: "purchase" },
                {
                    label: "Voucher",
                    route: "/dashboard/self-service/vouchers",
                    icon: <Wallet size={16} />,
                    pageKey: "vouchers"
                }
            ]
        },
        {
            label: "Master",
            icon: <Database size={18} />,
            subItems: [
                { label: "Item", route: "/dashboard/self-service/products", icon: <Box size={16} />, pageKey: "products" },
                { label: "Category", route: "/dashboard/self-service/categories", icon: <Layers size={16} />, pageKey: "categories" },
                { label: "Function Type", route: "/dashboard/self-service/function-master", icon: <Layers size={16} />, pageKey: "function_type" },
                { label: "Brand", route: "/dashboard/self-service/brands", icon: <Tag size={16} />, pageKey: "brands" },
                { label: "Unit", route: "/dashboard/self-service/units", icon: <Database size={16} />, pageKey: "units" },
                { label: "Tax", route: "/dashboard/self-service/taxes", icon: <Database size={16} />, pageKey: "taxes" },
                { label: "Table", route: "/dashboard/self-service/tables", icon: <Grid size={16} />, module: "table", pageKey: "tables" },
                { label: "Table Type", route: "/dashboard/self-service/table-types", icon: <Layers size={16} />, module: "table", pageKey: "table_types" },
                { label: "Captain/Waiter", route: "/dashboard/self-service/staff", icon: <Users size={16} />, module: "staff", pageKey: "staff" },
                { label: "Ledger", route: "/dashboard/self-service/ledgers", icon: <User size={16} />, pageKey: "ledgers" },
                { label: "Ledger Group", route: "/dashboard/self-service/group-master", icon: <Layers size={16} />, pageKey: "ledger_groups" }
            ]
        },
        {
            label: "Report",
            icon: <BarChart size={18} />,
            pageKey: "reports",
            subItems: [
                { label: "Stock Report", route: "/dashboard/self-service/reports?category=stock&filter=all", pageKey: "reports_stock" },
                { 
                    label: "GST Reports", 
                    pageKey: "reports_gst",
                    subItems: [
                        { label: "GSTR-1", route: "/dashboard/self-service/reports?category=gst&filter=gstr1", pageKey: "reports_gst" },
                        { label: "GSTR-2", route: "/dashboard/self-service/reports?category=gst&filter=gstr2", pageKey: "reports_gst" },
                        { label: "GSTR-3B", route: "/dashboard/self-service/reports?category=gst&filter=gstr3b", pageKey: "reports_gst" }
                    ]
                },
                { label: "Sale Summary", route: "/dashboard/self-service/reports?category=sales&filter=day", pageKey: "reports_sales" },
                { label: "Purchase Summary", route: "/dashboard/self-service/reports?category=purchase&filter=day", pageKey: "reports_purchase" },
                { label: "Outstanding", route: "/dashboard/self-service/reports?category=outstanding&filter=customer", pageKey: "reports_outstanding" }
            ]
        },
        {
            label: "Accounts",
            icon: <Calculator size={18} />,
            subItems: [
                { label: "Daybook", route: "/dashboard/self-service/accounts/daybook", icon: <List size={16} />, pageKey: "daybook" },
                { label: "Ledger Statement", route: "/dashboard/self-service/ledger-statement", icon: <FileText size={16} />, pageKey: "ledger_statement" },
                { label: "Cash & Bank", route: "/dashboard/self-service/accounts/cash-bank", icon: <Landmark size={16} />, pageKey: "cash_bank" },
                { label: "Trial Balance", route: "/dashboard/self-service/accounts/trial-balance", icon: <BarChart size={16} />, pageKey: "trial_balance" },
                { label: "Balance Sheet", route: "/dashboard/self-service/accounts/balance-sheet", icon: <PieChart size={16} />, pageKey: "balance_sheet" },
                { label: "Profit & Loss", route: "/dashboard/self-service/accounts/profit-loss", icon: <TrendingUp size={16} />, pageKey: "profit_loss" }
            ]
        },
        {
            label: "Settings",
            icon: <Settings size={18} />,
            route: "/dashboard/self-service/settings",
            pageKey: "settings_general"
        },
        {
            label: "Profile",
            icon: <UserCircle size={18} />,
            route: "/dashboard/self-service/profile",
            pageKey: "settings_general",
            subItems: [
                { label: "Backup", route: "/dashboard/self-service/profile?tab=backup", icon: <Download size={16} />, pageKey: "settings_general" },
                { label: "Restore", route: "/dashboard/self-service/profile?tab=restore", icon: <RefreshCw size={16} />, pageKey: "settings_general" }
            ]
        }
    ], []);


    const checkIsActive = (menuItem) => {
        if (menuItem.route) {
            const itemUrl = new URL(menuItem.route, window.location.origin);
            const isPathMatch = location.pathname === itemUrl.pathname;

            if (isPathMatch) {
                if (itemUrl.pathname === '/dashboard/self-service/settings') return true;
                const itemParams = Array.from(itemUrl.searchParams.entries());
                const queryParams = new URLSearchParams(location.search);

                if (itemParams.length > 0) {
                    return itemParams.every(([key, value]) => {
                        const currentVal = queryParams.get(key);
                        if (key === 'filter' && itemUrl.searchParams.get('category') !== 'gst') {
                            return true;
                        }
                        return currentVal === value;
                    });
                } else {
                    if (queryParams.has('tab') || queryParams.has('category')) {
                        return false;
                    }
                    return true;
                }
            }
        }
        if (menuItem.subItems) {
            return menuItem.subItems.some(sub => checkIsActive(sub));
        }
        return false;
    };

    // Auto-expand active menus
    useEffect(() => {
        const newExpanded = { ...expandedMenus };
        let changed = false;

        const expandActive = (items) => {
            items.forEach(item => {
                if (item.subItems) {
                    if (checkIsActive(item)) {
                        if (!newExpanded[item.label]) {
                            newExpanded[item.label] = true;
                            changed = true;
                        }
                    }
                    expandActive(item.subItems);
                }
            });
        };

        expandActive(menuStructure);

        if (changed) {
            setExpandedMenus(newExpanded);
        }
    }, [location.pathname, location.search, menuStructure]);

    const checkIsVisible = (menuItem) => {
        // Module visibility check
        if (menuItem.module && !hasModuleAccess(menuItem.module)) return false;

        const hasSubItems = menuItem.subItems && menuItem.subItems.length > 0;

        // If it's a leaf node (no sub-items)
        if (!hasSubItems) {
            return menuItem.pageKey ? hasPageAccess(menuItem.pageKey) : true;
        }

        // If it has sub-items
        // It is visible if ANY of its sub-items are visible
        const anyChildVisible = menuItem.subItems.some(sub => checkIsVisible(sub));
        const hasDirectAccess = menuItem.pageKey ? hasPageAccess(menuItem.pageKey) : false;

        return hasDirectAccess || anyChildVisible;
    };

    const checkIsExactActive = (menuItem) => {
        if (menuItem.route) {
            const itemUrl = new URL(menuItem.route, window.location.origin);
            const isPathMatch = location.pathname === itemUrl.pathname;

            if (isPathMatch) {
                if (itemUrl.pathname === '/dashboard/self-service/settings') return true;
                const itemParams = Array.from(itemUrl.searchParams.entries());
                const queryParams = new URLSearchParams(location.search);

                if (itemParams.length > 0) {
                    return itemParams.every(([key, value]) => {
                        const currentVal = queryParams.get(key);
                        if (key === 'filter' && itemUrl.searchParams.get('category') !== 'gst') {
                            return true;
                        }
                        return currentVal === value;
                    });
                } else {
                    if (queryParams.has('tab') || queryParams.has('category')) {
                        return false;
                    }
                    return true;
                }
            }
        }
        return false;
    };

    const renderMenuItem = (item, isSub = false) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedMenus[item.label];
        const isExactActive = checkIsExactActive(item);

        if (!checkIsVisible(item)) return null;

        return (
            <div key={item.label} className="menu-group">
                {hasSubItems ? (
                    <div
                        className={`nav-item ${isExactActive ? 'active' : ''} ${isExpanded ? 'expanded' : ''} ${isSub ? 'sub-nav-item' : ''}`}
                        onClick={() => {
                            if (item.route) {
                                const pathOnly = item.route.split('?')[0];
                                navigate(pathOnly);
                            }
                            toggleMenu(item.label, isSub);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {!isSub && <span className="nav-icon">{item.icon}</span>}
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        {!isCollapsed && (
                            <span className="nav-arrow" style={{ marginLeft: 'auto' }}>
                                <ChevronDown size={14} />
                            </span>
                        )}
                    </div>
                ) : (
                    <Link
                        to={item.route}
                        className={`nav-item ${isExactActive ? 'active' : ''} ${isSub ? 'sub-nav-item' : ''}`}
                    >
                        {!isSub && <span className="nav-icon">{item.icon}</span>}
                        {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    </Link>
                )}

                {hasSubItems && isExpanded && !isCollapsed && (
                    <div className="sub-menu">
                        {item.subItems.map(subItem => {
                            const isSubModuleAvailable = subItem.module ? hasModuleAccess(subItem.module) : true;
                            if (!isSubModuleAvailable) return null;
                            return renderMenuItem(subItem, true);
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'show' : ''}`}>
            <div className="sidebar-brand" style={{ padding: isCollapsed ? '0.5rem 0' : '0.75rem 1rem', height: '65px', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <img src={logoSidebar} alt="Yugam Software" style={{ width: '100%', maxWidth: isCollapsed ? '38px' : '175px', maxHeight: '48px', height: 'auto', objectFit: 'contain', transition: 'all 0.3s ease' }} />
            </div>

            <nav className="sidebar-nav">
                {menuStructure.map(item => renderMenuItem(item))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logoutWithBackup} className="logout-btn">
                    <LogOut size={18} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default memo(Sidebar);
