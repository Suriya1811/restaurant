import React, { useState, useEffect } from 'react';
import { Printer, X, CheckCircle2, Loader2 } from 'lucide-react';

const BillPreviewModal = ({ isOpen, onClose, billId, paymentModes }) => {
    const [billData, setBillData] = useState(null);
    const [restaurantData, setRestaurantData] = useState(null);
    const [loading, setLoading] = useState(true);

    const printerSettings = restaurantData?.printer_settings || {};

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('bpm-printing-active');
        } else {
            document.body.classList.remove('bpm-printing-active');
        }
        return () => {
            document.body.classList.remove('bpm-printing-active');
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && billId) fetchBillDetails();
    }, [isOpen, billId]);

    const fetchBillDetails = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const billRes = await fetch(`${import.meta.env.VITE_API_URL}/bills/${billId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const billResult = await billRes.json();
            if (billResult.success) {
                setBillData(billResult.data);
                const restaurantRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const restaurantResult = await restaurantRes.json();
                if (restaurantResult.success) setRestaurantData(restaurantResult.data.restaurant);
            }
        } catch (error) {
            console.error('Error fetching bill details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPaymentMethod = (modes) => {
        if (!modes || modes.length === 0) return 'N/A';
        if (modes.length === 1) return modes[0].type;
        return 'SPLIT';
    };

    const getConsolidatedItems = (items) => {
        if (!items) return [];
        const map = new Map();
        items.forEach(item => {
            const key = `${item.product_id}_${item.variation?.name || ''}_${(item.addons || []).map(a => a._id).sort().join(',')}_${item.notes || ''}_${item.unit_price}`;
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handlePrint = () => {
        const selectedPrinter = localStorage.getItem('pos_sales_bill_printer') || 'Sales Bill Printer';
        const receiptElem = document.querySelector('#bill-print-content') || document.querySelector('.bpm-receipt');
        if (receiptElem) {
            const fullThermalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sales Bill #${billData?.bill_number || ''}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 80mm auto; margin: 0; }
        html, body {
            font-family: 'Courier New', Courier, monospace, 'Lucida Console', system-ui, sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 3mm 2mm 15mm 2mm;
            color: #000000;
            background: #ffffff;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .bpm-receipt-header { text-align: center; margin-bottom: 6px; }
        .bpm-rest-name { font-size: 16px; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; color: #000; }
        .bpm-rest-addr, .bpm-rest-phone, .bpm-rest-fssai, .bpm-rest-gstin { font-size: 10px; font-weight: 700; margin: 1px 0; color: #000; }
        .bpm-divider-dashed { border-top: 1px dashed #000; margin: 6px 0; }
        .bpm-divider-solid { border-top: 2px solid #000; margin: 6px 0; }
        .bpm-meta { display: flex; flex-direction: column; gap: 3px; font-size: 11px; font-weight: 700; color: #000; }
        .bpm-meta-row { display: flex; justify-content: space-between; font-size: 11px; color: #000; }
        .bpm-meta-label { font-weight: 800; text-transform: uppercase; color: #000; }
        .bpm-meta-val { font-weight: 800; color: #000; }
        .bpm-pay-badge { background: #000; color: #fff; padding: 1px 6px; border-radius: 3px; font-weight: 900; font-size: 10px; }
        .bpm-items-table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 11px; table-layout: fixed; }
        .bpm-items-table th { border-bottom: 1px solid #000; padding: 4px 0; font-weight: 900; font-size: 11px; text-align: left; color: #000; }
        .th-item { width: 44%; text-align: left; }
        .th-qty { width: 12%; text-align: center !important; }
        .th-rate { width: 22%; text-align: right !important; }
        .th-amt { width: 22%; text-align: right !important; }
        .tr-item { border-bottom: 1px dashed #000; page-break-inside: avoid; }
        .td-name { padding: 4px 0; font-weight: 700; word-break: break-word; color: #000; }
        .td-var { font-size: 10px; font-weight: 600; color: #000; }
        .td-qty { text-align: center; padding: 4px 0; font-weight: 900; color: #000; }
        .td-rate { text-align: right; padding: 4px 0; font-weight: 900; color: #000; }
        .td-amt { text-align: right; padding: 4px 0; font-weight: 900; color: #000; }
        .bpm-totals { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; color: #000; }
        .bpm-total-row { display: flex; justify-content: space-between; font-size: 11px; color: #000; }
        .bpm-grand-total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; background: #000; color: #fff; padding: 5px 6px; margin-top: 4px; border-radius: 2px; }
        .bpm-grand-total-row * { color: #fff !important; }
        .bpm-mono { font-family: 'Courier New', Courier, monospace; font-weight: 900; color: #000; }
        .bpm-thankyou { text-align: center; padding: 6px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #000; }
        .bpm-visit-again { font-size: 10px; margin-top: 2px; font-weight: 800; color: #000; }
        .bpm-tokens-section { margin-top: 10px; }
        .bpm-token-ticket { margin-top: 12px; border-top: 2px dashed #000; padding-top: 8px; page-break-inside: avoid; }
    </style>
</head>
<body>
    ${receiptElem.innerHTML}
</body>
</html>`;

            if (window.electronAPI && window.electronAPI.print) {
                try {
                    window.electronAPI.print({
                        html: fullThermalHtml,
                        printerName: selectedPrinter,
                        deviceName: selectedPrinter
                    });
                    return;
                } catch (e) {
                    console.error("Electron direct print failed, falling back to window.print()", e);
                }
            }
        }
        const origTitle = document.title;
        document.title = `Sales Bill #${billData?.bill_number || ''}`;
        window.print();
        setTimeout(() => { document.title = origTitle; }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="bpm-overlay">
            <div className="bpm-modal">

                {/* Header */}
                <div className="bpm-header no-print">
                    <div className="bpm-header-left">
                        <div className="bpm-success-icon">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <h3 className="bpm-title">Payment Successful</h3>
                            <p className="bpm-subtitle">Bill #{billData?.bill_number || '...'}</p>
                        </div>
                    </div>
                    <button className="bpm-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="bpm-body">
                    {loading ? (
                        <div className="bpm-loading no-print">
                            <Loader2 size={32} className="bpm-spinner" />
                            <p>Generating receipt...</p>
                        </div>
                    ) : (
                        <>
                            {/* Receipt Container */}
                            <div className="bpm-receipt-container">
                                <div id="bill-print-content" className="bpm-receipt">
                                    {/* Restaurant Header */}
                                    <div className="bpm-receipt-header">
                                        {restaurantData?.logo && (
                                            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                                                <img src={restaurantData.logo} alt="Logo" style={{ maxHeight: '45px', maxWidth: '100px', objectFit: 'contain' }} />
                                            </div>
                                        )}
                                        <h2 className="bpm-rest-name">{restaurantData?.name || 'RESTOBOARD'}</h2>
                                        <p className="bpm-rest-addr">{restaurantData?.address || 'Main Branch'}</p>
                                        <p className="bpm-rest-phone">Ph: {restaurantData?.phone || '9988776655'}</p>
                                        {restaurantData?.fssai_no && <p className="bpm-rest-fssai">FSSAI: {restaurantData.fssai_no}</p>}
                                        {restaurantData?.gstin && <p className="bpm-rest-gstin">GSTIN: {restaurantData.gstin}</p>}
                                    </div>

                                    {/* Bill Meta */}
                                    <div className="bpm-divider-dashed" />
                                    <div className="bpm-meta">
                                        <div className="bpm-meta-row">
                                            <span className="bpm-meta-label">Bill No:</span>
                                            <span className="bpm-meta-val">{billData?.bill_number}</span>
                                        </div>
                                        <div className="bpm-meta-row">
                                            <span className="bpm-meta-label">Date:</span>
                                            <span className="bpm-meta-val">{formatDate(billData?.createdAt)}</span>
                                        </div>
                                        <div className="bpm-meta-row">
                                            <span className="bpm-meta-label">Time:</span>
                                            <span className="bpm-meta-val">{formatTime(billData?.createdAt)}</span>
                                        </div>
                                        {(billData?.biller_name || billData?.user_name || billData?.server_name || billData?.cashier) && (
                                            <div className="bpm-meta-row">
                                                <span className="bpm-meta-label">Cashier:</span>
                                                <span className="bpm-meta-val">{billData?.biller_name || billData?.user_name || billData?.server_name || billData?.cashier}</span>
                                            </div>
                                        )}
                                        {billData?.table_no && (
                                            <div className="bpm-meta-row">
                                                <span className="bpm-meta-label">Table:</span>
                                                <span className="bpm-meta-val">{billData.table_no}</span>
                                            </div>
                                        )}
                                        <div className="bpm-meta-row">
                                            <span className="bpm-meta-label">Payment:</span>
                                            <span className="bpm-meta-val bpm-pay-badge">{formatPaymentMethod(paymentModes)}</span>
                                        </div>
                                        {billData?.kots && billData.kots.length > 0 && (
                                            <div className="bpm-meta-row">
                                                <span className="bpm-meta-label">KOT(s):</span>
                                                <span className="bpm-meta-val" style={{ textAlign: 'right', wordBreak: 'break-word', fontSize: '10px' }}>
                                                    {billData.kots.map(k => k.kot_number || 'KOT').join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bpm-divider-dashed" />

                                    {/* Party Order Details (middle) */}
                                    {(billData?.type === 'PARTY' || billData?.type === 'PARTY_ORDER') && (
                                        <div className="bpm-meta bpm-customer-details">
                                            {billData?.customer_name && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Customer:</span>
                                                    <span className="bpm-meta-val">{billData.customer_name}</span>
                                                </div>
                                            )}
                                            {billData?.customer_phone && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Phone:</span>
                                                    <span className="bpm-meta-val">{billData.customer_phone}</span>
                                                </div>
                                            )}
                                            {billData?.function_type && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Function:</span>
                                                    <span className="bpm-meta-val">{billData.function_type}</span>
                                                </div>
                                            )}
                                            {billData?.delivery_date && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Event Date:</span>
                                                    <span className="bpm-meta-val">{formatDate(billData.delivery_date)}</span>
                                                </div>
                                            )}
                                            {billData?.delivery_time && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Event Time:</span>
                                                    <span className="bpm-meta-val">{billData.delivery_time}</span>
                                                </div>
                                            )}
                                            <div className="bpm-divider-dashed" />
                                        </div>
                                    )}

                                    {/* Customer Info (Normal Orders) */}
                                    {!(billData?.type === 'PARTY' || billData?.type === 'PARTY_ORDER') && (billData?.customer_name || billData?.customer_phone) && (
                                        <div className="bpm-meta bpm-customer-details">
                                            {billData?.customer_name && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Customer:</span>
                                                    <span className="bpm-meta-val">{billData.customer_name}</span>
                                                </div>
                                            )}
                                            {billData?.customer_phone && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Phone:</span>
                                                    <span className="bpm-meta-val">{billData.customer_phone}</span>
                                                </div>
                                            )}
                                            {billData?.customer_address && (
                                                <div className="bpm-meta-row">
                                                    <span className="bpm-meta-label">Address:</span>
                                                    <span className="bpm-meta-val">{billData.customer_address}</span>
                                                </div>
                                            )}
                                            <div className="bpm-divider-dashed" />
                                        </div>
                                    )}

                                    {/* Items Table: ITEM | QTY | RATE | AMOUNT */}
                                    <table className="bpm-items-table">
                                        <thead>
                                            <tr>
                                                <th className="th-item">ITEM</th>
                                                <th className="th-qty">QTY</th>
                                                <th className="th-rate">RATE</th>
                                                <th className="th-amt">AMOUNT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getConsolidatedItems(billData?.items).map((item, idx) => {
                                                const unitRate = item.unit_price || (item.quantity ? item.total_price / item.quantity : item.total_price);
                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr className="tr-item">
                                                            <td className="td-name">
                                                                <div style={{ fontWeight: 800 }}>{item.name}</div>
                                                                {item.variation && <div className="td-var">({item.variation})</div>}
                                                                {(item.remarks || item.notes) && (
                                                                    <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#1e293b', fontWeight: 'bold', marginTop: '1px' }}>
                                                                        Remarks : {item.remarks || item.notes}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="td-qty">{item.quantity}</td>
                                                            <td className="td-rate">₹{unitRate.toFixed(2)}</td>
                                                            <td className="td-amt">₹{item.total_price.toFixed(2)}</td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Totals */}
                                    <div className="bpm-divider-solid" />
                                    <div className="bpm-totals">
                                        <div className="bpm-total-row">
                                            <span>Subtotal</span>
                                            <span className="bpm-mono">₹{billData?.sub_total?.toFixed(2)}</span>
                                        </div>

                                        {billData?.discount_amount > 0 && (
                                            <div className="bpm-total-row">
                                                <span>Discount (-)</span>
                                                <span className="bpm-mono">₹{billData?.discount_amount?.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {billData?.delivery_charge > 0 && (
                                            <div className="bpm-total-row">
                                                <span>Delivery Chg (+)</span>
                                                <span className="bpm-mono">₹{billData?.delivery_charge?.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {billData?.container_charge > 0 && (
                                            <div className="bpm-total-row">
                                                <span>Package Chg (+)</span>
                                                <span className="bpm-mono">₹{billData?.container_charge?.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {billData?.tax_amount > 0 && (
                                            <div className="bpm-total-row">
                                                <span>Tax (+)</span>
                                                <span className="bpm-mono">₹{billData?.tax_amount?.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {billData?.tip_amount > 0 && (
                                            <div className="bpm-total-row">
                                                <span>Tip / Gratuity (+)</span>
                                                <span className="bpm-mono">₹{billData?.tip_amount?.toFixed(2)}</span>
                                            </div>
                                        )}

                                        {billData?.round_off !== 0 && (
                                            <div className="bpm-total-row">
                                                <span>Round Off</span>
                                                <span className="bpm-mono">{billData?.round_off > 0 ? '+' : ''}₹{billData?.round_off?.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="bpm-grand-total-row">
                                            <span>GRAND TOTAL</span>
                                            <span className="bpm-mono">₹{billData?.grand_total?.toFixed(2)}</span>
                                        </div>

                                        {(billData?.type === 'PARTY' || billData?.type === 'PARTY_ORDER') && (
                                            <>
                                                <div className="bpm-total-row" style={{ marginTop: '8px' }}>
                                                    <span>Advance / Paid</span>
                                                    <span className="bpm-mono">₹{(billData?.total_paid || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="bpm-total-row">
                                                    <span>Balance Due</span>
                                                    <span className="bpm-mono">₹{Math.max(0, (billData?.grand_total || 0) - (billData?.total_paid || 0)).toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="bpm-divider-dashed" />
                                    <div className="bpm-thankyou">
                                        <p>Thank You For Your Order!</p>
                                        <p className="bpm-visit-again">★ VISIT AGAIN ★</p>
                                    </div>

                                    {/* Category-Wise Detachable Tokens (If NORMAL_3_INCH_WITH_TOKEN format is active) */}
                                    {(printerSettings?.print_format === 'NORMAL_3_INCH_WITH_TOKEN' || JSON.parse(localStorage.getItem('pos_printer_settings') || '{}')?.print_format === 'NORMAL_3_INCH_WITH_TOKEN') && (
                                        <div className="bpm-tokens-section" style={{ marginTop: '15px' }}>
                                            {Object.entries(
                                                (billData?.items || []).reduce((acc, item) => {
                                                    const catName = item.category_name || item.product_id?.category || item.category || 'Kitchen Orders';
                                                    if (!acc[catName]) acc[catName] = [];
                                                    acc[catName].push(item);
                                                    return acc;
                                                }, {})
                                            ).map(([catName, catItems], catIdx) => (
                                                <div key={catIdx} className="bpm-token-ticket" style={{ marginTop: '16px', borderTop: '2px dashed #000', paddingTop: '10px', pageBreakInside: 'avoid' }}>
                                                    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        ✂ ----------------------------------------
                                                    </div>
                                                    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', margin: '4px 0', color: '#000' }}>
                                                        TOKEN — {catName}
                                                    </div>
                                                    <div style={{ fontSize: '10px', fontWeight: 800, display: 'flex', justifyBetween: 'space-between', marginBottom: '4px', color: '#000' }}>
                                                        <span>TOKEN #{catIdx + 1} | BILL #{billData?.bill_number}</span>
                                                        <span>{formatDate(billData?.createdAt)} {formatTime(billData?.createdAt)}</span>
                                                    </div>
                                                    {billData?.table_no && (
                                                        <div style={{ fontSize: '10px', fontWeight: 800, marginBottom: '4px', color: '#000' }}>
                                                            TABLE: {billData.table_no} ({billData.order_type || 'DINE IN'})
                                                        </div>
                                                    )}
                                                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', margin: '4px 0' }}>
                                                        <thead>
                                                            <tr style={{ textTransform: 'uppercase', borderBottom: '1px solid #000', color: '#000' }}>
                                                                <th style={{ textAlign: 'left', padding: '3px 0' }}>ITEM</th>
                                                                <th style={{ textAlign: 'right', padding: '3px 0' }}>QTY</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {catItems.map((ci, cidx) => (
                                                                <tr key={cidx} style={{ color: '#000' }}>
                                                                    <td style={{ padding: '3px 0', fontWeight: 700 }}>{ci.name || ci.item_name}</td>
                                                                    <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 900 }}>{ci.quantity}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 800, marginTop: '4px', textTransform: 'uppercase', color: '#000' }}>
                                                        [ COUNTER COPY — DETACHABLE TOKEN ]
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bpm-actions no-print">
                                <button className="btn-export print" onClick={handlePrint}>
                                    <Printer size={18} /> Print POS Receipt
                                </button>
                                <button className="bpm-done-btn" onClick={onClose}>
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .bpm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    padding: 1rem;
                    animation: bpmFadeIn 0.3s ease;
                }

                @keyframes bpmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .bpm-modal {
                    background: #ffffff;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 360px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.4);
                    animation: bpmSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }

                @keyframes bpmSlideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .bpm-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
                }

                .bpm-header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .bpm-success-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: #16a34a;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 16px -4px rgba(22, 163, 74, 0.4);
                }

                .bpm-title {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .bpm-subtitle {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0;
                    font-weight: 700;
                }

                .bpm-close-btn {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #64748b;
                    transition: all 0.2s;
                }

                .bpm-close-btn:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                    color: #fff;
                }

                .bpm-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: block;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }

                .bpm-receipt-container {
                    perspective: 1000px;
                    margin-bottom: 0.5rem;
                }

                .bpm-receipt {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    padding: 1rem;
                    font-family: 'Inter', system-ui, sans-serif;
                    color: #000;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    position: relative;
                }

                .bpm-receipt::before,
                .bpm-receipt::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background-image: radial-gradient(circle, #e2e8f0 1.5px, transparent 1.5px);
                    background-size: 8px 4px;
                }
                .bpm-receipt::before { top: 0; }
                .bpm-receipt::after { bottom: 0; }

                .bpm-receipt-header {
                    text-align: center;
                    margin-bottom: 0.5rem;
                }

                .bpm-rest-name {
                    font-size: 1rem;
                    font-weight: 900;
                    color: #000;
                    margin: 0 0 4px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .bpm-rest-addr, .bpm-rest-phone {
                    font-size: 0.65rem;
                    color: #475569;
                    margin: 2px 0;
                    font-weight: 600;
                }

                .bpm-divider-dashed {
                    border: none;
                    border-top: 1.5px dashed #94a3b8;
                    margin: 0.5rem 0;
                }

                .bpm-divider-solid {
                    border: none;
                    border-top: 2px solid #000;
                    margin: 0.5rem 0;
                }

                .bpm-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .bpm-meta-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                    font-weight: 700;
                }

                .bpm-meta-label {
                    color: #64748b;
                    text-transform: uppercase;
                }

                .bpm-pay-badge {
                    background: #000;
                    color: #fff;
                    padding: 1px 8px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }
                .bpm-items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 0.5rem 0;
                }

                .bpm-items-table th {
                    border-bottom: 1px solid #000;
                    padding: 4px 0;
                    font-size: 0.65rem;
                    font-weight: 900;
                    text-align: left;
                    color: #64748b;
                }

                .th-qty { text-align: center !important; }
                .th-amt { text-align: right !important; }

                .tr-item {
                    border-bottom: 1px dashed #f1f5f9;
                }

                .td-name {
                    padding: 6px 0;
                    font-size: 0.75rem;
                    font-weight: 700;
                    max-width: 160px;
                    line-height: 1.3;
                }

                .td-var {
                    font-size: 0.7rem;
                    color: #64748b;
                    font-weight: 600;
                }

                .td-qty {
                    text-align: center;
                    padding: 6px 0;
                    font-size: 0.75rem;
                    font-weight: 900;
                    font-family: 'JetBrains Mono', monospace;
                }

                .td-amt {
                    text-align: right;
                    padding: 6px 0;
                    font-size: 0.75rem;
                    font-weight: 900;
                    font-family: 'JetBrains Mono', monospace;
                }

                .bpm-totals {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .bpm-total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .bpm-grand-total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1rem;
                    font-weight: 900;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    padding: 6px 0;
                    margin-top: 4px;
                }

                .bpm-mono { font-family: 'JetBrains Mono', monospace; }

                .bpm-thankyou {
                    text-align: center;
                    padding: 0.25rem 0;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .bpm-visit-again {
                    font-size: 0.6rem;
                    color: #64748b;
                    margin-top: 2px;
                }

                .bpm-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }

                .bpm-print-btn {
                    flex: 1.5;
                    height: 48px;
                    background: #0f172a;
                    color: #fff;
                    border-radius: 12px;
                    border: none;
                    font-size: 0.85rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.4);
                }

                .bpm-print-btn:hover { background: #000; transform: translateY(-2px); }

                .bpm-done-btn {
                    flex: 1;
                    height: 48px;
                    background: #f1f5f9;
                    color: #334155;
                    border-radius: 12px;
                    border: 2px solid #e2e8f0;
                    font-size: 0.85rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .bpm-done-btn:hover { background: #e2e8f0; }

                /* ── THERMAL PRINTER & PDF FULL PAGE PRINT STYLES ── */
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }

                    html, body {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-family: 'Courier New', Courier, monospace, sans-serif !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* 1. Ensure parent shell containers stay visible during print */
                    body.bpm-printing-active,
                    body.bpm-printing-active #root,
                    body.bpm-printing-active .dashboard-layout,
                    body.bpm-printing-active .dashboard-main,
                    body.bpm-printing-active main {
                        display: block !important;
                        visibility: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        background: #ffffff !important;
                    }

                    /* 2. Hide background content siblings (sidebar, header, billing containers) */
                    body.bpm-printing-active .dashboard-sidebar,
                    body.bpm-printing-active .dashboard-header,
                    body.bpm-printing-active .billing-page-container,
                    body.bpm-printing-active .billing-container,
                    body.bpm-printing-active .dashboard-content,
                    body.bpm-printing-active .no-print,
                    body.bpm-printing-active header,
                    body.bpm-printing-active nav,
                    body.bpm-printing-active footer,
                    .no-print {
                        display: none !important;
                    }

                    /* 3. Format bpm-overlay as 100% full-width solid white background cover */
                    body.bpm-printing-active .bpm-overlay,
                    .bpm-overlay {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        min-width: 100vw !important;
                        min-height: 100vh !important;
                        background: #ffffff !important;
                        backdrop-filter: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        visibility: visible !important;
                        z-index: 999999 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    /* 4. Center receipt at standard 80mm receipt proportions so layout is preserved */
                    .bpm-modal {
                        position: static !important;
                        width: 80mm !important;
                        max-width: 100% !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: #ffffff !important;
                        display: block !important;
                        visibility: visible !important;
                    }

                    .bpm-body, .bpm-receipt-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        background: #ffffff !important;
                        display: block !important;
                        visibility: visible !important;
                        overflow: visible !important;
                    }

                    /* 5. Format receipt content cleanly without stretching columns */
                    .bpm-receipt, #bill-print-content {
                        width: 78mm !important;
                        max-width: 100% !important;
                        margin: 0 auto !important;
                        padding: 3mm 2mm 15mm 2mm !important;
                        box-sizing: border-box !important;
                        border: none !important;
                        box-shadow: none !important;
                        font-family: 'Courier New', Courier, monospace, sans-serif !important;
                        font-size: 11px !important;
                        color: #000000 !important;
                        background: #ffffff !important;
                        display: block !important;
                        visibility: visible !important;
                    }

                    /* Force black high-contrast text on all elements */
                    .bpm-receipt *,
                    .bpm-rest-name,
                    .bpm-rest-addr,
                    .bpm-rest-phone,
                    .bpm-rest-fssai,
                    .bpm-rest-gstin,
                    .bpm-meta-label,
                    .bpm-meta-val,
                    .td-name,
                    .td-var,
                    .td-qty,
                    .td-amt,
                    .bpm-total-row,
                    .bpm-thankyou,
                    .bpm-visit-again {
                        color: #000000 !important;
                    }

                    .bpm-rest-name {
                        font-size: 16px !important;
                        font-weight: 900 !important;
                        margin-bottom: 2px !important;
                        text-transform: uppercase !important;
                    }

                    .bpm-divider-dashed {
                        border-top: 1px dashed #000000 !important;
                        margin: 4px 0 !important;
                    }

                    .bpm-divider-solid {
                        border-top: 1.5px solid #000000 !important;
                        margin: 4px 0 !important;
                    }

                    .bpm-items-table {
                        display: table !important;
                        width: 100% !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 4px 0 !important;
                    }

                    .bpm-items-table tr {
                        display: table-row !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    .bpm-items-table th, .bpm-items-table td {
                        display: table-cell !important;
                        font-size: 11px !important;
                        padding: 3px 0 !important;
                        color: #000000 !important;
                    }

                    .th-item { width: 44% !important; text-align: left !important; font-weight: 900 !important; }
                    .th-qty { width: 12% !important; text-align: center !important; font-weight: 900 !important; }
                    .th-rate { width: 22% !important; text-align: right !important; font-weight: 900 !important; }
                    .th-amt { width: 22% !important; text-align: right !important; font-weight: 900 !important; }

                    .td-name { width: 44% !important; text-align: left !important; word-break: break-word !important; font-weight: 700 !important; }
                    .td-qty { width: 12% !important; text-align: center !important; font-weight: 900 !important; }
                    .td-rate { width: 22% !important; text-align: right !important; font-weight: 900 !important; }
                    .td-amt { width: 22% !important; text-align: right !important; font-weight: 900 !important; }

                    .tr-item {
                        border-bottom: 1px dashed #000000 !important;
                    }

                    .bpm-pay-badge {
                        background: #000000 !important;
                        color: #ffffff !important;
                        padding: 1px 6px !important;
                        font-weight: 900 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    .bpm-grand-total-row {
                        background: #000000 !important;
                        color: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        display: flex !important;
                        justify-content: space-between !important;
                        font-size: 14px !important;
                        font-weight: 900 !important;
                        padding: 4px 6px !important;
                        margin-top: 4px !important;
                        border-radius: 2px !important;
                    }

                    .bpm-grand-total-row * {
                        color: #ffffff !important;
                    }

                    .bpm-token-ticket {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        border-top: 2px dashed #000000 !important;
                        margin-top: 10px !important;
                        padding-top: 6px !important;
                    }

                    /* Hide UI controls */
                    .no-print, 
                    .bpm-header, 
                    .bpm-actions,
                    .bpm-success-icon,
                    button {
                        display: none !important;
                    }
                }

                @media (max-width: 480px) {
                    .bpm-modal { max-height: 98vh; width: 95%; }
                    .bpm-body { padding: 1.25rem; }
                    .bpm-receipt { padding: 1.25rem 1rem; }
                    .bpm-actions { flex-direction: column; }
                }

                .bpm-loading { padding: 4rem; text-align: center; }
                .bpm-spinner { animation: spin 1s linear infinite; margin: 0 auto 1rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default BillPreviewModal;
