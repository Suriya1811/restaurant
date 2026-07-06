const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Brand name is required'],
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique brand names within a company
brandSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Brand', brandSchema);
