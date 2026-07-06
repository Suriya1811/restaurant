const Printer = require('../models/Printer');
const Bill = require('../models/Bill');

// GET /api/printers — list all printers for this company
exports.getPrinters = async (req, res) => {
    try {
        const printers = await Printer.find({ company_id: req.user.restaurant_id }).sort({ name: 1 });
        res.status(200).json({ success: true, data: printers });
    } catch (error) {
        console.error('getPrinters error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// POST /api/printers — create a printer
exports.createPrinter = async (req, res) => {
    try {
        const { name, ip_address, description, categories, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Printer name is required' });
        }

        const printer = await Printer.create({
            company_id: req.user.restaurant_id,
            name: name.trim(),
            ip_address: ip_address || '',
            description: description || '',
            categories: categories || [],
            color: color || '#3b82f6'
        });

        res.status(201).json({ success: true, data: printer });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'A printer with this name already exists' });
        }
        console.error('createPrinter error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// PUT /api/printers/:id — update a printer
exports.updatePrinter = async (req, res) => {
    try {
        const { name, ip_address, description, categories, color, is_active } = req.body;
        const printer = await Printer.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            { name, ip_address, description, categories, color, is_active },
            { new: true, runValidators: true }
        );
        if (!printer) return res.status(404).json({ success: false, error: 'Printer not found' });
        res.status(200).json({ success: true, data: printer });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'A printer with this name already exists' });
        }
        console.error('updatePrinter error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// DELETE /api/printers/:id — delete a printer
exports.deletePrinter = async (req, res) => {
    try {
        const printer = await Printer.findOneAndDelete({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!printer) return res.status(404).json({ success: false, error: 'Printer not found' });
        res.status(200).json({ success: true, message: 'Printer deleted' });
    } catch (error) {
        console.error('deletePrinter error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// GET /api/printers/:id/orders — get all OPEN/DRAFT bills matching this printer's categories
exports.getPrinterOrders = async (req, res) => {
    try {
        const printer = await Printer.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!printer) return res.status(404).json({ success: false, error: 'Printer not found' });

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: { $in: ['OPEN', 'DRAFT'] },
            kitchen_status: 'PENDING',
            'items.0': { $exists: true }
        }).sort({ createdAt: 1 });

        const result = bills.map(bill => {
            let relevantItems;
            if (printer.categories && printer.categories.length > 0) {
                relevantItems = bill.items.filter(item =>
                    printer.categories.includes(item.category)
                );
            } else {
                relevantItems = bill.items;
            }

            if (relevantItems.length === 0) return null;

            return {
                _id: bill._id,
                bill_number: bill.bill_number,
                table_no: bill.table_no,
                order_mode: bill.type,
                customer_name: bill.customer_name,
                captain_name: bill.captain_name,
                waiter_name: bill.waiter_name,
                persons: bill.persons,
                createdAt: bill.createdAt,
                items: relevantItems
            };
        }).filter(Boolean);

        res.status(200).json({ success: true, data: result, printer });
    } catch (error) {
        console.error('getPrinterOrders error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
