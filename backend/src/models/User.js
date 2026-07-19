const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true
    },
    username: {
        type: String,
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        required: false,
        trim: true
    },
    user_id: {
        type: String,
        default: 'admin',
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            // Password only required if password protection is enabled
            return this.password_enabled;
        },
        select: false
    },
    role: {
        type: String,
        default: 'OWNER'
    },
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    custom_role_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    password_enabled: {
        type: Boolean,
        default: true
    },
    password_initialized: {
        type: Boolean,
        default: true
    },
    security_control_enabled: {
        type: Boolean,
        default: true
    },
    permissions: [{
        menu_key: { type: String, required: true },
        view: { type: Boolean, default: false },
        alter: { type: Boolean, default: false },
        cancel: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

// Allow same email/mobile for different companies, but keep it unique within one company
userSchema.index(
    { email: 1, restaurant_id: 1 },
    { unique: true, partialFilterExpression: { email: { $exists: true, $type: "string" } } }
);
userSchema.index(
    { mobile: 1, restaurant_id: 1 },
    { unique: true, partialFilterExpression: { mobile: { $exists: true, $type: "string" } } }
);
userSchema.index(
    { username: 1, restaurant_id: 1 },
    { unique: true, partialFilterExpression: { username: { $exists: true, $type: "string" } } }
);
userSchema.index(
    { user_id: 1, restaurant_id: 1 },
    { unique: true, partialFilterExpression: { user_id: { $exists: true, $type: "string" } } }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
