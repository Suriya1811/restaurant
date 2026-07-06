const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Tax name is required'],
        trim: true
    },
    percentage: {
        type: Number,
        required: [true, 'Tax percentage is required'],
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

taxSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tax', taxSchema);
