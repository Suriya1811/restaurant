const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['FOOD', 'BEVERAGE', 'OTHER'],
        default: 'FOOD'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    hsn_code: {
        type: String,
        trim: true
    },
    hsn_description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique category names within a company
categorySchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
