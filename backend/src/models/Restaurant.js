const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    company_name: {
        type: String,
        required: [true, 'Company name is required'],
        minlength: [3, 'Company name must be at least 3 characters'],
        trim: true
    },
    store_name: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true
    },
    logo_url: {
        type: String,
        default: ''
    },
    print_name: {
        type: String,
        required: [true, 'Print name is required'],
        trim: true
    },
    restaurant_type: {
        type: String,
        enum: ['SMART', 'EFFICIENT', 'ENTERPRISE', 'SELF_SERVICE', 'DINING'],
        required: [true, 'Restaurant type is required']
    },
    financial_year_start: {
        type: Date,
        required: [true, 'Financial year start date is required']
    },
    financial_year_end: {
        type: Date,
        required: [true, 'Financial year end date is required']
    },
    books_from: {
        type: Date,
        required: [true, 'Books from date is required']
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    fssai_no: {
        type: String,
        trim: true
    },
    gstin: {
        type: String,
        trim: true
    },
    billing_layout: {
        type: String,
        enum: ['SIDEBAR', 'TOP_HEADER'],
        default: 'SIDEBAR'
    },
    printer_enabled: {
        type: Boolean,
        default: false
    },
    printer_width: {
        type: String,
        default: '58mm'
    },
    bill_header: {
        type: String,
        default: ''
    },
    bill_footer: {
        type: String,
        default: ''
    },
    gst_no: {
        type: String,
        default: ''
    },
    auto_print: {
        type: Boolean,
        default: false
    },
    kot_printer_ip: { type: String, default: '' },
    bill_printer_ip: { type: String, default: '' },
    printer_settings: {
        sales_bill_printer: { type: String, default: 'Sales Bill Printer' },
        kot_printer: { type: String, default: 'KOT Printer' },
        delivery_printer: { type: String, default: 'Delivery Printer' },
        print_format: { type: String, enum: ['NORMAL_3_INCH', 'NORMAL_3_INCH_WITH_TOKEN'], default: 'NORMAL_3_INCH' }
    },
    backup_settings: {
        backup_dir: { type: String, default: '' },
        on_startup: { type: Boolean, default: false },
        on_exit: { type: Boolean, default: false },
        auto_interval: { type: Number, default: 0 },
        last_backup_at: { type: Date }
    },
    kitchen_mapping: [{
        category: String,
        printer_ip: String
    }],
    zomato_api_key: { type: String, default: '' },
    swiggy_api_key: { type: String, default: '' },
    order_integration_enabled: { type: Boolean, default: false },
    coupon_enabled: { type: Boolean, default: false },
    loyalty_enabled: { type: Boolean, default: false },
    loyalty_points_per_100: { type: Number, default: 1 },
    loyalty_target_points: { type: Number, default: 0 },
    loyalty_point_value: { type: Number, default: 1 },
    billing_coupon_active: { type: Boolean, default: true },
    billing_loyalty_active: { type: Boolean, default: true },
    kitchen_enabled: { type: Boolean, default: true },
    counter_enabled: { type: Boolean, default: true },
    dashboard_enabled: { type: Boolean, default: true },
    reports_enabled: { type: Boolean, default: true },
    staff_enabled: { type: Boolean, default: true },
    table_enabled: { type: Boolean, default: true },
    pay_mode_enabled: { type: Boolean, default: true },
    stock_level_enabled: { type: Boolean, default: true },
    kot_enabled: { type: Boolean, default: true },
    party_order_enabled: { type: Boolean, default: true },
    split_rate_tax_enabled: { type: Boolean, default: false },
    data_auto_lock_enabled: { type: Boolean, default: false },
    unlock_days: { type: Number, default: null },
    lock_date_up_to: { type: Date, default: null },
    cards_per_row: { type: Number, default: 7, min: 4, max: 7 },
    extra_modules_password: { type: String, default: '' },
    bill_series: {
        dine_in: { 
            numbering_method: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
            prefix: { type: String, default: 'DI' }, 
            suffix: { type: String, default: '' }, 
            starting_number: { type: Number, default: 1 }, 
            next_number: { type: Number, default: 1 },
            restart_after: { type: String, enum: ['Yearly', 'Monthly', 'Daily', 'Never'], default: 'Never' },
            last_reset_date: { type: Date }
        },
        takeaway: { 
            numbering_method: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
            prefix: { type: String, default: 'TA' }, 
            suffix: { type: String, default: '' }, 
            starting_number: { type: Number, default: 1 }, 
            next_number: { type: Number, default: 1 },
            restart_after: { type: String, enum: ['Yearly', 'Monthly', 'Daily', 'Never'], default: 'Never' },
            last_reset_date: { type: Date }
        },
        delivery: { 
            numbering_method: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
            prefix: { type: String, default: 'DE' }, 
            suffix: { type: String, default: '' }, 
            starting_number: { type: Number, default: 1 }, 
            next_number: { type: Number, default: 1 },
            restart_after: { type: String, enum: ['Yearly', 'Monthly', 'Daily', 'Never'], default: 'Never' },
            last_reset_date: { type: Date }
        },
        parcel: { 
            numbering_method: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
            prefix: { type: String, default: 'PA' }, 
            suffix: { type: String, default: '' }, 
            starting_number: { type: Number, default: 1 }, 
            next_number: { type: Number, default: 1 },
            restart_after: { type: String, enum: ['Yearly', 'Monthly', 'Daily', 'Never'], default: 'Never' },
            last_reset_date: { type: Date }
        },
        party: { 
            numbering_method: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
            prefix: { type: String, default: 'PT' }, 
            suffix: { type: String, default: '' }, 
            starting_number: { type: Number, default: 1 }, 
            next_number: { type: Number, default: 1 },
            restart_after: { type: String, enum: ['Yearly', 'Monthly', 'Daily', 'Never'], default: 'Never' },
            last_reset_date: { type: Date }
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
