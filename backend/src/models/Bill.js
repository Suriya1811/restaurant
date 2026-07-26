const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    bill_number: {
        type: String,
        required: false
    },
    counter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Counter'
    },
    table_no: {
        type: String,
        trim: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    customer_name: {
        type: String,
        trim: true
    },
    customer_phone: {
        type: String,
        trim: true
    },
    alternate_phone: {
        type: String,
        trim: true
    },
    persons: {
        type: Number
    },
    captain_name: {
        type: String,
        trim: true
    },
    waiter_name: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['DRAFT', 'OPEN', 'SAVED', 'PAID', 'PARTIAL', 'CANCELLED', 'DUE', 'CREDIT', 'KITCHEN_READY', 'KITCHEN_DONE', 'ADVANCE', 'HELD', 'HOLD'],
        default: 'OPEN'
    },
    kitchen_status: {
        type: String,
        enum: ['PENDING', 'READY', 'SERVED', 'DONE', 'IN_PROGRESS', 'KOT_SENT', 'CANCELLED'],
        default: 'PENDING'
    },
    type: {
        type: String,
        enum: ['DINE_IN', 'TAKEAWAY', 'SELF_SERVICE', 'PARCEL', 'DELIVERY', 'PARTY', 'PARTY_ORDER', 'COUNTER', 'ONLINE', 'EXPRESS'],
        default: 'SELF_SERVICE'
    },
    function_type: String,
    hall: String,
    packs: String,
    party_status: {
        type: String,
        enum: ['PREPARING', 'READY_TO_DISPATCH', 'DELIVERED'],
        default: 'PREPARING'
    },
    delivery_date: Date,
    delivery_time: String,
    delivery_address: String,
    customer_address: String,
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        sent_kot_qty: {
            type: Number,
            default: 0
        },
        unit_price: {
            type: Number,
            required: true
        },
        total_price: {
            type: Number,
            required: true
        },
        category: String, // To help with splitting if needed
        status: {
            type: String,
            enum: ['PENDING', 'READY', 'SERVED', 'CANCELLED', 'DONE'],
            default: 'PENDING'
        },
        remarks: String,
        notes: String
    }],
    sub_total: {
        type: Number,
        required: true,
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
    delivery_charge: {
        type: Number,
        default: 0
    },
    container_charge: {
        type: Number,
        default: 0
    },
    round_off: {
        type: Number,
        default: 0
    },
    grand_total: {
        type: Number,
        required: true,
        default: 0
    },
    payment_mode: {
        type: String,
        enum: ['CASH', 'UPI', 'CARD', 'ONLINE', 'SPLIT', 'PENDING', 'UNPAID', 'CREDIT', 'NA'],
        default: 'PENDING'
    },
    payment_details: {
        cash_received: Number,
        change_returned: Number,
        tips_amount: { type: Number, default: 0 },
        split_details: [{
            mode: String,
            amount: Number
        }]
    },
    payment_modes: [{
        type: {
            type: String,
            enum: ['CASH', 'UPI', 'CARD', 'ONLINE', 'SPLIT', 'CREDIT'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        cash_received: Number,  // For CASH payments
        balance_return: Number, // For CASH payments
        upi_reference: String   // For UPI payments
    }],
    total_paid: {
        type: Number,
        default: 0
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellation_reason: String,
    is_deleted: {
        type: Boolean,
        default: false
    },
    kots: [{
        kot_number: String,
        created_at: { type: Date, default: Date.now },
        status: { type: String, enum: ['PENDING', 'READY', 'SERVED', 'CANCELLED', 'DONE', 'KOT_SENT'], default: 'PENDING' },
        items: [mongoose.Schema.Types.Mixed]
    }],
    loyalty_earned_points: { type: Number, default: 0 },
    loyalty_redeemed_points: { type: Number, default: 0 },
    loyalty_redeemed_amount: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Compound index for unique bill numbers within a company
billSchema.index({ company_id: 1, bill_number: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
