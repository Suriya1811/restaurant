const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true
    },
    contact_person: {
        type: String,
        trim: true,
        default: ''
    },
    contact_number: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        default: ''
    },
    gst_number: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    opening_balance: {
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

supplierSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Supplier', supplierSchema);
