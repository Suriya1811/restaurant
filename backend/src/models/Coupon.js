const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    coupon_name: {
        type: String,
        required: true
    },
    num_from: {
        type: Number,
        required: true
    },
    num_to: {
        type: Number,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['DISCOUNT', 'BOGO'],
        default: 'DISCOUNT'
    },
    discount_type: {
        type: String,
        enum: ['PERCENT', 'FIXED'],
        default: 'PERCENT'
    },
    discount_value: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
