const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    bill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    amount: {
        type: Number,
        required: true
    },
    payment_mode: {
        type: String,
        enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'],
        required: true
    },
    transaction_reference: String,
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PENDING', 'REFUNDED'],
        default: 'SUCCESS'
    },
    cash_received: Number,
    change_returned: Number,
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
