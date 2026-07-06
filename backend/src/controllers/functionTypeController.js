const FunctionType = require('../models/FunctionType');

// @desc    Get all function types
// @route   GET /api/v1/function-types
// @access  Private
exports.getFunctionTypes = async (req, res) => {
    try {
        const functionTypes = await FunctionType.find({ company_id: req.user.restaurant_id }).sort({ name: 1 });
        res.status(200).json({ success: true, count: functionTypes.length, data: functionTypes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create a function type
// @route   POST /api/v1/function-types
// @access  Private (Admin/Owner)
exports.createFunctionType = async (req, res) => {
    try {
        req.body.company_id = req.user.restaurant_id;
        const functionType = await FunctionType.create(req.body);
        res.status(201).json({ success: true, data: functionType });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Function type already exists' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update function type
// @route   PUT /api/v1/function-types/:id
// @access  Private (Admin/Owner)
exports.updateFunctionType = async (req, res) => {
    try {
        let functionType = await FunctionType.findById(req.params.id);

        if (!functionType) {
            return res.status(404).json({ success: false, error: 'Function type not found' });
        }

        if (functionType.company_id.toString() !== (req.user.restaurant_id._id || req.user.restaurant_id).toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this function type' });
        }

        functionType = await FunctionType.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: functionType });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Function type name already exists' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Toggle function type status
// @route   PATCH /api/v1/function-types/:id/toggle-status
// @access  Private (Admin/Owner)
exports.toggleFunctionTypeStatus = async (req, res) => {
    try {
        const functionType = await FunctionType.findById(req.params.id);

        if (!functionType) {
            return res.status(404).json({ success: false, error: 'Function type not found' });
        }

        if (functionType.company_id.toString() !== (req.user.restaurant_id._id || req.user.restaurant_id).toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        functionType.is_active = !functionType.is_active;
        await functionType.save();

        res.status(200).json({ success: true, data: functionType });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete function type
// @route   DELETE /api/v1/function-types/:id
// @access  Private (Admin/Owner)
exports.deleteFunctionType = async (req, res) => {
    try {
        const functionType = await FunctionType.findById(req.params.id);

        if (!functionType) {
            return res.status(404).json({ success: false, error: 'Function type not found' });
        }

        if (functionType.company_id.toString() !== (req.user.restaurant_id._id || req.user.restaurant_id).toString()) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        await functionType.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
