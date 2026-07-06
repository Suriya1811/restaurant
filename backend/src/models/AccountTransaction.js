const mongoose = require('mongoose');

const accountTransactionSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger',
        required: true
    },
    type: {
        type: String,
        enum: ['DEBIT', 'CREDIT'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    voucher_type: {
        type: String,
        required: true
    },
    voucher_number: {
        type: String,
        required: true
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true // Points to Sales (Bill), Purchase, or Voucher _id
    },
    narration: {
        type: String,
        trim: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexing for faster report generation
accountTransactionSchema.index({ company_id: 1, ledger_id: 1, date: 1 });
accountTransactionSchema.index({ reference_id: 1 });

module.exports = mongoose.model('AccountTransaction', accountTransactionSchema);
