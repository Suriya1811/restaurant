const Supplier = require('../models/Supplier');
const Ledger = require('../models/Ledger');

// @desc    Get all suppliers for a restaurant
// @route   GET /api/suppliers
// @access  Public
exports.getSuppliers = async (req, res) => {
    try {
        const [suppliers, creditorsLedgers] = await Promise.all([
            Supplier.find({ company_id: req.user.restaurant_id }).sort({ is_active: -1, name: 1 }),
            Ledger.find({ company_id: req.user.restaurant_id, $or: [{ group: 'Sundry Creditors' }, { party_type: 'SUPPLIER' }] })
        ]);

        const supplierMap = {};

        suppliers.forEach(s => {
            supplierMap[s.name.trim().toLowerCase()] = s;
        });

        creditorsLedgers.forEach(l => {
            const cleanName = l.name.replace(/\(Supplier\)/gi, '').trim();
            const key = cleanName.toLowerCase();
            if (!supplierMap[key]) {
                supplierMap[key] = {
                    _id: l._id,
                    name: cleanName,
                    contact_number: l.phone || l.mobile2 || l.contact_person || '',
                    address: l.billing_address || '',
                    gst_number: l.gstin || '',
                    opening_balance: l.opening_balance || 0,
                    is_ledger: true
                };
            }
        });

        const dataList = Object.values(supplierMap);
        res.status(200).json({ success: true, count: dataList.length, data: dataList });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new supplier and its ledger
exports.createSupplier = async (req, res) => {
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

        const supplier = await Supplier.create({
            name,
            contact_person,
            contact_number,
            email,
            gst_number,
            address,
            opening_balance,
            company_id
        });

        // CREATE A CORRESPONDING LEDGER
        await Ledger.create({
            company_id,
            name: `${name} (Supplier)`,
            group: 'Sundry Creditors',
            opening_balance: opening_balance || 0,
            balance_type: (opening_balance || 0) >= 0 ? 'CR' : 'DR',
            description: `Auto-generated ledger for supplier ${name}`
        });

        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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

        await Supplier.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
