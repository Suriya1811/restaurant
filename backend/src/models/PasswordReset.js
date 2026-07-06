const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otp_hash: {
        type: String,
        required: true
    },
    expires_at: {
        type: Date,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index to automatically expire documents
passwordResetSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
