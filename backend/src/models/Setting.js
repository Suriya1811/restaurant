const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        unique: true
    },
    general: {
        restaurant_name: String,
        address: String,
        phone: String,
        email: String,
        gstin: String,
        currency: { type: String, default: '₹' },
        footer_note: String
    },
    printer: {
        thermal_80mm: { type: Boolean, default: true },
        kot_printer_ip: String,
        bill_printer_ip: String,
        auto_print_kot: { type: Boolean, default: false },
        auto_print_bill: { type: Boolean, default: false }
    },
    kitchen_mapping: [{
        category: String,
        printer_id: String
    }],
    order_integration: {
        zomato_api_key: String,
        swiggy_api_key: String,
        enabled: { type: Boolean, default: false }
    },
    loyalty: {
        enabled: { type: Boolean, default: false },
        points_per_100_spent: { type: Number, default: 1 },
        target_points: { type: Number, default: 0 },
        point_value_rupees: { type: Number, default: 1 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
