const mongoose = require('mongoose');

const voucherSeriesSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    series_name: {
        type: String,
        required: true,
        trim: true
    },
    prefix: {
        type: String,
        default: ''
    },
    suffix: {
        type: String,
        default: ''
    },
    starting_number: {
        type: Number,
        default: 1
    },
    next_number: {
        type: Number,
        default: 1
    },
    numbering_method: {
        type: String,
        enum: ['Automatic', 'Manual'],
        default: 'Automatic'
    },
    restart_after: {
        type: String,
        enum: ['Never', 'Restart Yearly', 'Restart Daily'],
        default: 'Never'
    },
    printer_path: {
        type: String,
        default: ''
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure series name is unique per company
voucherSeriesSchema.index({ company_id: 1, series_name: 1 }, { unique: true });

module.exports = mongoose.model('VoucherSeries', voucherSeriesSchema);
