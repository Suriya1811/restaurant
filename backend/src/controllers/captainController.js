const Captain = require('../models/Captain');

exports.getCaptains = async (req, res) => {
    try {
        const captains = await Captain.find({ company_id: req.user.restaurant_id }).sort({ name: 1 });
        res.status(200).json({ success: true, count: captains.length, data: captains });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createCaptain = async (req, res) => {
    try {
        const captain = await Captain.create({ ...req.body, company_id: req.user.restaurant_id });
        res.status(201).json({ success: true, data: captain });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateCaptain = async (req, res) => {
    try {
        const captain = await Captain.findOneAndUpdate({ _id: req.params.id, company_id: req.user.restaurant_id }, req.body, { new: true });
        if (!captain) return res.status(404).json({ success: false, error: 'Captain not found' });
        res.status(200).json({ success: true, data: captain });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleCaptainStatus = async (req, res) => {
    try {
        const captain = await Captain.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!captain) return res.status(404).json({ success: false, error: 'Captain not found' });
        captain.is_active = !captain.is_active;
        await captain.save();
        res.status(200).json({ success: true, data: captain });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.deleteCaptain = async (req, res) => {
    try {
        const captain = await Captain.findOneAndDelete({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!captain) return res.status(404).json({ success: false, error: 'Captain not found' });
        res.status(200).json({ success: true, message: 'Captain deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
