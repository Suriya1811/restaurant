const mongoose = require('mongoose');

const waiterSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Waiter name is required'],
        trim: true
    },
    phone: { // CELL NO
        type: String,
        trim: true,
        default: ''
    },
    cell_no_2: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    joining_date: {
        type: Date,
        default: Date.now
    },
    id_proof_type: {
        type: String,
        enum: ['ADHAR CARD', 'VOTER ID', 'DRIVING LICENSE', 'NONE'],
        default: 'NONE'
    },
    image: {
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

module.exports = mongoose.model('Waiter', waiterSchema);
