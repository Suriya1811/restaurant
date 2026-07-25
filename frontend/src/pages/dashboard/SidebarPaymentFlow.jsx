import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Smartphone, CreditCard, Save, Printer, ArrowLeft, Banknote, X } from 'lucide-react';
import './BillingPage.css';

const SidebarPaymentFlow = ({
    grandTotal = 0,
    onPaymentSubmit,
    onCancel,
    partialAllowed = false,
    loading = false
}) => {
    const [data, setData] = useState({
        cashReceived: '',
        upiAmount: '',
        cardAmount: '',
    });

    const billedAmt = parseFloat(grandTotal) || 0;
    const [cashAmounts, setCashAmounts] = useState({ received: '' });
    const [upiAmount, setUpiAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');
    const [chequeAmount, setChequeAmount] = useState('');
    const [tipsAmount, setTipsAmount] = useState('');
    
    // Advance Payment states
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [advPaymentMode, setAdvPaymentMode] = useState('CASH');
    const [advAmount, setAdvAmount] = useState('');
    const [activeMode, setActiveMode] = useState('CASH');

    const [paymentType, setPaymentType] = useState('CASH');

    const handleModeSelect = (mode) => {
        setActiveMode(mode);
        if (mode === 'CASH') {
            setCashAmounts({ received: grandTotal.toString() });
            setUpiAmount('');
            setCardAmount('');
        } else if (mode === 'UPI') {
            setUpiAmount(grandTotal.toString());
            setCashAmounts({ received: '' });
            setCardAmount('');
        } else if (mode === 'CARD') {
            setCardAmount(grandTotal.toString());
            setCashAmounts({ received: '' });
            setUpiAmount('');
        }
    };

    const calculateFinancials = () => {
        const cashRec = parseFloat(cashAmounts.received) || 0;
        const upi = parseFloat(upiAmount) || 0;
        const card = parseFloat(cardAmount) || 0;
        const cheque = parseFloat(chequeAmount) || 0;
        const tips = parseFloat(tipsAmount) || 0;
        
        const totalBill = grandTotal + tips;

        const otherPayments = upi + card + cheque;
        const totalPotential = cashRec + otherPayments;
        
        let pending = Math.max(0, totalBill - totalPotential);
        let cashUsed = 0;
        let balance = 0;

        if (totalPotential >= totalBill) {
            cashUsed = Math.max(0, totalBill - otherPayments);
            balance = cashRec - cashUsed;
            pending = 0;
        } else {
            cashUsed = cashRec;
            balance = 0;
            pending = totalBill - totalPotential;
        }

        return {
            pending,
            balance,
            cashUsed,
            totalBill
        };
    };

    const { pending, balance, cashUsed, totalBill } = calculateFinancials();

    const handleSubmit = (shouldPrint = false) => {
        const modes = [];
        if (paymentType === 'CREDIT') {
            modes.push({ type: 'CREDIT', amount: grandTotal });
        } else {
            if (cashUsed > 0) modes.push({ type: 'CASH', amount: cashUsed });
            if (parseFloat(upiAmount) > 0) modes.push({ type: 'UPI', amount: parseFloat(upiAmount) });
            if (parseFloat(cardAmount) > 0) modes.push({ type: 'CARD', amount: parseFloat(cardAmount) });
            if (parseFloat(chequeAmount) > 0) modes.push({ type: 'ONLINE', amount: parseFloat(chequeAmount) });

            if (modes.length === 0) return alert("Please enter payment amount or select Credit sale.");
            if (pending > 0 && !partialAllowed) {
                return alert(`Please collect full amount (Pending: ₹${pending.toFixed(2)})`);
            }
        }

        const tips = parseFloat(tipsAmount) || 0;
        onPaymentSubmit(modes, tips, paymentType === 'CREDIT' || pending > 0, 0, { shouldPrint, paymentType });
    };

    const isConfirmDisabled = useMemo(() => {
        if (loading) return true;
        return false;
    }, [loading]);

    const confirmAdvance = () => {
        setCashAmounts({ received: '', balance: 0 });
        setUpiAmount('');
        setCardAmount('');
        setChequeAmount('');

        if (advPaymentMode === 'CASH') setCashAmounts({ received: advAmount, balance: 0 });
        if (advPaymentMode === 'UPI') setUpiAmount(advAmount);
        if (advPaymentMode === 'CARD') setCardAmount(advAmount);
        if (advPaymentMode === 'CHEQUE') setChequeAmount(advAmount);

        setShowAdvanceModal(false);
    };

    return (
        <>
        <div className="payment-modal-overlay">
            <div className="sidebar-payment-container animate-in slide-in-from-bottom-2">
                <div className="unified-payment-rectangle">
                    {/* PAYMENT TYPE SELECTOR (CASH vs CREDIT, Default: CASH) */}
                    <div className="mb-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard size={16} className={paymentType === 'CREDIT' ? 'text-orange-600' : 'text-slate-500'} />
                            Payment Type
                        </label>
                        <select
                            value={paymentType}
                            onChange={(e) => {
                                const selected = e.target.value;
                                setPaymentType(selected);
                                if (selected === 'CREDIT') {
                                    setCashAmounts({ received: '' });
                                    setUpiAmount('');
                                    setCardAmount('');
                                    setChequeAmount('');
                                } else {
                                    setCashAmounts({ received: grandTotal.toString() });
                                }
                            }}
                            className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 focus:border-orange-500 outline-none transition-all cursor-pointer shadow-xs"
                        >
                            <option value="CASH">Cash Sale (Immediate Payment)</option>
                            <option value="CREDIT">Credit Sale (Party Outstanding)</option>
                        </select>
                    </div>

                    {paymentType === 'CREDIT' && (
                        <div className="mb-3 p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs font-bold text-orange-800 flex items-center justify-between">
                            <span>Credit Sale Selected: Total ₹{parseFloat(grandTotal).toFixed(2)} will be debited to Customer Outstanding.</span>
                        </div>
                    )}

                    {/* 1st ROW: CASH */}
                    <div className={`unified-row-module ${activeMode === 'CASH' ? 'active-row' : ''}`}>
                        <div className="row-header" onClick={() => handleModeSelect('CASH')}>
                            <div className="method-selector">
                                <Wallet size={18} />
                                <span>CASH</span>
                            </div>
                        </div>
                        <div className="row-fields-grid !grid-cols-2">
                            <div className="payment-field">
                                <label>RECEIVED AMT</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="unified-input"
                                    value={cashAmounts.received} 
                                    onChange={(e) => setCashAmounts({ ...cashAmounts, received: e.target.value })}
                                />
                            </div>
                            <div className="payment-field">
                                <label>BALANCE AMOUNT</label>
                                <div className="display-value balance">
                                    ₹{balance.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2nd ROW: UPI */}
                    <div className={`unified-row-module ${activeMode === 'UPI' ? 'active-row' : ''}`}>
                        <div className="row-header" onClick={() => handleModeSelect('UPI')}>
                            <div className="method-selector">
                                <Smartphone size={18} />
                                <span>UPI</span>
                            </div>
                        </div>
                        <div className="row-fields-grid !grid-cols-1">
                            <div className="field-item">
                                <label>UPI AMOUNT</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={upiAmount}
                                    onChange={e => setUpiAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3rd ROW: CARD */}
                    <div className={`unified-row-module ${activeMode === 'CARD' ? 'active-row' : ''}`}>
                        <div className="row-header" onClick={() => handleModeSelect('CARD')}>
                            <div className="method-selector">
                                <CreditCard size={18} />
                                <span>CARD</span>
                            </div>
                        </div>
                        <div className="row-fields-grid !grid-cols-1">
                            <div className="field-item">
                                <label>CARD AMOUNT</label>
                                <input
                                    type="number"
                                    className="unified-input"
                                    value={cardAmount}
                                    onChange={e => setCardAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ADVANCE PAYMENT BUTTON (ONLY FOR PARTY ORDERS) */}
                    {partialAllowed && (
                        <button 
                            className="btn-action-add"
                            onClick={() => setShowAdvanceModal(true)}
                        >
                            <Banknote size={18} />
                            ADD ADVANCE PAYMENT
                        </button>
                    )}

                    {/* BILL DETAILS SUMMARY */}
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Billed Amt</span>
                            <span className="text-xl font-black text-slate-800">₹{parseFloat(grandTotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Tips Amt</span>
                            <input
                                type="number"
                                className="unified-input !py-1 !text-right !w-24 !text-sm"
                                value={tipsAmount}
                                onChange={e => setTipsAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-200">
                            <span className="text-[14px] font-black text-indigo-600 uppercase tracking-widest">Total Bill</span>
                            <span className="text-2xl font-black text-indigo-600">₹{parseFloat(totalBill).toFixed(2)}</span>
                        </div>
                        
                        {(parseFloat(cashAmounts.received || 0) + parseFloat(upiAmount || 0) + parseFloat(cardAmount || 0) + parseFloat(chequeAmount || 0)) > 0 && pending > 0 && (
                            <div className="flex justify-between items-center mb-1 bg-orange-50 p-2 rounded-lg border border-orange-100">
                                <span className="text-[12px] font-black text-orange-600 uppercase tracking-widest">Advance Paid</span>
                                <span className="text-lg font-black text-orange-600">
                                    ₹{(parseFloat(cashAmounts.received || 0) + parseFloat(upiAmount || 0) + parseFloat(cardAmount || 0) + parseFloat(chequeAmount || 0)).toFixed(2)}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm mt-1">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Pending Amt</span>
                            <span className={`text-xl font-black ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {pending > 0 ? `₹${pending.toFixed(2)}` : 'PAID'}
                            </span>
                        </div>
                    </div>

                    <div className="payment-actions">
                        <button 
                            className="btn-pay-action btn-save" 
                            onClick={() => handleSubmit(false)} 
                            disabled={loading || (pending > 0 && !partialAllowed && (parseFloat(cashAmounts.received) > 0 || parseFloat(upiAmount) > 0 || parseFloat(cardAmount) > 0))}
                        >
                            <Save size={20} />
                            <span>SAVE</span>
                        </button>
                        <button 
                            className="btn-export print" 
                            onClick={() => handleSubmit(true)} 
                            disabled={loading || (pending > 0 && !partialAllowed)}
                        >
                            <Printer size={20} />
                            <span>SAVE & PRINT</span>
                        </button>
                    </div>
                    <button className="unified-back-btn mt-4 w-full flex items-center justify-center gap-2" onClick={onCancel}>
                        <ArrowLeft size={14} /> Back to Billing
                    </button>
                </div>
            </div>
        </div>

        {/* ADVANCE PAYMENT MODAL */}
            {showAdvanceModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-sm animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-black text-xl text-slate-800 tracking-tight">Advance <span className="text-orange-600">Payment</span></h3>
                            <button onClick={() => setShowAdvanceModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-5 flex justify-between items-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bill Amount</div>
                            <div className="text-lg font-black text-slate-800">₹{parseFloat(grandTotal).toFixed(2)}</div>
                        </div>

                        <div className="mb-5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Payment Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['CASH', 'UPI', 'CARD', 'CHEQUE'].map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => setAdvPaymentMode(m)}
                                        className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${advPaymentMode === m ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 border-orange-600' : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-orange-200'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Advance Amount (₹)</label>
                            <input 
                                type="text"
                                inputMode="decimal"
                                autoFocus
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-black text-slate-800 focus:border-orange-600 focus:bg-white transition-all outline-none"
                                value={advAmount}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setAdvAmount(val);
                                }}
                                placeholder="0.00"
                            />
                        </div>

                        <button 
                            onClick={confirmAdvance}
                            disabled={!advAmount || parseFloat(advAmount) <= 0 || parseFloat(advAmount) > grandTotal}
                            className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SidebarPaymentFlow;
