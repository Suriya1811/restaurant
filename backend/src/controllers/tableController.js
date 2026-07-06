const Table = require('../models/Table');

exports.getTables = async (req, res) => {
    try {
        const tables = await Table.find({ company_id: req.user.restaurant_id }).sort({ table_type: 1, table_number: 1 });
        res.status(200).json({ success: true, count: tables.length, data: tables });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createTable = async (req, res) => {
    try {
        const { table_number, seating_capacity } = req.body;
        const exists = await Table.findOne({ company_id: req.user.restaurant_id, table_number: { $regex: new RegExp(`^${table_number}$`, 'i') } });
        if (exists) return res.status(400).json({ success: false, error: 'Table already exists' });

        const table = await Table.create({ ...req.body, company_id: req.user.restaurant_id });
        res.status(201).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateTable = async (req, res) => {
    try {
        if (req.body.table_number) {
            const duplicate = await Table.findOne({ company_id: req.user.restaurant_id, table_number: { $regex: new RegExp(`^${req.body.table_number}$`, 'i') }, _id: { $ne: req.params.id } });
            if (duplicate) return res.status(400).json({ success: false, error: 'Table number already exists' });
        }
        const table = await Table.findOneAndUpdate({ _id: req.params.id, company_id: req.user.restaurant_id }, req.body, { new: true, runValidators: true });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleTableStatus = async (req, res) => {
    try {
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
        table.is_active = !table.is_active;
        await table.save();
        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.deleteTable = async (req, res) => {
    try {
        const table = await Table.findOneAndDelete({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
        res.status(200).json({ success: true, message: 'Table deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Reserve a table
exports.reserveTable = async (req, res) => {
    try {
        const { reservation_name, reservation_phone, reservation_time, reservation_note } = req.body;
        if (!reservation_name) return res.status(400).json({ success: false, error: 'Customer name is required for reservation' });

        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
        if (table.status === 'OCCUPIED') return res.status(400).json({ success: false, error: 'Table is currently occupied and cannot be reserved' });

        table.status = 'RESERVED';
        table.reservation_name = reservation_name;
        table.reservation_phone = reservation_phone || '';
        table.reservation_time = reservation_time || '';
        table.reservation_note = reservation_note || '';
        await table.save();

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Cancel a reservation — sets table back to AVAILABLE
exports.cancelReservation = async (req, res) => {
    try {
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });
        if (table.status !== 'RESERVED') return res.status(400).json({ success: false, error: 'Table is not reserved' });

        table.status = 'AVAILABLE';
        table.reservation_name = '';
        table.reservation_phone = '';
        table.reservation_time = '';
        table.reservation_note = '';
        await table.save();

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Occupy a table — captain starts taking order (marks OCCUPIED + records start time)
exports.occupyTable = async (req, res) => {
    try {
        const { bill_id, running_amount } = req.body;
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

        table.status = 'OCCUPIED';
        table.occupied_since = table.occupied_since || new Date(); // only set on first occupy
        table.printed_at = null;
        table.running_amount = running_amount || 0;
        table.bill_id = bill_id || null;
        await table.save();

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Mark table as PRINTED — Save & Print was clicked
exports.markTablePrinted = async (req, res) => {
    try {
        const { running_amount } = req.body;
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

        table.status = 'PRINTED';
        table.printed_at = new Date();
        if (running_amount !== undefined) table.running_amount = running_amount;
        await table.save();

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Free a table — payment done, table resets to AVAILABLE
exports.freeTable = async (req, res) => {
    try {
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

        table.status = 'AVAILABLE';
        table.occupied_since = null;
        table.printed_at = null;
        table.running_amount = 0;
        table.bill_id = null;
        table.kot_status = 'NONE';
        table.reservation_name = '';
        table.reservation_phone = '';
        table.reservation_time = '';
        table.reservation_note = '';
        await table.save();

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// PATCH /tables/:id/update-amount — live running amount update
exports.updateTableAmount = async (req, res) => {
    try {
        const { running_amount } = req.body;
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

        if (running_amount !== undefined) table.running_amount = running_amount;
        await table.save();

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// PATCH /tables/:id/kot-status — update kitchen order status (KOT_SENT / READY / NONE)
exports.updateKotStatus = async (req, res) => {
    try {
        const { kot_status } = req.body;
        if (!['NONE', 'KOT_SENT', 'READY'].includes(kot_status)) {
            return res.status(400).json({ success: false, error: 'Invalid kot_status. Use NONE, KOT_SENT, or READY' });
        }
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

        table.kot_status = kot_status;
        await table.save();

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
