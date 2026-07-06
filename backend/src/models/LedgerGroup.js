const mongoose = require('mongoose');

/**
 * LedgerGroup Model
 * 
 * Represents the two-level account hierarchy (like Tally):
 *  - Primary Groups (top level: Assets, Liabilities, Income, Expenses)
 *  - Secondary Groups (sub-groups under primary): e.g. Current Assets, Fixed Assets, etc.
 * 
 * The 28 pre-defined groups below mirror Tally's default chart of accounts.
 * Users can also create custom secondary groups under any primary.
 */

const ledgerGroupSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Group name is required'],
        trim: true
    },
    // parent group name (null for primary groups like Assets, Liabilities, etc.)
    parent: {
        type: String,
        default: null,
        trim: true
    },
    // The nature determines DR/CR behaviour for P&L / Balance Sheet
    nature: {
        type: String,
        enum: ['ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES'],
        required: true
    },
    // Whether this is a system default (cannot be deleted)
    is_system: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        trim: true
    },
    // For ordering in the UI
    sort_order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

ledgerGroupSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('LedgerGroup', ledgerGroupSchema);
