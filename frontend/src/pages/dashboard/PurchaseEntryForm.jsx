import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import './Dashboard.css';
import './PurchaseEntryForm.css';
import {
    Settings, ChevronDown, Plus, Trash2, Loader2,
    Upload, FileText, BarChart2, Printer, Save, XCircle, X, MoreHorizontal
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const getToken = () => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return null; } };

const emptyItem = () => ({
    product_id: '', barcode: '', code: '', item_name: '', unit: '',
    quantity: 1, purchase_rate: 0, rate_tax: 0, amount: 0,
    discount_percent: 0, discount_amount: 0,
    cd_percent: 0, dc_amount: 0,
    gst_percent: 0, cgst_percent: 0, cgst_amount: 0,
    sgst_percent: 0, sgst_amount: 0, tax_amount: 0,
    total_amount: 0, cost_rate: 0, sales_rate: 0,
    mrp: 0, hsn_code: ''
});

const COL_TO_FIELD = {
    "BARCODE": "barcode",
    "CODE": "code",
    "ITEM_NAME": "item_name",
    "UNIT": "unit",
    "QTY": "quantity",
    "RATE": "purchase_rate",
    "RATE+TAX": "rate_tax",
    "DIS%": "discount_percent",
    "CD%": "cd_percent",
    "PUR_RATE": "purchase_rate",
    "COST": "cost_rate",
    "SALES_RATE": "sales_rate",
    "MRP": "mrp",
    "HSN_CODE": "hsn_code"
};

const calcItem = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    let rate = parseFloat(item.purchase_rate) || 0;
    const disP = parseFloat(item.discount_percent) || 0;
    const cdP = parseFloat(item.cd_percent) || 0;
    const gstP = parseFloat(item.gst_percent) || 0;

    let rateTax = parseFloat(item.rate_tax) || 0;
    if (item._lastEditedField === 'rate_tax' && rateTax > 0) {
        rate = rateTax / (1 + (gstP / 100));
    } else {
        rateTax = rate + (rate * (gstP / 100));
    }

    const amount = qty * rate;
    const disAmt = amount * (disP / 100);
    const dcAmt = (amount - disAmt) * (cdP / 100);
    const taxableAmt = amount - disAmt - dcAmt;
    
    const cgstP = gstP / 2;
    const sgstP = gstP / 2;
    const cgstAmt = taxableAmt * (cgstP / 100);
    const sgstAmt = taxableAmt * (sgstP / 100);
    const taxAmt = cgstAmt + sgstAmt;
    const totalAmt = taxableAmt + taxAmt;

    return {
        ...item,
        purchase_rate: parseFloat(rate.toFixed(2)),
        rate_tax: parseFloat(rateTax.toFixed(2)),
        amount: parseFloat(amount.toFixed(2)),
        discount_amount: parseFloat(disAmt.toFixed(2)),
        dc_amount: parseFloat(dcAmt.toFixed(2)),
        cgst_percent: parseFloat(cgstP.toFixed(2)),
        cgst_amount: parseFloat(cgstAmt.toFixed(2)),
        sgst_percent: parseFloat(sgstP.toFixed(2)),
        sgst_amount: parseFloat(sgstAmt.toFixed(2)),
        tax_amount: parseFloat(taxAmt.toFixed(2)),
        total_amount: parseFloat(totalAmt.toFixed(2))
    };
};

const calcTotals = (items, otherCharges = 0, roundOff = 0) => {
    let subTotal = 0, discAmt = 0, taxAmt = 0, cgst = 0, sgst = 0;
    items.forEach(it => {
        subTotal += it.amount || 0;
        discAmt += it.discount_amount || 0;
        taxAmt += it.tax_amount || 0;
        cgst += it.cgst_amount || 0;
        sgst += it.sgst_amount || 0;
    });
    const netAmt = subTotal - discAmt + taxAmt + parseFloat(otherCharges || 0) + parseFloat(roundOff || 0);
    return {
        sub_total: parseFloat(subTotal.toFixed(2)),
        discount_amount: parseFloat(discAmt.toFixed(2)),
        tax_amount: parseFloat(taxAmt.toFixed(2)),
        cgst_amount: parseFloat(cgst.toFixed(2)),
        sgst_amount: parseFloat(sgst.toFixed(2)),
        net_amount: parseFloat(netAmt.toFixed(2)),
        grand_total: parseFloat(netAmt.toFixed(2))
    };
};

export default function PurchaseEntryForm() {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Bill header
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentType, setPaymentType] = useState('CREDIT');
    const [supplierId, setSupplierId] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const getTodayStr = () => new Date().toISOString().split('T')[0];
    const [dueDays, setDueDays] = useState(0);
    const [dueDate, setDueDate] = useState(getTodayStr);
    const [remarks, setRemarks] = useState('');
    const [otherCharges, setOtherCharges] = useState(0);
    const [roundOff, setRoundOff] = useState(0);
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [showGstModal, setShowGstModal] = useState(false);
    const [showPayMode, setShowPayMode] = useState(false);
    const [paidAmount, setPaidAmount] = useState(0);

    // New Fields (Req 18)
    const [regType, setRegType] = useState('');
    const [stateName, setStateName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [supplierCursor, setSupplierCursor] = useState(-1);
    const [itemCursor, setItemCursor] = useState(-1);
    const [activeItemRow, setActiveItemRow] = useState(-1);
    const [showItemDropdown, setShowItemDropdown] = useState(false);

    // Column Config / Settings (Req 8, 9, 12, 14, 15)
    const [colConfig, setColConfig] = useState({
        "S.NO": true, "BARCODE": true, "CODE": true, "ITEM_NAME": true, "UNIT": true, 
        "QTY": true, "RATE": true, "RATE+TAX": true, "DIS%": true, "DIS_AMT": true, 
        "CD%": true, "DC_AMT": true, "TOTAL": true, "PUR_RATE": true, "COST": true, 
        "SALES_RATE": true, "MRP": true, "TOTAL_AMT": true, "HSN_CODE": true
    });
    const [showColSettings, setShowColSettings] = useState(false);
    const [tempColConfig, setTempColConfig] = useState(null);

    const [showMoreDrawer, setShowMoreDrawer] = useState(false);
    const supplierRef = useRef(null);
    const itemRefs = useRef([]);

    // Items - default 10 rows for immediate entry
    const [items, setItems] = useState([
        emptyItem(), emptyItem(), emptyItem(), emptyItem(), emptyItem(),
        emptyItem(), emptyItem(), emptyItem(), emptyItem(), emptyItem()
    ]);
    const [totals, setTotals] = useState({ sub_total: 0, discount_amount: 0, tax_amount: 0, cgst_amount: 0, sgst_amount: 0, net_amount: 0, grand_total: 0 });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getToken();
                const [supRes, prodRes, ledgRes] = await Promise.all([
                    fetch(`${API}/suppliers`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API}/ledgers`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                const supData = await supRes.json();
                const prodData = await prodRes.json();
                const ledgData = await ledgRes.json();

                let combinedSuppliers = [];
                if (supData.success && Array.isArray(supData.data)) {
                    combinedSuppliers = supData.data.filter(s => s.is_active !== false).map(s => {
                        const addrParts = [s.address, s.address_line_1, s.address_line_2, s.address_line_3, s.address_line_4, s.address_line_5, s.billing_address].filter(Boolean);
                        return {
                            _id: s._id,
                            name: s.name,
                            contact_person: s.contact_person || s.name,
                            contact_number: s.contact_number || s.phone || s.mobile2 || '',
                            gst_number: s.gst_number || s.gstin || s.gstin_no || '',
                            address: addrParts.join(', ') || '',
                            address_line_1: s.address_line_1 || s.address || '',
                            opening_balance: s.opening_balance !== undefined && s.opening_balance !== null ? s.opening_balance : 0,
                            balance_type: s.balance_type || 'CR',
                            registration_type: s.registration_type || 'Regular',
                            state: s.state || '',
                            due_days: s.due_days || 0
                        };
                    });
                }
                if (ledgData.success && Array.isArray(ledgData.data)) {
                    const ledgerSuppliers = ledgData.data
                        .filter(l => l.is_active !== false)
                        .map(l => {
                            const addrParts = [l.billing_address, l.address_line_1, l.address_line_2, l.address_line_3, l.address_line_4, l.address_line_5, l.address].filter(Boolean);
                            return {
                                _id: l._id,
                                name: l.name,
                                contact_person: l.contact_person || l.name,
                                contact_number: l.phone || l.mobile2 || l.contact_number || '',
                                gst_number: l.gstin || l.gst_number || l.gstin_no || '',
                                address: addrParts.join(', ') || '',
                                address_line_1: l.address_line_1 || l.address || '',
                                opening_balance: l.opening_balance !== undefined && l.opening_balance !== null ? l.opening_balance : 0,
                                balance_type: l.balance_type || 'CR',
                                registration_type: l.registration_type || 'Regular',
                                state: l.state || '',
                                due_days: l.due_days || 0
                            };
                        });

                    ledgerSuppliers.forEach(ls => {
                        if (!combinedSuppliers.some(s => s._id === ls._id || s.name.toLowerCase() === ls.name.toLowerCase())) {
                            combinedSuppliers.push(ls);
                        }
                    });
                }

                setSuppliers(combinedSuppliers);
                if (prodData.success) setProducts(prodData.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const handleClickOutside = (e) => {
            if (supplierRef.current && !supplierRef.current.contains(e.target)) {
                setShowSupplierDropdown(false);
            }
            if (!e.target.closest('.pef-item-name-cell')) {
                setShowItemDropdown(false);
                setActiveItemRow(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Recalculate totals whenever items/other charges change
    useEffect(() => {
        const t = calcTotals(items, otherCharges, roundOff);
        setTotals(t);
    }, [items, otherCharges, roundOff]);

    // When supplierId changes, update selectedSupplier
    const handleSupplierChange = (id) => {
        setSupplierId(id);
        const found = suppliers.find(s => s._id === id);
        setSelectedSupplier(found || null);
        if (found) {
            setSupplierSearch(found.name);
            setRegType(found.registration_type || 'Regular');
            setStateName(found.state || '');
            handleDueDaysChange(found.due_days || 0);
        }
    };

    // When dueDays change, compute new dueDate from invoiceDate
    const handleDueDaysChange = (days) => {
        const d = parseInt(days) || 0;
        setDueDays(d);
        if (d > 0 && invoiceDate) {
            const base = new Date(invoiceDate);
            base.setDate(base.getDate() + d);
            setDueDate(base.toISOString().split('T')[0]);
        } else {
            setDueDate('');
        }
    };

    const handleInvoiceDateChange = (date) => {
        setInvoiceDate(date);
        const d = parseInt(dueDays) || 0;
        if (d > 0 && date) {
            const base = new Date(date);
            base.setDate(base.getDate() + d);
            setDueDate(base.toISOString().split('T')[0]);
        }
    };

    const getFocusableFields = useCallback(() => {
        const fieldList = [];
        Object.keys(colConfig).forEach(key => {
            if (colConfig[key] && COL_TO_FIELD[key] && !fieldList.includes(COL_TO_FIELD[key])) {
                fieldList.push(COL_TO_FIELD[key]);
            }
        });
        return fieldList;
    }, [colConfig]);

    const handleItemChange = (idx, field, value) => {
        const newItems = [...items];
        let item = { ...newItems[idx], [field]: value, _lastEditedField: field };

        // If product selected, populate fields
        if (field === 'product_id') {
            const prod = products.find(p => p._id === value);
            if (prod) {
                item.product_id = prod._id;
                item.item_name = prod.name;
                item.code = prod.code || '';
                item.barcode = prod.barcode || '';
                item.unit = prod.unit || '';
                item.purchase_rate = prod.purchase_price || prod.cost_price || 0;
                item.cost_rate = prod.cost_price || prod.purchase_price || 0;
                item.sales_rate = prod.selling_price || 0;
                item.mrp = prod.mrp || 0;
                item.gst_percent = prod.gst_purchase || 0;
                item.hsn_code = prod.hsn_code || '';
            }
        }

        // If barcode changed, try to find product
        if (field === 'barcode' && value) {
            const prod = products.find(p => p.barcode === value || (p.code && p.code === value));
            if (prod) {
                item.product_id = prod._id;
                item.item_name = prod.name;
                item.code = prod.code || '';
                item.unit = prod.unit || '';
                item.purchase_rate = prod.purchase_price || prod.cost_price || 0;
                item.cost_rate = prod.cost_price || prod.purchase_price || 0;
                item.sales_rate = prod.selling_price || 0;
                item.mrp = prod.mrp || 0;
                item.gst_percent = prod.gst_purchase || 0;
                item.hsn_code = prod.hsn_code || '';
            }
        }

        // If code changed, try to find product
        if (field === 'code' && value) {
            const prod = products.find(p => (p.code && p.code.toLowerCase() === value.toLowerCase()) || (p.barcode && p.barcode === value));
            if (prod) {
                item.product_id = prod._id;
                item.item_name = prod.name;
                item.barcode = prod.barcode || '';
                item.unit = prod.unit || '';
                item.purchase_rate = prod.purchase_price || prod.cost_price || 0;
                item.cost_rate = prod.cost_price || prod.purchase_price || 0;
                item.sales_rate = prod.selling_price || 0;
                item.mrp = prod.mrp || 0;
                item.gst_percent = prod.gst_purchase || 0;
                item.hsn_code = prod.hsn_code || '';
            }
        }

        newItems[idx] = calcItem(item);
        setItems(newItems);
    };

    const addItem = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleSave = async (andPrint = false) => {
        if (!supplierId) return alert('Please select a supplier');
        if (!invoiceNo.trim()) return alert('Please enter invoice number');
        const validItems = items.filter(it => it.quantity > 0 && it.purchase_rate > 0);
        if (validItems.length === 0) return alert('Please add at least one item with quantity and rate');

        setSaving(true);
        try {
            const token = getToken();
            const payload = {
                supplier_id: supplierId,
                invoice_number: invoiceNo.trim(),
                invoice_date: invoiceDate,
                payment_type: paymentType,
                due_days: parseInt(dueDays) || 0,
                items: validItems,
                ...totals,
                other_charges: parseFloat(otherCharges) || 0,
                round_off: parseFloat(roundOff) || 0,
                paid_amount: parseFloat(paidAmount) || 0,
                remarks,
                notes: remarks
            };

            const res = await fetch(`${API}/purchases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                if (andPrint) {
                    navigate('/dashboard/purchase-invoices', { state: { printId: data.data._id } });
                } else {
                    setInvoiceNo('');
                    setInvoiceDate(new Date().toISOString().split('T')[0]);
                    setPaymentType('CREDIT');
                    setSupplierId('');
                    setSelectedSupplier(null);
                    setDueDays(0);
                    setDueDate(getTodayStr());
                    setRemarks('');
                    setOtherCharges(0);
                    setRoundOff(0);
                    setPaidAmount(0);
                    setItems([emptyItem()]);
                    setTotals({ sub_total: 0, discount_amount: 0, tax_amount: 0, cgst_amount: 0, sgst_amount: 0, net_amount: 0, grand_total: 0 });
                    setSupplierSearch('');
                    setShowSupplierDropdown(false);
                    setShowItemDropdown(false);
                    setActiveItemRow(-1);
                    setItemCursor(-1);
                    alert('Purchase bill saved successfully!');
                    setTimeout(() => {
                        const firstField = document.getElementById('pef-supplier');
                        if (firstField && typeof firstField.focus === 'function') {
                            try { firstField.focus(); } catch (_) {}
                        }
                    }, 150);
                }
            } else {
                alert('Error: ' + (data.error || 'Save failed'));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleHeaderKeyDown = (e, nextId, prevId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextId === 'FIRST_ITEM') {
                const fields = getFocusableFields();
                const nextEl = document.querySelector(`[data-idx="0"][data-field="${fields[0]}"]`);
                if (nextEl) nextEl.focus();
            } else {
                const nextEl = document.getElementById(nextId);
                if (nextEl) nextEl.focus();
            }
        } else if (e.key === 'Backspace' && (!e.target.value || e.target.value === '')) {
            if (prevId) {
                e.preventDefault();
                const prevEl = document.getElementById(prevId);
                if (prevEl) prevEl.focus();
            }
        }
    };

    const handleItemKeyDown = (e, idx, field) => {
        const fields = getFocusableFields();
        const currentIdx = fields.indexOf(field);

        if (field === 'item_name' && showItemDropdown && activeItemRow === idx) {
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes((items[idx].item_name || '').toLowerCase()) ||
                (p.code && p.code.toLowerCase().includes((items[idx].item_name || '').toLowerCase()))
            ).slice(0, 50);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setItemCursor(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setItemCursor(prev => (prev > 0 ? prev - 1 : 0));
                return;
            } else if (e.key === 'Enter' && itemCursor >= 0 && filtered[itemCursor]) {
                e.preventDefault();
                handleItemChange(idx, 'product_id', filtered[itemCursor]._id);
                setShowItemDropdown(false);
                setItemCursor(-1);
                // Focus next field
                const nextField = fields[currentIdx + 1];
                if (nextField) {
                    const nextEl = document.querySelector(`[data-idx="${idx}"][data-field="${nextField}"]`);
                    if (nextEl) nextEl.focus();
                }
                return;
            } else if (e.key === 'Escape') {
                setShowItemDropdown(false);
                setItemCursor(-1);
                return;
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentIdx > -1 && currentIdx < fields.length - 1) {
                const nextField = fields[currentIdx + 1];
                const nextEl = document.querySelector(`[data-idx="${idx}"][data-field="${nextField}"]`);
                if (nextEl) nextEl.focus();
            } else {
                // Last field of row
                if (idx === items.length - 1) {
                    addItem();
                    setTimeout(() => {
                        const firstField = fields[0];
                        const nextEl = document.querySelector(`[data-idx="${idx + 1}"][data-field="${firstField}"]`);
                        if (nextEl) nextEl.focus();
                    }, 50);
                } else {
                    const firstField = fields[0];
                    const nextEl = document.querySelector(`[data-idx="${idx + 1}"][data-field="${firstField}"]`);
                    if (nextEl) nextEl.focus();
                }
            }
        } else if (e.key === 'Backspace') {
            const val = e.target.value;
            // Only move back if the field is empty
            if (!val || val === '' || val === '0') {
                if (currentIdx > 0) {
                    e.preventDefault();
                    const prevField = fields[currentIdx - 1];
                    const prevEl = document.querySelector(`[data-idx="${idx}"][data-field="${prevField}"]`);
                    if (prevEl) prevEl.focus();
                } else if (idx > 0) {
                    e.preventDefault();
                    const lastField = fields[fields.length - 1];
                    const prevEl = document.querySelector(`[data-idx="${idx - 1}"][data-field="${lastField}"]`);
                    if (prevEl) prevEl.focus();
                } else {
                    // Back to header
                    const headerEl = document.getElementById('due-date-field') || document.getElementById('supplier-search-field');
                    if (headerEl) headerEl.focus();
                }
            }
        }
    };

    const totalItems = items.filter(it => it.quantity > 0).length;
    const totalQty = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9f7f4' }}>
            <Loader2 className="pef-spinner" size={48} style={{ color: '#6c5fc7' }} />
        </div>
    );

    return (
        <DashboardPageShell className="bg-slate-50/50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <Header
                    toggleSidebar={toggleSidebar}
                    title="PURCHASE ENTRY"
                    onClose={() => navigate('/dashboard/self-service/home')}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setTempColConfig({ ...colConfig });
                                    setShowColSettings(true);
                                }}
                                style={{
                                    background: '#FF5722',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '7px 14px',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(255,87,34,0.25)'
                                }}
                            >
                                <Settings size={15} /> <span>COLUMN SETTINGS</span>
                            </button>

                            {/* Column Settings Slide-Over Drawer Panel */}
                            {showColSettings && (
                                <>
                                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999]" onClick={() => setShowColSettings(false)} />
                                    <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl border-l border-slate-200 z-[10000] flex flex-col animate-in slide-in-from-right duration-300">
                                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">COLUMN SETTINGS</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SELECT COLUMNS TO DISPLAY</p>
                                            </div>
                                            <button onClick={() => setShowColSettings(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800 cursor-pointer">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                            {Object.keys(colConfig).map(k => (
                                                <label key={k} className="flex items-center gap-3 cursor-pointer group py-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={tempColConfig ? !!tempColConfig[k] : !!colConfig[k]}
                                                        onChange={(e) => setTempColConfig(prev => ({ ...(prev || colConfig), [k]: e.target.checked }))}
                                                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                                                        style={{ accentColor: '#ff6b00' }}
                                                    />
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-orange-500 transition-colors uppercase tracking-tight">{k.replace(/_/g, ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const resetMap = {};
                                                    Object.keys(colConfig).forEach(k => resetMap[k] = true);
                                                    setTempColConfig(resetMap);
                                                }}
                                                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                RESET
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (tempColConfig) setColConfig(tempColConfig);
                                                    setShowColSettings(false);
                                                }}
                                                className="flex-1 py-2 text-xs font-bold text-white bg-[#FF5722] rounded hover:bg-[#e64a19] transition-colors cursor-pointer"
                                            >
                                                APPLY
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    }
                />
                <div className="pef-container fade-in-up" style={{ animationDuration: '0.4s' }}>

                    {/* ─── Bill Header (3-Column Layout Matching Image) ─── */}
                    <div className="pef-bill-header-unified">
                        <div className="pef-form-grid">
                            {/* Column 1: Invoice No, Date, Invoice Date, Payment */}
                            <div className="pef-form-col">
                                <div className="pef-f-group-horizontal">
                                    <span className="pef-f-label-left">Invoice No</span>
                                    <input id="invoice-no-field" className="pef-f-input" value={invoiceNo}
                                        onChange={e => setInvoiceNo(e.target.value.toUpperCase())}
                                        onKeyDown={e => handleHeaderKeyDown(e, 'invoice-date-field')}
                                        placeholder="INV-001" />
                                </div>
                                <div className="pef-f-group-horizontal">
                                    <span className="pef-f-label-left">Date</span>
                                    <input id="invoice-date-field" type="date" className="pef-f-input" value={invoiceDate}
                                        onKeyDown={e => handleHeaderKeyDown(e, 'invoice-date-field-2', 'invoice-no-field')}
                                        onChange={e => handleInvoiceDateChange(e.target.value)} />
                                </div>
                                <div className="pef-f-group-horizontal">
                                    <span className="pef-f-label-left">Invoice Date</span>
                                    <input id="invoice-date-field-2" type="date" className="pef-f-input" value={invoiceDate}
                                        onKeyDown={e => handleHeaderKeyDown(e, 'payment-type-field', 'invoice-date-field')}
                                        onChange={e => handleInvoiceDateChange(e.target.value)} />
                                </div>
                                <div className="pef-f-group-horizontal">
                                    <span className="pef-f-label-left">Payment</span>
                                    <div className="pef-f-select-wrap">
                                        <ChevronDown size={14} className="pef-f-chevron" style={{ color: '#FF5722' }} />
                                        <select id="payment-type-field" className="pef-f-select" value={paymentType}
                                            onKeyDown={e => handleHeaderKeyDown(e, 'supplier-search-field', 'invoice-date-field-2')}
                                            onChange={e => setPaymentType(e.target.value)}>
                                            <option value="CREDIT">CREDIT</option>
                                            <option value="CASH">CASH</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Supplier & Lined Address */}
                            <div className="pef-form-col">
                                <div className="pef-f-group-horizontal" ref={supplierRef}>
                                    <span className="pef-f-label-left">Supplier</span>
                                    <div style={{ display: 'flex', width: '100%', gap: '6px', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input 
                                                id="supplier-search-field"
                                                type="text"
                                                className="pef-f-input" 
                                                style={{ fontWeight: 800, paddingRight: '28px' }}
                                                value={supplierSearch}
                                                autoComplete="off"
                                                placeholder="Search or select supplier..."
                                                onFocus={() => setShowSupplierDropdown(true)}
                                                onChange={(e) => {
                                                    setSupplierSearch(e.target.value);
                                                    setShowSupplierDropdown(true);
                                                    setSupplierCursor(-1);
                                                    if (!e.target.value) {
                                                        setSupplierId('');
                                                        setSelectedSupplier(null);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    const filtered = suppliers.filter(s => 
                                                        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                        (s.gst_number && s.gst_number.toLowerCase().includes(supplierSearch.toLowerCase()))
                                                    );
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setShowSupplierDropdown(true);
                                                        setSupplierCursor(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setSupplierCursor(prev => (prev > 0 ? prev - 1 : 0));
                                                    } else if (e.key === 'Enter') {
                                                        if (supplierCursor >= 0 && showSupplierDropdown && filtered[supplierCursor]) {
                                                            e.preventDefault();
                                                            handleSupplierChange(filtered[supplierCursor]._id);
                                                            setShowSupplierDropdown(false);
                                                            setSupplierCursor(-1);
                                                            const dueDaysEl = document.getElementById('due-days-field');
                                                            if (dueDaysEl) dueDaysEl.focus();
                                                        } else if (filtered.length > 0 && showSupplierDropdown) {
                                                            e.preventDefault();
                                                            handleSupplierChange(filtered[0]._id);
                                                            setShowSupplierDropdown(false);
                                                            setSupplierCursor(-1);
                                                            const dueDaysEl = document.getElementById('due-days-field');
                                                            if (dueDaysEl) dueDaysEl.focus();
                                                        } else {
                                                            handleHeaderKeyDown(e, 'due-days-field', 'payment-type-field');
                                                        }
                                                    } else if (e.key === 'Escape') {
                                                        setShowSupplierDropdown(false);
                                                    }
                                                }}
                                            />
                                            <ChevronDown 
                                                size={14} 
                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#FF5722', pointerEvents: 'none' }} 
                                            />

                                            {showSupplierDropdown && (
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        marginTop: '4px',
                                                        background: '#ffffff',
                                                        border: '1.5px solid #FFAB91',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                                                        zIndex: 9999,
                                                        maxHeight: '220px',
                                                        overflowY: 'auto'
                                                    }}
                                                >
                                                    {suppliers.filter(s => 
                                                        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                        (s.gst_number && s.gst_number.toLowerCase().includes(supplierSearch.toLowerCase()))
                                                    ).map((s, idx) => (
                                                        <div 
                                                            key={s._id} 
                                                            style={{
                                                                padding: '8px 12px',
                                                                fontSize: '12px',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                background: supplierCursor === idx ? '#FFF3E0' : (supplierId === s._id ? '#FFF8F6' : '#ffffff'),
                                                                color: supplierCursor === idx ? '#E65100' : '#1e293b',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                handleSupplierChange(s._id);
                                                                setShowSupplierDropdown(false);
                                                                const dueDaysEl = document.getElementById('due-days-field');
                                                                if (dueDaysEl) dueDaysEl.focus();
                                                            }}
                                                            onMouseEnter={() => setSupplierCursor(idx)}
                                                        >
                                                            <span>{s.name}</span>
                                                            <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                                {s.gst_number ? `GST: ${s.gst_number}` : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {suppliers.filter(s => 
                                                        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                        (s.gst_number && s.gst_number.toLowerCase().includes(supplierSearch.toLowerCase()))
                                                    ).length === 0 && (
                                                        <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
                                                            No suppliers found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            type="button"
                                            style={{ width: '32px', height: '32px', border: '1.5px solid #FFAB91', borderRadius: '6px', color: '#FF5722', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                            title="Add New Supplier" 
                                            onClick={() => navigate('/dashboard/self-service/ledgers/create')}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pef-f-group-horizontal" style={{ alignItems: 'flex-start' }}>
                                    <span className="pef-f-label-left" style={{ paddingTop: '4px' }}>Address</span>
                                    <textarea 
                                        className="pef-address-box" 
                                        readOnly 
                                        value={selectedSupplier ? (selectedSupplier.address || 'No address provided') : ''} 
                                        placeholder="Supplier address details..." 
                                    />
                                </div>
                            </div>

                            {/* Column 3: GSTIN, Balance, Days & Due Date */}
                            <div className="pef-form-col">
                                <div className="pef-f-group-horizontal">
                                    <span className="pef-f-label-left">GSTIN</span>
                                    <input className="pef-f-input" readOnly value={selectedSupplier ? (selectedSupplier.gst_number || 'NO GSTIN') : ''} placeholder="GSTIN No" />
                                </div>

                                <div className="pef-f-group-horizontal">
                                    <span className="pef-f-label-left">Balance</span>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input 
                                            className="pef-f-input" 
                                            style={{ paddingRight: '45px', fontWeight: 800 }} 
                                            readOnly 
                                            value={selectedSupplier ? `₹${parseFloat(selectedSupplier.opening_balance || 0).toFixed(2)}` : ''} 
                                            placeholder="₹0.00"
                                        />
                                        <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: '#FFF3E0', color: '#E65100', border: '1px solid #FFE0B2', fontWeight: 800, fontSize: '10px', padding: '1px 5px', borderRadius: '4px' }}>
                                            {selectedSupplier?.balance_type || 'CR'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pef-f-group-horizontal" style={{ gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Days</span>
                                        <input 
                                            id="due-days-field" 
                                            type="number" 
                                            className="pef-f-input" 
                                            style={{ width: '48px', textAlign: 'center', fontWeight: 800 }} 
                                            min="0"
                                            value={dueDays} 
                                            onChange={e => handleDueDaysChange(e.target.value)} 
                                            onKeyDown={e => handleHeaderKeyDown(e, 'due-date-field', 'supplier-search-field')}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Date</span>
                                        <input 
                                            id="due-date-field" 
                                            type="date" 
                                            className="pef-f-input" 
                                            style={{ flex: 1, fontWeight: 700 }}
                                            value={dueDate} 
                                            onChange={e => setDueDate(e.target.value)} 
                                            onKeyDown={e => handleHeaderKeyDown(e, 'FIRST_ITEM', 'due-days-field')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Items Table ─── */}
                    <div className="pef-items-section">
                        <div className="pef-table-wrap">
                            <table className="pef-table">
                                <thead>
                                    <tr>
                                        {colConfig['S.NO'] && <th className="pef-th-sno">S.NO</th>}
                                        {colConfig['BARCODE'] && <th className="pef-th-barcode">BARCODE</th>}
                                        {colConfig['CODE'] && <th className="pef-th-code">CODE</th>}
                                        {colConfig['ITEM_NAME'] && <th className="pef-th-name">ITEM NAME</th>}
                                        {colConfig['UNIT'] && <th className="pef-th-unit">UNIT</th>}
                                        {colConfig['QTY'] && <th className="pef-th-qty">QTY</th>}
                                        {colConfig['RATE'] && <th className="pef-th-rate">RATE</th>}
                                        {colConfig['RATE+TAX'] && <th className="pef-th-rate">RATE+TAX</th>}
                                        {colConfig['DIS%'] && <th className="pef-th-dis">DIS %</th>}
                                        {colConfig['DIS_AMT'] && <th className="pef-th-dis">DIS AMT</th>}
                                        {colConfig['CD%'] && <th className="pef-th-dis">CD %</th>}
                                        {colConfig['DC_AMT'] && <th className="pef-th-dis">DC AMT</th>}
                                        {colConfig['TOTAL'] && <th className="pef-th-amount">TOTAL</th>}
                                        {colConfig['PUR_RATE'] && <th className="pef-th-rate">PUR RATE</th>}
                                        {colConfig['COST'] && <th className="pef-th-rate">COST</th>}
                                        {colConfig['SALES_RATE'] && <th className="pef-th-rate">SALES RATE</th>}
                                        {colConfig['MRP'] && <th className="pef-th-rate">MRP</th>}
                                        {colConfig['TOTAL_AMT'] && <th className="pef-th-total">TOTAL AMT</th>}
                                        {colConfig['HSN_CODE'] && <th className="pef-th-hsn">HSN CODE</th>}
                                        <th className="pef-th-del"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="pef-item-row fade-in-up" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                                            {colConfig['S.NO'] && <td className="pef-td-sno">{idx + 1}</td>}
                                            {colConfig['BARCODE'] && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-barcode"
                                                        data-idx={idx} data-field="barcode"
                                                        value={item.barcode}
                                                        onChange={e => handleItemChange(idx, 'barcode', e.target.value)}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'barcode')}
                                                        placeholder="Barcode" />
                                                </td>
                                            )}
                                            {colConfig['CODE'] && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-sm"
                                                        data-idx={idx} data-field="code"
                                                        value={item.code}
                                                        onChange={e => handleItemChange(idx, 'code', e.target.value)}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'code')}
                                                        placeholder="Code" />
                                                </td>
                                            )}
                                            {colConfig['ITEM_NAME'] && (
                                                <td className="pef-td-name pef-item-name-cell">
                                                    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                                                        <input
                                                            className="pef-cell-input pef-w-name"
                                                            style={{ paddingRight: '22px', fontWeight: 700 }}
                                                            data-idx={idx} data-field="item_name"
                                                            value={item.item_name}
                                                            autoComplete="off"
                                                            onFocus={() => {
                                                                setActiveItemRow(idx);
                                                                setShowItemDropdown(true);
                                                            }}
                                                            onChange={e => {
                                                                handleItemChange(idx, 'item_name', e.target.value);
                                                                setShowItemDropdown(true);
                                                                setItemCursor(-1);
                                                            }}
                                                            onKeyDown={e => handleItemKeyDown(e, idx, 'item_name')}
                                                            placeholder="Search or select item..."
                                                        />
                                                        <ChevronDown 
                                                            size={12} 
                                                            style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#FF5722', pointerEvents: 'none' }} 
                                                        />

                                                        {showItemDropdown && activeItemRow === idx && (
                                                            <div 
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    left: 0,
                                                                    width: '280px',
                                                                    marginTop: '2px',
                                                                    background: '#ffffff',
                                                                    border: '1.5px solid #FFAB91',
                                                                    borderRadius: '8px',
                                                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                                                                    zIndex: 9999,
                                                                    maxHeight: '220px',
                                                                    overflowY: 'auto'
                                                                }}
                                                            >
                                                                {products.filter(p => 
                                                                    p.name.toLowerCase().includes((item.item_name || '').toLowerCase()) ||
                                                                    (p.code && p.code.toLowerCase().includes((item.item_name || '').toLowerCase()))
                                                                ).slice(0, 50).map((p, pIdx) => (
                                                                    <div 
                                                                        key={p._id} 
                                                                        style={{
                                                                            padding: '6px 10px',
                                                                            fontSize: '11px',
                                                                            fontWeight: 700,
                                                                            cursor: 'pointer',
                                                                            borderBottom: '1px solid #f1f5f9',
                                                                            background: itemCursor === pIdx ? '#FFF3E0' : (item.product_id === p._id ? '#FFF8F6' : '#ffffff'),
                                                                            color: itemCursor === pIdx ? '#E65100' : '#1e293b',
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center'
                                                                        }}
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            handleItemChange(idx, 'product_id', p._id);
                                                                            setShowItemDropdown(false);
                                                                            setItemCursor(-1);
                                                                            const fields = getFocusableFields();
                                                                            const currentIdx = fields.indexOf('item_name');
                                                                            const nextField = fields[currentIdx + 1];
                                                                            if (nextField) {
                                                                                const nextEl = document.querySelector(`[data-idx="${idx}"][data-field="${nextField}"]`);
                                                                                if (nextEl) nextEl.focus();
                                                                            }
                                                                        }}
                                                                        onMouseEnter={() => setItemCursor(pIdx)}
                                                                    >
                                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <span style={{ fontWeight: 800 }}>{p.name}</span>
                                                                            <span style={{ fontSize: '9px', color: '#64748b' }}>Rate: ₹{p.purchase_price || p.cost_price || 0} | Stock: {p.current_stock || 0}</span>
                                                                        </div>
                                                                        <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>{p.code || ''}</span>
                                                                    </div>
                                                                ))}
                                                                {products.filter(p => 
                                                                    p.name.toLowerCase().includes((item.item_name || '').toLowerCase()) ||
                                                                    (p.code && p.code.toLowerCase().includes((item.item_name || '').toLowerCase()))
                                                                ).length === 0 && (
                                                                    <div style={{ padding: '10px', fontSize: '11px', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
                                                                        No items found
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            {colConfig['UNIT'] && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-unit"
                                                        data-idx={idx} data-field="unit"
                                                        value={item.unit}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'unit')}
                                                        onChange={e => handleItemChange(idx, 'unit', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['QTY'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-qty pef-num"
                                                        data-idx={idx} data-field="quantity"
                                                        min="0" step="0.01"
                                                        value={item.quantity}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'quantity')}
                                                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['RATE'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="purchase_rate"
                                                        min="0" step="0.01"
                                                        value={item.purchase_rate}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'purchase_rate')}
                                                        onChange={e => handleItemChange(idx, 'purchase_rate', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['RATE+TAX'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="rate_tax"
                                                        min="0" step="0.01"
                                                        value={item.rate_tax}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'rate_tax')}
                                                        onChange={e => handleItemChange(idx, 'rate_tax', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['DIS%'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-pct pef-num"
                                                        data-idx={idx} data-field="discount_percent"
                                                        min="0" max="100" step="0.01"
                                                        value={item.discount_percent}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'discount_percent')}
                                                        onChange={e => handleItemChange(idx, 'discount_percent', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['DIS_AMT'] && <td className="pef-td-computed">{item.discount_amount.toFixed(2)}</td>}
                                            {colConfig['CD%'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-pct pef-num"
                                                        data-idx={idx} data-field="cd_percent"
                                                        min="0" max="100" step="0.01"
                                                        value={item.cd_percent}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'cd_percent')}
                                                        onChange={e => handleItemChange(idx, 'cd_percent', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['DC_AMT'] && <td className="pef-td-computed">{item.dc_amount.toFixed(2)}</td>}
                                            {colConfig['TOTAL'] && <td className="pef-td-computed">{item.amount.toFixed(2)}</td>}
                                            {colConfig['PUR_RATE'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="purchase_rate"
                                                        min="0" step="0.01"
                                                        value={item.purchase_rate}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'purchase_rate')}
                                                        onChange={e => handleItemChange(idx, 'purchase_rate', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['COST'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="cost_rate"
                                                        min="0" step="0.01"
                                                        value={item.cost_rate}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'cost_rate')}
                                                        onChange={e => handleItemChange(idx, 'cost_rate', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['SALES_RATE'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="sales_rate"
                                                        min="0" step="0.01"
                                                        value={item.sales_rate}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'sales_rate')}
                                                        onChange={e => handleItemChange(idx, 'sales_rate', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['MRP'] && (
                                                <td>
                                                    <input type="number" className="pef-cell-input pef-w-rate pef-num"
                                                        data-idx={idx} data-field="mrp"
                                                        min="0" step="0.01"
                                                        value={item.mrp}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'mrp')}
                                                        onChange={e => handleItemChange(idx, 'mrp', e.target.value)} />
                                                </td>
                                            )}
                                            {colConfig['TOTAL_AMT'] && <td className="pef-td-computed pef-total">{item.total_amount.toFixed(2)}</td>}
                                            {colConfig['HSN_CODE'] && (
                                                <td>
                                                    <input className="pef-cell-input pef-w-hsn"
                                                        data-idx={idx} data-field="hsn_code"
                                                        value={item.hsn_code}
                                                        onKeyDown={e => handleItemKeyDown(e, idx, 'hsn_code')}
                                                        onChange={e => handleItemChange(idx, 'hsn_code', e.target.value)} />
                                                </td>
                                            )}
                                            <td>
                                                {items.length > 1 && (
                                                    <button className="pef-del-btn" onClick={() => removeItem(idx)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ─── Footer (Matching Image Exactly) ─── */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '10px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ width: '220px' }}>
                            <input 
                                type="text"
                                className="pef-f-input"
                                style={{ height: '38px', fontSize: '12px', border: '1.5px solid #FFAB91', background: '#FFFBFB' }} 
                                placeholder="Remarks" 
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                                type="button"
                                style={{ background: '#FF5722', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0 14px', height: '38px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(255,87,34,0.25)' }}
                                onClick={() => setShowGstModal(true)}
                            >
                                <FileText size={14} /> <span>GST DETAILS</span>
                            </button>

                            <button 
                                type="button"
                                style={{ background: '#FF5722', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0 14px', height: '38px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(255,87,34,0.25)' }}
                                onClick={() => setShowMoreDrawer(true)}
                            >
                                <MoreHorizontal size={14} /> <span>MORE</span>
                            </button>
                            
                            {/* Dark Navy Summary Block */}
                            <div style={{ background: '#0A1128', color: '#FFFFFF', borderRadius: '8px', height: '42px', padding: '0 18px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 10px rgba(10,17,40,0.15)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }}>ROUND OFF</span>
                                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF' }}>₹{parseFloat(roundOff || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ width: '1px', height: '22px', background: '#1E293B' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }}>NET AMOUNT</span>
                                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#FF7A00' }}>₹{totals.grand_total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button 
                                type="button"
                                disabled={saving}
                                onClick={() => handleSave(false)}
                                style={{ background: '#FF5722', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '0 24px', height: '42px', fontSize: '13px', fontWeight: 900, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255,87,34,0.3)' }}
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
                                <span>SAVE</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── More Details Drawer (Req 12, 13) ─── */}
                {showMoreDrawer && (
                    <div className="fixed inset-0 z-[1000] flex justify-end">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMoreDrawer(false)}></div>
                        <div className="relative w-[400px] bg-white h-full shadow-2xl p-8 flex flex-col fade-in-right">
                            <div className="flex justify-between items-center mb-8 pb-4 border-b">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Additional Details</h3>
                                <button onClick={() => setShowMoreDrawer(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] font-medium text-slate-500 leading-relaxed">
                                    "When working in more column refer me for details" - Please update this section with specific fields as required.
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="pef-label !text-indigo-600">OTHER CHARGES (₹)</label>
                                        <input type="number" 
                                            className="pef-input w-full !h-12 !text-sm font-black"
                                            value={otherCharges} 
                                            onChange={e => setOtherCharges(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="pef-label !text-indigo-600">ROUND OFF (₹)</label>
                                        <input type="number" 
                                            className="pef-input w-full !h-12 !text-sm font-black"
                                            value={roundOff} 
                                            onChange={e => setRoundOff(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowMoreDrawer(false)} className="mt-auto w-full py-4 bg-slate-900 text-white rounded-2xl font-bold tracking-widest uppercase hover:bg-black transition-all">
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* ─── Remarks Modal ─── */}
            {showRemarksModal && (
                <div className="pef-modal-overlay" onClick={() => setShowRemarksModal(false)}>
                    <div className="pef-modal" onClick={e => e.stopPropagation()}>
                        <h3>Remarks</h3>
                        <textarea
                            className="pef-remarks-textarea"
                            rows={5}
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="Enter any notes or remarks for this purchase..."
                        />
                        <div className="pef-modal-btns">
                            <button className="pi-modal-cancel" onClick={() => setShowRemarksModal(false)}>Close</button>
                            <button className="pi-modal-confirm" onClick={() => setShowRemarksModal(false)}>Save Remarks</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── GST Tax Summary Modal ─── */}
            {showGstModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowGstModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText size={18} className="text-orange-500" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">GST Tax Summary</h3>
                            </div>
                            <button onClick={() => setShowGstModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all text-slate-500">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 space-y-3 text-xs font-semibold text-slate-700">
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Sub Total (Taxable)</span>
                                <span className="font-bold text-slate-900">₹{totals.sub_total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Total Discount</span>
                                <span className="font-bold text-rose-600">- ₹{totals.discount_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">CGST Amount</span>
                                <span className="font-bold text-slate-900">₹{totals.cgst_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">SGST Amount</span>
                                <span className="font-bold text-slate-900">₹{totals.sgst_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">Total Tax Amount</span>
                                <span className="font-bold text-emerald-600">₹{totals.tax_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-black bg-orange-50 p-3 rounded-lg text-orange-900 mt-2">
                                <span>Grand Total</span>
                                <span>₹{totals.grand_total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowGstModal(false)} className="px-5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase rounded shadow-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Pay Mode Panel ─── */}
            {showPayMode && (
                <div className="pef-modal-overlay" onClick={() => setShowPayMode(false)}>
                    <div className="pef-modal" onClick={e => e.stopPropagation()}>
                        <h3>Payment Mode</h3>
                        <p style={{ marginBottom: '1rem', color: '#7c6b8a', fontSize: '0.85rem' }}>
                            Grand Total: <strong>₹{totals.grand_total.toFixed(2)}</strong>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c6b8a' }}>
                                PAID AMOUNT
                            </label>
                            <input type="number" min="0" step="0.01"
                                className="pef-input"
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                style={{ fontSize: '1.1rem', padding: '0.6rem', borderRadius: 8, border: '2px solid #d6c8e0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                                <span>Balance Due:</span>
                                <span style={{ color: (totals.grand_total - (parseFloat(paidAmount) || 0)) > 0 ? '#ef4444' : '#22c55e' }}>
                                    ₹{Math.max(0, totals.grand_total - (parseFloat(paidAmount) || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="pef-modal-btns" style={{ marginTop: '1.5rem' }}>
                            <button className="pi-modal-cancel" onClick={() => setShowPayMode(false)}>Cancel</button>
                            <button className="pi-modal-confirm" onClick={() => setShowPayMode(false)}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardPageShell>
    );
}
