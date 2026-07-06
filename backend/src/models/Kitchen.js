const mongoose = require('mongoose');

const kitchenSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Kitchen name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    // which food categories this kitchen handles
    categories: [{
        type: String,
        trim: true
    }],
    // display color for the KDS UI
    color: {
        type: String,
        default: '#6c5fc7'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

kitchenSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Kitchen', kitchenSchema);
