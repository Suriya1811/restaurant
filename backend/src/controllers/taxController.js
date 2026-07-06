const Tax = require('../models/Tax');

exports.getTaxes = async (req, res) => {
    try {
        const taxes = await Tax.find({ company_id: req.user.restaurant_id })
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: taxes.length, data: taxes });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createTax = async (req, res) => {
    try {
        const { name, percentage } = req.body;

        const existingTax = await Tax.findOne({
            company_id: req.user.restaurant_id,
            name
        });

        if (existingTax) {
            return res.status(400).json({ success: false, error: 'Tax already exists' });
        }

        const tax = await Tax.create({
            name,
            percentage,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: tax });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateTax = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Tax.findOne({
                company_id: req.user.restaurant_id,
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Tax name already exists' });
        }

        const tax = await Tax.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!tax) {
            return res.status(404).json({ success: false, error: 'Tax not found' });
        }

        res.status(200).json({ success: true, data: tax });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteTax = async (req, res) => {
    try {
        const tax = await Tax.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!tax) {
            return res.status(404).json({ success: false, error: 'Tax not found' });
        }
        await Tax.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        res.status(200).json({ success: true, message: 'Tax deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
