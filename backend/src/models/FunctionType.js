const mongoose = require('mongoose');

const functionTypeSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure function type name is unique per company
functionTypeSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FunctionType', functionTypeSchema);
