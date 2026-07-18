import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import BillPreviewModal from './BillPreviewModal';
import { ClipboardList, Calendar, Search, CreditCard, Clock, MapPin, Truck, CheckCircle2, Phone, Loader2, XCircle, Package, Trash2 } from 'lucide-react';
import './Dashboard.css';

const BillsAndSalesPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Layout State
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    // Party Orders State
    const [partyOrders, setPartyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); 
    const [searchQuery, setSearchQuery] = useState('');

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Bill Detail Modal State (for reports backward compatibility)
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [fetchingDetail, setFetchingDetail] = useState(false);
    const [printingBillId, setPrintingBillId] = useState(null);

    // Create Party Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [functionTypes, setFunctionTypes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState({});
    const [newPartyData, setNewPartyData] = useState({
        customer_name: '',
        customer_phone: '',
        alternate_phone: '',
        delivery_address: '',
        delivery_date: '',
        delivery_time: '',
        function_type: ''
    });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const fetchPartyOrders = useCallback(async () => {
        setLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const url = new URL(`${import.meta.env.VITE_API_URL}/bills`);
            url.searchParams.append('type', 'PARTY_ORDER');
            if (filterDate) {
                url.searchParams.append('delivery_date', filterDate);
            }
            
            const res = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPartyOrders(data.data);
            }
        } catch (e) {
            console.error("Failed to fetch party orders", e);
        } finally {
            setLoading(false);
        }
    }, [filterDate]);

    const handleDeletePartyOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to delete this party order?")) return;
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPartyOrders(prev => prev.filter(o => o._id !== orderId));
            } else {
                alert(data.error || "Failed to delete order. You might not have permission.");
            }
        } catch (e) {
            console.error("Failed to delete party order", e);
            alert("Error deleting order");
        }
    };

    const handleCreateParty = async (e) => {
        e.preventDefault();
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token, restaurant_id } = JSON.parse(savedUser);
            
            const tempBillNumber = `TEMP-${Date.now()}`;
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    company_id: restaurant_id,
                    type: 'PARTY_ORDER',
                    order_mode: 'PARTY_ORDER',
                    party_status: 'PREPARING',
                    customer_name: newPartyData.customer_name,
                    customer_phone: newPartyData.customer_phone,
                    alternate_phone: newPartyData.alternate_phone,
                    delivery_address: newPartyData.delivery_address,
                    delivery_date: newPartyData.delivery_date,
                    delivery_time: newPartyData.delivery_time,
                    function_type: newPartyData.function_type,
                    items: [],
                    bill_number: tempBillNumber,
                    status: 'DRAFT'
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowCreateModal(false);
                setNewPartyData({ customer_name: '', customer_phone: '', alternate_phone: '', delivery_address: '', delivery_date: '', delivery_time: '', function_type: '' });
                navigate('/dashboard/self-service/billing', {
                    state: {
                        fromTable: false,
                        orderMode: 'PARTY_ORDER',
                        billId: data.data._id,
                        partyDetails: newPartyData
                    }
                });
            } else {
                alert("Failed to create party order: " + data.error);
            }
        } catch (e) {
            console.error("Failed to create party order", e);
            alert("Error creating party order");
        }
    };

    useEffect(() => {
        fetchPartyOrders();
        
        // Fetch Function Types
        const fetchFunctionTypes = async () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;
                const { token } = JSON.parse(savedUser);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/function-types`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setFunctionTypes(data.data.filter(f => f.is_active !== false));
                }
            } catch (e) { console.error("Failed to fetch function types", e); }
        };
        fetchFunctionTypes();
    }, [fetchPartyOrders]);

    // Handle incoming state from reports
    const fetchBillDetail = async (id) => {
        setFetchingDetail(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSelectedBill(data.data);
                setShowDetail(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingDetail(false);
        }
    };

    useEffect(() => {
        if (location.state?.billId) {
            fetchBillDetail(location.state.billId);
        }
    }, [location.state]);

    const filteredOrders = useMemo(() => {
        return partyOrders.filter(order => {
            // Filter out empty shell bills that have no name and no items
            if (!order.customer_name && (!order.items || order.items.length === 0)) {
                return false;
            }

            if (filterStatus !== 'ALL' && order.party_status !== filterStatus) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    order.bill_number?.toLowerCase().includes(query) ||
                    order.customer_name?.toLowerCase().includes(query) ||
                    order.customer_phone?.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [partyOrders, filterStatus, searchQuery]);

    const consolidatedItems = useMemo(() => {
        const itemMap = new Map();
        filteredOrders.forEach(order => {
            order.items?.forEach(item => {
                if (itemMap.has(item.name)) {
                    itemMap.set(item.name, itemMap.get(item.name) + item.quantity);
                } else {
                    itemMap.set(item.name, item.quantity);
                }
            });
        });
        return Array.from(itemMap, ([name, quantity]) => ({ name, quantity })).sort((a,b) => b.quantity - a.quantity);
    }, [filteredOrders]);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${orderId}/party-status`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ party_status: newStatus })
            });
            
            if (res.ok) {
                fetchPartyOrders();
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handlePaymentSubmit = async () => {
        if (!selectedOrderForPayment || !paymentAmount) return;
        setPaymentProcessing(true);
        
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            const pAmount = parseFloat(paymentAmount);
            const currentModes = selectedOrderForPayment.payment_modes || [];
            const newModes = [...currentModes, { type: paymentMode, amount: pAmount }];
            const newTotalPaid = (selectedOrderForPayment.total_paid || 0) + pAmount;
            
            const isPartial = newTotalPaid < (selectedOrderForPayment.grand_total - 0.1);
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${selectedOrderForPayment._id}/pay`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payment_modes: newModes,
                    is_partial: isPartial
                })
            });
            
            if (res.ok) {
                setShowPaymentModal(false);
                setPaymentAmount('');
                fetchPartyOrders();
            }
        } catch (err) {
            console.error("Failed to process payment", err);
        } finally {
            setPaymentProcessing(false);
        }
    };

    const openPaymentModal = (order) => {
        setSelectedOrderForPayment(order);
        const balance = (order.grand_total || 0) - (order.total_paid || 0);
        setPaymentAmount(balance > 0 ? balance.toString() : '');
        setShowPaymentModal(true);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'PREPARING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'READY_TO_DISPATCH': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="dashboard-layout bg-slate-50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            
            <main className="dashboard-main flex flex-col h-screen overflow-hidden relative">
                <Header toggleSidebar={toggleSidebar} title="Party Management" />
                
                <div className="flex flex-col h-full bg-slate-50 relative flex-1 overflow-hidden">
                    {/* Header/Filters */}
                    <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <ClipboardList size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 tracking-tighter">Party Orders Dashboard</h2>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Manage bulk orders & catering</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 ml-auto">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-action-add"
                            >
                                <ClipboardList size={14} />
                                Create Party
                            </button>

                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search orders..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold w-56 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                                {['ALL', 'PREPARING', 'READY_TO_DISPATCH', 'DELIVERED'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-orange-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {status.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                                <Calendar size={14} className="text-orange-600" />
                                <input 
                                    type="date" 
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="text-xs font-black text-slate-700 bg-transparent outline-none border-none cursor-pointer"
                                />
                                {filterDate && (
                                    <button 
                                        onClick={() => setFilterDate('')}
                                        className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
                                        title="Clear Date Filter"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Panel: Consolidated Summary */}
                        <div className="w-80 bg-white border-r border-slate-100 overflow-y-auto flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                    <Truck size={16} className="text-orange-600" />
                                    Production Summary
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Consolidated Quantities</p>
                            </div>
                            <div className="p-4 flex-1">
                                {consolidatedItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <ClipboardList size={48} className="text-slate-200 mb-3" />
                                        <p className="text-xs font-bold">No items found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {consolidatedItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-900">{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Order Cards */}
                        <div className="flex-1 p-8 overflow-y-auto bg-[#f8fafc]">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 size={48} className="animate-spin text-orange-600 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Loading Orders...</p>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <ClipboardList size={64} className="text-slate-200 mb-4" />
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No Party Orders Found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredOrders.map(order => {
                                        const total = order.grand_total || 0;
                                        const advance = order.total_paid || 0;
                                        const balance = total - advance;
                                        const isFullyPaid = total > 0 && balance <= 0.1;

                                        let displayDate = order.delivery_date || '';
                                        let daysLeft = null;
                                        if (displayDate) {
                                            const d = new Date(displayDate);
                                            displayDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                            
                                            const delivery = new Date(order.delivery_date);
                                            delivery.setHours(0,0,0,0);
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const diffTime = delivery - today;
                                            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        }

                                        return (
                                            <div key={order._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.1)] transition-all">
                                                {/* Card Header */}
                                                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shrink-0 ${getStatusColor(order.party_status || 'PREPARING')}`}>
                                                                {order.party_status?.replace(/_/g, ' ') || 'PREPARING'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{order.bill_number}</span>
                                                        </div>
                                                        <h3 className="text-lg font-black text-slate-900 tracking-tighter truncate w-full">{order.customer_name || 'Unnamed Party'}</h3>
                                                        {order.function_type && (
                                                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1 block truncate">
                                                                {order.function_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="flex items-center gap-2 justify-end mb-1">
                                                            <div className="flex items-center gap-1 text-slate-600 shrink-0">
                                                                <Clock size={12} />
                                                                <span className="text-xs font-bold">{order.delivery_time || '--:--'}</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeletePartyOrder(order._id); }}
                                                                className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-md transition-colors shrink-0"
                                                                title="Delete Order"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{displayDate}</span>
                                                        {daysLeft !== null && (
                                                            <span className={`text-[10px] font-black uppercase tracking-widest block mt-0.5 ${daysLeft <= 1 ? 'text-rose-600' : 'text-amber-500'}`}>
                                                                {daysLeft < 0 ? `${Math.abs(daysLeft)} days ago` : daysLeft === 0 ? 'Today' : `${daysLeft} days left`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Customer Details */}
                                                <div className="px-6 py-4 border-b border-slate-50 space-y-2">
                                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                                        <Phone size={14} className="text-slate-400" />
                                                        <span className="font-bold">{order.customer_phone} {order.alternate_phone ? ` / ${order.alternate_phone}` : ''}</span>
                                                    </div>
                                                    {order.delivery_address && (
                                                        <div className="flex items-start gap-3 text-sm text-slate-600">
                                                            <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                            <span className="font-medium text-xs leading-tight line-clamp-2">{order.delivery_address}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Items Preview */}
                                                <div className="px-6 py-4 flex-1">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Items</h4>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                                        {order.items?.map((item, i) => (
                                                            <div key={i} className="flex items-center justify-between text-sm">
                                                                <span className="font-medium text-slate-700 truncate pr-4">{item.name}</span>
                                                                <span className="font-black text-slate-900 bg-slate-100 px-2 rounded">x{item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Financials & Actions */}
                                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                                    <div className="grid grid-cols-2 gap-4 mb-5">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bill</p>
                                                            <p className="text-lg font-black text-slate-900">₹{total.toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance</p>
                                                            <p className="text-lg font-black text-emerald-600">₹{advance.toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                                            <p className={`text-xl font-black ${isFullyPaid ? 'text-slate-400' : 'text-rose-600'}`}>
                                                                ₹{Math.max(0, balance).toLocaleString('en-IN')}
                                                            </p>
                                                        </div>
                                                        {(!isFullyPaid && total > 0) && (
                                                            <button 
                                                                onClick={() => {
                                                                    navigate('/dashboard/self-service/billing', {
                                                                        state: {
                                                                            fromTable: false,
                                                                            orderMode: 'PARTY_ORDER',
                                                                            billId: order._id,
                                                                            partyDetails: {
                                                                                customer_name: order.customer_name,
                                                                                customer_phone: order.customer_phone,
                                                                                alternate_phone: order.alternate_phone,
                                                                                delivery_address: order.delivery_address,
                                                                                delivery_date: order.delivery_date,
                                                                                delivery_time: order.delivery_time,
                                                                                function_type: order.function_type
                                                                            }
                                                                        }
                                                                    });
                                                                }}
                                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
                                                            >
                                                                Pay Balance
                                                            </button>
                                                        )}
                                                        {isFullyPaid && (
                                                            <div className="px-4 py-2 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                                                <CheckCircle2 size={14} /> Paid
                                                            </div>
                                                        )}
                                                        {total === 0 && (
                                                            <div className="px-4 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1">
                                                                EMPTY
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status Actions */}
                                                    <div className="mt-4 flex gap-2">
                                                        <select
                                                            className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-orange-500"
                                                            value={selectedStatuses[order._id] || order.party_status || 'PREPARING'}
                                                            onChange={(e) => setSelectedStatuses(prev => ({...prev, [order._id]: e.target.value}))}
                                                        >
                                                            <option value="PREPARING">PREPARING</option>
                                                            <option value="READY_TO_DISPATCH">READY TO DISPATCH</option>
                                                            <option value="DELIVERED">DELIVERED</option>
                                                        </select>
                                                        <button 
                                                            onClick={() => {
                                                                const newStatus = selectedStatuses[order._id];
                                                                if (newStatus && newStatus !== (order.party_status || 'PREPARING')) {
                                                                    updateOrderStatus(order._id, newStatus);
                                                                }
                                                            }}
                                                            disabled={!selectedStatuses[order._id] || selectedStatuses[order._id] === (order.party_status || 'PREPARING')}
                                                            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            SAVE
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && selectedOrderForPayment && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 border border-white/20 animate-in zoom-in duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Collect Payment</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Bill {selectedOrderForPayment.bill_number}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <CreditCard size={24} />
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-600">Total Bill Amount</span>
                                    <span className="font-black text-slate-900">₹{selectedOrderForPayment.grand_total?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                                    <span className="text-sm font-bold text-slate-600">Advance Paid</span>
                                    <span className="font-black text-emerald-600">₹{(selectedOrderForPayment.total_paid || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-slate-900">Balance Due</span>
                                    <span className="text-2xl font-black text-rose-600">₹{Math.max(0, (selectedOrderForPayment.grand_total || 0) - (selectedOrderForPayment.total_paid || 0)).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Payment Amount</label>
                                    <input 
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 text-xl font-black text-slate-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['CASH', 'UPI', 'CARD'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentMode(mode)}
                                                className={`py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${paymentMode === mode ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' : 'bg-slate-50 text-slate-500 border-2 border-slate-100 hover:bg-slate-100'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handlePaymentSubmit}
                                    disabled={paymentProcessing || !paymentAmount || parseFloat(paymentAmount) <= 0}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {paymentProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Pay'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Bill Detail Drawer (For backward compatibility with report links) */}
                {showDetail && selectedBill && (
                    <>
                        <div className="pi-drawer-overlay" onClick={() => setShowDetail(false)}></div>
                        <div className="pi-drawer animate-in slide-in-from-right duration-300">
                            <div className="pi-drawer-header">
                                <div>
                                    <p className="pi-drawer-subtitle">Retail Sale Invoice</p>
                                    <h3 className="pi-drawer-title">{selectedBill.bill_number}</h3>
                                </div>
                                <button onClick={() => setShowDetail(false)} className="pi-drawer-close">
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div className="pi-drawer-body">
                                <div className="pi-detail-grid">
                                    <div className="pi-detail-card">
                                        <label>Date & Time</label>
                                        <p>{new Date(selectedBill.createdAt).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="pi-detail-card">
                                        <label>Customer</label>
                                        <p>{selectedBill.customer_name || 'Walk-in Customer'}</p>
                                    </div>
                                    <div className="pi-detail-card">
                                        <label>Table / Mode</label>
                                        <p>{selectedBill.table_no ? `Table ${selectedBill.table_no}` : selectedBill.type}</p>
                                    </div>
                                </div>

                                <div className="pi-items-section">
                                    <div className="pi-section-title">
                                        <Package size={16} /> Ordered Items
                                    </div>
                                    <div className="pi-items-table-wrap">
                                        <table className="pi-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Qty</th>
                                                    <th>Rate</th>
                                                    <th style={{ textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(selectedBill.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.name}</td>
                                                        <td className="font-bold">{item.quantity}</td>
                                                        <td>₹{item.unit_price?.toLocaleString('en-IN')}</td>
                                                        <td style={{ textAlign: 'right' }} className="font-bold">₹{item.total_price?.toLocaleString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="pi-summary-calc">
                                    <div className="pi-calc-row">
                                        <span>Subtotal</span>
                                        <span>₹{selectedBill.sub_total?.toLocaleString('en-IN')}</span>
                                    </div>
                                    {selectedBill.tax_amount > 0 && (
                                        <div className="pi-calc-row text-amber-600">
                                            <span>Tax Amount</span>
                                            <span>₹{selectedBill.tax_amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {selectedBill.discount_amount > 0 && (
                                        <div className="pi-calc-row text-rose-500">
                                            <span>Discount</span>
                                            <span>-₹{selectedBill.discount_amount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="pi-calc-total">
                                        <span>Grand Total</span>
                                        <span>₹{selectedBill.grand_total?.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="pi-calc-row text-emerald-600 pt-2 border-t border-slate-100 mt-2">
                                        <span className="font-black uppercase text-[10px]">Settlement</span>
                                        <div className="flex flex-col items-end">
                                            {selectedBill.payment_modes?.map((pm, i) => (
                                                <span key={i} className="font-black text-xs">{pm.type}: ₹{pm.amount}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-4">
                                    <button
                                        onClick={() => setPrintingBillId(selectedBill._id)}
                                        className="btn-export print"
                                    >
                                        <CheckCircle2 size={20} /> PRINT INVOICE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {printingBillId && (
                    <BillPreviewModal
                        isOpen={!!printingBillId}
                        billId={printingBillId}
                        onClose={() => setPrintingBillId(null)}
                        paymentModes={selectedBill?.payment_modes}
                    />
                )}

                {fetchingDetail && (
                    <div className="pi-modal-overlay">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-white" size={48} />
                            <p className="text-white font-black tracking-widest uppercase text-xs">Accessing Sales Vault...</p>
                        </div>
                    </div>
                )}
            </main>
            {/* Create Party Modal */}
            {showCreateModal && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowCreateModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-6 border border-white/20 relative animate-in zoom-in duration-300">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-6 pr-8">Create New Party</h3>
                        
                        <form onSubmit={handleCreateParty} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        min={new Date().toISOString().split('T')[0]}
                                        value={newPartyData.delivery_date} 
                                        onChange={e => setNewPartyData({...newPartyData, delivery_date: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time *</label>
                                    <input type="time" required value={newPartyData.delivery_time} onChange={e => setNewPartyData({...newPartyData, delivery_time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Function Type *</label>
                                <select 
                                    required
                                    value={newPartyData.function_type} 
                                    onChange={e => setNewPartyData({...newPartyData, function_type: e.target.value})} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500 appearance-none"
                                >
                                    <option value="">Select Function Type...</option>
                                    {functionTypes.map(ft => (
                                        <option key={ft._id} value={ft.name}>{ft.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Name *</label>
                                <input type="text" required value={newPartyData.customer_name} onChange={e => setNewPartyData({...newPartyData, customer_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500" placeholder="e.g. John Doe" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Phone *</label>
                                    <input type="text" required value={newPartyData.customer_phone} onChange={e => setNewPartyData({...newPartyData, customer_phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500" placeholder="e.g. 9876543210" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alternate Phone</label>
                                    <input type="text" value={newPartyData.alternate_phone} onChange={e => setNewPartyData({...newPartyData, alternate_phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500" placeholder="Optional" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Address *</label>
                                <textarea required value={newPartyData.delivery_address} onChange={e => setNewPartyData({...newPartyData, delivery_address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-500 resize-none h-20" placeholder="Enter delivery address"></textarea>
                            </div>

                            <button type="submit" className="btn-action-save">
                                Save Party Details
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillsAndSalesPage;
