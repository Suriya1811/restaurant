const Waiter = require('../models/Waiter');

exports.getWaiters = async (req, res) => {
    try {
        const waiters = await Waiter.find({ company_id: req.user.restaurant_id }).sort({ name: 1 });
        res.status(200).json({ success: true, count: waiters.length, data: waiters });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createWaiter = async (req, res) => {
    try {
        const waiter = await Waiter.create({ ...req.body, company_id: req.user.restaurant_id });
        res.status(201).json({ success: true, data: waiter });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateWaiter = async (req, res) => {
    try {
        const waiter = await Waiter.findOneAndUpdate({ _id: req.params.id, company_id: req.user.restaurant_id }, req.body, { new: true });
        if (!waiter) return res.status(404).json({ success: false, error: 'Waiter not found' });
        res.status(200).json({ success: true, data: waiter });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleWaiterStatus = async (req, res) => {
    try {
        const waiter = await Waiter.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!waiter) return res.status(404).json({ success: false, error: 'Waiter not found' });
        waiter.is_active = !waiter.is_active;
        await waiter.save();
        res.status(200).json({ success: true, data: waiter });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.deleteWaiter = async (req, res) => {
    try {
        const waiter = await Waiter.findOneAndDelete({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!waiter) return res.status(404).json({ success: false, error: 'Waiter not found' });
        res.status(200).json({ success: true, message: 'Waiter deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
