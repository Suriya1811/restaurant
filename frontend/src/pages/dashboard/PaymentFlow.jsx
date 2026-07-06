import React, { useState, useEffect } from 'react';
import './BillingPage.css';
import { CreditCard, Smartphone, Wallet, Split, ChevronLeft, CheckCircle2, Info } from 'lucide-react';

const PaymentFlow = ({
    grandTotal,
    onPaymentSubmit,
    onCancel,
    loading = false,
    initialType = 'CASH'
}) => {
    const [isSplit, setIsSplit] = useState(false);
    const [activeMethod, setActiveMethod] = useState(initialType || 'CASH');
    const [paymentData, setPaymentData] = useState({
        cashAmount: '',
        cashReceived: '',
        upiAmount: '',
        cardAmount: '',
        tipAmount: ''
    });

    useEffect(() => {
        // When split is OFF, sync selected method with grand total
        if (!isSplit) {
            const resetData = { ...paymentData, cashAmount: '', upiAmount: '', cardAmount: '' };
            if (activeMethod === 'CASH') resetData.cashAmount = grandTotal.toFixed(2);
            else if (activeMethod === 'UPI') resetData.upiAmount = grandTotal.toFixed(2);
            else if (activeMethod === 'CARD') resetData.cardAmount = grandTotal.toFixed(2);
            setPaymentData(resetData);
        }
    }, [isSplit, activeMethod, grandTotal]);

    const cashAmount = parseFloat(paymentData.cashAmount) || 0;
    const upiAmount = parseFloat(paymentData.upiAmount) || 0;
    const cardAmount = parseFloat(paymentData.cardAmount) || 0;
    const tipAmount = parseFloat(paymentData.tipAmount) || 0;

    const totalPaid = cashAmount + upiAmount + cardAmount;
    const totalDueWithTip = grandTotal + tipAmount;
    const remaining = Math.max(0, totalDueWithTip - totalPaid);
    const balanceToReturn = Math.max(0, (parseFloat(paymentData.cashReceived) || 0) - cashAmount);

    const handleInputChange = (field, value) => {
        setPaymentData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        const paymentModes = [];
        if (cashAmount > 0) paymentModes.push({
            type: 'CASH',
            amount: cashAmount,
            cash_received: parseFloat(paymentData.cashReceived) || 0,
            balance_return: balanceToReturn
        });
        if (upiAmount > 0) paymentModes.push({ type: 'UPI', amount: upiAmount });
        if (cardAmount > 0) paymentModes.push({ type: 'CARD', amount: cardAmount });

        onPaymentSubmit(paymentModes, tipAmount);
    };

    const isPayDisabled = totalPaid < (grandTotal - 0.01);

    return (
        <div className="payment-flow-integrated animate-in fade-in">
            <div className="payment-header-summary">
                <div className="pay-summary-item">
                    <span className="label">Bill Amount</span>
                    <span className="value">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="pay-summary-item">
                    <span className="label">Tip Amount</span>
                    <input
                        type="number"
                        className="tip-input-summary"
                        placeholder="0"
                        value={paymentData.tipAmount}
                        onChange={(e) => handleInputChange('tipAmount', e.target.value)}
                    />
                </div>
                <div className="pay-summary-item">
                    <span className="label">Total Paid</span>
                    <span className="value success">₹{totalPaid.toFixed(2)}</span>
                </div>
                {remaining > 0 && (
                    <div className="pay-summary-item">
                        <span className="label">Remaining</span>
                        <span className="value warning">₹{remaining.toFixed(2)}</span>
                    </div>
                )}
            </div>

            <div className="payment-body-container">
                <div className="payment-sidebar-methods">
                    <div className="split-toggle-card">
                        <span>Split Payment</span>
                        <label className="switch">
                            <input type="checkbox" checked={isSplit} onChange={() => setIsSplit(!isSplit)} />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {[
                        { id: 'CASH', name: 'Cash', desc: 'Physical Note', icon: <Wallet size={20} />, class: 'cash' },
                        { id: 'UPI', name: 'UPI', desc: 'Scan & Pay', icon: <Smartphone size={20} />, class: 'upi' },
                        { id: 'CARD', name: 'Card', desc: 'Visa / Master', icon: <CreditCard size={20} />, class: 'card' }
                    ].map(method => (
                        <button
                            key={method.id}
                            className={`method-select-btn ${activeMethod === method.id ? 'active' : ''}`}
                            onClick={() => setActiveMethod(method.id)}
                        >
                            <div className={`method-icon-box ${method.class}`}>
                                {method.icon}
                            </div>
                            <div className="method-info-text">
                                <span className="name">{method.name}</span>
                                <span className="desc">{method.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="payment-details-view">
                    {/* Render Cash Details if selected OR in split mode */}
                    {(activeMethod === 'CASH' || isSplit) && (
                        <div className="payment-detail-card cash fade-in">
                            <div className="card-header-flex">
                                <Wallet size={18} /> <span>Cash Payment</span>
                            </div>
                            <div className="payment-inputs-grid">
                                <div className="input-field-group">
                                    <label>Amount to Pay</label>
                                    <input
                                        type="number"
                                        value={paymentData.cashAmount}
                                        onChange={(e) => handleInputChange('cashAmount', e.target.value)}
                                        readOnly={!isSplit}
                                    />
                                </div>
                                <div className="input-field-group">
                                    <label>Cash Received</label>
                                    <input
                                        type="number"
                                        value={paymentData.cashReceived}
                                        onChange={(e) => handleInputChange('cashReceived', e.target.value)}
                                    />
                                </div>
                                <div className="full">
                                    <div className="balance-box">
                                        <span className="label">Balance to Return</span>
                                        <span className="val">₹{balanceToReturn.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Render UPI Details if selected OR in split mode */}
                    {(activeMethod === 'UPI' || isSplit) && (
                        <div className="payment-detail-card upi fade-in">
                            <div className="card-header-flex">
                                <Smartphone size={18} /> <span>UPI / QR Payment</span>
                            </div>
                            <div className="payment-inputs-grid">
                                <div className="input-field-group full">
                                    <label>UPI Amount</label>
                                    <input
                                        type="number"
                                        value={paymentData.upiAmount}
                                        onChange={(e) => handleInputChange('upiAmount', e.target.value)}
                                        readOnly={!isSplit}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Render Card Details if selected OR in split mode */}
                    {(activeMethod === 'CARD' || isSplit) && (
                        <div className="payment-detail-card card fade-in">
                            <div className="card-header-flex">
                                <CreditCard size={18} /> <span>Card Payment</span>
                            </div>
                            <div className="payment-inputs-grid">
                                <div className="input-field-group full">
                                    <label>Card Amount</label>
                                    <input
                                        type="number"
                                        value={paymentData.cardAmount}
                                        onChange={(e) => handleInputChange('cardAmount', e.target.value)}
                                        readOnly={!isSplit}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {isSplit && (
                        <div className="info-msg" style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '8px', alignItems: 'center', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                            <Info size={16} /> <span>In <b>Split Mode</b>, you can enter custom amounts for each method. Total must match bill amount.</span>
                        </div>
                    )}

                    <div className="payment-action-footer">
                        <button className="cancel-pay-btn" onClick={onCancel}>
                            CANCEL
                        </button>
                        <button
                            className="pay-btn-final"
                            disabled={isPayDisabled || loading}
                            onClick={handleSubmit}
                        >
                            {loading ? 'PROCESSING...' : `PAY ₹${totalPaid.toFixed(2)} & FINISH`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFlow;
