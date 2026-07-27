/**
 * Balance Utility Functions
 * Handles safe increments and database sanitization for opening_balance across Ledgers, Suppliers, and Customers.
 */

/**
 * Safely increments opening_balance on a Mongoose model (Ledger, Supplier, Customer).
 * If opening_balance in DB is null/undefined/non-numeric, it heals it to 0 before applying $inc.
 */
const safeIncBalance = async (Model, id, amount, session = null) => {
    if (!Model || !id || amount === undefined || amount === null) return null;
    const delta = Number(amount);
    if (isNaN(delta) || delta === 0) return null;

    const options = session ? { session } : {};

    // 1. Ensure the target document does not have a null or non-numeric opening_balance
    await Model.updateOne(
        {
            _id: id,
            $or: [
                { opening_balance: null },
                { opening_balance: { $type: 'null' } },
                { opening_balance: { $exists: false } }
            ]
        },
        { $set: { opening_balance: 0 } },
        options
    );

    // 2. Perform atomic $inc safely
    return Model.findByIdAndUpdate(
        id,
        { $inc: { opening_balance: delta } },
        { new: true, ...options }
    );
};

/**
 * Scans DB collections and sanitizes any null/missing opening_balance fields to 0.
 */
const sanitizeAllBalances = async () => {
    try {
        const Ledger = require('../models/Ledger');
        const Supplier = require('../models/Supplier');
        const Customer = require('../models/Customer');

        const nullFilter = {
            $or: [
                { opening_balance: null },
                { opening_balance: { $type: 'null' } },
                { opening_balance: { $exists: false } }
            ]
        };

        const [r1, r2, r3] = await Promise.all([
            Ledger.updateMany(nullFilter, { $set: { opening_balance: 0 } }),
            Supplier.updateMany(nullFilter, { $set: { opening_balance: 0 } }),
            Customer.updateMany(nullFilter, { $set: { opening_balance: 0 } })
        ]);

        if (r1.modifiedCount > 0 || r2.modifiedCount > 0 || r3.modifiedCount > 0) {
            console.log(`✅ Sanitized opening_balance (fixed null fields -> Ledgers: ${r1.modifiedCount}, Suppliers: ${r2.modifiedCount}, Customers: ${r3.modifiedCount})`);
        }
    } catch (err) {
        console.error('Error during balance sanitization:', err.message);
    }
};

module.exports = {
    safeIncBalance,
    sanitizeAllBalances
};
