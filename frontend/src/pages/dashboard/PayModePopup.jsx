import React, { useState, useEffect } from 'react';
import { Wallet, Smartphone, CreditCard, X, Check } from 'lucide-react';
import './BillingPage.css';

const PayModePopup = ({
    grandTotal = 0,
    onPaymentSubmit,
    onCancel,
    loading = false
}) => {
    const [cashAmount, setCashAmount] = useState('');
    const [upiAmount, setUpiAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');

    const totalBill = parseFloat(grandTotal) || 0;
    
    // Derived values
    const cash = parseFloat(cashAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    
    const totalCollected = cash + upi + card;
    const balanceDue = Math.max(0, totalBill - totalCollected);
    const refundAmount = cash > 0 && totalCollected > totalBill ? totalCollected - totalBill : 0;
    
    const handleSubmit = () => {
        const modes = [];
        const actualCashPaid = Math.max(0, cash - refundAmount);
        
        if (actualCashPaid > 0) modes.push({ type: 'CASH', amount: actualCashPaid });
        if (upi > 0) modes.push({ type: 'UPI', amount: upi });
        if (card > 0) modes.push({ type: 'CARD', amount: card });

        if (balanceDue > 0.01) {
            return alert(`Please collect the full amount (Pending: ₹${balanceDue.toFixed(2)})`);
        }

        onPaymentSubmit(modes);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Payment Details</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Complete Transaction</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Summary */}
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Bill Amount</span>
                        <span className="text-2xl font-black text-slate-900">₹{totalBill.toFixed(2)}</span>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                        <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Cash Amount</label>
                            <input
                                type="number"
                                value={cashAmount}
                                onChange={e => setCashAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 pr-4 text-base font-black text-slate-800 focus:border-emerald-500 outline-none transition-all"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="0.00"
                            />
                            <Wallet size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
                        </div>

                        <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">Card Amount</label>
                            <input
                                type="number"
                                value={cardAmount}
                                onChange={e => setCardAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                onFocus={() => {
                                    setUpiAmount('');
                                    const remaining = Math.max(0, totalBill - cash);
                                    if (remaining > 0) {
                                        setCardAmount(parseFloat(remaining.toFixed(2)));
                                    }
                                }}
                                className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 pr-4 text-base font-black text-slate-800 focus:border-indigo-500 outline-none transition-all"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="0.00"
                            />
                            <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" />
                        </div>

                        <div className="relative group">
                            <label className="absolute -top-2 left-4 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">UPI Amount</label>
                            <input
                                type="number"
                                value={upiAmount}
                                onChange={e => setUpiAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                onFocus={() => {
                                    setCardAmount('');
                                    const remaining = Math.max(0, totalBill - cash);
                                    if (remaining > 0) {
                                        setUpiAmount(parseFloat(remaining.toFixed(2)));
                                    }
                                }}
                                className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 pr-4 text-base font-black text-slate-800 focus:border-violet-500 outline-none transition-all"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="0.00"
                            />
                            <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500" />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border ${balanceDue > 0 ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">Balance Due</div>
                            <div className={`text-lg font-black ${balanceDue > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
                                ₹{balanceDue.toFixed(2)}
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl border ${refundAmount > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">Refund</div>
                            <div className={`text-lg font-black ${refundAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                ₹{refundAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || balanceDue > 0.01}
                        className="btn-action-save"
                    >
                        {loading ? 'Processing...' : 'Confirm & Save'} <Check size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayModePopup;
