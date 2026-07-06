const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    code: {
        type: String,
        trim: true
    },
    barcode: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    short_name: {
        type: String,
        trim: true
    },
    print_name: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    food_type: {
        type: String,
        enum: ['VEG', 'NON_VEG', 'NONE'],
        default: 'NONE'
    },
    item_nature: {
        type: String,
        enum: ['GOOD', 'SERVICE'],
        default: 'GOOD'
    },
    product_type: {
        type: String,
        enum: ['GOODS', 'SERVICES'],
        default: 'GOODS'
    },
    purchase_price: {
        type: Number,
        default: 0
    },
    cost_price: {
        type: Number,
        default: 0
    },
    selling_price: {
        type: Number,
        required: [true, 'Selling price is required'],
        default: 0
    },
    mrp: {
        type: Number,
        default: 0
    },
    gst_sales: {
        type: Number,
        default: 0
    },
    gst_purchase: {
        type: Number,
        default: 0
    },
    hsn_code: {
        type: String,
        trim: true
    },
    unit: {
        type: String,
        trim: true
    },
    opening_stock: {
        type: Number,
        default: 0
    },
    current_stock: {
        type: Number,
        default: 0
    },
    stock_value: {
        type: Number,
        default: 0
    },
    // Stock levels
    min_stock: { type: Number, default: 0 },
    max_stock: { type: Number, default: 0 },
    reorder_level: { type: Number, default: 0 },
    urgent_order_level: { type: Number, default: 0 },

    // Timing
    available_timings: [{
        label: String, // Morning, Afternoon, Evening
        start_time: String,
        end_time: String,
        enabled: { type: Boolean, default: true }
    }],

    // Addons
    addons: [{
        name: String,
        rate: Number
    }],

    // Variations
    variations: [{
        name: String,
        amount: Number
    }],

    // Service Types
    serve_types: {
        dine_in: { type: Boolean, default: true },
        delivery: { type: Boolean, default: true },
        pickup: { type: Boolean, default: true },
        party_order: { type: Boolean, default: true }
    },

    online_order: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        default: ''
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to ensure unique product names within a company
productSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
