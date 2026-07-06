const mongoose = require('mongoose');

const printerSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Printer name is required'],
        trim: true
    },
    ip_address: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    // which food categories this printer handles
    categories: [{
        type: String,
        trim: true
    }],
    // display color for the Printer Manager UI
    color: {
        type: String,
        default: '#3b82f6'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

printerSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Printer', printerSchema);
