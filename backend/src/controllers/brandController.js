const Brand = require('../models/Brand');

// @desc    Get all brands for a restaurant
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({ company_id: req.user.restaurant_id })
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: brands.length, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new brand
// @route   POST /api/brands
// @access  Admin/Owner
exports.createBrand = async (req, res) => {
    try {
        const { name } = req.body;

        const existingBrand = await Brand.findOne({
            company_id: req.user.restaurant_id,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingBrand) {
            return res.status(400).json({ success: false, error: 'Brand already exists' });
        }

        const brand = await Brand.create({
            name,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Admin/Owner
exports.updateBrand = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Brand.findOne({
                company_id: req.user.restaurant_id,
                name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Brand name already exists' });
        }

        const brand = await Brand.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!brand) {
            return res.status(404).json({ success: false, error: 'Brand not found' });
        }

        res.status(200).json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle brand status
// @route   PATCH /api/brands/:id/toggle-status
// @access  Admin/Owner
exports.toggleBrandStatus = async (req, res) => {
    try {
        const brand = await Brand.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!brand) {
            return res.status(404).json({ success: false, error: 'Brand not found' });
        }

        brand.is_active = !brand.is_active;
        await brand.save();

        res.status(200).json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Admin/Owner
exports.deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!brand) {
            return res.status(404).json({ success: false, error: 'Brand not found' });
        }

        const Product = require('../models/Product');
        const productsCount = await Product.countDocuments({
            brand: brand.name,
            company_id: req.user.restaurant_id
        });

        if (productsCount > 0) {
            brand.is_active = false;
            await brand.save();
            return res.status(200).json({
                success: true,
                message: 'Brand preserved but deactivated because products are associated with it'
            });
        }

        await Brand.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({ success: true, message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
