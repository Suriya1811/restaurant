const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Unit name is required'],
        trim: true
    },
    decimal_places: {
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

unitSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Unit', unitSchema);
