const Supplier = require('../models/Supplier');

// @desc    Get all suppliers for a restaurant
// @route   GET /api/suppliers
// @access  Public
exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ company_id: req.user.restaurant_id })
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new supplier and its ledger
exports.createSupplier = async (req, res) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, contact_person, contact_number, email, gst_number, address, opening_balance } = req.body;
        const company_id = req.user.restaurant_id;

        const existingSupplier = await Supplier.findOne({
            company_id,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingSupplier) {
            return res.status(400).json({ success: false, error: 'Supplier already exists' });
        }

        const supplier = await Supplier.create([{
            name,
            contact_person,
            contact_number,
            email,
            gst_number,
            address,
            opening_balance,
            company_id
        }], { session });

        // CREATE A CORRESPONDING LEDGER
        const Ledger = require('../models/Ledger');
        await Ledger.create([{
            company_id,
            name: `${name} (Supplier)`,
            group: 'Sundry Creditors',
            opening_balance: opening_balance || 0,
            balance_type: (opening_balance || 0) >= 0 ? 'CR' : 'DR',
            description: `Auto-generated ledger for supplier ${name}`
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: supplier[0] });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};


// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Admin/Owner
exports.updateSupplier = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Supplier.findOne({
                company_id: req.user.restaurant_id,
                name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Supplier name already exists' });
        }

        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle supplier status
// @route   PATCH /api/suppliers/:id/toggle-status
// @access  Admin/Owner
exports.toggleSupplierStatus = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        supplier.is_active = !supplier.is_active;
        await supplier.save();

        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Admin/Owner
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        // Future check: ensure supplier doesn't have active purchase bills or ledgers before deleting 
        // For now, allow soft delete / status toggle or hard delete.

        await Supplier.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
