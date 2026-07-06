const Counter = require('../models/Counter');

exports.getCounters = async (req, res) => {
    try {
        const counters = await Counter.find({ company_id: req.user.restaurant_id });
        res.status(200).json({ success: true, count: counters.length, data: counters });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createCounter = async (req, res) => {
    try {
        const { name, code, type, cash_ledger_id, upi_ledger_id, card_ledger_id } = req.body;

        // Validation for uniqueness
        const existingCounter = await Counter.findOne({
            company_id: req.user.restaurant_id,
            $or: [{ name: name }, { code: code }]
        });

        if (existingCounter) {
            return res.status(400).json({ success: false, error: 'Counter name or code already exists' });
        }

        const counter = await Counter.create({
            name,
            code,
            type,
            cash_ledger_id,
            upi_ledger_id,
            card_ledger_id,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: counter });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateCounter = async (req, res) => {
    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!counter) {
            return res.status(404).json({ success: false, error: 'Counter not found' });
        }

        res.status(200).json({ success: true, data: counter });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
