const LedgerGroup = require('../models/LedgerGroup');

/**
 * The 28 default Tally-like ledger groups that get seeded for every new company.
 * Structure: { name, parent, nature, sort_order, description }
 */
const DEFAULT_GROUPS = [
    // ── PRIMARY GROUPS ──────────────────────────────────────────────
    { name: 'Capital Account',         parent: null, nature: 'LIABILITIES', sort_order: 1,  description: 'Represents the owner\'s invested capital' },
    { name: 'Reserves & Surplus',      parent: null, nature: 'LIABILITIES', sort_order: 2,  description: 'Accumulated profits / reserves' },
    { name: 'Loans (Liability)',        parent: null, nature: 'LIABILITIES', sort_order: 3,  description: 'All borrowed funds' },
    { name: 'Current Liabilities',     parent: null, nature: 'LIABILITIES', sort_order: 4,  description: 'Short-term obligations' },
    { name: 'Fixed Assets',            parent: null, nature: 'ASSETS',      sort_order: 5,  description: 'Long-term tangible assets' },
    { name: 'Investments',             parent: null, nature: 'ASSETS',      sort_order: 6,  description: 'Financial investments made by the company' },
    { name: 'Current Assets',          parent: null, nature: 'ASSETS',      sort_order: 7,  description: 'Assets convertible within one year' },
    { name: 'Misc. Expenses (ASSET)',  parent: null, nature: 'ASSETS',      sort_order: 8,  description: 'Preliminary / deferred revenue expenses' },
    { name: 'Branch / Divisions',      parent: null, nature: 'LIABILITIES', sort_order: 9,  description: 'Funds with branches / divisions' },
    { name: 'Suspense A/c',            parent: null, nature: 'LIABILITIES', sort_order: 10, description: 'Temporary / unclassified entries' },
    { name: 'Profit & Loss A/c',       parent: null, nature: 'LIABILITIES', sort_order: 11, description: 'Net P&L balance' },

    // ── SECONDARY GROUPS – Liabilities ──────────────────────────────
    { name: 'Bank OD A/c',       parent: 'Loans (Liability)',    nature: 'LIABILITIES', sort_order: 12, description: 'Bank overdraft accounts' },
    { name: 'Secured Loans',     parent: 'Loans (Liability)',    nature: 'LIABILITIES', sort_order: 13, description: 'Loans secured against assets' },
    { name: 'Unsecured Loans',   parent: 'Loans (Liability)',    nature: 'LIABILITIES', sort_order: 14, description: 'Loans without security' },
    { name: 'Duties & Taxes',    parent: 'Current Liabilities',  nature: 'LIABILITIES', sort_order: 15, description: 'GST, TDS and statutory duties payable' },
    { name: 'Provisions',        parent: 'Current Liabilities',  nature: 'LIABILITIES', sort_order: 16, description: 'Estimated liabilities (audit, gratuity, etc.)' },
    { name: 'Sundry Creditors',  parent: 'Current Liabilities',  nature: 'LIABILITIES', sort_order: 17, description: 'Amounts payable to suppliers / creditors' },

    // ── SECONDARY GROUPS – Assets ────────────────────────────────────
    { name: 'Bank Accounts',            parent: 'Current Assets', nature: 'ASSETS', sort_order: 18, description: 'Bank current / savings accounts' },
    { name: 'Cash-in-Hand',             parent: 'Current Assets', nature: 'ASSETS', sort_order: 19, description: 'Physical cash held' },
    { name: 'Deposits (Asset)',         parent: 'Current Assets', nature: 'ASSETS', sort_order: 20, description: 'Security / advance deposits given' },
    { name: 'Loans & Advances (Asset)', parent: 'Current Assets', nature: 'ASSETS', sort_order: 21, description: 'Loans & advances given to others' },
    { name: 'Stock-in-Hand',            parent: 'Current Assets', nature: 'ASSETS', sort_order: 22, description: 'Closing stock / inventory' },
    { name: 'Sundry Debtors',           parent: 'Current Assets', nature: 'ASSETS', sort_order: 23, description: 'Amounts receivable from customers / debtors' },

    // ── SECONDARY GROUPS – Expenses ─────────────────────────────────
    { name: 'Direct Expenses',    parent: null, nature: 'EXPENSES', sort_order: 24, description: 'Manufacturing / production related expenses' },
    { name: 'Indirect Expenses',  parent: null, nature: 'EXPENSES', sort_order: 25, description: 'Administrative / selling expenses' },
    { name: 'Purchase Accounts',  parent: null, nature: 'EXPENSES', sort_order: 26, description: 'Goods purchased for resale / production' },

    // ── SECONDARY GROUPS – Income ────────────────────────────────────
    { name: 'Direct Incomes',    parent: null, nature: 'INCOME', sort_order: 27, description: 'Income directly from operations / trading' },
    { name: 'Indirect Incomes',  parent: null, nature: 'INCOME', sort_order: 28, description: 'Non-operating income (interest, rent, etc.)' },
    { name: 'Sales Accounts',    parent: null, nature: 'INCOME', sort_order: 29, description: 'Sales / revenue ledgers' }
];

// ─── SEED defaults for a company ────────────────────────────────────────────
exports.seedDefaultGroups = async (company_id) => {
    try {
        const existing = await LedgerGroup.countDocuments({ company_id });
        if (existing > 0) return; // already seeded
        const docs = DEFAULT_GROUPS.map(g => ({ ...g, company_id, is_system: true }));
        await LedgerGroup.insertMany(docs);
    } catch (err) {
        console.error('Error seeding default groups:', err.message);
    }
};

// ─── GET all groups ──────────────────────────────────────────────────────────
exports.getLedgerGroups = async (req, res) => {
    try {
        // Ensure defaults exist
        const count = await LedgerGroup.countDocuments({ company_id: req.user.restaurant_id });
        if (count === 0) {
            const docs = DEFAULT_GROUPS.map(g => ({ ...g, company_id: req.user.restaurant_id, is_system: true }));
            await LedgerGroup.insertMany(docs);
        }
        const groups = await LedgerGroup.find({ company_id: req.user.restaurant_id }).sort({ sort_order: 1, name: 1 });
        res.status(200).json({ success: true, count: groups.length, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─── CREATE custom group ─────────────────────────────────────────────────────
exports.createLedgerGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await LedgerGroup.findOne({
            company_id: req.user.restaurant_id,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        if (exists) return res.status(400).json({ success: false, error: 'Group name already exists' });
        const group = await LedgerGroup.create({ ...req.body, company_id: req.user.restaurant_id, is_system: false });
        res.status(201).json({ success: true, data: group });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─── UPDATE group ────────────────────────────────────────────────────────────
exports.updateLedgerGroup = async (req, res) => {
    try {
        const group = await LedgerGroup.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        if (group.is_system && req.body.name && req.body.name !== group.name) {
            return res.status(400).json({ success: false, error: 'Cannot rename a system group' });
        }
        const updated = await LedgerGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─── DELETE group ────────────────────────────────────────────────────────────
exports.deleteLedgerGroup = async (req, res) => {
    try {
        const group = await LedgerGroup.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
        if (group.is_system) return res.status(400).json({ success: false, error: 'Cannot delete system-defined groups' });

        // Check if any ledger uses this group
        const Ledger = require('../models/Ledger');
        const inUse = await Ledger.countDocuments({ company_id: req.user.restaurant_id, group: group.name });
        if (inUse > 0) return res.status(400).json({ success: false, error: `Cannot delete: ${inUse} ledger(s) are using this group` });

        await LedgerGroup.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
