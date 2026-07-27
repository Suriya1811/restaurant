const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Tax name is required'],
        trim: true
    },
    percentage: {
        type: Number,
        required: [true, 'Tax percentage is required'],
        default: 0
    },
    sales_account_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    purchase_account_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    tax_type: {
        type: String,
        enum: ['TAXABLE', 'EXEMPTED'],
        default: 'TAXABLE'
    },
    local_central: {
        type: String,
        enum: ['LOCAL', 'CENTRAL'],
        default: 'LOCAL'
    },
    registration_type: {
        type: String,
        enum: ['REGULAR', 'COMPOSITION'],
        default: 'REGULAR'
    },
    cgst_rate: {
        type: Number,
        default: 0
    },
    sgst_rate: {
        type: Number,
        default: 0
    },
    igst_rate: {
        type: Number,
        default: 0
    },
    sales_cgst_rate: {
        type: Number,
        default: 0
    },
    sales_sgst_rate: {
        type: Number,
        default: 0
    },
    purchase_cgst_rate: {
        type: Number,
        default: 0
    },
    purchase_sgst_rate: {
        type: Number,
        default: 0
    },
    sales_igst_rate: {
        type: Number,
        default: 0
    },
    purchase_igst_rate: {
        type: Number,
        default: 0
    },
    gst_sales_ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    gst_purchase_ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    igst_sales_ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    igst_purchase_ledger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

taxSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tax', taxSchema);
