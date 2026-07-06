const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    type: {
        type: String,
        enum: ['IN', 'OUT', 'ADJUSTMENT'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    previous_stock: {
        type: Number,
        required: true
    },
    new_stock: {
        type: Number,
        required: true
    },
    reference_type: {
        type: String,
        enum: ['SALE', 'PURCHASE', 'MANUAL', 'WASTAGE'],
        default: 'MANUAL'
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId
    },
    remark: {
        type: String,
        trim: true
    },
    performed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
