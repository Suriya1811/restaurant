const mongoose = require('mongoose');

/**
 * Ledger Model
 * 
 * Represents an individual account ledger in the double-entry bookkeeping system.
 * Each ledger belongs to a LedgerGroup (group field stores the group NAME e.g. "Sundry Debtors").
 * 
 * Field guide (mirrors Tally's ledger creation form):
 *  1. Basic         - name, group, description
 *  2. Party Details - phone, email, gstin, pan, party_type, party_category, registration_type, state
 *  3. Address       - billing_address, shipping_address, same_as_billing
 *  4. Accounts      - opening_balance, balance_type, due_days, credit_limit
 *  5. Contact       - contact_person, dob
 *  6. Bank Details  - bank_account_number, ifsc_code, bank_name, branch, account_holder_name
 */
const ledgerSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },

    // 1. Basic Info
    name: {
        type: String,
        required: [true, 'Ledger name is required'],
        trim: true
    },
    print_name: {
        type: String,
        trim: true,
        default: ''
    },
    /**
     * `group` now stores the GROUP NAME (e.g. "Sundry Debtors", "Bank Accounts", "Sales Accounts")
     * instead of an enum so it's compatible with custom groups created by users.
     * Default system groups: 29 standard Tally-like groups (see LedgerGroup model).
     */
    group: {
        type: String,
        required: [true, 'Ledger group is required'],
        trim: true,
        default: 'Indirect Expenses'
    },
    description: {
        type: String,
        trim: true
    },

    // 2. Party Details (applicable for Sundry Debtors, Sundry Creditors, etc.)
    phone:              { type: String,  trim: true },
    mobile2:            { type: String,  trim: true, default: '' },
    email:              { type: String,  trim: true, lowercase: true },
    gstin:              { type: String,  trim: true },
    pan_number:         { type: String,  trim: true },
    party_type:         { type: String,  enum: ['CUSTOMER', 'SUPPLIER', 'AGENT', 'NONE'], default: 'NONE' },
    party_category:     { type: String,  trim: true },
    registration_type:  { type: String,  trim: true, default: 'Regular' },
    state:              { type: String,  trim: true },

    // 3. Address
    billing_address:    { type: String,  trim: true },
    shipping_address:   { type: String,  trim: true },
    same_as_billing:    { type: Boolean, default: true },
    address_line_1:     { type: String,  trim: true, default: '' },
    address_line_2:     { type: String,  trim: true, default: '' },
    address_line_3:     { type: String,  trim: true, default: '' },
    address_line_4:     { type: String,  trim: true, default: '' },
    address_line_5:     { type: String,  trim: true, default: '' },

    // 4. Accounts Details
    opening_balance: {
        type: Number,
        default: 0,
        set: v => (v === null || v === undefined || isNaN(v) ? 0 : Number(v))
    },
    balance_type: {
        type: String,
        enum: ['DR', 'CR'],  // DR = Debit (asset/expense), CR = Credit (liability/income)
        default: 'DR'
    },
    due_days:      { type: Number, default: 0 },
    credit_limit:  { type: Number, default: 0 },

    // 5. Contact Information
    contact_person: { type: String, trim: true },
    dob:            { type: Date },

    // 6. Party Bank Details
    bank_account_number: { type: String, trim: true },
    ifsc_code:           { type: String, trim: true },
    bank_name:           { type: String, trim: true },
    branch:              { type: String, trim: true },
    account_holder_name: { type: String, trim: true },

    // Status
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Unique per company
ledgerSchema.index({ company_id: 1, name: 1 }, { unique: true });
// For filtering by group
ledgerSchema.index({ company_id: 1, group: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
