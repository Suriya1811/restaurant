const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    table_number: {
        type: String,
        required: [true, 'Table number/name is required'],
        trim: true
    },
    seating_capacity: {
        type: Number,
        default: 4
    },
    captain: {
        type: String,
        trim: true
    },
    waiter: {
        type: String,
        trim: true
    },
    table_type: {
        type: String,
        default: 'G Floor'
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'OCCUPIED', 'PRINTED', 'RESERVED', 'MAINTENANCE'],
        default: 'AVAILABLE'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    // Reservation details
    reservation_name: { type: String, trim: true },
    reservation_phone: { type: String, trim: true },
    reservation_time: { type: String, trim: true },
    reservation_note: { type: String, trim: true },

    // Live session tracking
    occupied_since: { type: Date, default: null },  // When captain started the order
    printed_at: { type: Date, default: null },       // When Save & Print was done
    running_amount: { type: Number, default: 0 },   // Live bill total
    bill_id: { type: String, default: null },        // Linked active bill _id
    kot_status: { type: String, enum: ['NONE', 'KOT_SENT', 'READY'], default: 'NONE' }, // kitchen order status
}, {
    timestamps: true
});

tableSchema.index({ company_id: 1, table_number: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
