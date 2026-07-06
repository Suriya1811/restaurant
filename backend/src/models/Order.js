const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menu_item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Product acts as MenuItem
        required: true
    },
    name: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unit_price: {
        type: Number,
        required: true
    },
    total_price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
        default: 'PENDING'
    },
    notes: String
});

const orderSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    order_number: {
        type: String,
        required: true
    },
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table'
    },
    no_of_persons: {
        type: Number,
        default: 1
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    items: [orderItemSchema],
    sub_total: {
        type: Number,
        default: 0
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    grand_total: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['NEW', 'IN_PROGRESS', 'COMPLETED', 'BILLED', 'CANCELLED'],
        default: 'NEW'
    },
    bill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

orderSchema.index({ company_id: 1, order_number: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
