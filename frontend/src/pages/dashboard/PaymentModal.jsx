import React, { useState, useEffect } from 'react';
import './BillingPage.css';
import { CreditCard, Smartphone, Wallet, Split, X, ChevronRight, CheckCircle2 } from 'lucide-react';

const PaymentModal = ({
  isOpen,
  onClose,
  grandTotal,
  onPaymentSubmit,
  loading = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPaymentType, setSelectedPaymentType] = useState('');
  const [paymentMode, setPaymentMode] = useState('FULL');
  const [paymentData, setPaymentData] = useState({
    cashAmount: '',
    cashReceived: '',
    upiAmount: '',
    cardAmount: ''
  });

  const cashAmount = parseFloat(paymentData.cashAmount) || 0;
  const upiAmount = parseFloat(paymentData.upiAmount) || 0;
  const cardAmount = parseFloat(paymentData.cardAmount) || 0;
  const totalPaid = cashAmount + upiAmount + cardAmount;
  const remaining = Math.max(0, grandTotal - totalPaid);
  const balanceToReturn = Math.max(0, (parseFloat(paymentData.cashReceived) || 0) - cashAmount);

  const resetAllPayments = () => {
    setPaymentData({ cashAmount: '', cashReceived: '', upiAmount: '', cardAmount: '' });
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedPaymentType('');
      setPaymentMode('FULL');
      resetAllPayments();
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentTypeSelect = (type) => {
    resetAllPayments();
    setSelectedPaymentType(type);
    if (type === 'SPLIT') {
      setCurrentStep(2);
    } else {
      setPaymentMode('FULL');
      setCurrentStep(3);
      if (type === 'CASH') setPaymentData(prev => ({ ...prev, cashAmount: grandTotal.toString() }));
      else if (type === 'UPI') setPaymentData(prev => ({ ...prev, upiAmount: grandTotal.toString() }));
      else if (type === 'CARD') setPaymentData(prev => ({ ...prev, cardAmount: grandTotal.toString() }));
    }
  };

  const handleSubmit = () => {
    const paymentModes = [];
    if (cashAmount > 0) paymentModes.push({ type: 'CASH', amount: cashAmount, cash_received: parseFloat(paymentData.cashReceived) || 0, balance_return: balanceToReturn });
    if (upiAmount > 0) paymentModes.push({ type: 'UPI', amount: upiAmount });
    if (cardAmount > 0) paymentModes.push({ type: 'CARD', amount: cardAmount });
    onPaymentSubmit(paymentModes);
  };

  if (!isOpen) return null;

  const isPayDisabled = totalPaid < (grandTotal - 0.01);

  return (
    <div className="payment-modal-overlay">
      <div className="pos-payment-modal">
        {/* Header */}
        <div className="pos-modal-header">
          <div className="header-content">
            <h3 className="text-2xl font-bold text-slate-800">Checkout</h3>
            <span className="step-indicator">
              Step {currentStep} of {selectedPaymentType === 'SPLIT' ? '3' : '2'}
            </span>
          </div>
          <button className="close-btn p-2 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="pos-modal-body">
          <div className="modal-inner-container">
            {currentStep === 1 && (
              <div className="payment-step animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="step-title">
                  <h4 className="text-3xl font-extrabold text-slate-900 mb-2">How would you like to pay?</h4>
                  <p className="step-description">Select a preferred payment method to continue</p>
                </div>

                <div className="payment-type-grid">
                  <button className="payment-type-btn p-6 border-2 hover:shadow-xl transition-all" onClick={() => handlePaymentTypeSelect('CASH')}>
                    <Wallet className="text-orange-500 mb-2" size={32} />
                    <span className="font-bold text-lg">Cash</span>
                  </button>
                  <button className="payment-type-btn p-6 border-2 hover:shadow-xl transition-all" onClick={() => handlePaymentTypeSelect('UPI')}>
                    <Smartphone className="text-blue-500 mb-2" size={32} />
                    <span className="font-bold text-lg">UPI / QR</span>
                  </button>
                  <button className="payment-type-btn p-6 border-2 hover:shadow-xl transition-all" onClick={() => handlePaymentTypeSelect('CARD')}>
                    <CreditCard className="text-purple-500 mb-2" size={32} />
                    <span className="font-bold text-lg">Card</span>
                  </button>
                  <button className="payment-type-btn p-6 border-2 hover:shadow-xl transition-all" onClick={() => handlePaymentTypeSelect('SPLIT')}>
                    <Split className="text-green-500 mb-2" size={32} />
                    <span className="font-bold text-lg">Split Bill</span>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="payment-step animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="step-title">
                  <h4 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Mode</h4>
                  <p className="step-description">Choose how you want to split the payment</p>
                </div>
                <div className="mode-selection">
                  <button className={`mode-btn p-6 border-2 transition-all ${paymentMode === 'FULL' ? 'selected' : ''}`} onClick={() => { setPaymentMode('FULL'); setCurrentStep(3); }}>
                    <div className="mode-icon"><CheckCircle2 size={24} /></div>
                    <div className="mode-text">
                      <h5 className="font-bold text-lg">Full Payment</h5>
                      <p>Single method split</p>
                    </div>
                  </button>
                  <button className={`mode-btn p-6 border-2 transition-all ${paymentMode === 'PARTIAL' ? 'selected' : ''}`} onClick={() => { setPaymentMode('PARTIAL'); setCurrentStep(3); }}>
                    <div className="mode-icon"><Split size={24} /></div>
                    <div className="mode-text">
                      <h5 className="font-bold text-lg">Multi-Method</h5>
                      <p>Combine cash, card, & UPI</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="payment-step animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
                <div className="pos-total-section">
                  <div className="total-row">
                    <span className="text-slate-600">Grand Total</span>
                    <span className="total-amount">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="payment-forms-container w-full max-w-md space-y-4">
                  {(selectedPaymentType === 'CASH' || (selectedPaymentType === 'SPLIT' && paymentMode === 'PARTIAL')) && (
                    <div className="pos-payment-section">
                      <div className="section-header">
                        <Wallet size={18} className="text-orange-500" />
                        <h5>Cash Payment</h5>
                      </div>
                      <div className="payment-fields">
                        <div className="field-group">
                          <label>Amount to Pay</label>
                          <input type="number" value={paymentData.cashAmount} onChange={(e) => handleInputChange('cashAmount', e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="field-group">
                          <label>Cash Received</label>
                          <input type="number" value={paymentData.cashReceived} onChange={(e) => handleInputChange('cashReceived', e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="field-group col-span-2">
                          <label>Change to Return</label>
                          <input type="text" readOnly className="readonly-field" value={`₹${balanceToReturn.toFixed(2)}`} />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedPaymentType === 'UPI' || (selectedPaymentType === 'SPLIT' && paymentMode === 'PARTIAL')) && (
                    <div className="pos-payment-section">
                      <div className="section-header">
                        <Smartphone size={18} className="text-blue-500" />
                        <h5>UPI Payment</h5>
                      </div>
                      <div className="payment-fields">
                        <div className="field-group full-width">
                          <label>UPI Amount</label>
                          <input type="number" value={paymentData.upiAmount} onChange={(e) => handleInputChange('upiAmount', e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedPaymentType === 'CARD' || (selectedPaymentType === 'SPLIT' && paymentMode === 'PARTIAL')) && (
                    <div className="pos-payment-section">
                      <div className="section-header">
                        <CreditCard size={18} className="text-purple-500" />
                        <h5>Card Payment</h5>
                      </div>
                      <div className="payment-fields">
                        <div className="field-group full-width">
                          <label>Card Amount</label>
                          <input type="number" value={paymentData.cardAmount} onChange={(e) => handleInputChange('cardAmount', e.target.value)} placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pos-summary-section">
                    <div className="summary-row">
                      <span>Total Paid</span>
                      <span className={`amount ${totalPaid >= grandTotal ? 'paid' : 'pending'}`}>₹{totalPaid.toFixed(2)}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="summary-row">
                        <span>Remaining</span>
                        <span className="amount pending">₹{remaining.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <button className="pay-btn" disabled={isPayDisabled || loading} onClick={handleSubmit}>
                    {loading ? 'Processing...' : 'CONFIRM PAYMENT & PRINT'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions for Step 1 & 2 */}
        {currentStep < 3 && (
          <div className="pos-modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            {currentStep > 1 && (
              <button className="btn-back" onClick={() => setCurrentStep(currentStep - 1)}>Back</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;