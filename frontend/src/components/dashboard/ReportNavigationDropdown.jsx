import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ChevronDown, BarChart3, ShoppingCart, PackageOpen, Tag, Calendar,
    LayoutGrid, Database, FileText, Activity, AlertTriangle,
    ArrowDownRight, CreditCard, Users, TrendingUp, TrendingDown,
    Grid, Layers, Box, UserCircle, MinusCircle, List, PieChart
} from 'lucide-react';

// ─── Report catalogue ────────────────────────────────────────────────────────
// Every `route` mirrors the Sidebar's link targets exactly.
const REPORT_CATEGORIES = [
    {
        key: 'stock',
        title: 'Stock Report',
        icon: <PackageOpen size={16} />,
        accentClass: 'text-amber-500',
        items: [
            { label: 'All Stock',         filter: 'all',         icon: <Grid size={14} /> },
            { label: 'Negative Stock',    filter: 'negative',    icon: <TrendingDown size={14} /> },
            { label: 'Nil Stock',         filter: 'nil',         icon: <MinusCircle size={14} /> },
            { label: 'Below Min Stock',   filter: 'min',         icon: <AlertTriangle size={14} /> },
            { label: 'Maximum Stock',     filter: 'max',         icon: <ArrowDownRight size={14} /> },
            { label: 'Moving Item',       filter: 'moving',      icon: <Activity size={14} /> },
            { label: 'Non Moving Item',   filter: 'non-moving',  icon: <PackageOpen size={14} /> },
            { label: 'Transaction Item',  filter: 'transaction', icon: <FileText size={14} /> },
        ]
    },
    {
        key: 'sales',
        title: 'Sales Summary',
        icon: <BarChart3 size={16} />,
        accentClass: 'text-emerald-500',
        items: [
            { label: 'Day Wise',         filter: 'day',         icon: <Calendar size={14} /> },
            { label: 'Month Wise',       filter: 'month',       icon: <PieChart size={14} /> },
            { label: 'Item Wise',        filter: 'item',        icon: <Box size={14} /> },
            { label: 'Group Wise',       filter: 'group',       icon: <Layers size={14} /> },
            { label: 'Transaction Wise', filter: 'transaction', icon: <FileText size={14} /> },
            { label: 'Profit Audit',     filter: 'profit',      icon: <TrendingUp size={14} /> },
            { label: 'Brand Wise',       filter: 'brand',       icon: <Tag size={14} /> },
            { label: 'Captain Wise',     filter: 'captain',     icon: <UserCircle size={14} /> },
            { label: 'Agent Wise',       filter: 'agent',       icon: <Users size={14} /> },
        ]
    },
    {
        key: 'purchase',
        title: 'Purchase Summary',
        icon: <ShoppingCart size={16} />,
        accentClass: 'text-indigo-500',
        items: [
            { label: 'Day Wise',      filter: 'day',      icon: <Calendar size={14} /> },
            { label: 'Month Wise',    filter: 'month',    icon: <PieChart size={14} /> },
            { label: 'Item Wise',     filter: 'item',     icon: <Box size={14} /> },
            { label: 'Group Wise',    filter: 'group',    icon: <Layers size={14} /> },
            { label: 'Brand Wise',    filter: 'brand',    icon: <Tag size={14} /> },
            { label: 'Supplier Wise', filter: 'supplier', icon: <Users size={14} /> },
        ]
    },
    {
        key: 'outstanding',
        title: 'Outstanding',
        icon: <CreditCard size={16} />,
        accentClass: 'text-rose-500',
        items: [
            { label: 'Customer Wise', filter: 'customer',   icon: <UserCircle size={14} /> },
            { label: 'Supplier Wise', filter: 'supplier',   icon: <Users size={14} /> },
            { label: 'Receivable',    filter: 'receivable', icon: <TrendingUp size={14} /> },
            { label: 'Payable',       filter: 'payable',    icon: <TrendingDown size={14} /> },
        ]
    },
];

// Build the report route mapping to centralized hub
const reportRoute = (category, filter) => {
    return `/dashboard/self-service/reports?category=${category}&filter=${filter}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportNavigationDropdown() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('stock');
    const dropdownRef = useRef(null);

    // Map current URL to active category and filter
    const getActiveState = () => {
        // First try query parameters (used by Stock & some generics)
        const params = new URLSearchParams(location.search);
        let cat = params.get('category');
        let fil = params.get('filter');

        if (cat && fil) return { currentCategory: cat, currentFilter: fil };

        // Fallback to reading the pathname if query params don't exist
        const path = location.pathname;
        
        // Outstanding custom routes mapping
        if (path.includes('/outstanding/')) {
            return {
                currentCategory: 'outstanding',
                currentFilter: path.split('/').pop() // customers, suppliers, receivable, payable
            };
        }

        // Sales & Purchase custom routes mapping
        if (path.includes('/reports/sales/')) {
            return { currentCategory: 'sales', currentFilter: path.split('/').pop() };
        }
        if (path.includes('/reports/purchase/')) {
            return { currentCategory: 'purchase', currentFilter: path.split('/').pop() };
        }

        // Default to stock all if nothing matches
        return { currentCategory: 'stock', currentFilter: 'all' };
    };

    const { currentCategory, currentFilter } = getActiveState();

    // Sync tab to current URL category whenever the URL changes
    useEffect(() => {
        setActiveTab(currentCategory);
    }, [currentCategory]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const activeCat = REPORT_CATEGORIES.find(c => c.key === currentCategory);
    const activeItem = activeCat?.items.find(i => i.filter === currentFilter);
    const buttonLabel = activeItem
        ? `${activeCat.title} — ${activeItem.label}`
        : activeCat?.title ?? 'Select Report';

    const tabCat = REPORT_CATEGORIES.find(c => c.key === activeTab) ?? REPORT_CATEGORIES[0];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(o => !o)}
                className={`flex items-center gap-3 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-12 px-6 rounded-2xl text-[10.5px] font-black uppercase tracking-widest transition-all outline-none ${
                    isOpen
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl -translate-y-0.5'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md'
                }`}
            >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-1">
                    <Database size={12} />
                </div>
                <span>{buttonLabel}</span>
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ml-2 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`}
                />
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute top-14 left-0 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100 w-[620px] z-[100] overflow-hidden origin-top-left flex flex-col"
                    style={{ animation: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards' }}>

                    {/* Category tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/80 p-3 m-2 rounded-[1.5rem] shadow-inner gap-2">
                        {REPORT_CATEGORIES.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => setActiveTab(cat.key)}
                                className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === cat.key
                                        ? 'bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] border border-slate-200 text-slate-900 scale-105'
                                        : 'text-slate-400 hover:bg-slate-100/50 hover:text-slate-600 border border-transparent'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    activeTab === cat.key ? `bg-indigo-50 ${cat.accentClass}` : 'bg-transparent text-slate-400'
                                }`}>
                                    {cat.icon}
                                </div>
                                {cat.title.split(' ')[0]}
                            </button>
                        ))}
                    </div>

                    {/* Filter items — each is a Link exactly like the Sidebar */}
                    <div className="p-6 pt-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 pl-2 border-l-2 border-indigo-500">
                            {tabCat.title} Views
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {tabCat.items.map(item => {
                                const isActive = currentCategory === tabCat.key && currentFilter === item.filter;
                                return (
                                    <Link
                                        key={item.filter}
                                        to={reportRoute(tabCat.key, item.filter)}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 ${
                                            isActive
                                                ? 'bg-indigo-600 border border-indigo-700 text-white shadow-lg translate-x-1'
                                                : 'hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-md text-slate-700'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {item.icon}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-5px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);    }
                }
            `}</style>
        </div>
    );
}
