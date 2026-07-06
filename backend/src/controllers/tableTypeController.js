const TableType = require('../models/TableType');

// @desc    Get all table types for a restaurant
// @route   GET /api/table-types
// @access  Public
exports.getTableTypes = async (req, res) => {
    try {
        const tableTypes = await TableType.find({ company_id: req.user.restaurant_id })
            .sort({ name: 1 });
        res.status(200).json({ success: true, count: tableTypes.length, data: tableTypes });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new table type
// @route   POST /api/table-types
// @access  Admin/Owner
exports.createTableType = async (req, res) => {
    try {
        const { name } = req.body;

        const existingType = await TableType.findOne({
            company_id: req.user.restaurant_id,
            name
        });

        if (existingType) {
            return res.status(400).json({ success: false, error: 'Table type already exists' });
        }

        const tableType = await TableType.create({
            name,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: tableType });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update table type
// @route   PUT /api/table-types/:id
// @access  Admin/Owner
exports.updateTableType = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await TableType.findOne({
                company_id: req.user.restaurant_id,
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Table type name already exists' });
        }

        const tableType = await TableType.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!tableType) {
            return res.status(404).json({ success: false, error: 'Table type not found' });
        }

        res.status(200).json({ success: true, data: tableType });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete table type
// @route   DELETE /api/table-types/:id
// @access  Admin/Owner
exports.deleteTableType = async (req, res) => {
    try {
        const tableType = await TableType.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!tableType) {
            return res.status(404).json({ success: false, error: 'Table type not found' });
        }

        // Check if any tables are associated with this type
        const Table = require('../models/Table');
        const tablesCount = await Table.countDocuments({ 
            table_type: tableType.name, 
            company_id: req.user.restaurant_id 
        });

        if (tablesCount > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete table type because there are tables associated with it' 
            });
        }

        await TableType.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({ success: true, message: 'Table type deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
