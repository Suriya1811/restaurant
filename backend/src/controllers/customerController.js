const Customer = require('../models/Customer');

// @desc    Get all customers for a restaurant
// @route   GET /api/customers
// @access  Public
exports.getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({ company_id: req.user.restaurant_id })
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new customer and its ledger
exports.createCustomer = async (req, res) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, phone, email, address, gst_number, opening_balance, loyalty_points } = req.body;
        const company_id = req.user.restaurant_id;

        if (phone) {
            const existingCustomer = await Customer.findOne({
                company_id,
                phone: phone
            });

            if (existingCustomer) {
                return res.status(400).json({ success: false, error: 'Customer phone already exists' });
            }
        }

        const customer = await Customer.create([{
            name,
            phone,
            email,
            address,
            gst_number,
            opening_balance,
            loyalty_points,
            company_id
        }], { session });

        // CREATE A CORRESPONDING LEDGER
        const Ledger = require('../models/Ledger');
        await Ledger.create([{
            company_id,
            name: `${name} (Customer)`,
            group: 'Sundry Debtors',
            opening_balance: opening_balance || 0,
            balance_type: (opening_balance || 0) >= 0 ? 'DR' : 'CR',
            description: `Auto-generated ledger for customer ${name}`
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: customer[0] });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};


// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Admin/Owner
exports.updateCustomer = async (req, res) => {
    try {
        if (req.body.phone) {
            const duplicate = await Customer.findOne({
                company_id: req.user.restaurant_id,
                phone: req.body.phone,
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Customer phone already exists' });
        }

        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle customer status
// @route   PATCH /api/customers/:id/toggle-status
// @access  Admin/Owner
exports.toggleCustomerStatus = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        customer.is_active = !customer.is_active;
        await customer.save();

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Admin/Owner
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        await Customer.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
