const Role = require('../models/Role');
const User = require('../models/User');

// Default page and feature definitions for the system
const DEFAULT_PAGES_CONFIG = [
    {
        page_key: 'dashboard',
        page_label: 'Dashboard',
        features: [
            { feature_key: 'view_stats', feature_label: 'View Statistics' },
            { feature_key: 'view_charts', feature_label: 'View Charts' },
            { feature_key: 'view_recent_bills', feature_label: 'View Recent Bills' }
        ]
    },
    // ENTRY
    {
        page_key: 'kot',
        page_label: 'KOT',
        features: [
            { feature_key: 'kot_print', feature_label: 'KOT Print' }
        ]
    },
    {
        page_key: 'sales_bill',
        page_label: 'Sales Bill',
        features: [
            { feature_key: 'create_bill', feature_label: 'Create New Bill' },
            { feature_key: 'apply_discount', feature_label: 'Apply Discount' },
            { feature_key: 'hold_bill', feature_label: 'Hold Bill' },
            { feature_key: 'print_bill', feature_label: 'Print Bill' },
            { feature_key: 'split_bill', feature_label: 'Split Bill' },
            { feature_key: 'complimentary', feature_label: 'Complimentary' },
            { feature_key: 'sales_return', feature_label: 'Sales Return' }
        ]
    },
    {
        page_key: 'display',
        page_label: 'Display',
        features: []
    },
    {
        page_key: 'party_master',
        page_label: 'Party Master',
        features: []
    },
    {
        page_key: 'purchase',
        page_label: 'Purchase Entry',
        features: [
            { feature_key: 'view_purchases', feature_label: 'View Purchases' },
            { feature_key: 'add_purchase', feature_label: 'Add Purchase' },
            { feature_key: 'delete_purchase', feature_label: 'Delete Purchase' }
        ]
    },
    {
        page_key: 'receipts',
        page_label: 'Receipt Entry',
        features: []
    },
    {
        page_key: 'payments',
        page_label: 'Payment Entry',
        features: []
    },
    {
        page_key: 'vouchers',
        page_label: 'Voucher Master',
        features: [
            { feature_key: 'view_vouchers', feature_label: 'View Vouchers' },
            { feature_key: 'add_voucher', feature_label: 'Add Voucher' },
            { feature_key: 'delete_voucher', feature_label: 'Delete Voucher' }
        ]
    },
    // MASTER
    {
        page_key: 'products',
        page_label: 'Item',
        features: [
            { feature_key: 'view_products', feature_label: 'View Products' },
            { feature_key: 'add_product', feature_label: 'Add Product' },
            { feature_key: 'edit_product', feature_label: 'Edit Product' },
            { feature_key: 'delete_product', feature_label: 'Delete Product' },
            { feature_key: 'import_products', feature_label: 'Import Products' }
        ]
    },
    {
        page_key: 'categories',
        page_label: 'Category',
        features: [
            { feature_key: 'view_categories', feature_label: 'View Categories' },
            { feature_key: 'add_category', feature_label: 'Add Category' },
            { feature_key: 'edit_category', feature_label: 'Edit Category' },
            { feature_key: 'delete_category', feature_label: 'Delete Category' }
        ]
    },
    {
        page_key: 'function_type',
        page_label: 'Function Type',
        features: []
    },
    {
        page_key: 'brands',
        page_label: 'Brand',
        features: [
            { feature_key: 'view_brands', feature_label: 'View Brands' },
            { feature_key: 'add_brand', feature_label: 'Add Brand' },
            { feature_key: 'edit_brand', feature_label: 'Edit Brand' },
            { feature_key: 'delete_brand', feature_label: 'Delete Brand' }
        ]
    },
    {
        page_key: 'units',
        page_label: 'Unit',
        features: []
    },
    {
        page_key: 'taxes',
        page_label: 'Tax',
        features: []
    },
    {
        page_key: 'tables',
        page_label: 'Table',
        features: [
            { feature_key: 'view_tables', feature_label: 'View Tables' },
            { feature_key: 'add_table', feature_label: 'Add Table' },
            { feature_key: 'edit_table', feature_label: 'Edit Table' },
            { feature_key: 'delete_table', feature_label: 'Delete Table' }
        ]
    },
    {
        page_key: 'table_types',
        page_label: 'Table Type',
        features: []
    },
    {
        page_key: 'staff',
        page_label: 'Captain/Waiter',
        features: [
            { feature_key: 'view_staff', feature_label: 'View Staff' },
            { feature_key: 'add_staff', feature_label: 'Add Staff' },
            { feature_key: 'edit_staff', feature_label: 'Edit Staff' },
            { feature_key: 'delete_staff', feature_label: 'Delete Staff' }
        ]
    },
    {
        page_key: 'ledgers',
        page_label: 'Ledger',
        features: [
            { feature_key: 'view_ledgers', feature_label: 'View Ledgers' },
            { feature_key: 'add_ledger', feature_label: 'Add Ledger' },
            { feature_key: 'edit_ledger', feature_label: 'Edit Ledger' },
            { feature_key: 'delete_ledger', feature_label: 'Delete Ledger' }
        ]
    },
    {
        page_key: 'ledger_groups',
        page_label: 'Ledger Group',
        features: []
    },
    // REPORT
    {
        page_key: 'reports',
        page_label: 'Report',
        features: [
            { feature_key: 'view_reports', feature_label: 'View Reports' },
            { feature_key: 'export_reports', feature_label: 'Export Reports' },
            { feature_key: 'daily_report', feature_label: 'Daily Report' },
            { feature_key: 'monthly_report', feature_label: 'Monthly Report' }
        ]
    },
    // ACCOUNTS
    {
        page_key: 'daybook',
        page_label: 'Daybook',
        features: []
    },
    {
        page_key: 'ledger_statement',
        page_label: 'Ledger Statement',
        features: [
            { feature_key: 'view_statement', feature_label: 'View Ledger Statement' }
        ]
    },
    {
        page_key: 'cash_bank',
        page_label: 'Cash & Bank',
        features: []
    },
    // SETTINGS
    {
        page_key: 'settings_general',
        page_label: 'General',
        features: [
            { feature_key: 'view_settings', feature_label: 'View Settings' }
        ]
    },
    {
        page_key: 'counters',
        page_label: 'Counter',
        features: [
            { feature_key: 'view_counters', feature_label: 'View Counters' },
            { feature_key: 'add_counter', feature_label: 'Add Counter' },
            { feature_key: 'edit_counter', feature_label: 'Edit Counter' },
            { feature_key: 'delete_counter', feature_label: 'Delete Counter' }
        ]
    },
    {
        page_key: 'kitchen_printers',
        page_label: 'Kitchen & Printers',
        features: [
            { feature_key: 'printer_settings', feature_label: 'Printer Settings' }
        ]
    },
    {
        page_key: 'user_rights',
        page_label: 'User Rights',
        features: []
    },
    {
        page_key: 'order_integration',
        page_label: 'Order Integration',
        features: []
    },
    {
        page_key: 'bill_series',
        page_label: 'Bill Series',
        features: [
            { feature_key: 'bill_settings', feature_label: 'Bill Settings' }
        ]
    },
    {
        page_key: 'generated_bills',
        page_label: 'Generated Bills',
        features: [
            { feature_key: 'view_bills', feature_label: 'View Bills' },
            { feature_key: 'edit_bill', feature_label: 'Edit Bill' },
            { feature_key: 'delete_bill', feature_label: 'Delete Bill' },
            { feature_key: 'export_bills', feature_label: 'Export Bills' }
        ]
    },
    {
        page_key: 'coupons',
        page_label: 'Coupons',
        features: []
    },
    {
        page_key: 'loyalty',
        page_label: 'Loyalty',
        features: []
    },
    {
        page_key: 'system_modules',
        page_label: 'System Modules',
        features: []
    }
];

// @desc    Get all page and feature config (for role creation UI)
// @route   GET /api/roles/pages-config
// @access  Protected (OWNER/ADMIN)
exports.getPagesConfig = async (req, res) => {
    try {
        res.json({ success: true, data: DEFAULT_PAGES_CONFIG });
    } catch (error) {
        console.error('Get pages config error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Protected (OWNER/ADMIN)
exports.createRole = async (req, res) => {
    try {
        const { name, description, pages } = req.body;
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Role name is required' });
        }

        // Check for duplicate role name
        const existing = await Role.findOne({ name: name.trim(), restaurant_id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A role with this name already exists' });
        }

        const role = await Role.create({
            name: name.trim(),
            description: description || '',
            restaurant_id,
            pages: pages || []
        });

        res.status(201).json({ success: true, data: role });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all roles for the restaurant
// @route   GET /api/roles
// @access  Protected (OWNER/ADMIN)
exports.getRoles = async (req, res) => {
    try {
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
        const roles = await Role.find({ restaurant_id }).sort({ createdAt: -1 });

        // Also get count of users for each role
        const rolesWithCount = await Promise.all(roles.map(async (role) => {
            const userCount = await User.countDocuments({ custom_role_id: role._id });
            return { ...role.toObject(), userCount };
        }));

        res.json({ success: true, data: rolesWithCount });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Protected (OWNER/ADMIN)
exports.getRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }
        res.json({ success: true, data: role });
    } catch (error) {
        console.error('Get role error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Protected (OWNER/ADMIN)
exports.updateRole = async (req, res) => {
    try {
        const { name, description, pages, is_active } = req.body;
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Check duplicate name (but not itself)
        if (name && name.trim() !== role.name) {
            const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
            const existing = await Role.findOne({ name: name.trim(), restaurant_id, _id: { $ne: role._id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'A role with this name already exists' });
            }
        }

        if (name !== undefined) role.name = name.trim();
        if (description !== undefined) role.description = description;
        if (pages !== undefined) role.pages = pages;
        if (is_active !== undefined) role.is_active = is_active;

        await role.save();

        res.json({ success: true, data: role });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Protected (OWNER/ADMIN)
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        // Check if any users are assigned this role
        const usersWithRole = await User.countDocuments({ custom_role_id: role._id });
        if (usersWithRole > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role. Please reassign or delete them first.`
            });
        }

        await Role.findByIdAndDelete(role._id);
        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a sub-user with permissions
// @route   POST /api/roles/users
// @access  Protected (OWNER/ADMIN)
exports.createSubUser = async (req, res) => {
    try {
        const { name, username, password, password_enabled = true, role, permissions, custom_role_id, email, mobile } = req.body;
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;

        const isPasswordEnabled = password_enabled !== false;

        if (!name || !username || (isPasswordEnabled && !password)) {
            return res.status(400).json({
                success: false,
                message: isPasswordEnabled ? 'Name, username, and password are required' : 'Name and username are required'
            });
        }



        // Check for duplicate username within same restaurant
        const existingUser = await User.findOne({ username: username.toLowerCase(), restaurant_id });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists for this restaurant' });
        }

        // Determine the role dynamically if not explicitly provided
        let finalRole = role;
        const hasAdmin = await User.findOne({
            restaurant_id,
            role: { $in: ['ADMIN', 'OWNER'] },
            password_enabled: true
        });

        if (!finalRole) {
            finalRole = hasAdmin ? 'STAFF' : 'ADMIN';
        }

        // Enforce admin rule: Cannot create non-admin if no password-enabled admin exists
        if (finalRole !== 'ADMIN') {
            if (!hasAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'An Admin account with a password must be created before adding regular users.'
                });
            }
        }

        // Ensure the first admin always has a password
        if (finalRole === 'ADMIN' && !hasAdmin && !isPasswordEnabled) {
            return res.status(400).json({
                success: false,
                message: 'The first Admin account must have password protection enabled.'
            });
        }

        const user = await User.create({
            name,
            username: username.toLowerCase(),
            email: email || undefined,
            mobile: mobile || undefined,
            password: isPasswordEnabled ? password : '',
            password_enabled: isPasswordEnabled,
            password_initialized: isPasswordEnabled,
            restaurant_id,
            role: finalRole, // 'ADMIN' or 'STAFF'
            permissions: finalRole === 'ADMIN' ? [] : (permissions || []),
            custom_role_id: custom_role_id || null,
            is_active: true
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                custom_role_id: user.custom_role_id,
                is_active: user.is_active
            }
        });
    } catch (error) {
        console.error('Create sub-user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all sub-users for the restaurant
// @route   GET /api/roles/users
// @access  Protected (OWNER/ADMIN)
exports.getSubUsers = async (req, res) => {
    try {
        const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
        const users = await User.find({
            restaurant_id,
            role: { $in: ['STAFF', 'ADMIN'] }
        }).select('-password').populate('custom_role_id', 'name');

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get sub-users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a sub-user
// @route   PUT /api/roles/users/:id
// @access  Protected (OWNER/ADMIN)
exports.updateSubUser = async (req, res) => {
    try {
        const { name, username, password, password_enabled, custom_role_id, role, permissions, email, mobile, is_active } = req.body;
        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't allow editing of OWNER users
        if (user.role === 'OWNER') {
            return res.status(403).json({ success: false, message: 'Cannot modify owner account' });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email || undefined;
        if (mobile !== undefined) user.mobile = mobile || undefined;
        if (custom_role_id !== undefined) user.custom_role_id = custom_role_id;
        if (is_active !== undefined) user.is_active = is_active;
        if (role !== undefined) user.role = role;
        if (permissions !== undefined) user.permissions = role === 'ADMIN' ? [] : permissions;

        if (username !== undefined) {
            const restaurant_id = req.user.restaurant_id._id || req.user.restaurant_id;
            const existingUser = await User.findOne({
                username: username.toLowerCase(),
                restaurant_id,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }
            user.username = username.toLowerCase();
        }

        if (password_enabled !== undefined) {
            // Prevent disabling password for the last admin
            if (password_enabled === false && (user.role === 'ADMIN' || user.role === 'OWNER')) {
                const otherAdmins = await User.countDocuments({
                    restaurant_id: user.restaurant_id,
                    role: { $in: ['ADMIN', 'OWNER'] },
                    password_enabled: true,
                    _id: { $ne: user._id }
                });
                if (otherAdmins === 0) {
                    return res.status(400).json({ success: false, message: 'Cannot disable password. At least one Admin account must have password protection enabled.' });
                }
            }
            user.password_enabled = password_enabled;
        }

        if (password && user.password_enabled !== false) {
            user.password = password;
        } else if (password_enabled === false) {
            user.password = '';
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password').populate('custom_role_id', 'name');
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('Update sub-user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a sub-user
// @route   DELETE /api/roles/users/:id
// @access  Protected (OWNER/ADMIN)
exports.deleteSubUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'OWNER') {
            return res.status(403).json({ success: false, message: 'Cannot delete owner account' });
        }

        await User.findByIdAndDelete(user._id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete sub-user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
