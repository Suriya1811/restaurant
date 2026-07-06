const Unit = require('../models/Unit');

exports.getUnits = async (req, res) => {
    try {
        const units = await Unit.find({ company_id: req.user.restaurant_id })
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: units.length, data: units });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createUnit = async (req, res) => {
    try {
        const { name, decimal_places } = req.body;

        const existingUnit = await Unit.findOne({
            company_id: req.user.restaurant_id,
            name
        });

        if (existingUnit) {
            return res.status(400).json({ success: false, error: 'Unit already exists' });
        }

        const unit = await Unit.create({
            name,
            decimal_places,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: unit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateUnit = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Unit.findOne({
                company_id: req.user.restaurant_id,
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Unit name already exists' });
        }

        const unit = await Unit.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!unit) {
            return res.status(404).json({ success: false, error: 'Unit not found' });
        }

        res.status(200).json({ success: true, data: unit });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteUnit = async (req, res) => {
    try {
        const unit = await Unit.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!unit) {
            return res.status(404).json({ success: false, error: 'Unit not found' });
        }
        await Unit.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        res.status(200).json({ success: true, message: 'Unit deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
