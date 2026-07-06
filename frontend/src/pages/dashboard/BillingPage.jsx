import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarPaymentFlow from './SidebarPaymentFlow';
import PayModePopup from './PayModePopup';
import './BillingPage.css';
import BillPreviewModal from './BillPreviewModal';
import { CardSkeleton } from '../../components/Skeleton';
import {
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    ChevronDown,
    Search,
    RotateCcw,
    ArrowLeft,
    User,
    Table,
    Users,
    Save,
    Printer,
    Menu as MenuIcon,
    LayoutGrid,
    Columns,
    LogOut,
    Bell,
    Settings,
    Pause,
    History,
    Timer,
    Gift,
    MoreHorizontal,
    ArrowRight,
    Ticket,
    CheckSquare,
    UserCheck,
    Package,
    Truck,
    Users2,
    Smartphone,
    Wallet,
    MoveHorizontal,
    ArrowLeftRight,
    Undo2,
    Edit,
    Layers,
    X,
    CalendarClock,
    Eye,
    EyeOff,
    Check,
    CheckCircle2,
    CheckCircle,
    ClipboardList,
    Calendar,
    Clock,
    PartyPopper,
    Phone,
    MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Custom Table Logo (Furniture style)
const TableLogo = memo(({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" opacity="0" />
        <path d="M3 7h18" />
        <path d="M6 7v10" />
        <path d="M18 7v10" />
        <path d="M6 11h12" />
    </svg>
));

const getConsolidatedItems = (items) => {
    if (!items) return [];
    const map = new Map();
    items.forEach(item => {
        const key = `${item.product_id}_${item.variation?.name || ''}_${(item.addons || []).map(a => a._id).sort().join(',')}_${item.notes || ''}_${item.unit_price}_${item.is_complementary}`;
        if (map.has(key)) {
            const existing = map.get(key);
            existing.quantity += item.quantity;
            existing.total_price += item.total_price;
        } else {
            map.set(key, { ...item });
        }
    });
    return Array.from(map.values());
};

const BillingPage = () => {
    const navigate = useNavigate();
    const { logout, user, hasModuleAccess } = useAuth();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [billItems, setBillItems] = useState([]);
    const [previousItems, setPreviousItems] = useState([]); // Items from previous KOTs/sessions
    const [loading, setLoading] = useState(true);
    const [currentBillId, setCurrentBillId] = useState(null);
    const [billNumber, setBillNumber] = useState('Wait...');
    const [counters, setCounters] = useState([]);
    const [selectedCounter, setSelectedCounter] = useState('');
    const [orderMode, setOrderMode] = useState('DINE_IN');
    const [tableNo, setTableNo] = useState("");
    const [persons, setPersons] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showBillPreview, setShowBillPreview] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [lastPaymentModes, setLastPaymentModes] = useState([]);
    const [lastBillId, setLastBillId] = useState(null);
    const [restaurantName, setRestaurantName] = useState("RestoBoard");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showSidebar, setShowSidebar] = useState(true);
    const [checkoutActive, setCheckoutActive] = useState(false);
    const [checkoutType, setCheckoutType] = useState('');
    const [stepProceeded, setStepProceeded] = useState(false);
    const [extraCharges, setExtraCharges] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [gstPercentage, setGstPercentage] = useState(5);
    const [taxType, setTaxType] = useState('EXCLUSIVE');
    const [promoCode, setPromoCode] = useState('');
    const [showConsolidatedView, setShowConsolidatedView] = useState(false);

    // -- NEW POS ENHANCEMENT STATES --
    const [showTimer, setShowTimer] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(() => localStorage.getItem('pos_loyalty_enabled') === 'true');
    const [couponEnabled, setCouponEnabled] = useState(() => localStorage.getItem('pos_coupon_enabled') === 'true');
    const [loyaltyUnlocked, setLoyaltyUnlocked] = useState(false);
    const [couponUnlocked, setCouponUnlocked] = useState(false);
    const [showRateColumn, setShowRateColumn] = useState(() => localStorage.getItem('pos_show_rate') !== 'false');
    const [showProductPrice, setShowProductPrice] = useState(() => localStorage.getItem('pos_show_prod_price') !== 'false');
    const [showBillNumber, setShowBillNumber] = useState(true);

    const [billSearchQuery, setBillSearchQuery] = useState("");
    const [dailySearchQuery, setDailySearchQuery] = useState("");
    const [kotSearchQuery, setKotSearchQuery] = useState("");

    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [containerCharge, setContainerCharge] = useState(0);
    const [discountType, setDiscountType] = useState('FIXED'); // 'PERCENT' or 'FIXED'

    const [isHoldPanelOpen, setIsHoldPanelOpen] = useState(false);
    const [heldBills, setHeldBills] = useState(() => JSON.parse(localStorage.getItem('pos_held_bills') || '[]'));

    // Pay Mode popup is now controlled by global moduleSettings via hasModuleAccess('pay_mode')
    const [showPayModePopup, setShowPayModePopup] = useState(false);
    const [pendingSaveAction, setPendingSaveAction] = useState(null); // 'SAVE' or 'PRINT'

    const [tables, setTables] = useState([]);
    const [tableTypes, setTableTypes] = useState([]);
    const [activeTableType, setActiveTableType] = useState("ALL");
    const [selectedTableId, setSelectedTableId] = useState("");
    const [isTablePreSelected, setIsTablePreSelected] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerGst, setCustomerGst] = useState("");
    const [captainName, setCaptainName] = useState("");
    const [waiterName, setWaiterName] = useState("");
    const [captains, setCaptains] = useState([]);
    const [waiters, setWaiters] = useState([]);
    const [showPersonsForm, setShowPersonsForm] = useState(false);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showCaptainForm, setShowCaptainForm] = useState(false);
    const [showWaiterForm, setShowWaiterForm] = useState(false);
    const [showTableForm, setShowTableForm] = useState(false);
    const [showAlterForm, setShowAlterForm] = useState(false);
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [showSplitForm, setShowSplitForm] = useState(false);
    const [showLoyaltyForm, setShowLoyaltyForm] = useState(false);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [showMoreForm, setShowMoreForm] = useState(false);
    const [couponNumber, setCouponNumber] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [couponSearchName, setCouponSearchName] = useState('');
    const [customerPoints, setCustomerPoints] = useState(0);
    const [redeemPointsInput, setRedeemPointsInput] = useState('');
    const [loyaltyRedeemedPoints, setLoyaltyRedeemedPoints] = useState(0);
    const [loyaltySettings, setLoyaltySettings] = useState({ enabled: false, target_points: 0, point_value: 1 });
    const [billSeriesSettings, setBillSeriesSettings] = useState(null);
    const [partyData, setPartyData] = useState(null);

    const getSeriesKey = (mode) => {
        if (mode === 'DINE_IN') return 'dine_in';
        if (mode === 'DELIVERY') return 'delivery';
        if (mode === 'PARCEL') return 'parcel';
        if (mode === 'PARTY' || mode === 'PARTY_ORDER') return 'party';
        return 'takeaway';
    };
    const activeSeries = billSeriesSettings ? billSeriesSettings[getSeriesKey(orderMode)] : null;
    const isManualNumbering = activeSeries?.numbering_method === 'Manual';

    // Prevent auto-create from firing while we are fetching an existing bill for a table
    const isRestoringTableBill = useRef(false);

    const toggleExpandableForm = (formName) => {
        // Validation: For ALTER, TRANSFER, RETURN, we need an active bill loaded via search
        const needsBill = ['ALTER', 'TRANSFER', 'RETURN'].includes(formName);
        if (needsBill && !currentBillId) {
            return alert("Search and load a bill in the header first before using this feature.");
        }

        setShowPersonsForm(formName === 'PERSONS' ? !showPersonsForm : false);
        setShowCustomerForm(formName === 'CUSTOMER' ? !showCustomerForm : false);
        setShowTableForm(formName === 'TABLE' ? !showTableForm : false);
        // If whole bill transfer (no item selected), use same table form UI
        setShowTransferForm(formName === 'TRANSFER' ? !showTransferForm : false);
        setShowAlterForm(formName === 'ALTER' ? !showAlterForm : false);
        setShowReturnForm(formName === 'RETURN' ? !showReturnForm : false);
        setShowSplitForm(formName === 'SPLIT' ? !showSplitForm : false);
        setShowLoyaltyForm(formName === 'LOYALTY' ? !showLoyaltyForm : false);
        setShowCaptainForm(formName === 'CAPTAIN' ? !showCaptainForm : false);
        setShowWaiterForm(formName === 'WAITER' ? !showWaiterForm : false);
        setShowMoreForm(formName === 'MORE' ? !showMoreForm : false);
        setShowCouponForm(formName === 'COUPON' ? !showCouponForm : false);
        setStepProceeded(formName === 'PAYMODE' ? !stepProceeded : false);
        setCheckoutActive(formName === 'PAYMODE' ? !checkoutActive : false);

        setSelectionOverlay('NONE');
        // No longer fetching KOTs here as we use the header search
    };
    const [isOrderListCollapsed, setIsOrderListCollapsed] = useState(false);
    const [variationModalProduct, setVariationModalProduct] = useState(null);
    const [addonModalProduct, setAddonModalProduct] = useState(null);
    const [noteModalIdx, setNoteModalIdx] = useState(null);
    const [tempNote, setTempNote] = useState('');
    const [tempSelectedAddons, setTempSelectedAddons] = useState([]);
    const [tempVariation, setTempVariation] = useState(null);

    // Party Order States
    const [showPartyBookingModal, setShowPartyBookingModal] = useState(false);
    const [bookedDates, setBookedDates] = useState([]);
    const [currentCalDate, setCurrentCalDate] = useState(new Date());
    const [showPartyCustomerForm, setShowPartyCustomerForm] = useState(false);
    const [tempPartyBooking, setTempPartyBooking] = useState({ date: new Date().toISOString().split('T')[0], time: '12:00' });
    const [showPartyManagement, setShowPartyManagement] = useState(false);
    const [showPartySelectionModal, setShowPartySelectionModal] = useState(false);
    const [partySelectionOrders, setPartySelectionOrders] = useState([]);
    const [partyMgtDate, setPartyMgtDate] = useState(new Date().toISOString().split('T')[0]);
    const [partyOrders, setPartyOrders] = useState([]);
    const [functionTypes, setFunctionTypes] = useState([]);

    useEffect(() => {
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
                    setFunctionTypes(data.data.filter(f => f.is_active));
                }
            } catch (e) {
                console.error("Failed to fetch function types", e);
            }
        };
        fetchFunctionTypes();
    }, []);

    // -- SELECTION OVERLAYS --
    const [activeItemActions, setActiveItemActions] = useState(null);
    const [selectionOverlay, setSelectionOverlay] = useState('NONE'); // NONE, TABLE, CAPTAIN, ALTER, TRANSFER, RETURN, SPLIT
    const [selectedItemForAction, setSelectedItemForAction] = useState(null);
    const [billSearchKots, setBillSearchKots] = useState([]);
    const [billSearchResults, setBillSearchResults] = useState([]);
    const [showBillDropdown, setShowBillDropdown] = useState(false);
    const [billSearchLoading, setBillSearchLoading] = useState(false);
    const [kotSearchResults, setKotSearchResults] = useState([]);
    const [showKotDropdown, setShowKotDropdown] = useState(false);
    const [loadedBillMode, setLoadedBillMode] = useState('NONE'); // NONE, ALTER, RETURN, TRANSFER
    const [pendingAutoAction, setPendingAutoAction] = useState(null);

    const [transferMode, setTransferMode] = useState('TABLE'); // TABLE or BILL
    const [transferBillQuery, setTransferBillQuery] = useState('');
    const [transferBillResults, setTransferBillResults] = useState([]);
    const [transferBillLoading, setTransferBillLoading] = useState(false);
    const [transferTargetBill, setTransferTargetBill] = useState(null);

    const [returnQtys, setReturnQtys] = useState({});
    const [returnReasons, setReturnReasons] = useState({});
    const [transferItemSel, setTransferItemSel] = useState({});

    // -- LATEST CALCULATION HOOK --
    // -- LATEST CALCULATION HOOK --
    const billCalculations = useMemo(() => {
        const allItems = [...previousItems, ...billItems];
        const sub = allItems.reduce((acc, item) => acc + (item.is_complementary ? 0 : item.total_price), 0);
        let discAmt = 0;
        if (discountType === 'PERCENT') {
            discAmt = sub * (parseFloat(discount) / 100);
        } else {
            discAmt = parseFloat(discount);
        }

        // Coupon Discount
        let couponDisc = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === 'DISCOUNT') {
                if (appliedCoupon.discount_type === 'PERCENT') {
                    couponDisc = (sub - discAmt) * (parseFloat(appliedCoupon.discount_value) / 100);
                } else {
                    couponDisc = parseFloat(appliedCoupon.discount_value);
                }
            } else if (appliedCoupon.type === 'BOGO') {
                // BOGO: Every 2nd unit of an item is free
                allItems.forEach(item => {
                    if (!item.is_complementary && item.quantity >= 2) {
                        const freeQty = Math.floor(item.quantity / 2);
                        couponDisc += freeQty * item.unit_price;
                    }
                });
            }
        }

        // Loyalty Discount
        let loyaltyDisc = loyaltyRedeemedPoints * (loyaltySettings.point_value || 1);

        const taxable = Math.max(0, sub - discAmt - couponDisc - loyaltyDisc);
        const gstRate = parseFloat(gstPercentage) / 100;

        let gstAmt = 0;
        let finalTaxable = taxable;
        let rawTotal = 0;

        const delivery = parseFloat(deliveryCharge) || 0;
        const container = parseFloat(containerCharge) || 0;

        if (taxType === 'INCLUSIVE') {
            finalTaxable = taxable / (1 + gstRate);
            gstAmt = taxable - finalTaxable;
            rawTotal = taxable + delivery + container;
        } else {
            gstAmt = taxable * gstRate;
            rawTotal = taxable + gstAmt + delivery + container;
        }

        const roundedTotal = Math.round(rawTotal);
        const rOff = roundedTotal - rawTotal;

        return {
            subTotal: sub,
            discountAmount: discAmt,
            couponDiscount: couponDisc,
            loyaltyDiscount: loyaltyDisc,
            taxAmount: gstAmt,
            deliveryCharge: delivery,
            containerCharge: container,
            roundOff: rOff,
            grandTotal: roundedTotal
        };
    }, [previousItems, billItems, discount, gstPercentage, taxType, discountType, deliveryCharge, containerCharge, appliedCoupon, loyaltyRedeemedPoints, loyaltySettings]);

    const { subTotal, taxAmount, discountAmount, couponDiscount, loyaltyDiscount, roundOff, grandTotal } = billCalculations;

    // Fetch customer points when phone changes
    useEffect(() => {
        const fetchCustomerData = async () => {
            if (customerPhone && customerPhone.length >= 10) {
                try {
                    const savedUser = localStorage.getItem('user');
                    const { token } = JSON.parse(savedUser);
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/customers?phone=${customerPhone}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success && data.data.length > 0) {
                        setCustomerPoints(data.data[0].loyalty_points || 0);
                        if (!customerName) setCustomerName(data.data[0].name);
                    } else {
                        setCustomerPoints(0);
                    }
                } catch (err) { console.error("Error fetching customer points", err); }
            } else {
                setCustomerPoints(0);
            }
        };

        const debounce = setTimeout(fetchCustomerData, 500);
        return () => clearTimeout(debounce);
    }, [customerPhone]);

    const [billingLayout, setBillingLayout] = useState(() => localStorage.getItem('cachedBillingLayout') || 'SIDEBAR');

    // Get base API URL for images
    const getBaseUrl = () => {
        const fullUrl = import.meta.env.VITE_API_URL || '';
        // If the URL ends with /api, remove it to get the server root for images
        if (fullUrl.endsWith('/api')) {
            return fullUrl.slice(0, -4);
        }
        return fullUrl;
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Close sidebar by default on mobile
        if (window.innerWidth <= 768) {
            setShowSidebar(false);
        }

        return () => clearInterval(timer);
    }, []);

    const location = useLocation();

    // Load initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const savedUser = localStorage.getItem('user');
                if (!savedUser) return;
                const { token } = JSON.parse(savedUser);
                const headers = { 'Authorization': `Bearer ${token}` };

                const fetchWithAuth = async (endpoint) => {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, { headers });
                    if (!res.ok) throw new Error(`Fetch failed: ${endpoint}`);
                    return res.json();
                };

                // 1. Categories
                try {
                    const catData = await fetchWithAuth('/categories');
                    if (catData.success) setCategories(catData.data);
                } catch (e) { console.error("Categories fetch failed", e); }

                // 2. Products (Active Only)
                try {
                    const prodData = await fetchWithAuth('/products?is_active=true');
                    if (prodData.success) setProducts(prodData.data);
                } catch (e) {
                    console.error("Products fetch failed", e);
                    alert("Critical Error: Could not load products. Please check connection.");
                }

                // 3. Coupons
                try {
                    const coupData = await fetchWithAuth('/coupons/active');
                    if (coupData.success) setAvailableCoupons(coupData.data);
                } catch (e) { console.error("Coupons fetch failed", e); }

                // 4. Settings (Loyalty & Bill Series)
                try {
                    const settingsData = await fetchWithAuth('/settings');
                    if (settingsData.success && settingsData.data) {
                        if (settingsData.data.loyalty) {
                            setLoyaltySettings(settingsData.data.loyalty);
                            setLoyaltyEnabled(settingsData.data.loyalty.enabled);
                        }
                        if (settingsData.data.modules) {
                            setCouponUnlocked(settingsData.data.modules.coupon_enabled);
                            setLoyaltyUnlocked(settingsData.data.modules.loyalty_enabled);

                            // Load local active states
                            setCouponEnabled(settingsData.data.modules.billing_coupon_active);
                            setLoyaltyEnabled(settingsData.data.modules.billing_loyalty_active);

                            localStorage.setItem('pos_coupon_enabled', String(settingsData.data.modules.billing_coupon_active));
                            localStorage.setItem('pos_loyalty_enabled', String(settingsData.data.modules.billing_loyalty_active));
                        }
                        if (settingsData.data.billSeries) {
                            setBillSeriesSettings(settingsData.data.billSeries);
                        }
                    }
                } catch (e) { console.error("Settings fetch failed", e); }

                // 5. Counters
                try {
                    const countData = await fetchWithAuth('/counters');
                    if (countData.success) {
                        setCounters(countData.data);
                        if (countData.data.length > 0) setSelectedCounter(countData.data[0]._id);
                    }
                } catch (e) { console.error("Counters fetch failed", e); }

                // 6. Auth Profile
                try {
                    const profileData = await fetchWithAuth('/auth/profile');
                    if (profileData.success) {
                        setRestaurantName(profileData.data.restaurant.name);
                        const layout = profileData.data.restaurant.billing_layout || 'SIDEBAR';
                        setBillingLayout(layout);
                        localStorage.setItem('cachedBillingLayout', layout);
                    }
                } catch (e) { console.error("Profile fetch failed", e); }

                // 7. Tables & Types
                try {
                    const [tableData, typeData] = await Promise.all([
                        fetchWithAuth('/tables'),
                        fetchWithAuth('/table-types')
                    ]);
                    if (tableData.success) setTables(tableData.data);
                    if (typeData.success) setTableTypes(typeData.data);
                } catch (e) { console.error("Tables fetch failed", e); }

                // 8. Captains & Waiters
                try {
                    const [capData, waitData] = await Promise.all([
                        fetchWithAuth('/captains'),
                        fetchWithAuth('/waiters')
                    ]);
                    if (capData.success) setCaptains(capData.data);
                    if (waitData.success) setWaiters(waitData.data);
                } catch (e) { console.error("Staff fetch failed", e); }

            } catch (error) {
                console.error("Billing init error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [location.key]);

    // Handle Restoration of Held Bill
    useEffect(() => {
        if (location.state && location.state.restoreHold) {
            const hold = location.state.restoreHold;
            setBillItems(hold.items);
            setCurrentBillId(hold.billId);
            setBillNumber(hold.billNumber);
            setTableNo(hold.tableNo || "");
            setOrderMode(hold.orderMode || 'DINE_IN');
            setCustomerName(hold.customerName || "");
            setCustomerPhone(hold.customerPhone || "");
            setCustomerAddress(hold.customerAddress || "");

            // Remove from localStorage
            const held = JSON.parse(localStorage.getItem('pos_held_bills') || '[]');
            const updated = held.filter(h => h.id !== hold.id);
            localStorage.setItem('pos_held_bills', JSON.stringify(updated));
            setHeldBills(updated);

            // Use window.history.replaceState to clear location.state without triggering reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Handle navigation FROM TableSelectionPage
    useEffect(() => {
        if (location.state && location.state.fromTable) {
            const tableId = location.state.tableId || '';
            const billId = location.state.billId || null;
            const tableStatus = location.state.tableStatus || '';

            setTableNo(location.state.tableNo || '');
            setSelectedTableId(tableId);
            setPersons(location.state.persons || '');
            setCaptainName(location.state.captainName || '');
            setWaiterName(location.state.waiterName || '');
            setOrderMode('DINE_IN');
            setIsTablePreSelected(true);

            // Pre-fill customer details if it's a reservation
            if (location.state.reservationName) setCustomerName(location.state.reservationName);
            if (location.state.reservationPhone) setCustomerPhone(location.state.reservationPhone);

            const isPrintedOrOccupied = tableStatus === 'PRINTED' || tableStatus === 'OCCUPIED';

            if (isPrintedOrOccupied && billId) {
                // ── Load existing bill (bill counter opening a PRINTED table to pay) ──
                isRestoringTableBill.current = true;  // block auto-create during fetch
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const { token } = JSON.parse(savedUser);
                    fetch(`${import.meta.env.VITE_API_URL}/bills/${billId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(r => r.json())
                        .then(data => {
                            if (data.success && data.data) {
                                const bill = data.data;
                                // Restore full bill into POS
                                setCurrentBillId(bill._id);
                                setBillNumber(bill.bill_number);
                                setPreviousItems(bill.items || []);
                                setBillItems([]);
                                setSelectedTableId(tableId); // Set the table ID from navigation state
                                setTableNo(bill.table_no || location.state.tableNo || '');
                                setPersons(bill.persons || location.state.persons || '');
                                setOrderMode(bill.type || 'DINE_IN');
                                setCustomerName(bill.customer_name || '');
                                setCustomerPhone(bill.customer_phone || '');
                                setCustomerAddress(bill.customer_address || '');
                                setCustomerGst(bill.customer_gst || '');
                                setCaptainName(bill.captain_name || location.state.captainName || '');
                                setWaiterName(bill.waiter_name || location.state.waiterName || '');
                                setDiscount(bill.discount_amount || 0);
                                setDeliveryCharge(bill.delivery_charge || 0);
                                setContainerCharge(bill.container_charge || 0);

                                if (location.state && location.state.printKots) {
                                    setTimeout(() => handleAllKotsPrint(bill), 500);
                                }
                            } else {
                                console.warn('Could not load bill for table, starting fresh');
                            }
                            isRestoringTableBill.current = false;  // restore flag
                        })
                        .catch(e => {
                            console.error('Load table bill error', e);
                            isRestoringTableBill.current = false;
                        });
                }
            } else {
                // ── Fresh session: AVAILABLE or RESERVED table ──
                // Mark the table as OCCUPIED immediately (captain opened it)
                if (tableId) {
                    const savedUser = localStorage.getItem('user');
                    if (savedUser) {
                        const { token } = JSON.parse(savedUser);
                        fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/occupy`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ running_amount: 0 })
                        }).catch(e => console.error('Occupy table error', e));
                    }
                }
            }
            if (location.state.actionTrigger) {
                setPendingAutoAction(location.state.actionTrigger);
            }
            // Clear state so refresh doesn't re-apply
            window.history.replaceState({}, document.title);
        } else if (location.state && location.state.orderMode) {
            setOrderMode(location.state.orderMode);
            if (location.state.partyDetails) {
                setPartyData(location.state.partyDetails);
                setCustomerName(location.state.partyDetails.customer_name || '');
                setCustomerPhone(location.state.partyDetails.customer_phone || '');
                setCustomerAddress(location.state.partyDetails.delivery_address || location.state.partyDetails.customer_address || '');
            }
            setIsTablePreSelected(false);
            
            const billId = location.state.billId;
            if (billId) {
                isRestoringTableBill.current = true;
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const { token } = JSON.parse(savedUser);
                    fetch(`${import.meta.env.VITE_API_URL}/bills/${billId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(r => r.json())
                        .then(data => {
                            if (data.success && data.data) {
                                const bill = data.data;
                                setCurrentBillId(bill._id);
                                setBillNumber(bill.bill_number);
                                if (bill.type === 'PARTY_ORDER' || bill.type === 'PARTY') {
                                    setBillItems(bill.items || []);
                                    setPreviousItems([]);
                                } else {
                                    setPreviousItems(bill.items || []);
                                    setBillItems([]);
                                }

                                setOrderMode(bill.type || location.state.orderMode);
                                setCustomerName(bill.customer_name || location.state.partyDetails?.customer_name || '');
                                setCustomerPhone(bill.customer_phone || location.state.partyDetails?.customer_phone || '');
                                setCustomerAddress(bill.delivery_address || location.state.partyDetails?.delivery_address || '');
                                setDiscount(bill.discount_amount || 0);
                                setDeliveryCharge(bill.delivery_charge || 0);
                                setContainerCharge(bill.container_charge || 0);

                                if (bill.type === 'PARTY_ORDER' || bill.type === 'PARTY') {
                                    setPartyData(prev => ({ ...prev, advance_paid: bill.total_paid || 0, previous_payment_modes: bill.payment_modes || [] }));
                                }
                            }
                            isRestoringTableBill.current = false;
                        })
                        .catch(e => {
                            console.error('Load bill error', e);
                            isRestoringTableBill.current = false;
                        });
                }
            }

            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Handle Auto Actions from TableSelectionPage
    useEffect(() => {
        if (pendingAutoAction && !loading && !isRestoringTableBill.current && currentBillId) {
            const timer = setTimeout(() => {
                if (pendingAutoAction === 'FINALIZE') {
                    toggleExpandableForm('PAYMODE');
                }
                setPendingAutoAction(null);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [pendingAutoAction, loading, currentBillId]);

    // Helper: update live amount on table whenever items change
    const updateTableLiveAmount = async (tableId, amount) => {
        if (!tableId) return;
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/update-amount`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ running_amount: amount })
            });
        } catch (e) {
            console.error('Update table amount error', e);
        }
    };

    // Helper: free table after payment
    const freeTableAfterPayment = async (tableId) => {
        if (!tableId) return;
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/tables/${tableId}/free`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Free table error', e);
        }
    };

    // Fetch KOTs for Alter Bill
    const fetchKots = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills?status=PENDING`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setBillSearchKots(data.data);
        } catch (error) {
            console.error("KOT fetch error", error);
        }
    };

    // Create New Bill
    const createNewBill = async () => {
        if (!selectedCounter) return null;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    counter_id: selectedCounter,
                    type: orderMode
                })
            });
            const data = await res.json();
            if (data.success) {
                const newBillId = data.data._id;
                setCurrentBillId(newBillId);
                setBillNumber(data.data.bill_number);
                setBillItems([]);

                // Link this bill to the table (so bill counter can fetch it later)
                const tId = selectedTableId;
                if (tId) {
                    fetch(`${import.meta.env.VITE_API_URL}/tables/${tId}/occupy`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ bill_id: newBillId, running_amount: 0 })
                    }).catch(e => console.error('Link bill to table error', e));
                }

                return newBillId;
            } else {
                alert(data.message || "Could not create bill.");
            }
        } catch (error) {
            console.error("Create bill error", error);
        }
        return null;
    };

    const createManualNewBill = async () => {
        if (!window.confirm("Start a manual new bill? This will clear current items.")) return;
        setBillItems([]);
        setCurrentBillId(null);
        setBillNumber('Generating...');
        await createNewBill();
    };

    useEffect(() => {
        // Automatically create a new bill if we have a counter but no active bill.
        // Skip if we are in the middle of restoring a bill from a table click.
        const autoCreate = async () => {
            if (selectedCounter && !currentBillId && !loading && !isRestoringTableBill.current) {
                await createNewBill();
            }
        };
        autoCreate();
    }, [selectedCounter, currentBillId, loading]);

    const updateItemQuantity = async (productId, delta) => {
        const item = billItems.find(i => i.product_id === productId);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty < 1) {
            removeFromBill(billItems.indexOf(item));
            return;
        }

        const newItems = billItems.map(i =>
            i.product_id === productId
                ? { ...i, quantity: newQty, total_price: newQty * i.unit_price }
                : i
        );
        setBillItems(newItems);

        // Update live amount on table
        if (selectedTableId) {
            const newSub = newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0);
            updateTableLiveAmount(selectedTableId, newSub);
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ product_id: productId, quantity: delta })
            });
        } catch (error) {
            console.error("Update quantity failed", error);
        }
    };

    const addToBill = async (productOrId, selectedVariation = null, selectedAddons = [], skipNext = false) => {
        if (selectedTableId) {
            const tableObj = tables.find(t => t._id === selectedTableId);
            if (tableObj && tableObj.status === 'PRINTED') {
                return alert("Bill is already printed for this table. Further ordering is not allowed. Please proceed to payment.");
            }
        }
        let product = productOrId;

        // If only ID passed, or it's just the shallow product from the list, 
        // fetch full details to ensure we have current variants and addons
        if (typeof productOrId === 'string' || (!selectedVariation && selectedAddons.length === 0)) {
            try {
                const id = typeof productOrId === 'string' ? productOrId : productOrId._id;
                const savedUser = localStorage.getItem('user');
                const { token } = JSON.parse(savedUser);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) {
                    product = result.data;
                }
            } catch (err) {
                console.error("Failed to fetch product details for selection", err);
                // Continue with the shallow product if fetch fails
            }
        }

        // If product has variations and none selected yet, show selection modal
        if (product.variations?.length > 0 && !selectedVariation && !skipNext) {
            setVariationModalProduct(product);
            return;
        }

        // If product has addons and hasn't been through the addon modal yet
        if (product.addons?.length > 0 && selectedAddons.length === 0 && !addonModalProduct && !skipNext) {
            setTempVariation(selectedVariation);
            setAddonModalProduct(product);
            setVariationModalProduct(null); // Clear variants modal if moving to addons
            return;
        }

        // Special case: if skipNext was true, we might have arrived here from a specific badge click.
        // If we want ONLY variants, we'd call with skipNext=true but selectedVariation=null initially? No.
        // Let's refine the badge triggers.

        // Fix: Automatically try to create a bill if one is missing (e.g. initial load failed)
        let activeId = currentBillId;
        if (!activeId) {
            if (!selectedCounter) {
                alert("Please select a counter in Settings, or create one in Counter Master if none exist.");
                return;
            }
            setBillNumber('Auto-Generating...');
            activeId = await createNewBill();
            if (!activeId) {
                return alert("Failed to generate a bill. Please check your connection or counter setup.");
            }
        }

        let itemName = selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name;
        let basePrice = parseFloat(product.selling_price) || 0;
        let variationPrice = selectedVariation ? (parseFloat(selectedVariation.amount) || 0) : 0;
        let itemUnitPrice = basePrice + variationPrice;

        // Add addon details to name and price if they exist
        if (selectedAddons.length > 0) {
            const addonNames = selectedAddons.map(a => a.name).join(', ');
            itemName += ` (${addonNames})`;
            const addonTotal = selectedAddons.reduce((sum, a) => sum + (parseFloat(a.rate) || 0), 0);
            itemUnitPrice += addonTotal;
        }

        const existingItem = billItems.find(item => item.product_id === product._id && item.name === itemName);
        if (existingItem) {
            // Find its index
            const idx = billItems.indexOf(existingItem);
            const newItems = [...billItems];
            newItems[idx].quantity += 1;
            newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
            setBillItems(newItems);

            // Update live amount on table
            if (selectedTableId) {
                const newSub = newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0);
                updateTableLiveAmount(selectedTableId, newSub);
            }

            try {
                const savedUser = localStorage.getItem('user');
                const { token } = JSON.parse(savedUser);
                await fetch(`${import.meta.env.VITE_API_URL}/bills/${activeId}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        product_id: product._id,
                        quantity: 1,
                        variation: selectedVariation,
                        addons: selectedAddons
                    })
                });
            } catch (e) { console.error(e); }

            setVariationModalProduct(null);
            setAddonModalProduct(null);
            setTempSelectedAddons([]);
            setTempVariation(null);
            return;
        }

        const newItems = [...billItems, {
            product_id: product._id,
            name: itemName,
            category: product.category || '',
            quantity: 1,
            unit_price: itemUnitPrice,
            total_price: itemUnitPrice,
            variation: selectedVariation,
            addons: selectedAddons
        }];
        setBillItems(newItems);

        // Update table live amount
        if (selectedTableId) {
            const newSub = newItems.reduce((acc, i) => acc + i.total_price, 0);
            updateTableLiveAmount(selectedTableId, newSub);
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${activeId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: product._id,
                    quantity: 1,
                    variation: selectedVariation,
                    addons: selectedAddons
                })
            });
        } catch (error) {
            console.error("Add item failed", error);
        }
        setVariationModalProduct(null);
        setAddonModalProduct(null);
        setTempSelectedAddons([]);
        setTempVariation(null);
    };

    const removeFromBill = async (index) => {
        const item = billItems[index];
        const newItems = billItems.filter((_, i) => i !== index);
        setBillItems(newItems);

        // Update live amount on table
        if (selectedTableId) {
            const newSub = newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0);
            updateTableLiveAmount(selectedTableId, newSub);
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}/items/${item.product_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Remove item failed", error);
        }
    };

    const toggleComplementary = async (index) => {
        const newItems = [...billItems];
        newItems[index].is_complementary = !newItems[index].is_complementary;
        setBillItems(newItems);
        // Backend update could happen here if model supports it
    };


    const filteredProducts = useMemo(() => {
        const searchLower = searchQuery.toLowerCase();
        return products.filter(p => {
            const matchesCategory = activeCategory === "ALL" || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchLower) ||
                (p.code && p.code.toLowerCase().includes(searchLower));
            const modeMap = {
                'DINE_IN': 'dine_in', 'TAKEAWAY': 'pickup', 'SELF_SERVICE': 'pickup',
                'PARCEL': 'pickup', 'DELIVERY': 'delivery', 'PARTY': 'party_order'
            };
            const serveKey = modeMap[orderMode];
            const isAvailable = !serveKey || !p.serve_types || p.serve_types[serveKey] !== false;
            return matchesCategory && matchesSearch && isAvailable;
        });
    }, [products, activeCategory, searchQuery, orderMode]);
    const handlePayment = (type = '') => {
        if (!currentBillId) return;
        if (subTotal === 0) return alert("Bill is empty!");
        setCheckoutType(type);
        setCheckoutActive(true);
    };

    const handlePaymentSubmit = async (paymentModes, tipAmount = 0, isPartial = false, vesselAmount = 0, options = {}) => {
        setPaymentLoading(true);

        let allPaymentModes = [...paymentModes];
        if (orderMode === 'PARTY_ORDER' && partyData?.previous_payment_modes?.length > 0) {
            allPaymentModes = [...partyData.previous_payment_modes, ...paymentModes];
        }

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}/pay`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_modes: allPaymentModes,
                    sub_total: subTotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    delivery_charge: deliveryCharge,
                    container_charge: containerCharge,
                    round_off: roundOff,
                    tips_amount: tipAmount,
                    vessel_amount: vesselAmount,
                    grand_total: grandTotal + tipAmount + vesselAmount,
                    customer_name: customerName || partyData?.customer_name,
                    customer_phone: customerPhone || partyData?.customer_phone,
                    customer_address: customerAddress || partyData?.customer_address,
                    delivery_date: partyData?.delivery_date,
                    delivery_time: partyData?.delivery_time,
                    delivery_address: partyData?.customer_address,
                    function_type: partyData?.function_type,
                    table_no: tableNo,
                    persons: persons,
                    captain_name: captainName,
                    waiter_name: waiterName,
                    type: orderMode,
                    alternate_phone: partyData?.alternate_phone,
                    is_partial: (grandTotal > allPaymentModes.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) + 0.01),
                    redeem_loyalty_points: loyaltyRedeemedPoints,
                    bill_number: billNumber
                })
            });
            const data = await res.json();
            if (data.success) {
                if (selectedTableId) {
                    freeTableAfterPayment(selectedTableId);
                }
                setLastBillId(currentBillId);
                setLastPaymentModes(paymentModes);
                setShowBillPreview(true);

                // Reset state
                setTableNo("");
                setPersons("");
                setSelectedTableId("");
                setCustomerName("");
                setCustomerPhone("");
                setCustomerAddress("");
                setCustomerGst("");
                setDiscount(0);
                setDeliveryCharge(0);
                setContainerCharge(0);
                setBillItems([]);
                setPreviousItems([]);
                setStepProceeded(false);
                setCheckoutActive(false);
                setPromoCode('');
                setLoyaltyRedeemedPoints(0);

                // If options.shouldPrint is TRUE, you could trigger auto-print here
                // if the modal supports it, but for now showing preview is the standard.

                createNewBill();
            } else {
                alert(data.message || "Payment failed");
            }
        } catch (error) {
            console.error("Payment submission error", error);
            alert("Could not process payment. Check your connection.");
        } finally {
            setPaymentLoading(false);
        }
    };

    const handlePopupPaymentSubmit = (modes) => {
        setShowPayModePopup(false);
        // Using handlePaymentSubmit completely processes the payment and marks bill PAID.
        handlePaymentSubmit(modes, 0, false, 0, { shouldPrint: pendingSaveAction === 'PRINT' });
    };

    const handleOrderAction = async (type) => {
        if (!currentBillId) return;
        if (billItems.length === 0 && previousItems.length === 0) return alert("Add items first!");

        if (type === 'SAVE' || type === 'PRINT') {
            if (hasModuleAccess('pay_mode')) {
                setPendingSaveAction(type);
                setShowPayModePopup(true);
                return;
            } else {
                const amountToPay = orderMode === 'PARTY_ORDER' 
                    ? Math.max(0, grandTotal - (partyData?.advance_paid || 0)) 
                    : grandTotal;
                const defaultModes = [{ type: 'CASH', amount: amountToPay, cash_received: amountToPay, balance_return: 0 }];
                handlePaymentSubmit(defaultModes, 0, false, 0, { shouldPrint: type === 'PRINT' });
                return;
            }
        }

        setPaymentLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            
            // Merge duplicate items from previous and current cart by product_id and name
            const allItems = [...previousItems, ...billItems];
            const mergedMap = new Map();
            allItems.forEach(item => {
                const key = item.product_id + '_' + item.name;
                if (mergedMap.has(key)) {
                    const existing = mergedMap.get(key);
                    existing.quantity += item.quantity;
                    existing.total_price += item.total_price;
                } else {
                    mergedMap.set(key, { ...item });
                }
            });
            const mergedItems = Array.from(mergedMap.values());
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: mergedItems,
                    action_type: (type === 'KOT' || type === 'KOT_SAVE') ? 'GENERATE_KOT' : (type === 'SAVE' || type === 'PRINT' ? 'GENERATE_BILL_NO' : undefined),
                    status: (type === 'KOT' || type === 'KOT_SAVE') ? 'OPEN' : ((type === 'SAVE' || type === 'PRINT') ? 'PAID' : undefined),
                    payment_mode: (type === 'SAVE' || type === 'PRINT') ? 'NA' : undefined,
                    kitchen_status: (type === 'KOT' || type === 'KOT_SAVE') ? 'PENDING' : undefined,
                    sub_total: subTotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    delivery_charge: deliveryCharge,
                    container_charge: containerCharge,
                    round_off: roundOff,
                    grand_total: grandTotal,
                    table_no: tableNo,
                    persons: persons,
                    order_mode: orderMode,
                    type: orderMode,
                    customer_name: customerName || partyData?.customer_name,
                    customer_phone: customerPhone || partyData?.customer_phone,
                    customer_address: customerAddress || partyData?.customer_address,
                    delivery_date: partyData?.delivery_date,
                    delivery_time: partyData?.delivery_time,
                    function_type: partyData?.function_type,
                    vessel_amount: partyData?.vessel_amount || 0,
                    captain_name: captainName,
                    waiter_name: waiterName,
                    alternate_phone: partyData?.alternate_phone,
                    redeem_loyalty_points: loyaltyRedeemedPoints,
                    bill_number: billNumber
                })
            });
            const data = await res.json();
            if (data.success) {
                if (type === 'KOT' || type === 'KOT_SAVE') {
                    if (selectedTableId) {
                        updateTableLiveAmount(selectedTableId, grandTotal);
                        try {
                            const { token: tk } = JSON.parse(localStorage.getItem('user'));
                            fetch(`${import.meta.env.VITE_API_URL}/tables/${selectedTableId}/kot-status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tk}` },
                                body: JSON.stringify({ kot_status: 'KOT_SENT' })
                            });
                        } catch (e) { console.error('KOT status update error', e); }
                    }
                    try {
                        const kotChannel = new BroadcastChannel('restoboard_kot');
                        kotChannel.postMessage({ type: 'KOT_FIRED', billId: currentBillId, billNumber, tableNo, ts: Date.now() });
                        kotChannel.close();
                    } catch (e) {
                        localStorage.setItem('kot_fired', JSON.stringify({ ts: Date.now() }));
                    }
                    
                    if (data.new_kot) {
                        if (type === 'KOT') {
                            handleKOTPrint(data.new_kot);
                        } else {
                            alert("KOT Saved successfully.");
                        }
                        
                        if (data.data && data.data.items) {
                            setPreviousItems(data.data.items);
                            setBillItems([]);
                        }
                    } else {
                        alert("No new items to send to Kitchen.");
                    }
                }
                else if (type === 'SAVE' || type === 'PRINT') {
                    if (selectedTableId) {
                        try {
                            const savedUser = localStorage.getItem('user');
                            const { token } = JSON.parse(savedUser);
                            await fetch(`${import.meta.env.VITE_API_URL}/tables/${selectedTableId}/mark-printed`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ running_amount: grandTotal })
                            });
                        } catch (e) { console.error('Mark printed error', e); }
                    }
                    setLastBillId(currentBillId);
                    setLastPaymentModes([]);
                    setShowBillPreview(true);

                    // Clear cart and reset state since bill is now PAID
                    setTableNo("");
                    setPersons("");
                    setSelectedTableId("");
                    setCustomerName("");
                    setCustomerPhone("");
                    setCustomerAddress("");
                    setCustomerGst("");
                    setDiscount(0);
                    setDeliveryCharge(0);
                    setContainerCharge(0);
                    setBillItems([]);
                    setPreviousItems([]);
                    setStepProceeded(false);
                    setCheckoutActive(false);
                    setPromoCode('');
                    setLoyaltyRedeemedPoints(0);

                    createNewBill();
                }
            }
        } catch (error) {
            console.error("Order action error", error);
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleKOTPrint = (kotData) => {
        if (!kotData || !kotData.items || kotData.items.length === 0) return;
        const rowsHtml = kotData.items.map(item => `
            <tr>
                <td class="item-name">
                    ${item.name} ${item.notes ? `<br><span style="font-weight:bold; font-style:italic; font-size:12px; color:#000;">* Note: ${item.notes}</span>` : ''}
                </td>
                <td class="item-qty">x${item.quantity}</td>
            </tr>
        `).join('');

        let resData = {};
        try {
            resData = JSON.parse(localStorage.getItem('restaurant')) || {};
        } catch(e) {}
        
        let tableAreaName = '';
        if (selectedTableId && tables.length > 0) {
            const tableObj = tables.find(t => t._id === selectedTableId);
            if (tableObj && tableTypes.length > 0) {
                const typeObj = tableTypes.find(type => type._id === tableObj.type);
                if (typeObj) tableAreaName = typeObj.name;
            }
        }
        
        const kotHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${kotData.kot_number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 13px; width: 72mm; padding: 4px; }
        .sep { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .sep-solid { border: none; border-top: 2px solid #000; margin: 6px 0; }
        .center { text-align: center; }
        .bold { font-weight: 900; }
        .big { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
        .table-label { font-size: 17px; font-weight: 900; }
        .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
        .item-name { font-weight: 700; font-size: 14px; padding: 5px 2px; vertical-align: middle; }
        .footer { text-align: center; font-size: 11px; margin-top: 8px; }
        @media print { body { width: 72mm; } }
    </style>
</head>
<body>
    <div class="center" style="margin-bottom: 5px;">
        <h2 style="font-size: 16px; margin: 0;">${resData.name || 'RESTAURANT'}</h2>
        ${resData.address ? `<p style="font-size: 10px; margin: 2px 0;">${resData.address}</p>` : ''}
        ${resData.phone ? `<p style="font-size: 10px; margin: 2px 0;">Cell: ${resData.phone}</p>` : ''}
        ${resData.fssai_no ? `<p style="font-size: 10px; margin: 2px 0;">FSSAI: ${resData.fssai_no}</p>` : ''}
        ${resData.gstin ? `<p style="font-size: 10px; margin: 2px 0;">GSTIN: ${resData.gstin}</p>` : ''}
        ${tableAreaName ? `<p style="font-size: 11px; font-weight: 900; margin: 4px 0;">Type: ${tableAreaName}</p>` : ''}
        <div class="table-label" style="margin-top: 8px;">${tableNo ? 'TABLE ' + tableNo : (orderMode === 'TAKEAWAY' ? 'TAKEAWAY' : (orderMode === 'PARCEL' ? 'PARCEL' : (orderMode === 'DELIVERY' ? 'DELIVERY' : (orderMode === 'PARTY' ? 'PARTY' : 'COUNTER'))))}</div>
    </div>
    <hr class="sep-solid">
    <div class="info-row"><span class="bold">KOT No:</span><span class="bold">${kotData.kot_number}</span></div>
    ${(previousItems && previousItems.length > 0) ? `<div class="info-row"><span class="bold">Status:</span><span class="bold">RUNNING TABLE</span></div>` : ''}
    <div class="info-row"><span>Bill#</span><span>${billNumber}</span></div>
    <div class="info-row"><span>Date</span><span>${new Date(kotData.created_at || Date.now()).toLocaleString('en-IN', { hour12: true })}</span></div>
    <hr class="sep-solid">
    <table>
        <thead>
            <tr>
                <th style="text-align:left; font-size:11px; padding-bottom:3px;">ITEM NAME</th>
                <th style="text-align:right; font-size:11px; padding-bottom:3px;">QUANTITY</th>
            </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
    </table>
    <hr class="sep-solid">
    <div class="footer">*** KITCHEN KOT END ***</div>
</body>
</html>`;
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return alert('Popup blocked. Please allow popups for printing KOT.');
        printWindow.document.open();
        printWindow.document.write(kotHtml);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        };
    };

    const handleAllKotsPrint = (billData) => {
        if (!billData || !billData.kots || billData.kots.length === 0) return alert("No KOT items to print.");
        const allKotsHtml = billData.kots.map(kot => {
            const rowsHtml = kot.items.map(item => `
                <tr>
                    <td class="item-name">${item.name}</td>
                    <td class="item-qty">x${item.quantity}</td>
                </tr>
            `).join('');
            return `
            <div class="center bold" style="margin-top: 10px; font-size: 14px;">${kot.kot_number || 'KOT'}</div>
            <hr class="sep-solid">
            <table>
                <thead>
                    <tr><th style="text-align:left; font-size:11px;">ITEM</th><th style="text-align:right; font-size:11px;">QTY</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            `;
        }).join('');

        const kotHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"><title>All KOTs - ${(billData.bill_number && !billData.bill_number.startsWith('TEMP-')) ? billData.bill_number : 'Reprint'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; } @page { size: 80mm auto; margin: 4mm; } body { font-family: monospace; font-size: 13px; width: 72mm; padding: 4px; }
        .sep-solid { border: none; border-top: 2px solid #000; margin: 6px 0; } .center { text-align: center; } .bold { font-weight: 900; } .big { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; } .item-name { font-weight: 700; font-size: 14px; padding: 5px 2px; } .item-qty  { font-weight: 900; font-size: 16px; text-align: right; padding: 5px 2px; }
        @media print { body { width: 72mm; } }
    </style>
</head>
<body>
    <div class="center"><div class="big">ALL KOTs</div><div class="bold">TABLE: ${billData.table_no || tableNo || 'N/A'}</div></div>
    ${allKotsHtml}
    <hr class="sep-solid"><div class="center" style="font-size: 11px; margin-top: 10px;">Reprinted at ${new Date().toLocaleTimeString()}</div>
</body>
</html>`;
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;
        printWindow.document.write(kotHtml);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); printWindow.onafterprint = () => printWindow.close(); };
    };

    const searchBills = async (query, statusFilter = '') => {
        if (!query || query.length < 2) {
            if (statusFilter === 'OPEN') setKotSearchResults([]);
            else setBillSearchResults([]);
            return;
        }
        if (statusFilter === '') setBillSearchLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const dateParams = statusFilter === 'OPEN' ? '&startDate=today&endDate=today' : '';
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills?bill_number=${query}&status=${statusFilter}${dateParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                if (statusFilter === 'OPEN') setKotSearchResults(data.data);
                else setBillSearchResults(data.data);
            }
        } catch (err) {
            console.error("Search error", err);
        } finally {
            setBillSearchLoading(false);
        }
    };

    const loadBillForAlter = (bill, mode) => {
        if (!bill) return;
        setLoadedBillMode(mode);
        setCurrentBillId(bill._id);
        setBillNumber(bill.bill_number);
        setPreviousItems([]);
        setBillItems(bill.items || []);
        setTableNo(bill.table_no || "");
        setOrderMode(bill.type || 'DINE_IN');
        setCustomerName(bill.customer_name || "");
        setCustomerPhone(bill.customer_phone || "");
        setCustomerAddress(bill.customer_address || "");
        setDiscount(bill.discount_amount || 0);

        if (mode === 'ALTER') { setShowAlterForm(true); setShowReturnForm(false); setShowTransferForm(false); }
        if (mode === 'RETURN') { setShowReturnForm(true); setShowAlterForm(false); setShowTransferForm(false); }
        if (mode === 'TRANSFER') { setShowTransferForm(true); setShowAlterForm(false); setShowReturnForm(false); }
        if (mode === 'LOAD') {
            setShowAlterForm(false); setShowReturnForm(false); setShowTransferForm(false);
            alert(`Bill ${bill.bill_number} loaded into POS.`);
        }
    };

    const saveAlteredBill = async () => {
        if (!currentBillId) return;
        setPaymentLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    items: billItems,
                    sub_total: subTotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    grand_total: grandTotal,
                    status: 'OPEN'
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Bill alterations saved successfully.");
                setShowAlterForm(false);
                setLoadedBillMode('NONE');
            } else {
                alert(data.message || "Failed to save alterations.");
            }
        } catch (err) { console.error(err); }
        finally { setPaymentLoading(false); }
    };

    const handleInlineReturn = async () => {
        const itemsToReturn = [];
        Object.keys(returnQtys).forEach(idx => {
            const qty = returnQtys[idx];
            if (qty > 0) {
                itemsToReturn.push({
                    ...billItems[idx],
                    quantity: qty,
                    reason: returnReasons[idx] || 'Customer Return',
                    timestamp: new Date().toISOString()
                });
            }
        });
        if (itemsToReturn.length === 0) return alert("Select at least one item and quantity to return.");
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const newBillItems = billItems.map((item, idx) => {
                const retQty = returnQtys[idx] || 0;
                const finalQty = Math.max(0, item.quantity - retQty);
                return { ...item, quantity: finalQty, total_price: finalQty * item.unit_price };
            }).filter(item => item.quantity > 0);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    items: newBillItems,
                    return_items: itemsToReturn
                })
            });
            const data = await res.json();
            if (data.success) {
                setBillItems(newBillItems);
                setReturnQtys({});
                setReturnReasons({});
                setShowReturnForm(false);
                setLoadedBillMode('NONE');
                alert("Return processed successfully and logged to backend.");
            }
        } catch (err) { console.error("Return failed", err); }
    };

    const searchTransferBills = async (q) => {
        if (q.length < 2) return setTransferBillResults([]);
        setTransferBillLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills?bill_number=${q}&status=OPEN`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTransferBillResults(data.data);
        } finally { setTransferBillLoading(false); }
    };

    const handleTransferToBill = async () => {
        if (!transferTargetBill) return alert("Please select a target bill first.");
        const itemsToMove = [];
        Object.keys(transferItemSel).forEach(idx => {
            if (transferItemSel[idx] > 0) {
                itemsToMove.push({ ...billItems[idx], quantity: transferItemSel[idx] });
            }
        });
        if (itemsToMove.length === 0) return alert("Select items to transfer.");
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            for (const item of itemsToMove) {
                await fetch(`${import.meta.env.VITE_API_URL}/bills/${transferTargetBill._id}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity, name: item.name })
                });
            }
            const newSourceItems = billItems.map((item, idx) => {
                const moveQty = transferItemSel[idx] || 0;
                const finalQty = item.quantity - moveQty;
                return { ...item, quantity: finalQty, total_price: finalQty * item.unit_price };
            }).filter(i => i.quantity > 0);
            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items: newSourceItems })
            });
            setBillItems(newSourceItems);
            setTransferTargetBill(null);
            setTransferItemSel({});
            setShowTransferForm(false);
            setLoadedBillMode('NONE');
            alert(`Items transferred to ${transferTargetBill.bill_number}`);
        } catch (err) { console.error("Transfer error", err); }
    };

    const handleTransferToTable = async (targetTable) => {
        const itemsToMove = [];
        Object.keys(transferItemSel).forEach(idx => {
            const qty = transferItemSel[idx];
            if (qty > 0) {
                itemsToMove.push({ ...billItems[idx], quantity: qty });
            }
        });

        if (itemsToMove.length === 0) return alert("Select items to transfer.");
        if (!targetTable || !targetTable._id) return alert("Select a destination table.");

        setPaymentLoading(true);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/tables/${targetTable._id}/transfer-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    source_bill_id: currentBillId,
                    items: itemsToMove.map(i => ({
                        product_id: i.product_id,
                        name: i.name,
                        quantity: i.quantity,
                        unit_price: i.unit_price
                    }))
                })
            });

            const data = await res.json();
            if (data.success) {
                const newSourceItems = billItems.map((item, idx) => {
                    const moveQty = transferItemSel[idx] || 0;
                    const finalQty = item.quantity - moveQty;
                    return { ...item, quantity: finalQty, total_price: finalQty * item.unit_price };
                }).filter(i => i.quantity > 0);

                setBillItems(newSourceItems);
                setTransferItemSel({});
                setShowTransferForm(false);
                setLoadedBillMode('NONE');
                alert(`Items transferred to Table ${targetTable.table_number || targetTable.table_no}`);

                if (selectedTableId) {
                    const newSub = newSourceItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0);
                    updateTableLiveAmount(selectedTableId, newSub);
                }
            } else {
                alert(data.message || "Transfer failed.");
            }
        } catch (err) {
            console.error("Transfer error", err);
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleNotificationClick = () => {
        alert("System notifications: Backend connected successfully.");
    };

    const fetchPartyOrders = async (date = partyMgtDate) => {
        try {
            const { token } = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills?type=PARTY_ORDER&delivery_date=${date}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPartyOrders(data.data);
            }
        } catch (e) { console.error("Party orders fetch failed", e); }
    };

    const fetchPartySelectionOrders = async () => {
        try {
            const { token } = JSON.parse(localStorage.getItem('user'));
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bills?type=PARTY_ORDER`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Filter to only show active party orders that are not fully delivered and not empty ghost shells
                const activeParties = data.data.filter(b =>
                    b.party_status !== 'DELIVERED' &&
                    !(!b.customer_name && (!b.items || b.items.length === 0))
                );
                setPartySelectionOrders(activeParties);
            }
        } catch (e) { console.error("Party selection fetch failed", e); }
    };

    const loadPartyOrder = (order) => {
        if (billItems.length > 0) {
            if (!window.confirm("Current bill items will be discarded. Continue?")) return;
        }
        setBillItems(order.items || []);
        setPreviousItems([]);
        setCurrentBillId(order._id);
        setBillNumber(order.bill_number);
        setOrderMode('PARTY_ORDER');
        setCustomerName(order.customer_name || "");
        setCustomerPhone(order.customer_phone || "");
        setCustomerAddress(order.delivery_address || "");
        setPartyData({
            delivery_date: order.delivery_date,
            delivery_time: order.delivery_time,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            alternate_phone: order.alternate_phone,
            customer_address: order.delivery_address,
            function_type: order.function_type,
            vessel_amount: order.vessel_amount,
            advance_paid: order.total_paid || 0,
            previous_payment_modes: order.payment_modes || []
        });
        setShowPartySelectionModal(false);
    };

    const handleModeChange = (newMode) => {
        if (newMode === 'PARTY_ORDER') {
            fetchBookedDates();
            setShowPartyBookingModal(true);
        } else {
            setOrderMode(newMode);
            setPartyData(null);
            setTableNo('');
            setSelectedTableId('');
        }
    };

    const resetForm = () => {
        setTableNo("");
        setPersons("");
        setSelectedTableId("");
        setCustomerName("");
        setShowPersonsForm(false);
        setShowCustomerForm(false);
        setShowTableForm(false);
        setShowAlterForm(false);
        setShowTransferForm(false);
        setShowReturnForm(false);
        setShowSplitForm(false);
        setShowLoyaltyForm(false);
        setShowMoreForm(false);
        setShowCouponForm(false);
        setAppliedCoupon(null);
        setCouponNumber('');
        setCustomerPhone("");
        setCustomerAddress("");
        setCustomerGst("");
        setCaptainName("");
        setWaiterName("");
        setDiscount(0);
        setDeliveryCharge(0);
        setContainerCharge(0);
        setLoyaltyRedeemedPoints(0);
        setRedeemPointsInput('');
        setBillItems([]);
        setPreviousItems([]);
        setStepProceeded(false);
        setPromoCode('');
        createNewBill();
    };

    const updateItemRate = (idx, newRate) => {
        const newItems = [...billItems];
        newItems[idx].unit_price = parseFloat(newRate) || 0;
        newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
        setBillItems(newItems);
        if (selectedTableId) updateTableLiveAmount(selectedTableId, newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0));
    };

    const updateItemQtyDirect = (idx, newQty) => {
        const newItems = [...billItems];
        newItems[idx].quantity = parseFloat(newQty) || 0;
        newItems[idx].total_price = newItems[idx].quantity * newItems[idx].unit_price;
        setBillItems(newItems);
        if (selectedTableId) updateTableLiveAmount(selectedTableId, newItems.reduce((acc, i) => acc + (i.is_complementary ? 0 : i.total_price), 0));
    };

    const handleTransferItem = (idx) => {
        setSelectedItemForAction(idx);
        if (!currentBillId) return;
        setShowTransferForm(true);
        setShowAlterForm(false);
        setShowReturnForm(false);
    };

    const handleReturnItem = (idx) => {
        if (!currentBillId) return;
        setReturnQtys({ [idx]: 1 });
        setShowReturnForm(true);
        setShowAlterForm(false);
        setShowTransferForm(false);
    };

    const handleSplitBill = () => {
        if (billItems.length < 2) return alert("Need at least 2 items to split!");
        toggleExpandableForm('SPLIT');
    };

    const toggleFullBillComplimentary = () => {
        const anyNonComp = billItems.some(i => !i.is_complementary);
        const newItems = billItems.map(i => ({ ...i, is_complementary: anyNonComp }));
        setBillItems(newItems);
    };

    const holdCurrentBill = () => {
        if (billItems.length === 0) return alert("Cannot hold an empty bill.");
        const newHold = {
            id: Date.now(),
            billId: currentBillId,
            billNumber: billNumber,
            items: billItems,
            tableNo: tableNo,
            orderMode: orderMode,
            customerName: customerName,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            grandTotal: grandTotal,
            timestamp: new Date().toISOString()
        };
        const updated = [newHold, ...heldBills];
        setHeldBills(updated);
        localStorage.setItem('pos_held_bills', JSON.stringify(updated));
        resetForm();
        alert("Bill placed on hold.");
    };

    const restoreHeldBill = (hold) => {
        if (billItems.length > 0) {
            if (!window.confirm("Current bill items will be discarded. Continue?")) return;
        }
        setBillItems(hold.items);
        setCurrentBillId(hold.billId);
        setBillNumber(hold.billNumber);
        setTableNo(hold.tableNo || "");
        setOrderMode(hold.orderMode || 'DINE_IN');
        setCustomerName(hold.customerName || "");
        setCustomerPhone(hold.customerPhone || "");
        setCustomerAddress(hold.customerAddress || "");

        const updated = heldBills.filter(h => h.id !== hold.id);
        setHeldBills(updated);
        localStorage.setItem('pos_held_bills', JSON.stringify(updated));
        setIsHoldPanelOpen(false);
    };

    const handleApplyCoupon = async () => {
        if (!couponSearchName || !couponNumber) return alert('Please select a coupon and enter the coupon number.');
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ coupon_name: couponSearchName, coupon_number: couponNumber })
            });
            const data = await res.json();
            if (data.success) {
                setAppliedCoupon(data.data);
                alert(`Coupon applied: ${data.data.coupon_name}`);
            } else {
                alert(data.message || 'Invalid Coupon');
            }
        } catch (err) {
            console.error('Coupon validation error', err);
            alert('Failed to validate coupon.');
        }
    };

    const applyPromoCode = () => {
        if (!promoCode) return;
        alert(`Promo Code "${promoCode}" applied successfully! 5% extra discount added (Simulated).`);
        setDiscount(prev => parseFloat(prev) + 5);
        setPromoCode('');
    };

    const toggleLayout = async () => {
        const newLayout = billingLayout === 'SIDEBAR' ? 'TOP_HEADER' : 'SIDEBAR';
        setBillingLayout(newLayout);
        localStorage.setItem('cachedBillingLayout', newLayout);

        if (newLayout === 'TOP_HEADER') {
            setShowSidebar(false);
        } else {
            setShowSidebar(true);
        }

        try {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/settings/layout`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ billingLayout: newLayout })
            });
        } catch (err) {
            console.error('Failed to save layout preference', err);
        }
    };

    return (
        <div className={`pos-layout ${showSidebar ? 'sidebar-open' : 'sidebar-closed'} layout-${billingLayout.toLowerCase().replace('_', '-')}`}>
            {/* Top Navigation Bar */}
            <div className="pos-nav">
                <div className="nav-left">
                    <button
                        className="nav-action-btn"
                        onClick={() => navigate(`/dashboard/${location.pathname.split('/')[2]}/home`)}
                        style={{ marginRight: '10px', padding: '0 12px' }}
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="bill-no-display-wrapper">
                        {showBillNumber && (
                            <div className="bill-no-badge animate-in fade-in zoom-in duration-300">
                                <span className="label">BILL/KOT NO:</span>
                                {isManualNumbering && (!currentBillId || billNumber.startsWith('TEMP-') || currentBillId) ? (
                                    <input
                                        type="text"
                                        className="number"
                                        style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px dashed rgba(255,255,255,0.5)', outline: 'none', width: '130px', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: '900' }}
                                        value={billNumber.startsWith('TEMP-') ? '' : billNumber}
                                        onChange={(e) => setBillNumber(e.target.value)}
                                        placeholder="Enter Bill No"
                                    />
                                ) : (
                                    <span className="number">{billNumber}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-center">
                    {/* Centered actions can go here */}
                </div>

                <div className="nav-right">
                    {showTimer && (
                        <div className="pos-timer-enhanced">
                            <Timer size={16} />
                            <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            <span className="timer-sep">|</span>
                            <span className="timer-clock">{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                    )}

                    <div className="nav-actions-group">
                        <button type="button" className="nav-action-btn" onClick={() => navigate('/dashboard/self-service/bills-sales')} title="Party Orders Dashboard">
                            PARTY ORDERS
                        </button>
                        <button type="button" className="nav-action-btn" onClick={() => navigate('/dashboard/self-service/table-select')} title="Select Table">
                            TABLE
                        </button>
                        <button type="button" className={`nav-action-btn ${heldBills.length > 0 ? 'has-items' : ''}`} onClick={() => navigate('/dashboard/self-service/hold')} title="Manage held transactions">
                            HOLD {heldBills.length > 0 && <span className="hold-badge">{heldBills.length}</span>}
                        </button>
                        <button type="button" className="nav-action-btn" onClick={handleNotificationClick} title="System Alerts">
                            <Bell size={20} />
                        </button>
                    </div>

                    <div className="settings-btn-wrapper">
                        <button className="nav-action-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)} title="Settings">
                            <Settings size={20} />
                            <span className="btn-text">Settings</span>
                        </button>

                        {isSettingsOpen && (
                            <div className="settings-dropdown">
                                <div className="settings-option">
                                    <span>Hide Bill Number</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={!showBillNumber} onChange={() => setShowBillNumber(!showBillNumber)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="settings-option">
                                    <span>Show Timer</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={showTimer} onChange={() => setShowTimer(!showTimer)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="settings-option">
                                    <span>Layout Mode</span>
                                    <select value={billingLayout} onChange={(e) => {
                                        setBillingLayout(e.target.value);
                                        localStorage.setItem('cachedBillingLayout', e.target.value);
                                        setShowSidebar(e.target.value === 'SIDEBAR');
                                    }}>
                                        <option value="SIDEBAR">Sidebar</option>
                                        <option value="TOP_HEADER">Top Layout</option>
                                    </select>
                                </div>



                                {loyaltyUnlocked && (
                                    <div className="settings-option">
                                        <span>Loyalty System</span>
                                        <label className="switch">
                                            <input type="checkbox" checked={loyaltyEnabled} onChange={async () => {
                                                const next = !loyaltyEnabled;
                                                setLoyaltyEnabled(next);
                                                localStorage.setItem('pos_loyalty_enabled', String(next));
                                                // Sync with backend
                                                try { await fetchWithAuth('/settings/modules', { method: 'PUT', body: JSON.stringify({ billing_loyalty_active: next }) }); } catch (err) { }
                                            }} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                )}
                                {couponUnlocked && (
                                    <div className="settings-option">
                                        <span>Coupon System</span>
                                        <label className="switch">
                                            <input type="checkbox" checked={couponEnabled} onChange={async () => {
                                                const next = !couponEnabled;
                                                setCouponEnabled(next);
                                                localStorage.setItem('pos_coupon_enabled', String(next));
                                                // Sync with backend
                                                try { await fetchWithAuth('/settings/modules', { method: 'PUT', body: JSON.stringify({ billing_coupon_active: next }) }); } catch (err) { }
                                            }} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                )}
                                <div className="settings-option">
                                    <span>Show Rate Column</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={showRateColumn} onChange={() => {
                                            const next = !showRateColumn;
                                            setShowRateColumn(next);
                                            localStorage.setItem('pos_show_rate', String(next));
                                        }} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="settings-option">
                                    <span>Show Item Price</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={showProductPrice} onChange={() => {
                                            const next = !showProductPrice;
                                            setShowProductPrice(next);
                                            localStorage.setItem('pos_show_prod_price', String(next));
                                        }} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>


                            </div>
                        )}
                    </div>

                    <div className="nav-actions-group">
                        <button type="button" className="nav-action-btn" onClick={logout} title="Sign Out">
                            LOGOUT
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Search & Mode Bar - Restored to Global Position */}
            <div className="pos-search-section">
                <div className="search-flex-container">
                    {/* Searches Grouped on Left */}
                    <div className="search-input-wrapper main-search">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Product Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* KOT Search with dropdown */}
                    <div className="search-input-wrapper secondary-search" style={{ position: 'relative' }}>
                        <History size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="KOT Search"
                            value={kotSearchQuery}
                            onChange={(e) => { setKotSearchQuery(e.target.value); searchBills(e.target.value, 'OPEN'); setShowKotDropdown(true); }}
                            onFocus={() => { if (kotSearchQuery) setShowKotDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowKotDropdown(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && kotSearchResults.length > 0) {
                                    loadBillForAlter(kotSearchResults[0], 'LOAD');
                                }
                            }}
                        />
                        {showKotDropdown && kotSearchResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                                {kotSearchResults.map(b => (
                                    <button key={b._id}
                                        onMouseDown={() => loadBillForAlter(b, 'LOAD')}
                                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#1e293b' }}>{b.bill_number}</span>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>{b.table_no || b.type} · ₹{b.grand_total || 0}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bill No. Search with dropdown */}
                    <div className="search-input-wrapper secondary-search" style={{ position: 'relative' }}>
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Bill No."
                            value={billSearchQuery}
                            onChange={(e) => { setBillSearchQuery(e.target.value); searchBills(e.target.value); setShowBillDropdown(true); }}
                            onFocus={() => { if (billSearchQuery) setShowBillDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowBillDropdown(false), 200)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && billSearchResults.length > 0) {
                                    loadBillForAlter(billSearchResults[0], 'LOAD');
                                }
                            }}
                        />
                        {billSearchLoading && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#94a3b8' }}>...</span>}
                        {showBillDropdown && billSearchResults.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '240px', overflowY: 'auto', marginTop: '4px' }}>
                                {billSearchResults.map(b => (
                                    <div key={b._id} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', cursor: 'pointer' }}
                                            onMouseDown={() => loadBillForAlter(b, 'LOAD')}>
                                            <span style={{ fontWeight: 800, fontSize: '12px', color: '#1e293b' }}>{b.bill_number}</span>
                                            <span style={{
                                                fontSize: '10px', padding: '1px 8px', borderRadius: '20px', fontWeight: 800,
                                                background: b.status === 'PAID' ? '#f0fdf4' : '#fffbeb',
                                                color: b.status === 'PAID' ? '#16a34a' : '#d97706'
                                            }}>{b.status}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', cursor: 'pointer' }}
                                            onMouseDown={() => loadBillForAlter(b, 'LOAD')}>
                                            {b.table_no || b.type} · ₹{b.grand_total || 0} · {b.items?.length || 0} items
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onMouseDown={() => loadBillForAlter(b, 'ALTER')}
                                                style={{ flex: 1, padding: '5px 0', fontSize: '10px', fontWeight: 800, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer' }}>
                                                ALTER
                                            </button>
                                            <button onMouseDown={() => loadBillForAlter(b, 'RETURN')}
                                                style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>
                                                RETURN
                                            </button>
                                            <button onMouseDown={() => loadBillForAlter(b, 'TRANSFER')}
                                                style={{ flex: 1, padding: '4px 0', fontSize: '10px', fontWeight: 800, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer' }}>
                                                TRANSFER
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order Mode Selector - Restored to Far Right */}
                    <div className="mode-selector-header">
                        {[
                            { id: 'DINE_IN', label: 'Dine In', icon: <TableLogo size={16} /> },
                            { id: 'PARCEL', label: 'Parcel', icon: <Package size={16} /> },
                            { id: 'DELIVERY', label: 'Delivery', icon: <Truck size={16} /> },
                            { id: 'PARTY_SELECTION', label: 'Party', icon: <Users2 size={16} /> }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                className={`mode-pill ${(orderMode === mode.id) || (orderMode === 'PARTY_ORDER' && mode.id === 'PARTY_SELECTION') ? 'active' : ''}`}
                                onClick={() => {
                                    if (mode.id === 'PARTY_SELECTION') {
                                        fetchPartySelectionOrders();
                                        setShowPartySelectionModal(true);
                                    } else {
                                        handleModeChange(mode.id);
                                    }
                                }}
                            >
                                {mode.icon}
                                <span>{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>




            {/* Main POS Container */}
            <div className={`pos-main ${showSidebar ? '' : 'full-width'}`}>
                {/* Mobile Sidebar Overlay */}
                {showSidebar && window.innerWidth <= 768 && (
                    <div className="mobile-overlay" onClick={() => setShowSidebar(false)} style={{ zIndex: 1999 }}></div>
                )}

                {/* 1. Category Sidebar (Left) - Only if Layout 1 */}
                {billingLayout === 'SIDEBAR' && (
                    <div className={`category-sidebar ${showSidebar ? 'open' : 'closed'}`}>
                        <div className="sidebar-header">
                            <span>CATEGORY</span>
                            <button onClick={() => setShowSidebar(false)} className="icon-btn-sm">
                                <ArrowLeft size={16} />
                            </button>
                        </div>
                        <div className="category-list">
                            <button
                                className={`category-item ${activeCategory === "ALL" ? 'active' : ''}`}
                                onClick={() => setActiveCategory("ALL")}
                            >
                                All Items
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat._id}
                                    className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat.name)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Product Area (Middle) */}
                <div className="product-area">
                    <>
                        {/* Top Category Header - Only if Layout 2 */}
                        {billingLayout === 'TOP_HEADER' && (
                            <div className="top-category-header">
                                <button
                                    className={`top-cat-btn ${activeCategory === "ALL" ? 'active' : ''}`}
                                    onClick={() => setActiveCategory("ALL")}
                                >
                                    ALL ITEMS
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat._id}
                                        className={`top-cat-btn ${activeCategory === cat.name ? 'active' : ''}`}
                                        onClick={() => setActiveCategory(cat.name)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {billingLayout === 'SIDEBAR' && !showSidebar && (
                            <button className="toggle-sidebar-btn" onClick={() => setShowSidebar(true)}>
                                <MenuIcon size={18} /> <span>Show Categories</span>
                            </button>
                        )}

                        <div className="product-scroll-grid">
                            {loading ? (
                                <CardSkeleton count={12} />
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex-center h-full text-gray-400 w-full py-20">
                                    No products found in this category.
                                </div>
                            ) : filteredProducts.map(product => (
                                <div
                                    key={product._id}
                                    className="pos-product-card"
                                    onClick={() => addToBill(product)}
                                >
                                    <div className="p-image-container">
                                        {product.variations?.length > 0 && (
                                            <div
                                                className="absolute top-2 right-2 z-10 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20 uppercase tracking-tighter cursor-pointer hover:bg-white hover:text-indigo-600 transition-all active:scale-95"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setVariationModalProduct(product);
                                                }}
                                            >
                                                <Layers size={10} className="inline mr-1" /> VARIANTS
                                            </div>
                                        )}
                                        {product.addons?.length > 0 && (
                                            <div
                                                className="absolute top-7 right-2 z-10 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white/20 uppercase tracking-tighter cursor-pointer hover:bg-white hover:text-emerald-600 transition-all active:scale-95"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAddonModalProduct(product);
                                                    setVariationModalProduct(null); // Ensure variants modal is closed
                                                }}
                                            >
                                                <Plus size={10} className="inline mr-1" /> ADD ON
                                            </div>
                                        )}
                                        {product.image ? (
                                            <img src={`${getBaseUrl()}${product.image}`} alt={product.name} className="p-card-img" />
                                        ) : (
                                            <div className="p-img-placeholder">
                                                <ShoppingBag size={32} color="#cbd5e0" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-details">
                                        <div className="p-name">{product.name}</div>
                                        {showProductPrice && <div className="p-price">₹{product.selling_price}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>


                    </>
                </div>

                {/* 3. Bill Panel (Right) */}
                <div className="bill-sidebar">
                    {/* Meta Icons row from reference image */}
                    <div className="sidebar-meta-icons">
                        <div className="meta-icon-btn active" style={{ cursor: 'default', pointerEvents: 'none' }}>
                            <div className="icon-bg"><TableLogo size={18} /></div>
                            <span style={{ color: tableNo ? '#ea580c' : 'inherit', fontWeight: tableNo ? 900 : 'normal' }}>
                                {tableNo || 'TABLE'}
                            </span>
                        </div>
                        <div className="meta-icon-btn active" style={{ cursor: 'default', pointerEvents: 'none' }}>
                            <div className="icon-bg"><Users size={18} /></div>
                            <span style={{ color: persons ? '#ea580c' : 'inherit', fontWeight: persons ? 900 : 'normal' }}>
                                {persons ? `${persons} PAX` : 'PERSONS'}
                            </span>
                        </div>
                        <button className={`meta-icon-btn ${showAlterForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('ALTER')}>
                            <div className="icon-bg"><Edit size={18} /></div>
                            <span>ALTER</span>
                        </button>
                        <button className={`meta-icon-btn ${showTransferForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('TRANSFER')}>
                            <div className="icon-bg"><ArrowLeftRight size={18} /></div>
                            <span>TRANSFER</span>
                        </button>
                        <button className={`meta-icon-btn ${showReturnForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('RETURN')}>
                            <div className="icon-bg"><Undo2 size={18} /></div>
                            <span>RETURN</span>
                        </button>
                    </div>





                    {/* Customer Form Section */}
                    {showCustomerForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="text" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea rows="1" placeholder="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} style={{ minHeight: '38px' }}></textarea>
                                </div>
                                <div className="form-group">
                                    <label>GST Number</label>
                                    <input type="text" placeholder="GSTIN" value={customerGst} onChange={(e) => setCustomerGst(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Captain Form Section */}
                    {showCaptainForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Select Captain</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                    {captains.map(cap => (
                                        <button
                                            key={cap._id}
                                            onClick={() => { setCaptainName(cap.name); setShowCaptainForm(false); }}
                                            className={`selection-card ${captainName === cap.name ? 'active' : ''}`}
                                            style={{
                                                padding: '8px',
                                                background: captainName === cap.name ? '#ea580c' : '#f8fafc',
                                                color: captainName === cap.name ? '#fff' : '#1e293b',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}
                                        >
                                            {cap.name}
                                        </button>
                                    ))}
                                    {captains.length === 0 && <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8' }}>No captains found.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Waiter Form Section */}
                    {showWaiterForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Select Waiter</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                    {waiters.map(wait => (
                                        <button
                                            key={wait._id}
                                            onClick={() => { setWaiterName(wait.name); setShowWaiterForm(false); }}
                                            className={`selection-card ${waiterName === wait.name ? 'active' : ''}`}
                                            style={{
                                                padding: '8px',
                                                background: waiterName === wait.name ? '#ea580c' : '#f8fafc',
                                                color: waiterName === wait.name ? '#fff' : '#1e293b',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}
                                        >
                                            {wait.name}
                                        </button>
                                    ))}
                                    {waiters.length === 0 && <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#94a3b8' }}>No waiters found.</p>}
                                </div>
                            </div>
                        </div>
                    )}



                    {/* ── ALTER Form ── */}
                    {showAlterForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                {!currentBillId ? (
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>
                                        Search a bill by number above to load it for editing.
                                    </p>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>Editing: {billNumber}</span>
                                            <button onClick={saveAlteredBill} disabled={paymentLoading}
                                                style={{ padding: '6px 16px', fontSize: '11px', fontWeight: 900, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 3px 8px rgba(37,99,235,0.3)' }}>
                                                {paymentLoading ? 'Saving...' : '✓ SAVE ALTERATIONS'}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#64748b' }}>Add/remove items from the bill panel below. Click SAVE ALTERATIONS when done.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── RETURN Form ── */}
                    {showReturnForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                {!currentBillId || billItems.length === 0 ? (
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                                        Search a bill above to load items for return.
                                    </p>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>Return Items — Bill: {billNumber}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                            {billItems.map((item, idx) => (
                                                <div key={idx} style={{ background: '#fef2f2', borderRadius: '8px', padding: '6px 10px', border: '1px solid #fecaca' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{item.name}</span>
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>Max: {item.quantity}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #fecaca', borderRadius: '6px', padding: '2px 6px' }}>
                                                            <button onClick={() => setReturnQtys(q => ({ ...q, [idx]: Math.max(0, (q[idx] || 0) - 1) }))}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>−</button>
                                                            <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 800 }}>{returnQtys[idx] || 0}</span>
                                                            <button onClick={() => setReturnQtys(q => ({ ...q, [idx]: Math.min(item.quantity, (q[idx] || 0) + 1) }))}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>+</button>
                                                        </div>
                                                        <input placeholder="Reason" value={returnReasons[idx] || ''}
                                                            onChange={e => setReturnReasons(r => ({ ...r, [idx]: e.target.value }))}
                                                            style={{ flex: 1, fontSize: '11px', padding: '4px 8px', border: '1px solid #fecaca', borderRadius: '6px', outline: 'none' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={handleInlineReturn}
                                            style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '12px', fontWeight: 900, background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 3px 8px rgba(220,38,38,0.3)' }}>
                                            PROCESS RETURN
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TRANSFER Form ── */}
                    {showTransferForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '10px 15px' }}>
                                {!currentBillId || billItems.length === 0 ? (
                                    <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                                        Search a bill above, then select items and choose a destination.
                                    </p>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', marginBottom: '8px' }}>Transfer Items — from Bill: {billNumber}</div>

                                        {/* Mode Toggle: TABLE / BILL */}
                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                            <button
                                                onClick={() => setTransferMode('TABLE')}
                                                style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 800, borderRadius: '7px', border: '1.5px solid', borderColor: transferMode === 'TABLE' ? '#16a34a' : '#e2e8f0', background: transferMode === 'TABLE' ? '#f0fdf4' : '#f8fafc', color: transferMode === 'TABLE' ? '#16a34a' : '#64748b', cursor: 'pointer' }}
                                            >
                                                TABLE
                                            </button>
                                            <button
                                                onClick={() => setTransferMode('BILL')}
                                                style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 800, borderRadius: '7px', border: '1.5px solid', borderColor: transferMode === 'BILL' ? '#2563eb' : '#e2e8f0', background: transferMode === 'BILL' ? '#eff6ff' : '#f8fafc', color: transferMode === 'BILL' ? '#2563eb' : '#64748b', cursor: 'pointer' }}
                                            >
                                                BILL NO.
                                            </button>
                                        </div>

                                        {/* Item selection */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '130px', overflowY: 'auto', marginBottom: '8px' }}>
                                            {billItems.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', padding: '5px 10px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', flex: 1 }}>{item.name} (x{item.quantity})</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '2px 6px' }}>
                                                        <button onClick={() => setTransferItemSel(s => ({ ...s, [idx]: Math.max(0, (s[idx] || 0) - 1) }))}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>−</button>
                                                        <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 800 }}>{transferItemSel[idx] || 0}</span>
                                                        <button onClick={() => setTransferItemSel(s => ({ ...s, [idx]: Math.min(item.quantity, (s[idx] || 0) + 1) }))}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>+</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* TABLE mode: grid of occupied tables */}
                                        {transferMode === 'TABLE' && (
                                            <>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Select destination table:</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                                                    {tables.filter(t => (t.status === 'OCCUPIED' || t.status === 'PRINTED') && t.table_no !== tableNo && t.table_number !== tableNo).map(t => (
                                                        <button key={t._id}
                                                            onClick={() => handleTransferToTable(t)}
                                                            style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: t.status === 'PRINTED' ? '#f0fdf4' : '#fffbeb', color: t.status === 'PRINTED' ? '#15803d' : '#92400e', borderRadius: '8px', border: `1.5px solid ${t.status === 'PRINTED' ? '#86efac' : '#fde68a'}`, cursor: 'pointer', fontSize: '11px', fontWeight: 800, transition: 'all 0.15s' }}
                                                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                                        >
                                                            <TableLogo size={16} />
                                                            <span style={{ marginTop: '2px' }}>{t.table_number || t.table_no}</span>
                                                        </button>
                                                    ))}
                                                    {tables.filter(t => (t.status === 'OCCUPIED' || t.status === 'PRINTED') && t.table_no !== tableNo && t.table_number !== tableNo).length === 0 && (
                                                        <p style={{ gridColumn: '1/-1', fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>No other active tables found.</p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {/* BILL mode: search for target bill */}
                                        {transferMode === 'BILL' && (
                                            <>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Search target bill number:</div>
                                                <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. BILL-123 or table name..."
                                                        value={transferBillQuery}
                                                        onChange={e => { setTransferBillQuery(e.target.value); searchTransferBills(e.target.value); setTransferTargetBill(null); }}
                                                        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12px', border: '1.5px solid #bfdbfe', borderRadius: '8px', outline: 'none', color: '#1e293b' }}
                                                    />
                                                    {transferBillLoading && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#94a3b8' }}>...</span>}
                                                    {transferBillResults.length > 0 && !transferTargetBill && (
                                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', maxHeight: '140px', overflowY: 'auto', marginTop: '3px' }}>
                                                            {transferBillResults.map(b => (
                                                                <button key={b._id}
                                                                    onMouseDown={() => { setTransferTargetBill(b); setTransferBillQuery(b.bill_number); setTransferBillResults([]); }}
                                                                    style={{ width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                                >
                                                                    <span style={{ fontWeight: 800, fontSize: '12px', color: '#1e293b' }}>{b.bill_number}</span>
                                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{b.table_no || b.type} · ₹{b.grand_total || 0}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {transferTargetBill && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '8px', padding: '7px 10px', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e40af', flex: 1 }}>→ {transferTargetBill.bill_number}</span>
                                                        <button onClick={() => { setTransferTargetBill(null); setTransferBillQuery(''); }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', lineHeight: 1 }}>✕</button>
                                                    </div>
                                                )}
                                                <button onClick={handleTransferToBill}
                                                    style={{ width: '100%', padding: '8px', fontSize: '12px', fontWeight: 900, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 3px 8px rgba(37,99,235,0.3)' }}>
                                                    TRANSFER TO BILL
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}



                    {/* Split Form Section */}
                    {showSplitForm && (
                        <div className="customer-expandable-form animate-in slide-in-from-top-2 duration-300">
                            <div style={{ padding: '0 15px 15px' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>Select items to move to a new bill.</p>
                                <div className="split-items-list" style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {billItems.map((item, i) => (
                                        <div key={i} className="split-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontWeight: '500' }}>{item.name} (x{item.quantity})</span>
                                            <input type="checkbox" style={{ transform: 'scale(1.2)' }} />
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => { alert("Bill split successfully."); setShowSplitForm(false); }} style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'black', letterSpacing: '0.5px' }}>CREATE NEW BILL</button>
                            </div>
                        </div>
                    )}

                    {/* Item List */}
                    <div className={`order-items-header ${showRateColumn ? 'with-rate' : 'no-rate'}`}>
                        <span className="col-name">ITEM</span>
                        <span className="col-qty">QTY</span>
                        {showRateColumn && <span className="col-rate">RATE</span>}
                        <span className="col-amt">AMT</span>
                    </div>

                    {/* Loaded Bill Action Bar — shown when a bill is fetched via search */}
                    {loadedBillMode !== 'NONE' || (billItems.length > 0 && !selectedTableId && billNumber && !billNumber.startsWith('TEMP-')) ? (
                        billItems.length > 0 && !billNumber.startsWith('TEMP-') && (
                            <div style={{ display: 'flex', gap: '6px', padding: '6px 10px', background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ flex: 1, fontSize: '11px', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: '4px', padding: '1px 6px', fontSize: '10px' }}>{billNumber}</span>
                                    <span style={{ color: '#94a3b8' }}>Loaded</span>
                                </div>
                                <button onClick={() => loadBillForAlter(currentBillId, 'ALTER')}
                                    style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 800, background: '#f0f9ff', color: '#0369a1', border: '1.5px solid #bae6fd', borderRadius: '6px', cursor: 'pointer' }}>ALTER</button>
                                <button onClick={() => loadBillForAlter(currentBillId, 'RETURN')}
                                    style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>RETURN</button>
                                <button onClick={() => loadBillForAlter(currentBillId, 'TRANSFER')}
                                    style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 800, background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer' }}>TRANSFER</button>
                            </div>
                        )
                    ) : null}

                    {/* Scrollable area: items list + scrollable summary details */}
                    <div className="bill-scroll-area">
                        <div className={`order-items-list ${isOrderListCollapsed ? 'hidden' : ''}`}>
                            {billItems.length === 0 && previousItems.length === 0 ? (
                                <div className="empty-cart">
                                    <ShoppingBag size={48} />
                                    <p>Order is empty</p>
                                </div>
                            ) : (
                                <>
                                    {showConsolidatedView ? (
                                        // CONSOLIDATED VIEW
                                        getConsolidatedItems([...previousItems, ...billItems]).map((item, idx) => (
                                            <div key={`cons-${idx}`} className={`order-item-row ${showRateColumn ? 'with-rate' : 'no-rate'} ${item.is_complementary ? 'complementary' : ''}`} style={{ background: '#f8fafc', borderLeft: '3px solid #6366f1' }}>
                                                <div className="item-name-cell">
                                                    <div className="item-name-wrap">
                                                        <span style={{ color: '#475569' }}>{item.name}</span>
                                                        {item.notes && (
                                                            <div className="text-[10px] text-emerald-600 font-bold italic mt-0.5">
                                                                * {item.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="item-qty-cell" style={{ justifyContent: 'center' }}>
                                                    <span style={{ fontWeight: 800, color: '#334155' }}>{item.quantity}</span>
                                                </div>
                                                {showRateColumn && (
                                                    <div className="item-rate">
                                                        {item.is_complementary ? 0 : item.unit_price}
                                                    </div>
                                                )}
                                                <div className="item-amt">{item.is_complementary ? 0 : item.total_price}</div>
                                                <div className="item-actions-cell" style={{ justifyContent: 'center' }}>
                                                    <CheckCircle2 size={16} color="#64748b" opacity={0.5} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            {/* RUNNING TABLE EMPTY STATE */}
                                            {billItems.length === 0 && previousItems.length > 0 && (
                                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                                                    <ClipboardList size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                                                    <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Table is Running</p>
                                                    <p style={{ fontSize: '11px' }}>Add new items to place next order.</p>
                                                    <button onClick={() => setShowConsolidatedView(true)} style={{ marginTop: '15px', padding: '8px 16px', background: '#eef2ff', color: '#4f46e5', fontWeight: 800, fontSize: '12px', border: '1px solid #c7d2fe', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                        VIEW CONSOLIDATED BILL
                                                    </button>
                                                </div>
                                            )}

                                            {/* NEW ITEMS (Unsaved KOT) */}
                                    {billItems.map((item, idx) => (
                                        <div key={idx} className={`order-item-row ${showRateColumn ? 'with-rate' : 'no-rate'} ${item.is_complementary ? 'complementary' : ''}`}>
                                            <div className="item-name-cell">
                                                <div className="item-name-wrap flex items-center justify-between w-full">
                                                    <div
                                                        className="cursor-pointer hover:text-indigo-600 transition-colors flex-1"
                                                        onClick={() => {
                                                            setNoteModalIdx(idx);
                                                            setTempNote(item.notes || '');
                                                        }}
                                                    >
                                                        <span>{item.name}</span>
                                                        {item.notes && (
                                                            <div className="text-[10px] text-emerald-600 font-bold italic mt-0.5 animate-in fade-in slide-in-from-left-1">
                                                                * {item.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setNoteModalIdx(idx);
                                                            setTempNote(item.notes || '');
                                                        }}
                                                        className="text-[9px] bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 font-bold px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap ml-1 transition-colors"
                                                        title="Add Remarks"
                                                    >
                                                        + REMARK
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="item-qty-cell">
                                                {orderMode === 'PARTY_ORDER' ? (
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => updateItemQtyDirect(idx, e.target.value)}
                                                        style={{ width: '45px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', fontSize: '12px', fontWeight: 800 }}
                                                    />
                                                ) : (
                                                    <>
                                                        <button onClick={() => updateItemQuantity(item.product_id, -1)}><Minus size={12} /></button>
                                                        <span>{item.quantity}</span>
                                                        <button onClick={() => updateItemQuantity(item.product_id, 1)}><Plus size={12} /></button>
                                                    </>
                                                )}
                                            </div>
                                            {showRateColumn && (
                                                <div className="item-rate">
                                                    {orderMode === 'PARTY_ORDER' ? (
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={e => updateItemRate(idx, e.target.value)}
                                                            style={{ width: '55px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', fontSize: '12px', fontWeight: 800 }}
                                                        />
                                                    ) : (
                                                        item.is_complementary ? 0 : item.unit_price
                                                    )}
                                                </div>
                                            )}
                                            <div className="item-amt">{item.is_complementary ? 0 : item.total_price}</div>
                                            <div className="item-actions-cell">
                                                <button className="remove-btn" onClick={() => removeFromBill(idx)} title="Remove Item"><Trash2 size={14} /></button>
                                                {activeItemActions === idx && (
                                                    <div className="extra-actions-layer">
                                                        <button className="row-action-btn" onClick={() => handleTransferItem(idx)} title="Transfer Item"><ArrowLeftRight size={14} /></button>
                                                        <button className="row-action-btn" onClick={() => handleReturnItem(idx)} title="Return Item"><Undo2 size={14} /></button>
                                                        <button
                                                            className="row-action-btn"
                                                            onClick={() => {
                                                                setNoteModalIdx(idx);
                                                                setTempNote(item.notes || '');
                                                                setActiveItemActions(null);
                                                            }}
                                                            title="Add Notes/Instructions"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            className={`comp-toggle-sm ${item.is_complementary ? 'active' : ''}`}
                                                            onClick={() => toggleComplementary(idx)}
                                                            title="Complementary"
                                                        >
                                                            <Gift size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    className={`item-action-toggle ${activeItemActions === idx ? 'active' : ''}`}
                                                    onClick={() => setActiveItemActions(activeItemActions === idx ? null : idx)}
                                                    title="Action Toggle"
                                                >
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Scrollable Summary Section */}
                        <div className="order-summary-scrollable">
                            <div className="summary-section">
                                {showMoreForm && (
                                    <div className={`collapsible-summary-area animate-in fade-in slide-in-from-top-2 duration-300`}>
                                        <div className="sum-row" style={{ padding: '5px 0', borderBottom: '1px dashed #e2e8f0' }}>
                                            <span>Subtotal ({billItems.length} items)</span>
                                            <span className="mono">₹{subTotal.toFixed(2)}</span>
                                        </div>

                                        <div className="summary-details-grid">
                                            <div className="sum-detail-row">
                                                <label>Discount</label>
                                                <div className="discount-inputs-flex">
                                                    <div className="input-with-toggle">
                                                        <span>₹</span>
                                                        <input
                                                            type="number"
                                                            value={discountType === 'FIXED' ? discount : (subTotal > 0 ? (discount * subTotal / 100).toFixed(2) : 0)}
                                                            onChange={(e) => { setDiscount(e.target.value); setDiscountType('FIXED'); }}
                                                        />
                                                    </div>
                                                    <div className="input-with-toggle">
                                                        <span>%</span>
                                                        <input
                                                            type="number"
                                                            value={discountType === 'PERCENT' ? discount : (subTotal > 0 ? (discount / subTotal * 100).toFixed(2) : 0)}
                                                            onChange={(e) => { setDiscount(e.target.value); setDiscountType('PERCENT'); }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="calc-val">- ₹{billCalculations.discountAmount.toFixed(2)}</span>
                                            </div>

                                            <div className="sum-detail-row">
                                                <label>Deliv. Chg</label>
                                                <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} />
                                                <span className="calc-val">+ ₹{billCalculations.deliveryCharge.toFixed(2)}</span>
                                            </div>

                                            <div className="sum-detail-row">
                                                <label>Pack. Chg</label>
                                                <input type="number" value={containerCharge} onChange={(e) => setContainerCharge(e.target.value)} />
                                                <span className="calc-val">+ ₹{billCalculations.containerCharge.toFixed(2)}</span>
                                            </div>

                                            <div className="sum-detail-row">
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    Tax ({gstPercentage}%)
                                                    <select
                                                        value={taxType}
                                                        onChange={e => setTaxType(e.target.value)}
                                                        className="tax-selector">
                                                        <option value="EXCLUSIVE">Exclusive</option>
                                                        <option value="INCLUSIVE">Inclusive</option>
                                                    </select>
                                                </label>
                                                <div className="empty-input"></div>
                                                <span className="calc-val">{taxType === 'EXCLUSIVE' ? '+' : '(Inc)'} ₹{taxAmount.toFixed(2)}</span>
                                            </div>

                                            {loyaltyRedeemedPoints > 0 && (
                                                <div className="sum-detail-row">
                                                    <label>Loyalty ({loyaltyRedeemedPoints} Pts)</label>
                                                    <div className="empty-input"></div>
                                                    <span className="calc-val">- ₹{loyaltyDiscount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {appliedCoupon && (
                                                <div className="sum-detail-row">
                                                    <label>Coupon ({appliedCoupon.coupon_name})</label>
                                                    <div className="empty-input"></div>
                                                    <span className="calc-val">- ₹{couponDiscount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="sum-detail-row">
                                                <label>Round Off</label>
                                                <div className="empty-input"></div>
                                                <span className="calc-val">{roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showLoyaltyForm && loyaltyEnabled && (
                                    <div className="customer-expandable-form animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="loyalty-form-internal" style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block' }}>CUSTOMER WALLET</span>
                                                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#4f46e5' }}>{customerPoints} Points</span>
                                                </div>
                                                {loyaltySettings.target_points > 0 && (
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8', display: 'block' }}>TARGET FOR REDEEM</span>
                                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: customerPoints >= loyaltySettings.target_points ? '#166534' : '#94a3b8' }}>
                                                            {loyaltySettings.target_points} PTS
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="number"
                                                    placeholder="Points to redeem"
                                                    value={redeemPointsInput}
                                                    onChange={(e) => setRedeemPointsInput(e.target.value)}
                                                    className="input-premium"
                                                    style={{ flex: 1, height: '38px', fontSize: '12px' }}
                                                    disabled={customerPoints < (loyaltySettings.target_points || 0)}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const pts = parseInt(redeemPointsInput);
                                                        if (isNaN(pts) || pts <= 0) return alert('Enter valid points');
                                                        if (pts > customerPoints) return alert('Insufficient points');
                                                        if (pts < (loyaltySettings.target_points || 0)) return alert(`Minimum ${loyaltySettings.target_points} points required to redeem`);

                                                        setLoyaltyRedeemedPoints(pts);
                                                        setRedeemPointsInput('');
                                                        alert(`${pts} Points applied for redemption!`);
                                                    }}
                                                    className="btn-premium-primary"
                                                    style={{ height: '38px', padding: '0 15px', fontSize: '11px', fontWeight: '900' }}
                                                    disabled={customerPoints < (loyaltySettings.target_points || 0)}
                                                >
                                                    REDEEM
                                                </button>
                                            </div>

                                            {loyaltyRedeemedPoints > 0 && (
                                                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eef2ff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                                                    <span style={{ fontSize: '11px', color: '#3730a3', fontWeight: 'bold' }}>
                                                        Redeeming: {loyaltyRedeemedPoints} Pts (Value: ₹{loyaltyRedeemedPoints * loyaltySettings.point_value})
                                                    </span>
                                                    <button onClick={() => setLoyaltyRedeemedPoints(0)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' }}>REMOVE</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {showCouponForm && (
                                    <div className="customer-expandable-form animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="coupon-form-internal" style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <select
                                                        value={couponSearchName}
                                                        onChange={(e) => setCouponSearchName(e.target.value)}
                                                        className="input-premium"
                                                        style={{ width: '100%', height: '38px', fontSize: '12px' }}
                                                    >
                                                        <option value="">Select Coupon</option>
                                                        {availableCoupons.map(c => (
                                                            <option key={c._id} value={c.coupon_name}>{c.coupon_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <input
                                                        type="number"
                                                        placeholder="Coupon Number"
                                                        value={couponNumber}
                                                        onChange={(e) => setCouponNumber(e.target.value)}
                                                        className="input-premium"
                                                        style={{ width: '100%', height: '38px', fontSize: '12px' }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '0 16px', borderRadius: '8px', height: '38px', fontWeight: '900', fontSize: '0.75rem' }}
                                                >
                                                    APPLY
                                                </button>
                                            </div>
                                            {appliedCoupon && (
                                                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>
                                                        Applied: {appliedCoupon.coupon_name}
                                                        ({appliedCoupon.type === 'DISCOUNT' ? (appliedCoupon.discount_type === 'PERCENT' ? `${appliedCoupon.discount_value}%` : `₹${appliedCoupon.discount_value}`) : 'BOGO'})
                                                    </span>
                                                    <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' }}>REMOVE</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="order-footer-fixed">
                        {/* Top Control Buttons moved above summary */}
                        <div className="billing-actions-panel">
                            <div className="panel-controls">
                                {loyaltyUnlocked && loyaltyEnabled && (
                                    <button className={`control-btn ${showLoyaltyForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('LOYALTY')}>
                                        <Gift size={15} /> Loyalty
                                    </button>
                                )}
                                {couponUnlocked && couponEnabled && (
                                    <button className={`control-btn ${showCouponForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('COUPON')}>
                                        <Ticket size={15} /> COUPON
                                    </button>
                                )}
                                <button className={`control-btn ${showMoreForm ? 'active' : ''}`} onClick={() => toggleExpandableForm('MORE')}>
                                    <MoreHorizontal size={15} /> More
                                </button>
                            </div>
                        </div>

                        <div className="summary-section" style={{ padding: '12px 8px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '12px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL PAYABLE</span>
                                        <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                            {previousItems.reduce((sum, item) => sum + item.quantity, 0) + billItems.reduce((sum, item) => sum + item.quantity, 0)} QTY
                                        </span>
                                    </div>
                                    {orderMode === 'PARTY_ORDER' && partyData?.advance_paid > 0 && (
                                        <span style={{ fontSize: '10px', color: '#f97316', fontWeight: 'bold', marginTop: '4px' }}>
                                            (Total: ₹{grandTotal.toFixed(2)} - Adv: ₹{partyData.advance_paid.toFixed(2)})
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '24px', fontWeight: '900', color: '#ea580c', letterSpacing: '-0.5px' }}>₹{(orderMode === 'PARTY_ORDER' ? Math.max(0, grandTotal - (partyData?.advance_paid || 0)) : grandTotal).toFixed(2)}</span>
                            </div>
                        </div>



                        {/* Integrated Sidebar Payment Flow */}
                        {stepProceeded && (
                            <SidebarPaymentFlow
                                grandTotal={orderMode === 'PARTY_ORDER' ? Math.max(0, grandTotal - (partyData?.advance_paid || 0)) : grandTotal}
                                onPaymentSubmit={handlePaymentSubmit}
                                onCancel={() => setStepProceeded(false)}
                                loading={paymentLoading}
                                partialAllowed={orderMode === 'PARTY_ORDER'}
                            />
                        )}

                        <div className="footer-actions-grid">
                            {showConsolidatedView ? (
                                <>
                                    <button type="button" className="action-btn" style={{ gridColumn: '1 / -1', padding: '10px 0', fontSize: '13px', background: '#f1f5f9', color: '#475569', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => setShowConsolidatedView(false)} title="Go Back">
                                        BACK
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" className="action-btn save-bill" onClick={() => handleOrderAction('SAVE')} title="Save draft bill">
                                        SAVE
                                    </button>
                                    <button type="button" className="action-btn print-bill" onClick={() => handleOrderAction('PRINT')} title="Save and print final bill">
                                        SAVE & PRINT
                                    </button>
                                    <button type="button" className="action-btn kot-print" onClick={() => handleOrderAction('KOT_SAVE')} title="Save KOT">
                                        KOT
                                    </button>
                                    <button type="button" className="action-btn kot-print" onClick={() => handleOrderAction('KOT')} title="Send KOT to kitchen">
                                        KOT PRINT
                                    </button>
                                    <button type="button" className="action-btn hold-bill" onClick={holdCurrentBill} title="Hold this bill for later">
                                        HOLD
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {variationModalProduct && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select VARIANTS</h3>
                                <p className="text-xs text-indigo-600 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                    {variationModalProduct.name}
                                </p>
                            </div>
                            <button onClick={() => setVariationModalProduct(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {(variationModalProduct.variations || []).map((v, i) => (
                                <button
                                    key={i}
                                    onClick={() => addToBill(variationModalProduct, v, [], true)}
                                    className="w-full flex items-center justify-between p-5 border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group hover:shadow-lg hover:shadow-indigo-500/10"
                                >
                                    <div className="text-left">
                                        <div className="font-black text-lg text-slate-800 group-hover:text-indigo-700 tracking-tight">{v.name}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1.5">Variant Price</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                                            ₹{(variationModalProduct.selling_price || 0) + (v.amount || 0)}
                                        </div>
                                        {(v.amount > 0) && <div className="text-[10px] text-slate-400 font-bold">+₹{v.amount} extra</div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-center border-t border-slate-100">
                            <button onClick={() => setVariationModalProduct(null)} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-rose-500 transition-colors">
                                <X size={14} /> Close & Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {addonModalProduct && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Choice of ADD ON</h3>
                                <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                    {addonModalProduct.name} {tempVariation ? `(${tempVariation.name})` : ''}
                                </p>
                            </div>
                            <button onClick={() => { setAddonModalProduct(null); setTempSelectedAddons([]); setTempVariation(null); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                            {(addonModalProduct.addons || []).map((addon, i) => {
                                const isSelected = tempSelectedAddons.some(a => a.name === addon.name);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (isSelected) {
                                                setTempSelectedAddons(tempSelectedAddons.filter(a => a.name !== addon.name));
                                            } else {
                                                setTempSelectedAddons([...tempSelectedAddons, addon]);
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between p-4 border-2 rounded-2xl transition-all group ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200'}`}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                            <div className="text-left">
                                                <div className={`font-black text-base tracking-tight ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{addon.name}</div>
                                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Extra Sub-Asset</div>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-black tracking-tighter ${isSelected ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            +₹{addon.rate}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-slate-50 flex flex-col gap-4 border-t border-slate-100">
                            <button
                                onClick={() => addToBill(addonModalProduct, tempVariation, tempSelectedAddons, true)}
                                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                            >
                                <Plus size={18} /> Confirm & Add {tempSelectedAddons.length > 0 && `(+₹${tempSelectedAddons.reduce((s, a) => s + a.rate, 0)})`}
                            </button>
                            <button
                                onClick={() => addToBill(addonModalProduct, tempVariation, [], true)}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                            >
                                No Thanks, Skip Extras
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBillPreview && (
                <BillPreviewModal
                    isOpen={showBillPreview}
                    onClose={() => setShowBillPreview(false)}
                    billId={lastBillId}
                    paymentModes={lastPaymentModes}
                />
            )}

            {showPayModePopup && (
                <PayModePopup
                    grandTotal={orderMode === 'PARTY_ORDER' ? Math.max(0, grandTotal - (partyData?.advance_paid || 0)) : grandTotal}
                    onPaymentSubmit={handlePopupPaymentSubmit}
                    onCancel={() => setShowPayModePopup(false)}
                    loading={paymentLoading}
                />
            )}

            {noteModalIdx !== null && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Custom Instruction</h3>
                                <p className="text-xs text-indigo-600 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                    {billItems[noteModalIdx]?.name}
                                </p>
                            </div>
                            <button onClick={() => setNoteModalIdx(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes (e.g. Spicy, Less Oil)</label>
                                <textarea
                                    autoFocus
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-600 focus:bg-white transition-all outline-none"
                                    rows="3"
                                    placeholder="Add specific instructions for the chef..."
                                    value={tempNote}
                                    onChange={(e) => setTempNote(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-2 p-1 overflow-x-auto pb-2 scrollbar-none">
                                {['Spicy', 'Less Oil', 'Sugar Free', 'Creamy', 'No Onions', 'Extra Hot'].map(suggest => (
                                    <button
                                        key={suggest}
                                        onClick={() => setTempNote(suggest)}
                                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                                    >
                                        {suggest}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-4 border-t border-slate-100">
                            <button
                                onClick={() => setNoteModalIdx(null)}
                                className="flex-1 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 bg-white border border-slate-200 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const newItems = [...billItems];
                                    newItems[noteModalIdx].notes = tempNote;
                                    setBillItems(newItems);

                                    // Update in backend if active bill exists
                                    if (currentBillId && !billNumber.startsWith('TEMP-')) {
                                        try {
                                            const savedUser = localStorage.getItem('user');
                                            const { token } = JSON.parse(savedUser);
                                            await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                body: JSON.stringify({ items: newItems })
                                            });
                                        } catch (e) { console.error("Notes save failed", e); }
                                    }

                                    setNoteModalIdx(null);
                                }}
                                className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── PARTY SELECTION MODAL ── */}
            {showPartySelectionModal && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowPartySelectionModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl p-10 border border-white/20 relative my-8 animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                                <PartyPopper size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Party Orders</h3>
                                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">Select a party to add items to the cart</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">

                            {partySelectionOrders.map(order => {
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
                                    <div
                                        key={order._id}
                                        onClick={() => loadPartyOrder(order)}
                                        className="bg-white border border-slate-100 rounded-[2rem] p-6 cursor-pointer hover:border-orange-500 hover:shadow-lg transition-all group relative overflow-hidden min-h-[200px] flex flex-col"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 ${order.party_status === 'READY_TO_DISPATCH' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                                                }`}>
                                                {order.party_status?.replace(/_/g, ' ') || 'PREPARING'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">
                                                {order.bill_number}
                                            </span>
                                        </div>

                                        <h4 className="text-lg font-black text-slate-800 tracking-tight mb-1 truncate">{order.customer_name || 'Unnamed Party'}</h4>
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-4">
                                            <Phone size={12} /> {order.customer_phone}
                                        </div>

                                        <div className="mt-auto space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <span className="flex items-center gap-1.5"><Calendar size={12} /> {displayDate}</span>
                                                {daysLeft !== null && (
                                                    <span className={`${daysLeft <= 1 ? 'text-rose-600' : 'text-amber-500'}`}>
                                                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Today' : `${daysLeft} days`}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5"><Clock size={12} /> {order.delivery_time || '--:--'}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items: {order.items?.length || 0}</span>
                                                <span className="text-sm font-black text-slate-900">₹{(order.grand_total || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {showPartyBookingModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20 animate-in zoom-in duration-300">
                        <div className="flex flex-col md:flex-row h-full">
                            {/* Left Side: Calendar and Date/Time */}
                            <div className="flex-1 p-8 bg-slate-50 border-r border-slate-100">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Party Date & Time</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Select delivery schedule</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronLeft size={20} /></button>
                                        <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><ChevronRight size={20} /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-8">
                                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                        <div key={d} className="text-center text-[10px] font-black text-slate-300 tracking-widest pb-4">{d}</div>
                                    ))}
                                    {(() => {
                                        const days = [];
                                        const first = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1);
                                        const last = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 0);
                                        const startPadding = first.getDay();
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);

                                        for (let i = 0; i < startPadding; i++) days.push(<div key={`p-${i}`} />);

                                        for (let d = 1; d <= last.getDate(); d++) {
                                            const dateObj = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), d);
                                            const dateStr = dateObj.toISOString().split('T')[0];
                                            const isPast = dateObj < today;
                                            const isBooked = bookedDates.includes(dateStr);
                                            const isSelected = tempPartyBooking.date === dateStr;

                                            days.push(
                                                <button
                                                    key={d}
                                                    disabled={isPast}
                                                    onClick={() => setTempPartyBooking(p => ({ ...p, date: dateStr }))}
                                                    style={{
                                                        padding: '12px 2px',
                                                        borderRadius: '16px',
                                                        fontSize: '14px',
                                                        fontWeight: 900,
                                                        transition: 'all 0.2s',
                                                        background: isSelected ? '#ea580c' : (isBooked ? '#ef4444' : (isPast ? 'transparent' : '#fff')),
                                                        color: isSelected ? '#fff' : (isBooked ? '#fff' : (isPast ? '#cbd5e1' : '#1e293b')),
                                                        border: isPast ? 'none' : '1px solid #f1f5f9',
                                                        opacity: isPast ? 0.3 : 1
                                                    }}
                                                    className={`relative ${isSelected ? 'shadow-lg shadow-orange-500/30' : (isBooked ? 'shadow-md shadow-red-500/20' : 'hover:border-orange-200 hover:shadow-sm')}`}
                                                >
                                                    {d}
                                                    {isBooked && !isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                </button>
                                            );
                                        }
                                        return days;
                                    })()}
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-slate-800">
                                            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Clock size={20} /></div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Time</div>
                                                <input
                                                    type="time"
                                                    value={tempPartyBooking.time}
                                                    onChange={(e) => setTempPartyBooking(p => ({ ...p, time: e.target.value }))}
                                                    className="font-black text-sm bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-900"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Date</div>
                                            <div className="text-sm font-black text-slate-800">{tempPartyBooking.date || 'Choose Date'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Next Actions */}
                            <div className="w-full md:w-[350px] p-8 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-4">Confirm <span className="text-orange-600">Booking</span></h4>
                                        <p className="text-sm text-slate-500 font-bold leading-relaxed">Please select an available date (white) or current date. Booked dates (red) may already have scheduled deliveries.</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-600 text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <div className="w-3 h-3 rounded-full bg-white border border-slate-200"></div>
                                            Available Dates
                                        </div>
                                        <div className="flex items-center gap-3 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-2xl border border-red-100">
                                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-200"></div>
                                            Already Booked
                                        </div>
                                        <div className="flex items-center gap-3 text-orange-600 text-xs font-bold bg-orange-50 p-3 rounded-2xl border border-orange-100">
                                            <div className="w-3 h-3 rounded-full bg-orange-600 shadow-md shadow-orange-200"></div>
                                            Your Selection
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-12">
                                    <button
                                        disabled={!tempPartyBooking.date}
                                        onClick={() => setShowPartyCustomerForm(true)}
                                        className="w-full bg-slate-900 text-white rounded-[1.5rem] py-5 font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        CONTINUE <ArrowRight size={18} />
                                    </button>
                                    <button onClick={() => setShowPartyBookingModal(false)} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] py-2 hover:text-rose-500 transition-colors">
                                        CANCEL BOOKING
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PARTY CUSTOMER FORM ── */}
            {showPartyCustomerForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in slide-in-from-bottom-5 duration-400">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Customer <span className="text-orange-600">Details</span></h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                    FOR PARTY ON {new Date(tempPartyBooking.date).toLocaleDateString()} AT {tempPartyBooking.time}
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-orange-600">
                                <User size={24} />
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={partyData?.customer_name || ''}
                                            onChange={(e) => setPartyData(p => ({ ...p, customer_name: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-sm font-black text-slate-800 focus:border-orange-600 focus:bg-white transition-all outline-none"
                                            placeholder="e.g. John Doe"
                                        />
                                        <User size={18} className="absolute left-4 top-4 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={partyData?.customer_phone || ''}
                                            onChange={(e) => setPartyData(p => ({ ...p, customer_phone: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-sm font-black text-slate-800 focus:border-orange-600 focus:bg-white transition-all outline-none"
                                            placeholder="10-digit mobile number"
                                        />
                                        <Smartphone size={18} className="absolute left-4 top-4 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Alternate Number (Optional)</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={partyData?.alternate_phone || ''}
                                            onChange={(e) => setPartyData(p => ({ ...p, alternate_phone: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-sm font-black text-slate-800 focus:border-orange-600 focus:bg-white transition-all outline-none"
                                            placeholder="Alternate mobile number"
                                        />
                                        <Smartphone size={18} className="absolute left-4 top-4 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Delivery Location</label>
                                    <div className="relative group">
                                        <textarea
                                            rows="2"
                                            value={partyData?.customer_address || ''}
                                            onChange={(e) => setPartyData(p => ({ ...p, customer_address: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-sm font-black text-slate-800 focus:border-orange-600 focus:bg-white transition-all outline-none"
                                            placeholder="Complete delivery address..."
                                        />
                                        <MapPin size={18} className="absolute left-4 top-4 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-8">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Function Type</label>
                                <div className="relative group">
                                    <select
                                        value={partyData?.function_type || ''}
                                        onChange={(e) => setPartyData(p => ({ ...p, function_type: e.target.value }))}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 text-sm font-black text-slate-800 focus:border-orange-600 focus:bg-white transition-all outline-none appearance-none"
                                    >
                                        <option value="">Select Function Type (Optional)</option>
                                        {functionTypes.map(ft => (
                                            <option key={ft._id} value={ft.name}>{ft.name}</option>
                                        ))}
                                    </select>
                                    <ClipboardList size={18} className="absolute left-4 top-4 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowPartyCustomerForm(false)}
                                    className="flex-1 px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest text-slate-400 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                                >
                                    BACK
                                </button>
                                <button
                                    disabled={!partyData?.customer_name || !partyData?.customer_phone}
                                    onClick={async () => {
                                        setPartyData(p => ({
                                            ...p,
                                            delivery_date: tempPartyBooking.date,
                                            delivery_time: tempPartyBooking.time
                                        }));
                                        setOrderMode('PARTY_ORDER');
                                        setShowPartyCustomerForm(false);
                                        setShowPartyBookingModal(false);

                                        // Explicitly update the DB so the party shell exists
                                        if (currentBillId) {
                                            try {
                                                const { token } = JSON.parse(localStorage.getItem('user'));
                                                await fetch(`${import.meta.env.VITE_API_URL}/bills/${currentBillId}`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({
                                                        type: 'PARTY_ORDER',
                                                        order_mode: 'PARTY_ORDER',
                                                        party_status: 'PREPARING',
                                                        customer_name: partyData?.customer_name,
                                                        customer_phone: partyData?.customer_phone,
                                                        alternate_phone: partyData?.alternate_phone,
                                                        customer_address: partyData?.customer_address,
                                                        delivery_date: tempPartyBooking.date,
                                                        delivery_time: tempPartyBooking.time,
                                                        function_type: partyData?.function_type
                                                    })
                                                });
                                            } catch (e) { console.error('Failed to update party shell', e); }
                                        }
                                    }}
                                    className="flex-2 bg-orange-600 text-white rounded-[1.5rem] py-5 font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-orange-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                    style={{ flex: 2 }}
                                >
                                    SAVE & CONTINUE <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ── PARTY MANAGEMENT DASHBOARD (KDS) ── */}
            {showPartyManagement && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[2500] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden border border-white/20 animate-in slide-in-from-bottom-10 duration-500 flex flex-col">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-orange-600 text-white rounded-[1.5rem] shadow-lg shadow-orange-200">
                                    <ClipboardList size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tighter">Party Order Management</h2>
                                    <div className="flex items-center gap-4 mt-1.5">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
                                            KITCHEN PRODUCTION DISPLAY
                                        </p>
                                        <div className="h-3 w-[1px] bg-slate-200" />
                                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                            <Calendar size={12} className="text-orange-600" />
                                            <input
                                                type="date"
                                                value={partyMgtDate}
                                                onChange={(e) => { setPartyMgtDate(e.target.value); fetchPartyOrders(e.target.value); }}
                                                className="text-[11px] font-black text-slate-700 bg-transparent border-none outline-none p-0 w-24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowPartyManagement(false)} className="p-4 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-full transition-all group">
                                <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Main Grid */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Side: Aggregated Production View */}
                            <div className="w-[350px] border-r border-slate-100 bg-slate-50/30 p-8 flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Production View</h4>
                                    <div className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">TOTAL ITEMS</div>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-premium">
                                    {(() => {
                                        const totalItems = {};
                                        partyOrders.forEach(order => {
                                            order.items.forEach(item => {
                                                totalItems[item.name] = (totalItems[item.name] || 0) + item.quantity;
                                            });
                                        });
                                        return Object.entries(totalItems).length > 0 ? Object.entries(totalItems).map(([name, qty]) => (
                                            <div key={name} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-orange-200 transition-all">
                                                <span className="font-black text-slate-800 text-sm tracking-tight">{name}</span>
                                                <span className="bg-slate-900 text-white px-3 py-1 rounded-xl text-xs font-black min-w-[45px] text-center shadow-lg group-hover:bg-orange-600 transition-colors">
                                                    {qty} nos
                                                </span>
                                            </div>
                                        )) : <div className="text-center py-20 text-slate-300 font-bold italic text-sm">No orders for this date.</div>;
                                    })()}
                                </div>
                            </div>

                            {/* Main Area: Orders List */}
                            <div className="flex-1 p-8 overflow-y-auto scrollbar-premium bg-white">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    {partyOrders.map(order => (
                                        <div key={order._id} className="bg-white rounded-[2rem] border-2 border-slate-50 shadow-xl overflow-hidden hover:border-orange-100 transition-all flex flex-col">
                                            <div className="p-6 border-b border-slate-50 flex justify-between items-start bg-slate-50/30">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="font-black text-lg text-slate-800 tracking-tight">{order.customer_name}</h5>
                                                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${order.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>{order.status}</div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                                                        <Smartphone size={10} /> {order.customer_phone || 'No phone'}
                                                        <span className="mx-2 text-slate-200">|</span>
                                                        <Clock size={10} /> {order.delivery_time || '12:00'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-slate-800 tracking-tighter">₹{(order.grand_total || 0).toFixed(2)}</div>
                                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Total Bill</div>
                                                </div>
                                            </div>

                                            <div className="flex-1 p-6 space-y-3">
                                                <div className="grid grid-cols-1 gap-2">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs' p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                                            <span className="font-bold text-slate-700">{item.name}</span>
                                                            <span className="font-black text-slate-900">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-6 bg-slate-50/50 border-t border-slate-50 grid grid-cols-2 gap-4">
                                                <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Due</div>
                                                    <div className={`text-sm font-black ${order.grand_total - (order.partial_payments?.reduce((s, p) => s + p.amount, 0) || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        ₹{(order.grand_total - (order.partial_payments?.reduce((s, p) => s + p.amount, 0) || 0) || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm border-orange-100">
                                                    <div className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Vessel Amt</div>
                                                    <div className="text-sm font-black text-orange-600">₹{(order.vessel_amount || 0).toFixed(2)}</div>
                                                </div>
                                            </div>

                                            <div className="p-6 flex gap-3">
                                                <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all flex items-center justify-center gap-2">
                                                    <CheckCircle size={14} /> Ready
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Logic for delivery - Collect payment if balance exists
                                                        const balance = order.grand_total - (order.partial_payments?.reduce((s, p) => s + p.amount, 0) || 0);
                                                        if (balance > 0.01) {
                                                            // Load this bill into the main screen for payment
                                                            loadBillForAlter(order, 'PAYMODE');
                                                            setShowPartyManagement(false);
                                                        } else {
                                                            alert("Marking as Delivered...");
                                                            // Update status to DELIVERED effectively
                                                        }
                                                    }}
                                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                                >
                                                    <Truck size={14} /> Deliver
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {partyOrders.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-bold italic">No bookings found for this selection.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPage;
