const Ledger = require('../models/Ledger');

/**
 * Creates default ledgers for a new restaurant
 * @param {string} companyId - The ID of the restaurant
 */
const createDefaultLedgers = async (companyId) => {
    const defaults = [
        { name: 'Cash in Hand', group: 'Cash-in-Hand', balance_type: 'DR' },
        { name: 'Sales Account', group: 'Sales Accounts', balance_type: 'CR' },
        { name: 'Purchase Account', group: 'Purchase Accounts', balance_type: 'DR' },
        { name: 'GST Output', group: 'Duties & Taxes', balance_type: 'CR' },
        { name: 'GST Input', group: 'Duties & Taxes', balance_type: 'DR' },
        { name: 'HDFC Bank', group: 'Bank Accounts', balance_type: 'DR' }
    ];

    const ledgerPromises = defaults.map(ledger => {
        return Ledger.findOneAndUpdate(
            { company_id: companyId, name: ledger.name },
            { ...ledger, company_id: companyId },
            { upsert: true, new: true }
        );
    });

    return Promise.all(ledgerPromises);
};

module.exports = {
    createDefaultLedgers
};
