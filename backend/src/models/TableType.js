const mongoose = require('mongoose');

const tableTypeSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Table type name is required'],
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique table type names within a company
tableTypeSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('TableType', tableTypeSchema);
