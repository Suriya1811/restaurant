const Tax = require('../models/Tax');

exports.getTaxes = async (req, res) => {
    try {
        const taxes = await Tax.find({ company_id: req.user.restaurant_id })
            .populate('sales_account_id')
            .populate('purchase_account_id')
            .populate('gst_sales_ledger_id')
            .populate('gst_purchase_ledger_id')
            .populate('igst_sales_ledger_id')
            .populate('igst_purchase_ledger_id')
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: taxes.length, data: taxes });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createTax = async (req, res) => {
    try {
        const { name, local_central, cgst_rate, sgst_rate, igst_rate } = req.body;

        const existingTax = await Tax.findOne({
            company_id: req.user.restaurant_id,
            name
        });

        if (existingTax) {
            return res.status(400).json({ success: false, error: 'Tax already exists' });
        }

        // Calculate total percentage for backward compatibility
        const salesCgst = req.body.sales_cgst_rate !== undefined ? req.body.sales_cgst_rate : cgst_rate;
        const salesSgst = req.body.sales_sgst_rate !== undefined ? req.body.sales_sgst_rate : sgst_rate;
        const salesIgst = req.body.sales_igst_rate !== undefined ? req.body.sales_igst_rate : igst_rate;

        const calculatedPercentage = local_central === 'LOCAL' 
            ? (Number(salesCgst || 0) + Number(salesSgst || 0)) 
            : Number(salesIgst || 0);

        const tax = await Tax.create({
            ...req.body,
            cgst_rate: Number(salesCgst || 0),
            sgst_rate: Number(salesSgst || 0),
            igst_rate: Number(salesIgst || 0),
            percentage: calculatedPercentage,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: tax });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateTax = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Tax.findOne({
                company_id: req.user.restaurant_id,
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Tax name already exists' });
        }

        const lc = req.body.local_central || 'LOCAL';
        const cgst = req.body.sales_cgst_rate !== undefined ? req.body.sales_cgst_rate : (req.body.cgst_rate !== undefined ? req.body.cgst_rate : 0);
        const sgst = req.body.sales_sgst_rate !== undefined ? req.body.sales_sgst_rate : (req.body.sgst_rate !== undefined ? req.body.sgst_rate : 0);
        const igst = req.body.sales_igst_rate !== undefined ? req.body.sales_igst_rate : (req.body.igst_rate !== undefined ? req.body.igst_rate : 0);
        
        req.body.cgst_rate = Number(cgst || 0);
        req.body.sgst_rate = Number(sgst || 0);
        req.body.igst_rate = Number(igst || 0);
        req.body.percentage = lc === 'LOCAL' 
            ? (Number(cgst) + Number(sgst)) 
            : Number(igst);

        const tax = await Tax.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!tax) {
            return res.status(404).json({ success: false, error: 'Tax not found' });
        }

        res.status(200).json({ success: true, data: tax });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteTax = async (req, res) => {
    try {
        const tax = await Tax.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!tax) {
            return res.status(404).json({ success: false, error: 'Tax not found' });
        }
        await Tax.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        res.status(200).json({ success: true, message: 'Tax deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
