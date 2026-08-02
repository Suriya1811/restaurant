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

// Temporary open a vacant table (NEW TABLE opened in POS before KOT)
exports.tempOpenTable = async (req, res) => {
    try {
        const table = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

        // Only set temp_opened_at if table is AVAILABLE and no active order
        if (table.status === 'AVAILABLE' && !table.bill_id) {
            table.temp_opened_at = table.temp_opened_at || new Date();
            await table.save();
        }

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
        table.temp_opened_at = null; // Clear temporary timer once converted to KOT / OCCUPIED
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
        table.temp_opened_at = null; // Clear temp timer
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
        table.temp_opened_at = null;
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

// POST /tables/:id/transfer-items — transfer items to another table's open bill
exports.transferItems = async (req, res) => {
    try {
        const { source_bill_id, items } = req.body;
        const targetTable = await Table.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!targetTable) return res.status(404).json({ success: false, error: 'Target table not found' });

        const Bill = require('../models/Bill');
        let targetBill = null;

        if (targetTable.bill_id) {
            targetBill = await Bill.findOne({ _id: targetTable.bill_id, company_id: req.user.restaurant_id });
        }

        if (!targetBill) {
            targetBill = await Bill.findOne({
                company_id: req.user.restaurant_id,
                table_no: targetTable.table_number || targetTable.table_no,
                status: 'OPEN'
            });
        }

        if (!targetBill) {
            targetBill = await Bill.create({
                company_id: req.user.restaurant_id,
                bill_number: `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                table_no: targetTable.table_number || targetTable.table_no,
                status: 'OPEN',
                type: 'DINE_IN',
                created_by: req.user.id,
                items: []
            });
            targetTable.bill_id = targetBill._id;
            targetTable.status = 'OCCUPIED';
            targetTable.occupied_since = targetTable.occupied_since || new Date();
            await targetTable.save();
        }

        items.forEach(item => {
            const existingIdx = targetBill.items.findIndex(i => i.product_id?.toString() === item.product_id?.toString() && i.name === item.name);
            if (existingIdx > -1) {
                targetBill.items[existingIdx].quantity += item.quantity;
                targetBill.items[existingIdx].total_price = targetBill.items[existingIdx].quantity * targetBill.items[existingIdx].unit_price;
            } else {
                targetBill.items.push({
                    product_id: item.product_id,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.quantity * item.unit_price
                });
            }
        });

        const subTotal = targetBill.items.reduce((sum, i) => sum + (i.is_complementary ? 0 : i.total_price), 0);
        targetBill.sub_total = subTotal;
        targetBill.grand_total = subTotal;
        await targetBill.save();

        targetTable.running_amount = subTotal;
        await targetTable.save();

        res.status(200).json({ success: true, message: 'Items transferred successfully', data: targetBill });
    } catch (error) {
        console.error("Transfer items error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Scan and clean up expired temporary un-KOT new table sessions
exports.cleanupExpiredNewTables = async (companyId = null) => {
    try {
        const Setting = require('../models/Setting');
        let query = {
            status: 'AVAILABLE',
            bill_id: null,
            temp_opened_at: { $ne: null }
        };
        if (companyId) {
            query.company_id = companyId;
        }

        const openTables = await Table.find(query);
        if (!openTables || openTables.length === 0) return { released: 0 };

        let releasedCount = 0;
        const now = new Date();

        for (const table of openTables) {
            let timeoutMinutes = 3; // default
            try {
                const setting = await Setting.findOne({ company_id: table.company_id });
                if (setting && setting.general && setting.general.new_table_timeout_minutes !== undefined) {
                    timeoutMinutes = Number(setting.general.new_table_timeout_minutes);
                }
            } catch (e) {}

            // If timeoutMinutes <= 0, auto-release is disabled
            if (timeoutMinutes <= 0) continue;

            const openedTime = new Date(table.temp_opened_at).getTime();
            const diffMinutes = (now.getTime() - openedTime) / (1000 * 60);

            if (diffMinutes >= timeoutMinutes) {
                table.temp_opened_at = null;
                table.running_amount = 0;
                table.bill_id = null;
                table.status = 'AVAILABLE';
                table.kot_status = 'NONE';
                await table.save();
                releasedCount++;
            }
        }
        return { released: releasedCount };
    } catch (error) {
        console.error("Cleanup expired new tables error:", error);
        return { released: 0, error: error.message };
    }
};
