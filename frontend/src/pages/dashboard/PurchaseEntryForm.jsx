import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import './PurchaseEntryForm.css';
import {
    Settings, ChevronDown, Plus, Trash2, Loader2,
    Upload, FileText, BarChart2, Printer, Save, XCircle, MoreHorizontal
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

const calcItem = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.purchase_rate) || 0;
    const disP = parseFloat(item.discount_percent) || 0;
    const cdP = parseFloat(item.cd_percent) || 0;
    const gstP = parseFloat(item.gst_percent) || 0;

    const rateTax = rate + (rate * (gstP / 100));

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
    const [dueDays, setDueDays] = useState(0);
    const [dueDate, setDueDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [otherCharges, setOtherCharges] = useState(0);
    const [roundOff, setRoundOff] = useState(0);
    const [showRemarksModal, setShowRemarksModal] = useState(false);
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

    const [showMoreDrawer, setShowMoreDrawer] = useState(false);
    const supplierRef = useRef(null);
    const itemRefs = useRef([]);

    // Items
    const [items, setItems] = useState([emptyItem()]);
    const [totals, setTotals] = useState({ sub_total: 0, discount_amount: 0, tax_amount: 0, cgst_amount: 0, sgst_amount: 0, net_amount: 0, grand_total: 0 });

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) { setIsMobileSidebarOpen(!isMobileSidebarOpen); }
        else { const n = !isCollapsed; setIsCollapsed(n); localStorage.setItem('sidebarCollapsed', n); }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getToken();
                const [supRes, prodRes] = await Promise.all([
                    fetch(`${API}/suppliers`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                const supData = await supRes.json();
                const prodData = await prodRes.json();
                if (supData.success) {
                    // Filter only active suppliers
                    setSuppliers(supData.data.filter(s => s.is_active !== false));
                }
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

    const handleItemChange = (idx, field, value) => {
        const newItems = [...items];
        let item = { ...newItems[idx], [field]: value };

        // If product selected, populate fields
        if (field === 'product_id') {
            const prod = products.find(p => p._id === value);
            if (prod) {
                item.product_id = prod._id;
                item.item_name = prod.name;
                item.code = prod.code || '';
                item.barcode = prod.barcode || '';
                item.unit = prod.unit || '';
                item.purchase_rate = prod.purchase_price || 0;
                item.cost_rate = prod.cost_price || 0;
                item.sales_rate = prod.selling_price || 0;
                item.mrp = prod.mrp || 0;
                item.gst_percent = prod.gst_purchase || 0;
                item.hsn_code = prod.hsn_code || '';
            }
        }

        // If barcode changed, try to find product
        if (field === 'barcode' && value) {
            const prod = products.find(p => p.barcode === value);
            if (prod) {
                item.product_id = prod._id;
                item.item_name = prod.name;
                item.code = prod.code || '';
                item.unit = prod.unit || '';
                item.purchase_rate = prod.purchase_price || 0;
                item.cost_rate = prod.cost_price || 0;
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
                    // Navigate to view with print intent
                    navigate('/dashboard/purchase-invoices', { state: { printId: data.data._id } });
                } else {
                    alert('Purchase bill saved successfully!');
                    navigate('/dashboard/purchase-invoices');
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
                const fields = Object.keys(colConfig).filter(k => colConfig[k]);
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
        const fields = Object.keys(colConfig).filter(k => colConfig[k]);
        const currentIdx = fields.indexOf(field);

        if (field === 'item_name' && showItemDropdown && activeItemRow === idx) {
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes((items[idx].item_name || '').toLowerCase()) ||
                (p.code && p.code.toLowerCase().includes((items[idx].item_name || '').toLowerCase()))
            ).slice(0, 50);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setItemCursor(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setItemCursor(prev => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter' && itemCursor >= 0) {
                e.preventDefault();
                handleItemChange(idx, 'product_id', filtered[itemCursor]._id);
                setShowItemDropdown(false);
                setItemCursor(-1);
                // Focus next field
                const nextField = fields[currentIdx + 1];
                const nextEl = document.querySelector(`[data-idx="${idx}"][data-field="${nextField}"]`);
                if (nextEl) nextEl.focus();
                return;
            } else if (e.key === 'Escape') {
                setShowItemDropdown(false);
                setItemCursor(-1);
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentIdx < fields.length - 1) {
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
                    const headerEl = document.getElementById('supplier-search-field');
                    if (headerEl) headerEl.focus();
                }
            }
        }
    };

    const [showColSettings, setShowColSettings] = useState(false);

    const totalItems = items.filter(it => it.quantity > 0).length;
    const totalQty = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0), 0);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f9f7f4' }}>
            <Loader2 className="pef-spinner" size={48} style={{ color: '#6c5fc7' }} />
        </div>
    );

    return (
        <div className="dashboard-layout bg-slate-50/50">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}
            <main className="dashboard-main">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700 mb-6 mt-4 mx-2">
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight ml-2">PURCHASE ENTRY</h1>
                    <div className="flex gap-4 items-center">
                        <div className="relative">
                            <button className="flex items-center gap-2 bg-[#f97316] text-white px-5 py-2.5 rounded-lg font-bold text-sm outline-none transition-opacity hover:opacity-90 shadow-sm" onClick={() => setShowColSettings(true)}>
                                <Settings size={16} /> COLUMN SETTINGS
                            </button>
                            {showColSettings && (
                                <div className="absolute right-0 top-[110%] w-[350px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 z-[2000] animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-bold text-slate-800">Display Columns</h3>
                                        <button onClick={() => setShowColSettings(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                        {Object.keys(colConfig).map(k => (
                                            <label key={k} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={colConfig[k]} 
                                                    onChange={() => setColConfig(prev => ({...prev, [k]: !prev[k]})) }
                                                    className="w-4 h-4 rounded text-[#f97316] focus:ring-[#f97316]" />
                                                <span className="text-xs font-bold text-slate-700">{k.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button className="flex items-center gap-2 bg-white text-[#ef4444] border border-[#ef4444] px-5 py-2.5 rounded-lg font-bold text-sm outline-none transition-colors hover:bg-red-50 shadow-sm" onClick={() => navigate(-1)}>
                            <XCircle size={16} /> CLOSE
                        </button>
                    </div>
                </div>
                <div className="pef-container fade-in-up" style={{ animationDuration: '0.4s' }}>

                    {/* ─── Bill Header (Neat Unified Form) ─── */}
                    <div className="pef-bill-header-unified">
                        <div className="pef-form-grid">
                            {/* Column 1 */}
                            <div className="pef-form-col">
                                <div className="pef-f-group">
                                    <label className="pef-f-label">INVOICE NO</label>
                                    <input id="invoice-no-field" className="pef-f-input" value={invoiceNo}
                                        onChange={e => setInvoiceNo(e.target.value.toUpperCase())}
                                        onKeyDown={e => handleHeaderKeyDown(e, 'invoice-date-field')}
                                        placeholder="INV-001" />
                                </div>
                                <div className="pef-f-group">
                                    <label className="pef-f-label">DATE</label>
                                    <input id="invoice-date-field" type="date" className="pef-f-input" value={invoiceDate}
                                        onKeyDown={e => handleHeaderKeyDown(e, 'payment-type-field')}
                                        onChange={e => handleInvoiceDateChange(e.target.value)} />
                                </div>
                                <div className="pef-f-group">
                                    <label className="pef-f-label">PAYMENT</label>
                                    <div className="pef-f-select-wrap">
                                        <ChevronDown size={11} className="pef-f-chevron" />
                                        <select id="payment-type-field" className="pef-f-select" value={paymentType}
                                            onChange={e => setPaymentType(e.target.value)}>
                                            <option value="CASH">CASH</option>
                                            <option value="CREDIT">CREDIT</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="pef-form-col">
                                <div className="pef-f-group" ref={supplierRef}>
                                    <label className="pef-f-label">Supplier</label>
                                    <div className="flex w-full gap-2 relative">

                                        <input 
                                            id="supplier-search-field"
                                            className="pef-f-input font-bold flex-1" 
                                            value={supplierSearch}
                                            autoComplete="off"
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
                                                    setSupplierCursor(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
                                                } else if (e.key === 'ArrowUp') {
                                                    e.preventDefault();
                                                    setSupplierCursor(prev => (prev > 0 ? prev - 1 : 0));
                                                } else if (e.key === 'Enter') {
                                                    if (supplierCursor >= 0 && showSupplierDropdown) {
                                                        e.preventDefault();
                                                        handleSupplierChange(filtered[supplierCursor]._id);
                                                        setShowSupplierDropdown(false);
                                                        setSupplierCursor(-1);
                                                    } else {
                                                        handleHeaderKeyDown(e, 'FIRST_ITEM');
                                                    }
                                                } else if (e.key === 'Escape') {
                                                    setShowSupplierDropdown(false);
                                                }
                                            }}
                                            placeholder="Type name to search..."
                                        />
                                        {showSupplierDropdown && (
                                            <div className="pef-dropdown-container">
                                                {suppliers.filter(s => 
                                                    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                                                    (s.gst_number && s.gst_number.toLowerCase().includes(supplierSearch.toLowerCase()))
                                                ).map((s, idx) => (
                                                    <div 
                                                        key={s._id} 
                                                        className={`pef-dropdown-item ${supplierCursor === idx ? 'active' : ''}`}
                                                        onClick={() => {
                                                            handleSupplierChange(s._id);
                                                            setShowSupplierDropdown(false);
                                                        }}
                                                        onMouseEnter={() => setSupplierCursor(idx)}
                                                    >
                                                        <div className="flex justify-between items-center w-full">
                                                            <span className="font-bold text-xs">{s.name}</span>
                                                            <span className="text-[9px] text-slate-400 font-mono tracking-tighter">{s.gst_number || 'NO GSTIN'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="pef-dropdown-footer">List End</div>
                                            </div>
                                        )}
                                        <button className="flex items-center justify-center w-10 border border-[#f97316] rounded-md text-[#f97316] hover:bg-orange-50 transition-colors" title="Add Supplier" onClick={() => navigate('/dashboard/self-service/ledgers/create')}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="pef-f-group">
                                    <label className="pef-f-label">GSTIN</label>
                                    <input className="pef-f-input pef-f-readonly" readOnly value={selectedSupplier?.gst_number || ''} />
                                </div>
                                <div className="pef-f-group">
                                    <label className="pef-f-label">Balance</label>
                                    <div className="relative w-full">
                                        <input className="pef-f-input pef-f-readonly font-bold !text-left" 
                                            readOnly value={selectedSupplier ? `₹${parseFloat(selectedSupplier.opening_balance || 0).toFixed(2)}` : ''} />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 font-bold text-xs bg-orange-100 px-1 rounded">CR</span>
                                    </div>
                                </div>
                                <div className="pef-f-group">
                                    <label className="pef-f-label">Address</label>
                                    <div className="relative w-full">
                                        <textarea className="pef-f-textarea w-full" readOnly value={selectedSupplier?.address || ''}></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Column 3 */}
                            <div className="pef-form-col">
                                <div className="flex gap-2 w-full mt-2">
                                    <div className="pef-f-group w-1/2">
                                        <label className="pef-f-label">Days</label>
                                        <input id="due-days-field" type="number" className="pef-f-input !font-bold text-center" min="0"
                                            value={dueDays} onChange={e => handleDueDaysChange(e.target.value)} />
                                    </div>
                                    <div className="pef-f-group w-1/2">
                                        <label className="pef-f-label">Date</label>
                                        <input className="pef-f-input !font-bold" type="date" value={dueDate} readOnly />
                                    </div>
                                </div>
                                <div className="pef-f-group">
                                    <label className="pef-f-label">DUE DATE</label>
                                    <input id="due-date-field" type="date" className="pef-f-input font-bold"
                                        value={dueDate} onChange={e => setDueDate(e.target.value)} />
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
                                                    <div className="relative">
                                                        <input
                                                            className="pef-cell-input pef-w-name"
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
                                                            placeholder="Type Item Name..."
                                                        />
                                                        {showItemDropdown && activeItemRow === idx && (
                                                            <div className="pef-dropdown-container !w-[300px]">
                                                                {products.filter(p => 
                                                                    p.name.toLowerCase().includes((item.item_name || '').toLowerCase()) ||
                                                                    (p.code && p.code.toLowerCase().includes((item.item_name || '').toLowerCase()))
                                                                ).slice(0, 50).map((p, pIdx) => (
                                                                    <div 
                                                                        key={p._id} 
                                                                        className={`pef-dropdown-item ${itemCursor === pIdx ? 'active' : ''}`}
                                                                        onClick={() => {
                                                                            handleItemChange(idx, 'product_id', p._id);
                                                                            setShowItemDropdown(false);
                                                                        }}
                                                                        onMouseEnter={() => setItemCursor(pIdx)}
                                                                    >
                                                                        <div className="flex justify-between items-center w-full">
                                                                            <span className="font-bold">{p.name}</span>
                                                                            <span className="text-[10px] text-slate-400">{p.code || ''}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                                                                            <span>Rate: ₹{p.purchase_price}</span>
                                                                            <span>Stock: {p.current_stock || 0}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div className="pef-dropdown-footer">Showing top 50 items</div>
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

                    {/* ─── Footer ─── */}
                    <div className="flex items-center justify-between w-full pt-4 mt-2">
                        <textarea className="w-1/4 border border-[#ea580c] rounded-md p-3 h-[52px] resize-none text-sm outline-none focus:ring-1 focus:ring-orange-500" 
                            placeholder="Remarks" 
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                        
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 bg-[#ea580c] text-white px-5 h-[52px] rounded-md font-bold text-sm uppercase shadow-sm hover:bg-orange-600 transition-colors">
                                <FileText size={16} /> GST DETAILS
                            </button>
                            <button className="flex items-center gap-2 bg-[#ea580c] text-white px-5 h-[52px] rounded-md font-bold text-sm uppercase shadow-sm hover:bg-orange-600 transition-colors" onClick={() => setShowMoreDrawer(true)}>
                                <MoreHorizontal size={16} /> MORE
                            </button>
                            
                            <div className="bg-[#0f172a] text-white flex items-center px-6 rounded-md h-[52px] shadow-sm">
                                <div className="flex flex-col items-center justify-center pr-6 border-r border-white/20 h-full">
                                    <span className="text-[9px] font-bold tracking-widest text-slate-300">ROUND OFF</span>
                                    <span className="text-base font-bold">₹{parseFloat(roundOff || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center pl-6 h-full">
                                    <span className="text-[9px] font-bold tracking-widest text-slate-300">NET AMOUNT</span>
                                    <span className="text-lg font-black text-[#ea580c]">₹{totals.grand_total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button className="flex items-center gap-3 bg-[#ea580c] text-white px-8 h-[52px] rounded-md font-black text-xl uppercase shadow-md hover:bg-orange-600 transition-colors"
                                disabled={saving}
                                onClick={() => handleSave(false)}>
                                {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} 
                                SAVE
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
        </div>
    );
}
