const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    gst_number: {
        type: String,
        trim: true,
        default: ''
    },
    opening_balance: {
        type: Number,
        default: 0
    },
    loyalty_points: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique customer contact within a company
customerSchema.index({ company_id: 1, phone: 1 }, {
    unique: true,
    partialFilterExpression: { phone: { $type: "string", $ne: "" } }
});

module.exports = mongoose.model('Customer', customerSchema);
