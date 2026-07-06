const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Counter name is required'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Counter code is required'],
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['BILLING', 'SELF_SERVICE', 'TAKEAWAY'],
        default: 'BILLING'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    cash_ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    upi_ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    card_ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    }
}, {
    timestamps: true
});

// Compound index to ensure unique counter names and codes within a company
counterSchema.index({ company_id: 1, name: 1 }, { unique: true });
counterSchema.index({ company_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
