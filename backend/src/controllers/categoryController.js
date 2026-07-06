const Category = require('../models/Category');

// @desc    Get all categories for a restaurant
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ company_id: req.user.restaurant_id })
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Admin/Owner
exports.createCategory = async (req, res) => {
    try {
        const { name, type, hsn_code, hsn_description } = req.body;

        const existingCategory = await Category.findOne({
            company_id: req.user.restaurant_id,
            name
        });

        if (existingCategory) {
            return res.status(400).json({ success: false, error: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            type,
            hsn_code,
            hsn_description,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin/Owner
exports.updateCategory = async (req, res) => {
    try {
        // Prevent updates if trying to duplicate name
        if (req.body.name) {
            const duplicate = await Category.findOne({
                company_id: req.user.restaurant_id,
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Category name already exists' });
        }

        const category = await Category.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle category status
// @route   PATCH /api/categories/:id/toggle-status
// @access  Admin/Owner
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        category.is_active = !category.is_active;
        await category.save();

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin/Owner
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Check if any products are associated with this category
        const Product = require('../models/Product'); // Import here to avoid circular dependency
        const productsCount = await Product.countDocuments({
            category: category.name,
            company_id: req.user.restaurant_id
        });

        if (productsCount > 0) {
            category.is_active = false;
            await category.save();
            return res.status(200).json({
                success: true,
                message: 'Category preserved but deactivated because products are associated with it'
            });
        }

        await Category.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
