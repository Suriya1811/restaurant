const Ledger = require('../models/Ledger');
const { seedDefaultGroups } = require('./ledgerGroupController');

// ─── GET all ledgers (supports ?group= filter and ?nature= filter) ────────────
exports.getLedgers = async (req, res) => {
    try {
        // Auto-seed ledger groups on first call (harmless if already seeded)
        await seedDefaultGroups(req.user.restaurant_id);

        const filter = { company_id: req.user.restaurant_id };

        // Optional group name filter (comma-separated)
        if (req.query.group) {
            const groups = req.query.group.split(',').map(g => g.trim());
            filter.group = { $in: groups };
        }

        // Optional name search
        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: 'i' };
        }

        // Optional active filter
        if (req.query.active !== undefined) {
            filter.is_active = req.query.active === 'true';
        }

        const ledgers = await Ledger.find(filter).sort({ group: 1, name: 1 });
        res.status(200).json({ success: true, count: ledgers.length, data: ledgers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ─── GET single ledger ───────────────────────────────────────────────────────
exports.getLedgerById = async (req, res) => {
    try {
        const ledger = await Ledger.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });
        res.status(200).json({ success: true, data: ledger });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ─── CREATE ledger ───────────────────────────────────────────────────────────
exports.createLedger = async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await Ledger.findOne({
            company_id: req.user.restaurant_id,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        if (exists) return res.status(400).json({ success: false, error: 'Ledger already exists' });

        const ledger = await Ledger.create({ ...req.body, company_id: req.user.restaurant_id });
        res.status(201).json({ success: true, data: ledger });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─── UPDATE ledger ───────────────────────────────────────────────────────────
exports.updateLedger = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Ledger.findOne({
                company_id: req.user.restaurant_id,
                name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Ledger name already exists' });
        }
        const ledger = await Ledger.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true }
        );
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });
        res.status(200).json({ success: true, data: ledger });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─── TOGGLE active status ─────────────────────────────────────────────────────
exports.toggleLedgerStatus = async (req, res) => {
    try {
        const ledger = await Ledger.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });
        ledger.is_active = !ledger.is_active;
        await ledger.save();
        res.status(200).json({ success: true, data: ledger });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// ─── DELETE ledger ───────────────────────────────────────────────────────────
exports.deleteLedger = async (req, res) => {
    try {
        const ledger = await Ledger.findOneAndDelete({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });
        res.status(200).json({ success: true, message: 'Ledger deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─── GET ledger summary by group ─────────────────────────────────────────────
exports.getLedgerSummaryByGroup = async (req, res) => {
    try {
        const summary = await Ledger.aggregate([
            { $match: { company_id: req.user.restaurant_id } },
            {
                $group: {
                    _id: '$group',
                    count: { $sum: 1 },
                    total_balance: { $sum: '$opening_balance' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
