const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({ restaurant_id: req.user.restaurant_id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get active coupons (for billing application)
// @route   GET /api/coupons/active
// @access  Private
exports.getActiveCoupons = async (req, res) => {
    try {
        const today = new Date();
        const coupons = await Coupon.find({
            restaurant_id: req.user.restaurant_id,
            is_active: true,
            start_date: { $lte: today },
            end_date: { $gte: today }
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private
exports.createCoupon = async (req, res) => {
    try {
        req.body.restaurant_id = req.user.restaurant_id;
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private
exports.updateCoupon = async (req, res) => {
    try {
        let coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        await coupon.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Validate a single coupon by number (for POS)
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
    try {
        const { coupon_name, coupon_number } = req.body;
        const today = new Date();

        const couponMaster = await Coupon.findOne({
            restaurant_id: req.user.restaurant_id,
            coupon_name: coupon_name,
            is_active: true,
            start_date: { $lte: today },
            end_date: { $gte: today },
            num_from: { $lte: coupon_number },
            num_to: { $gte: coupon_number }
        });

        if (!couponMaster) {
            return res.status(400).json({ success: false, message: 'Invalid or Expired Coupon' });
        }

        res.status(200).json({ success: true, data: couponMaster });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
