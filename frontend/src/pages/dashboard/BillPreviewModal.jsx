import React, { useState, useEffect } from 'react';
import { Printer, X, CheckCircle2, Loader2 } from 'lucide-react';

const BillPreviewModal = ({ isOpen, onClose, billId, paymentModes }) => {
    const [billData, setBillData] = useState(null);
    const [restaurantData, setRestaurantData] = useState(null);
    const [loading, setLoading] = useState(true);

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
        window.print();
        // Since we are using @media print in the style block below, 
        // it will automatically only print the receipt area without reloads.
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

                                    {/* Items */}
                                    <table className="bpm-items-table">
                                        <thead>
                                            <tr>
                                                <th className="th-item">ITEM</th>
                                                <th className="th-qty">QTY</th>
                                                <th className="th-amt">AMOUNT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getConsolidatedItems(billData?.items).map((item, idx) => (
                                                <React.Fragment key={idx}>
                                                    <tr className="tr-item">
                                                        <td className="td-name">
                                                            <div>{item.name}{item.notes ? ` (${item.notes})` : ''}</div>
                                                            {item.variation && <div className="td-var">({item.variation})</div>}
                                                        </td>
                                                        <td className="td-qty">{item.quantity}</td>
                                                        <td className="td-amt">₹{item.total_price.toFixed(2)}</td>
                                                    </tr>
                                                </React.Fragment>
                                            ))}
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

                /* ── PRINT STYLES ── */
                @media print {
                    /* Reset everything */
                    @page {
                        margin: 0;
                        size: auto;
                    }

                    /* General hiding */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }

                    /* Hide everything EXCEPT the modal overlay and its children */
                    body > * {
                        display: none !important;
                    }

                    body > .bpm-overlay {
                        display: block !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        visibility: visible !important;
                        backdrop-filter: none !important;
                    }

                    /* Reset Modal appearance for Paper */
                    .bpm-modal {
                        position: static !important;
                        width: 80mm !important;
                        margin: 0 auto !important;
                        box-shadow: none !important;
                        border: none !important;
                        display: block !important;
                        max-width: none !important;
                        max-height: none !important;
                        visibility: visible !important;
                    }

                    .bpm-body {
                        padding: 0 !important;
                        display: block !important;
                        visibility: visible !important;
                        overflow: visible !important;
                    }

                    .bpm-receipt-container {
                        display: block !important;
                        visibility: visible !important;
                    }

                    /* Force ALL Receipt parts to be visible */
                    .bpm-receipt, 
                    .bpm-receipt *,
                    .bpm-receipt-header,
                    .bpm-meta,
                    .bpm-items-table,
                    .bpm-totals,
                    .bpm-thankyou {
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                    }

                    .bpm-items-table {
                        display: table !important;
                        width: 100% !important;
                    }
                    
                    .bpm-items-table tr {
                        display: table-row !important;
                    }
                    
                    .bpm-items-table th, .bpm-items-table td {
                        display: table-cell !important;
                    }

                    .tr-item {
                        border-bottom: 1px dashed #000 !important;
                    }

                    .bpm-pay-badge {
                        background: #000 !important;
                        color: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .bpm-grand-total-row {
                        background: #000 !important;
                        color: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        display: flex !important;
                    }

                    /* Specifically hide the UI components */
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
