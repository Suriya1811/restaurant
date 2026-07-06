const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    barcode: { type: String, default: '' },
    code: { type: String, default: '' },
    item_name: { type: String, default: '' },
    unit: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0.01 },
    purchase_rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, default: 0 },
    discount_percent: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    gst_percent: { type: Number, default: 0 },
    cgst_percent: { type: Number, default: 0 },
    cgst_amount: { type: Number, default: 0 },
    sgst_percent: { type: Number, default: 0 },
    sgst_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true, default: 0 },
    cost_rate: { type: Number, default: 0 },
    sales_rate: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    hsn_code: { type: String, default: '' }
});

const purchaseSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    invoice_number: { type: String, required: true },
    invoice_date: { type: Date, default: Date.now },
    purchase_date: { type: Date, default: Date.now },
    payment_type: {
        type: String,
        enum: ['CASH', 'CREDIT'],
        default: 'CREDIT'
    },
    due_days: { type: Number, default: 0 },
    due_date: { type: Date },
    items: [purchaseItemSchema],
    sub_total: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    cgst_amount: { type: Number, default: 0 },
    sgst_amount: { type: Number, default: 0 },
    other_charges: { type: Number, default: 0 },
    round_off: { type: Number, default: 0 },
    net_amount: { type: Number, default: 0 },
    grand_total: { type: Number, required: true, default: 0 },
    payment_status: {
        type: String,
        enum: ['UNPAID', 'PARTIAL', 'PAID'],
        default: 'UNPAID'
    },
    paid_amount: { type: Number, default: 0 },
    due_amount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    notes: { type: String, default: '' },
    is_deleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);
