import React, { useState, useEffect } from 'react';

const CashCalculator = ({ 
  payableAmount = 0, 
  onCalculationChange = () => {},
  cashReceived: initialCashReceived = '',
  cashPaid: initialCashPaid = ''
}) => {
  const [cashReceived, setCashReceived] = useState(initialCashReceived);
  const [cashPaid, setCashPaid] = useState(initialCashPaid);
  const [balanceReturn, setBalanceReturn] = useState(0);
  const [error, setError] = useState('');

  // Calculate balance when inputs change
  useEffect(() => {
    const received = parseFloat(cashReceived) || 0;
    const paid = parseFloat(cashPaid) || 0;
    
    // Calculate balance to return
    const calculatedBalance = received - paid;
    
    if (received > 0 && received < payableAmount) {
      setError('Insufficient cash received');
      setBalanceReturn(0);
    } else if (paid > 0 && received < paid) {
      setError('Cash received is less than amount to be paid');
      setBalanceReturn(0);
    } else {
      setError('');
      setBalanceReturn(calculatedBalance >= 0 ? calculatedBalance : 0);
    }

    // Notify parent component of changes
    onCalculationChange({
      cashReceived: received,
      cashPaid: paid,
      balanceReturn: calculatedBalance >= 0 ? calculatedBalance : 0,
      isValid: !error && received >= Math.max(payableAmount, paid)
    });
  }, [cashReceived, cashPaid, payableAmount, error, onCalculationChange]);

  const handleCashReceivedChange = (e) => {
    setCashReceived(e.target.value);
  };

  const handleCashPaidChange = (e) => {
    setCashPaid(e.target.value);
  };

  return (
    <div className="cash-calculator">
      <div className="calculator-header">
        <h4>Cash Calculator</h4>
      </div>
      
      <div className="calculator-body">
        <div className="form-group">
          <label>Payable Amount (₹)</label>
          <input
            type="number"
            readOnly
            value={payableAmount}
            className="readonly-input"
          />
        </div>
        
        <div className="form-group">
          <label>Cash Paid (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cashPaid}
            onChange={handleCashPaidChange}
            placeholder="Enter amount to pay"
          />
        </div>
        
        <div className="form-group">
          <label>Cash Received (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cashReceived}
            onChange={handleCashReceivedChange}
            placeholder="Enter cash received"
          />
        </div>
        
        <div className="form-group">
          <label>Balance to Return (₹)</label>
          <input
            type="number"
            readOnly
            value={balanceReturn.toFixed(2)}
            className="readonly-input"
          />
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashCalculator;