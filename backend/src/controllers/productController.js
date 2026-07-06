const Product = require('../models/Product');

// @desc    Get all products (scoped to company)
// @route   GET /api/products
// @access  Private (Admin, Owner, Billing)
exports.getProducts = async (req, res) => {
    try {
        const { is_active } = req.query;
        const restId = req.user.restaurant_id._id || req.user.restaurant_id;
        let query = { company_id: restId };

        if (is_active) {
            query.is_active = is_active === 'true';
        }

        const products = await Product.find(query).sort({ created_at: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin, Owner)
exports.createProduct = async (req, res) => {
    try {
        const { name, category, selling_price, product_type } = req.body;

        if (!name || !category || selling_price == null) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (name, category, selling price)' });
        }

        const restId = req.user.restaurant_id._id || req.user.restaurant_id;
        // Check for duplicates
        const exists = await Product.findOne({
            company_id: restId,
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive check
        });

        if (exists) {
            return res.status(400).json({ success: false, message: 'Product with this name already exists' });
        }

        const product = await Product.create({
            ...req.body,
            company_id: restId,
            current_stock: req.body.opening_stock || 0
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin, Owner)
exports.updateProduct = async (req, res) => {
    try {
        const restId = req.user.restaurant_id._id || req.user.restaurant_id;
        let product = await Product.findOne({ _id: req.params.id, company_id: restId });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Apply update data
        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle product active status (Disable/Enable)
// @route   PATCH /api/products/:id/toggle-status
// @access  Private (Admin, Owner)
exports.toggleProductStatus = async (req, res) => {
    try {
        const restId = req.user.restaurant_id._id || req.user.restaurant_id;
        const product = await Product.findOne({ _id: req.params.id, company_id: restId });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.is_active = !product.is_active;
        await product.save();

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Owner)
exports.deleteProduct = async (req, res) => {
    try {
        const restId = req.user.restaurant_id._id || req.user.restaurant_id;
        const product = await Product.findOne({ _id: req.params.id, company_id: restId });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Soft Delete Logic: If biled, only deactivate.
        const Bill = require('../models/Bill'); 
        const billExists = await Bill.findOne({
            "items.product_id": req.params.id
        });

        if (billExists) {
            product.is_active = false;
            await product.save();
            return res.status(200).json({
                success: true,
                message: 'Product preserved but deactivated because it has been used in bills'
            });
        }

        await Product.deleteOne({ _id: req.params.id, company_id: restId });

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
