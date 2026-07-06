const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const bcrypt = require('bcryptjs');

// @desc    Get user and restaurant settings
// @route   GET /api/settings
// @access  Private (Admin, Owner)
exports.getUserSettings = async (req, res) => {
    try {
        // Get user profile
        const user = await User.findById(req.user.id).select('-password');

        // Get restaurant info
        const restaurant = await Restaurant.findById(req.user.restaurant_id);

        if (!user || !restaurant) {
            return res.status(404).json({
                success: false,
                message: 'User or restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                profile: {
                    ownerName: user.name,
                    email: user.email,
                    mobile: user.mobile || '',
                    businessName: restaurant.company_name
                },
                restaurant: {
                    restaurant_type: restaurant.restaurant_type,
                    billing_layout: restaurant.billing_layout || 'SIDEBAR',
                    store_name: restaurant.store_name || '',
                    print_name: restaurant.print_name || '',
                    address: restaurant.address || '',
                    fssai_no: restaurant.fssai_no || '',
                    gstin: restaurant.gstin || '',
                    financial_year_start: restaurant.financial_year_start,
                    financial_year_end: restaurant.financial_year_end,
                    books_from: restaurant.books_from,
                    logo_url: restaurant.logo_url || ''
                },
                printer: {
                    enabled: restaurant.printer_enabled || false,
                    width: restaurant.printer_width || '58mm',
                    kot_printer_ip: restaurant.kot_printer_ip || '',
                    bill_printer_ip: restaurant.bill_printer_ip || '',
                    kitchen_mapping: restaurant.kitchen_mapping || []
                },
                orderIntegration: {
                    zomato_api_key: restaurant.zomato_api_key || '',
                    swiggy_api_key: restaurant.swiggy_api_key || '',
                    enabled: restaurant.order_integration_enabled || false
                },
                billFormat: {
                    header: restaurant.bill_header || '',
                    footer: restaurant.bill_footer || '',
                    gstNo: restaurant.gst_no || '',
                    autoPrint: restaurant.auto_print || false
                },
                modules: {
                    coupon_enabled: restaurant.coupon_enabled || false,
                    loyalty_enabled: restaurant.loyalty_enabled || false,
                    billing_coupon_active: restaurant.billing_coupon_active !== undefined ? restaurant.billing_coupon_active : true,
                    billing_loyalty_active: restaurant.billing_loyalty_active !== undefined ? restaurant.billing_loyalty_active : true,
                    kitchen_enabled: restaurant.kitchen_enabled !== undefined ? restaurant.kitchen_enabled : true,
                    printer_enabled: restaurant.printer_enabled !== undefined ? restaurant.printer_enabled : true,
                    counter_enabled: restaurant.counter_enabled !== undefined ? restaurant.counter_enabled : true,
                    dashboard_enabled: restaurant.dashboard_enabled !== undefined ? restaurant.dashboard_enabled : true,
                    reports_enabled: restaurant.reports_enabled !== undefined ? restaurant.reports_enabled : true,
                    staff_enabled: restaurant.staff_enabled !== undefined ? restaurant.staff_enabled : true,
                    table_enabled: restaurant.table_enabled !== undefined ? restaurant.table_enabled : true,
                    pay_mode_enabled: restaurant.pay_mode_enabled !== undefined ? restaurant.pay_mode_enabled : true,
                    stock_level_enabled: restaurant.stock_level_enabled !== undefined ? restaurant.stock_level_enabled : true,
                    kot_enabled: restaurant.kot_enabled !== undefined ? restaurant.kot_enabled : true
                },
                loyalty: {
                    enabled: restaurant.loyalty_enabled || false,
                    points_per_100: restaurant.loyalty_points_per_100 || 1,
                    target_points: restaurant.loyalty_target_points || 0,
                    point_value: restaurant.loyalty_point_value || 1
                },
                billSeries: restaurant.bill_series || {
                    dine_in: { prefix: 'DI', next_number: 1 },
                    takeaway: { prefix: 'TA', next_number: 1 },
                    delivery: { prefix: 'DE', next_number: 1 },
                    parcel: { prefix: 'PA', next_number: 1 },
                    party: { prefix: 'PT', next_number: 1 }
                }
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Advanced Settings (Printers, etc)
exports.updateAdvancedSettings = async (req, res) => {
    try {
        const { kot_printer_ip, bill_printer_ip, kitchen_mapping, zomato_api_key, swiggy_api_key, order_integration_enabled } = req.body;

        const updatePayload = {};
        if (kot_printer_ip !== undefined) updatePayload.kot_printer_ip = kot_printer_ip;
        if (bill_printer_ip !== undefined) updatePayload.bill_printer_ip = bill_printer_ip;
        if (kitchen_mapping !== undefined) updatePayload.kitchen_mapping = kitchen_mapping;
        if (zomato_api_key !== undefined) updatePayload.zomato_api_key = zomato_api_key;
        if (swiggy_api_key !== undefined) updatePayload.swiggy_api_key = swiggy_api_key;
        if (order_integration_enabled !== undefined) updatePayload.order_integration_enabled = order_integration_enabled;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            updatePayload,
            { new: true }
        );
        res.status(200).json({ success: true, data: restaurant });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Update profile information
// @route   PUT /api/settings/profile
// @access  Private (Admin, Owner)
// @desc    Create a completely new profile (Restaurant)
// @route   POST /api/settings/new-profile
// @access  Private (Admin, Owner)
exports.createNewProfile = async (req, res) => {
    try {
        const { 
            ownerName, email, mobile, businessName, 
            store_name, print_name, address, fssai_no, 
            gstin, financial_year_start, financial_year_end, books_from 
        } = req.body;

        // Create new restaurant
        const newRestaurant = await Restaurant.create({
            company_name: businessName || 'New Business',
            store_name: store_name || businessName || 'New Store',
            print_name: print_name || businessName || 'New Business',
            restaurant_type: 'SMART',
            address: address || 'Not Set',
            fssai_no: fssai_no || '',
            gstin: gstin || '',
            financial_year_start: financial_year_start || new Date(),
            financial_year_end: financial_year_end || new Date(),
            books_from: books_from || new Date()
        });

        // Update user's restaurant_id to point to the new one
        await User.findByIdAndUpdate(req.user.id, { 
            restaurant_id: newRestaurant._id,
            name: ownerName || req.user.name,
            email: email || req.user.email,
            mobile: mobile || req.user.mobile
        });

        res.status(201).json({
            success: true,
            message: 'New profile created and switched successfully',
            data: {
                restaurant_id: newRestaurant._id
            }
        });
    } catch (error) {
        console.error('Create new profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { 
            ownerName, email, mobile, phone, businessName, 
            billingLayout, restaurantType, store_name, print_name,
            address, fssai_no, gstin, financial_year_start, 
            financial_year_end, books_from, logo_url 
        } = req.body;
        const mobileToUse = mobile || phone;

        // Fetch existing data first
        const existingUser = await User.findById(req.user.id);
        const existingRestaurant = await Restaurant.findById(req.user.restaurant_id);

        if (!existingUser || !existingRestaurant) {
            return res.status(404).json({ success: false, message: 'User or restaurant not found' });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name: ownerName || existingUser.name,
                email: email || existingUser.email,
                mobile: mobileToUse || existingUser.mobile
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Update restaurant
        const restaurantUpdate = {
            company_name: businessName || existingRestaurant.company_name,
            store_name: store_name || existingRestaurant.store_name,
            print_name: print_name || existingRestaurant.print_name,
            billing_layout: billingLayout || existingRestaurant.billing_layout,
            restaurant_type: restaurantType || existingRestaurant.restaurant_type,
            address: address || existingRestaurant.address,
            fssai_no: fssai_no || existingRestaurant.fssai_no,
            gstin: gstin || existingRestaurant.gstin,
            financial_year_start: financial_year_start || existingRestaurant.financial_year_start,
            financial_year_end: financial_year_end || existingRestaurant.financial_year_end,
            books_from: books_from || existingRestaurant.books_from,
            logo_url: logo_url || existingRestaurant.logo_url
        };

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            restaurantUpdate,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: {
                    ownerName: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    businessName: restaurant.company_name
                },
                restaurant: {
                    restaurant_type: restaurant.restaurant_type,
                    billing_layout: restaurant.billing_layout
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/settings/password
// @access  Private (Admin, Owner)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Set plain password — the User model's pre-save hook will hash it
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update printer settings
// @route   PUT /api/settings/printer
// @access  Private (Admin, Owner)
exports.updatePrinterSettings = async (req, res) => {
    try {
        const { enabled, width } = req.body;

        // Validate input
        if (enabled === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Enabled status is required'
            });
        }

        if (width && !['58mm', '80mm'].includes(width)) {
            return res.status(400).json({
                success: false,
                message: 'Printer width must be 58mm or 80mm'
            });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            {
                printer_enabled: enabled,
                printer_width: width || '58mm'
            },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Printer settings updated successfully',
            data: {
                printer: {
                    enabled: restaurant.printer_enabled,
                    width: restaurant.printer_width
                }
            }
        });
    } catch (error) {
        console.error('Update printer settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update bill format settings
// @route   PUT /api/settings/bill-format
// @access  Private (Admin, Owner)
exports.updateBillFormat = async (req, res) => {
    try {
        const { header, footer, gstNo, autoPrint } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            {
                bill_header: header || '',
                bill_footer: footer || '',
                gst_no: gstNo || '',
                auto_print: autoPrint !== undefined ? autoPrint : false
            },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bill format updated successfully',
            data: {
                billFormat: {
                    header: restaurant.bill_header,
                    footer: restaurant.bill_footer,
                    gstNo: restaurant.gst_no,
                    autoPrint: restaurant.auto_print
                }
            }
        });
    } catch (error) {
        console.error('Update bill format error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update loyalty settings
// @route   PUT /api/settings/loyalty
// @access  Private (Admin, Owner)
exports.updateLoyaltySettings = async (req, res) => {
    try {
        const { enabled, points_per_100, target_points, point_value } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            {
                loyalty_enabled: enabled,
                loyalty_points_per_100: points_per_100,
                loyalty_target_points: target_points,
                loyalty_point_value: point_value
            },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Loyalty settings updated successfully',
            data: {
                loyalty: {
                    enabled: restaurant.loyalty_enabled,
                    points_per_100: restaurant.loyalty_points_per_100,
                    target_points: restaurant.loyalty_target_points,
                    point_value: restaurant.loyalty_point_value
                }
            }
        });
    } catch (error) {
        console.error('Update loyalty settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update billing layout ONLY (from Appearance tab)
// @route   PUT /api/settings/layout
// @access  Private (Admin, Owner)
exports.updateBillingLayout = async (req, res) => {
    try {
        const { billingLayout } = req.body;

        if (!billingLayout || !['SIDEBAR', 'TOP_HEADER'].includes(billingLayout)) {
            return res.status(400).json({
                success: false,
                message: 'Valid billing layout (SIDEBAR or TOP_HEADER) is required'
            });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            { billing_layout: billingLayout },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Layout updated successfully',
            data: {
                billing_layout: restaurant.billing_layout
            }
        });
    } catch (error) {
        console.error('Update billing layout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update bill number series settings
// @route   PUT /api/settings/bill-series
// @access  Private (Admin, Owner)
exports.updateBillSeries = async (req, res) => {
    try {
        const { billSeries } = req.body;

        if (!billSeries) {
            return res.status(400).json({ success: false, message: 'Bill series settings are required' });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            { bill_series: billSeries },
            { new: true, runValidators: true }
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Bill series updated successfully',
            data: restaurant.bill_series
        });
    } catch (error) {
        console.error('Update bill series error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Module Settings (Enable/Disable Coupons, Loyalty)
// @route   PUT /api/settings/modules
// @access  Private (Admin, Owner)
exports.updateModuleSettings = async (req, res) => {
    try {
        const { 
            coupon_enabled, loyalty_enabled, kitchen_enabled, 
            counter_enabled, order_integration_enabled, 
            pay_mode_enabled, stock_level_enabled, dashboard_enabled,
            kot_enabled
        } = req.body;
        const updatePayload = {};
        if (coupon_enabled !== undefined) updatePayload.coupon_enabled = coupon_enabled;
        if (loyalty_enabled !== undefined) updatePayload.loyalty_enabled = loyalty_enabled;
        if (kitchen_enabled !== undefined) updatePayload.kitchen_enabled = kitchen_enabled;
        if (counter_enabled !== undefined) updatePayload.counter_enabled = counter_enabled;
        if (order_integration_enabled !== undefined) updatePayload.order_integration_enabled = order_integration_enabled;
        if (pay_mode_enabled !== undefined) updatePayload.pay_mode_enabled = pay_mode_enabled;
        if (stock_level_enabled !== undefined) updatePayload.stock_level_enabled = stock_level_enabled;
        if (dashboard_enabled !== undefined) updatePayload.dashboard_enabled = dashboard_enabled;
        if (kot_enabled !== undefined) updatePayload.kot_enabled = kot_enabled;
        if (req.body.billing_coupon_active !== undefined) updatePayload.billing_coupon_active = req.body.billing_coupon_active;
        if (req.body.billing_loyalty_active !== undefined) updatePayload.billing_loyalty_active = req.body.billing_loyalty_active;
        if (req.body.kitchen_enabled !== undefined) updatePayload.kitchen_enabled = req.body.kitchen_enabled;
        if (req.body.printer_enabled !== undefined) updatePayload.printer_enabled = req.body.printer_enabled;
        if (req.body.counter_enabled !== undefined) updatePayload.counter_enabled = req.body.counter_enabled;
        if (req.body.dashboard_enabled !== undefined) updatePayload.dashboard_enabled = req.body.dashboard_enabled;
        if (req.body.reports_enabled !== undefined) updatePayload.reports_enabled = req.body.reports_enabled;
        if (req.body.staff_enabled !== undefined) updatePayload.staff_enabled = req.body.staff_enabled;
        if (req.body.table_enabled !== undefined) updatePayload.table_enabled = req.body.table_enabled;

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            updatePayload,
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Module settings updated successfully',
            data: {
                coupon_enabled: restaurant.coupon_enabled,
                loyalty_enabled: restaurant.loyalty_enabled,
                billing_coupon_active: restaurant.billing_coupon_active,
                billing_loyalty_active: restaurant.billing_loyalty_active,
                kitchen_enabled: restaurant.kitchen_enabled,
                printer_enabled: restaurant.printer_enabled,
                counter_enabled: restaurant.counter_enabled,
                dashboard_enabled: restaurant.dashboard_enabled,
                reports_enabled: restaurant.reports_enabled,
                staff_enabled: restaurant.staff_enabled,
                table_enabled: restaurant.table_enabled,
                pay_mode_enabled: restaurant.pay_mode_enabled,
                stock_level_enabled: restaurant.stock_level_enabled,
                kot_enabled: restaurant.kot_enabled
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Extra Modules Password
// @route   POST /api/settings/extra-modules/verify-password
// @access  Private (Admin, Owner)
exports.verifyExtraModulesPassword = async (req, res) => {
    try {
        const { password } = req.body;
        
        // Find owner user for this restaurant
        const owner = await User.findOne({ restaurant_id: req.user.restaurant_id, role: 'OWNER' }).select('+password');
        
        if (!owner) {
            return res.status(404).json({ success: false, message: 'Owner user not found' });
        }

        const isMatch = await owner.matchPassword(password);
        if (isMatch) {
            return res.status(200).json({ success: true, message: 'Password verified' });
        }
        
        return res.status(401).json({ success: false, message: 'Invalid password' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
