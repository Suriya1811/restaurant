import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import StockPage from './StockPage';
import GenericSummaryReport from './dashboard/GenericSummaryReport';
import Gstr1Report from './dashboard/Gstr1Report';

// Sales Reports
import DayWiseSales from './dashboard/DayWiseSales';
import MonthWiseSales from './dashboard/MonthWiseSales';
import ItemWiseSales from './dashboard/ItemWiseSales';
import CategoryWiseSales from './dashboard/CategoryWiseSales';
import TransactionWiseSales from './dashboard/TransactionWiseSales';
import SalesProfit from './dashboard/SalesProfit';

// Purchase Reports
import DayWisePurchase from './dashboard/DayWisePurchase';
import SupplierWisePurchase from './dashboard/SupplierWisePurchase';

// Outstanding Reports
import SupplierOutstanding from './dashboard/SupplierOutstanding';
import CustomerOutstanding from './dashboard/CustomerOutstanding';
import AccountsReceivable from './dashboard/AccountsReceivable';
import AccountsPayable from './dashboard/AccountsPayable';

import {
    PackageOpen, BarChart3, ShoppingCart, CreditCard,
    Grid, TrendingDown, MinusCircle, AlertTriangle, ArrowDownRight,
    Activity, FileText, Calendar, PieChart, Box, Layers, TrendingUp, Tag,
    UserCircle, Users, ChevronRight, Search, FileBarChart2
} from 'lucide-react';
import './ReportsPage.css';

const CATEGORIES = [
    { key: 'stock', label: 'Stock Report', icon: <PackageOpen size={18} />, color: '#f59e0b', bg: '#fef3c7' },
    { key: 'gst', label: 'GST Reports', icon: <FileBarChart2 size={18} />, color: '#ec4899', bg: '#fce7f3' },
    { key: 'sales', label: 'Sales Summary', icon: <BarChart3 size={18} />, color: '#10b981', bg: '#d1fae5' },
    { key: 'purchase', label: 'Purchase Summary', icon: <ShoppingCart size={18} />, color: '#6366f1', bg: '#e0e7ff' },
    { key: 'outstanding', label: 'Outstanding', icon: <CreditCard size={18} />, color: '#f43f5e', bg: '#ffe4e6' }
];

const FILTERS = {
    stock: [
        { key: 'all', label: 'All Stock', icon: <Grid size={14} /> },
        { key: 'negative', label: 'Negative', icon: <TrendingDown size={14} /> },
        { key: 'nil', label: 'Nil Stock', icon: <MinusCircle size={14} /> },
        { key: 'min', label: 'Below Min', icon: <AlertTriangle size={14} /> },
        { key: 'max', label: 'Maximum', icon: <ArrowDownRight size={14} /> },
        { key: 'moving', label: 'Moving', icon: <Activity size={14} /> },
        { key: 'non-moving', label: 'Non Moving', icon: <Box size={14} /> },
        { key: 'transaction', label: 'Transaction', icon: <FileText size={14} /> }
    ],
    gst: [
        { key: 'gstr1', label: 'GSTR-1', icon: <FileText size={14} /> },
        { key: 'gstr2', label: 'GSTR-2', icon: <FileText size={14} /> },
        { key: 'gstr3b', label: 'GSTR-3B', icon: <FileText size={14} /> }
    ],
    sales: [
        { key: 'day', label: 'Day Wise', icon: <Calendar size={14} /> },
        { key: 'month', label: 'Month Wise', icon: <PieChart size={14} /> },
        { key: 'item', label: 'Item Wise', icon: <Box size={14} /> },
        { key: 'group', label: 'Group Wise', icon: <Layers size={14} /> },
        { key: 'transaction', label: 'Transaction', icon: <FileText size={14} /> },
        { key: 'profit', label: 'Profit Audit', icon: <TrendingUp size={14} /> },
        { key: 'brand', label: 'Brand Wise', icon: <Tag size={14} /> },
        { key: 'captain', label: 'Captain Wise', icon: <UserCircle size={14} /> },
        { key: 'agent', label: 'Agent Wise', icon: <Users size={14} /> }
    ],
    purchase: [
        { key: 'day', label: 'Day Wise', icon: <Calendar size={14} /> },
        { key: 'month', label: 'Month Wise', icon: <PieChart size={14} /> },
        { key: 'item', label: 'Item Wise', icon: <Box size={14} /> },
        { key: 'group', label: 'Group Wise', icon: <Layers size={14} /> },
        { key: 'brand', label: 'Brand Wise', icon: <Tag size={14} /> },
        { key: 'supplier', label: 'Supplier Wise', icon: <Users size={14} /> }
    ],
    outstanding: [
        { key: 'customer', label: 'Customer Wise', icon: <UserCircle size={14} /> },
        { key: 'supplier', label: 'Supplier Wise', icon: <Users size={14} /> },
        { key: 'receivable', label: 'Receivable', icon: <TrendingUp size={14} /> },
        { key: 'payable', label: 'Payable', icon: <TrendingDown size={14} /> }
    ]
};

const ReportsPage = () => {
    const location = useLocation();
    const navigate = useNavigate(); // Add useNavigate here
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category') || 'stock';
    const filter = searchParams.get('filter') || 'all';

    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const getHeaderTitle = () => {
        switch (category) {
            case 'stock': return 'Inventory Master Hub';
            case 'gst': return 'GST Reports Hub';
            case 'sales': return 'Sales Summary Hub';
            case 'purchase': return 'Purchase Audit Hub';
            case 'outstanding': return 'Financial Outstanding Hub';
            default: return 'Dynamic Reports Hub';
        }
    };

    const renderActiveReport = () => {
        // Use a composite key of category and filter to ensure clean remounts.
        const componentKey = `${category}-${filter}`;

        // ── STOCK ─────────────────────────────────────────────────────────────
        if (category === 'stock') {
            if (filter === 'valuation') {
                return (
                    <GenericSummaryReport
                        key={componentKey}
                        isEmbedded={true}
                        title="Stock Valuation Report"
                        endpoint="/reports/stock-valuation"
                    />
                );
            }
            return <StockPage key={componentKey} isEmbedded={true} embeddedFilter={filter} />;
        }

        // ── GST ───────────────────────────────────────────────────────────────
        if (category === 'gst') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-sm p-10">
                    <FileBarChart2 className="mb-3 text-slate-300" size={48} />
                    <p>{filter.toUpperCase()} Report Generation</p>
                    <p className="text-xs text-slate-300 mt-2 font-medium normal-case">This feature is currently under development.</p>
                </div>
            );
        }

        // ── SALES ─────────────────────────────────────────────────────────────
        if (category === 'sales') {
            switch (filter) {
                case 'day': return <DayWiseSales key={componentKey} isEmbedded={true} />;
                case 'month': return <MonthWiseSales key={componentKey} isEmbedded={true} />;
                case 'item': return <ItemWiseSales key={componentKey} isEmbedded={true} />;
                case 'group': return <CategoryWiseSales key={componentKey} isEmbedded={true} />;
                case 'transaction': return <TransactionWiseSales key={componentKey} isEmbedded={true} />;
                case 'profit': return <SalesProfit key={componentKey} isEmbedded={true} />;
                case 'brand':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Brand Wise Sales" endpoint="/reports/sales-by-brand" />;
                case 'captain':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Captain Wise Sales" endpoint="/reports/sales-by-captain" />;
                case 'agent':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Personnel Sales" endpoint="/reports/sales/summary" groupBy="WAITER" />;
                default:
                    return <DayWiseSales key={componentKey} isEmbedded={true} />;
            }
        }

        // ── PURCHASE ──────────────────────────────────────────────────────────
        if (category === 'purchase') {
            switch (filter) {
                case 'day': return <DayWisePurchase key={componentKey} isEmbedded={true} />;
                case 'supplier': return <SupplierWisePurchase key={componentKey} isEmbedded={true} />;
                case 'month':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Month Wise Purchase" endpoint="/reports/purchase-summary" groupBy="MONTH" />;
                case 'item':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Item Wise Purchase" endpoint="/reports/purchase-summary" groupBy="ITEM" />;
                case 'group':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Group Wise Purchase" endpoint="/reports/purchase-summary" groupBy="CATEGORY" />;
                case 'brand':
                    return <GenericSummaryReport key={componentKey} isEmbedded={true} title="Brand Wise Purchase" endpoint="/reports/purchase-summary" groupBy="BRAND" />;
                default:
                    return <DayWisePurchase key={componentKey} isEmbedded={true} />;
            }
        }

        // ── OUTSTANDING ───────────────────────────────────────────────────────
        if (category === 'outstanding') {
            switch (filter) {
                case 'customer': return <CustomerOutstanding key={componentKey} isEmbedded={true} />;
                case 'supplier': return <SupplierOutstanding key={componentKey} isEmbedded={true} />;
                case 'receivable':
                    return <AccountsReceivable key={componentKey} isEmbedded={true} />;
                case 'payable':
                    return <AccountsPayable key={componentKey} isEmbedded={true} />;
                default:
                    return <CustomerOutstanding key={componentKey} isEmbedded={true} />;
            }
        }

        // ── FALLBACK ──────────────────────────────────────────────────────────
        return <StockPage key={componentKey} isEmbedded={true} embeddedFilter={filter} />;
    };

    return (
        <div className="dashboard-layout bg-slate-50">
            {/* If GSTR-1 is selected, completely bypass the wrapper and render the standalone component */}
            {category === 'gst' && filter === 'gstr1' ? (
                <Gstr1Report />
            ) : (
                <>
                    <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

                    {isMobileSidebarOpen && window.innerWidth <= 768 && (
                        <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
                    )}

            <main className="dashboard-main flex-1 overflow-hidden font-sans bg-slate-50 flex flex-col h-screen">
                <Header toggleSidebar={toggleSidebar} title={getHeaderTitle()} />

                <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-hidden m-2 lg:m-4 rounded-xl border border-slate-200">
                    {/* Standard Navigation Tab Bar */}
                    <div className="bg-slate-50 border-b border-slate-200 px-2 py-2 flex items-center gap-1 overflow-x-auto custom-scrollbar flex-shrink-0">
                        {(FILTERS[category] || []).map(f => (
                            <button
                                key={f.key}
                                onClick={() => navigate(`/dashboard/self-service/reports?category=${category}&filter=${f.key}`)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold tracking-wide transition-all whitespace-nowrap border ${filter === f.key
                                        ? 'bg-white text-slate-800 border-slate-300 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent'
                                    }`}
                            >
                                <span className={filter === f.key ? 'text-slate-700' : 'text-slate-400'}>{f.icon}</span>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Report Content */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        {renderActiveReport()}
                    </div>
                </div>
            </main>
                </>
            )}
        </div>
    );
};

export default ReportsPage;

