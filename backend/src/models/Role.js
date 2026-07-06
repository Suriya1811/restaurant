const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        trim: true
    },
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    // Which pages this role can access
    pages: [{
        page_key: {
            type: String,
            required: true
        },
        page_label: {
            type: String,
            required: true
        },
        has_access: {
            type: Boolean,
            default: false
        },
        // Feature-level permissions within each page
        features: [{
            feature_key: {
                type: String,
                required: true
            },
            feature_label: {
                type: String,
                required: true
            },
            enabled: {
                type: Boolean,
                default: false
            }
        }]
    }],
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Unique role name per restaurant
roleSchema.index({ name: 1, restaurant_id: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
