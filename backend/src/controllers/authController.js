const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcryptjs'); // Needed for OTP verification if hashing
const { sendEmail } = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Initiate forgot password flow
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { company_name, email } = req.body;

        if (!company_name || !email) {
            return res.status(400).json({ message: 'Please provide company name and email' });
        }

        // 1. Find Restaurant
        const restaurant = await Restaurant.findOne({
            $or: [
                { name: company_name },
                { print_name: company_name },
                { store_name: company_name }
            ]
        });

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // 2. Find Admin User linked to this restaurant with email
        const user = await User.findOne({
            restaurant_id: restaurant._id,
            email,
            // Only allow admins/owners to reset this way for safety
            role: { $in: ['OWNER', 'ADMIN'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'No admin/owner found with this email for the specified restaurant' });
        }

        // 3. Generate OTP (6 digits)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Hash OTP
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // 5. Save to DB (expires in 10 mins)
        // Clear old OTPs for this user first
        await PasswordReset.deleteMany({ company_id: restaurant._id, email });

        await PasswordReset.create({
            company_id: restaurant._id,
            email,
            otp_hash: otpHash,
            expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        });

        // 6. Send Email
        const emailContent = `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset for <b>${restaurant.print_name}</b>.</p>
            <p>Your verification code is:</p>
            <h2 style="color: #F2A65A; letter-spacing: 5px;">${otp}</h2>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        await sendEmail(email, 'Password Reset Code - RestoSaaS', emailContent);

        res.status(200).json({ message: 'OTP sent to your email' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    try {
        const { company_name, email, otp } = req.body;

        if (!company_name || !email || !otp) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const restaurant = await Restaurant.findOne({
            $or: [
                { name: company_name },
                { print_name: company_name }
            ]
        });

        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        const resetEntry = await PasswordReset.findOne({
            company_id: restaurant._id,
            email
        });

        if (!resetEntry) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (resetEntry.expires_at < new Date()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const isMatch = await bcrypt.compare(otp, resetEntry.otp_hash);

        if (!isMatch) {
            // Increment logic could be added here
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        res.status(200).json({ message: 'OTP verified successfully' });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { company_name, email, otp, new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const restaurant = await Restaurant.findOne({
            $or: [
                { name: company_name },
                { print_name: company_name }
            ]
        });

        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found to reset' });

        // Validate OTP one last time securely
        const resetEntry = await PasswordReset.findOne({
            company_id: restaurant._id,
            email
        });

        if (!resetEntry) {
            return res.status(400).json({ message: 'Session expired, please request OTP again' });
        }

        const isMatch = await bcrypt.compare(otp, resetEntry.otp_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Find User
        const user = await User.findOne({
            restaurant_id: restaurant._id,
            email
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Set plain password — the User model's pre-save hook will hash it
        user.password = new_password;
        await user.save();

        // Delete OTP
        await PasswordReset.deleteOne({ _id: resetEntry._id });

        res.status(200).json({ message: 'Password reset successfully. Please login.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register a new restaurant and owner
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const {
            company_name,
            store_name,
            print_name,
            restaurant_type,
            financial_year_start,
            financial_year_end,
            books_from,
            address,
            fssai_no,
            gstin,
            owner_name,
            email,
            mobile,
            password,
            confirm_password,
            security_control_enabled,
            logo_url
        } = req.body;

        // 1. Basic Validation
        if (!company_name || !store_name || !print_name || !restaurant_type ||
            !address || !owner_name || !email || !mobile || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // 2. Date Validations & Defaults
        const currentYear = new Date().getFullYear();
        const fyStart = financial_year_start ? new Date(financial_year_start) : new Date(`${currentYear}-04-01`);
        const fyEnd = financial_year_end ? new Date(financial_year_end) : new Date(`${currentYear + 1}-03-31`);
        const bkFrom = books_from ? new Date(books_from) : new Date(`${currentYear}-04-01`);

        if (fyStart >= fyEnd) {
            return res.status(400).json({ message: 'Financial year start must be before end' });
        }

        if (bkFrom < fyStart || bkFrom > fyEnd) {
            return res.status(400).json({ message: 'Books start date must be within financial year' });
        }

        // 3. Unique Checks - Removed global unique checks to allow same email for multiple companies
        // Uniqueness is now handled by compound indices [email, restaurant_id] in the DB

        // 4. Create Documents
        let restaurant;
        try {
            restaurant = await Restaurant.create({
                company_name,
                store_name,
                print_name,
                restaurant_type,
                financial_year_start: fyStart,
                financial_year_end: fyEnd,
                books_from: bkFrom,
                address,
                fssai_no,
                gstin,
                logo_url
            });

            const user = await User.create({
                name: owner_name,
                email,
                mobile,
                password,
                restaurant_id: restaurant._id,
                security_control_enabled: security_control_enabled !== false, // Default to true
                role: 'OWNER'
            });

            // Create Default Ledgers
            const { createDefaultLedgers } = require('../utils/accounting');
            await createDefaultLedgers(restaurant._id);

            res.status(201).json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    role: user.role,
                    restaurant_id: user.restaurant_id,
                    email: user.email
                },
                restaurant: {
                    name: restaurant.company_name,
                    store_name: restaurant.store_name,
                    restaurant_type: restaurant.restaurant_type,
                    billing_layout: restaurant.billing_layout,
                    logo_url: restaurant.logo_url
                },
                permissions: null
            });

        } catch (dbError) {
            // Manual cleanup if restaurant was created but user failed
            if (restaurant && restaurant._id) {
                await Restaurant.findByIdAndDelete(restaurant._id);
            }
            throw dbError;
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile and restaurant details
// @route   GET /api/auth/profile
// @access  Protected
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('restaurant_id');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role
                },
                restaurant: {
                    id: user.restaurant_id._id,
                    name: user.restaurant_id.company_name,
                    store_name: user.restaurant_id.store_name,
                    print_name: user.restaurant_id.print_name,
                    address: user.restaurant_id.address,
                    phone: user.restaurant_id.mobile || user.restaurant_id.landline,
                    gstin: user.restaurant_id.gstin,
                    fssai_no: user.restaurant_id.fssai_no,
                    billing_layout: user.restaurant_id.billing_layout,
                    logo_url: user.restaurant_id.logo_url
                }
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.login = async (req, res) => {
    try {
        const { username, password, company_name } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please provide username and password' });
        }

        // MASTER ADMIN DEFAULT LOGIN BYPASS
        if (username.toLowerCase() === 'admin@restoboard.com' && password === 'password123') {
            // Find the first OWNER user in the system to use as the actual user
            const anyOwner = await User.findOne({ role: 'OWNER' }).populate('restaurant_id');
            if (anyOwner && anyOwner.restaurant_id) {
                const token = generateToken(anyOwner._id);
                return res.json({
                    success: true,
                    token,
                    user: {
                        id: anyOwner._id,
                        name: 'Master Support',
                        role: 'SUPER_ADMIN',
                        restaurant_id: anyOwner.restaurant_id._id
                    },
                    restaurant: {
                        name: anyOwner.restaurant_id?.company_name || 'Admin Dashboard',
                        store_name: anyOwner.restaurant_id?.store_name || 'Admin Dashboard',
                        restaurant_type: anyOwner.restaurant_id?.restaurant_type || 'SELF_SERVICE',
                        billing_layout: anyOwner.restaurant_id?.billing_layout,
                        logo_url: anyOwner.restaurant_id?.logo_url || ''
                    },
                    permissions: null
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'No restaurant found. Please register a restaurant first.'
                });
            }
        }

        // Build query: find user by email, mobile, or username
        let query = {
            $or: [
                { email: username.toLowerCase() },
                { mobile: username },
                { username: username.toLowerCase() }
            ]
        };

        // If company_name is provided, filter by restaurant
        if (company_name) {
            const restaurant = await Restaurant.findOne({
                $or: [
                    { company_name: company_name },
                    { store_name: company_name },
                    { print_name: company_name }
                ]
            });
            if (restaurant) {
                query.restaurant_id = restaurant._id;
            }
        }

        const users = await User.find(query).select('+password').populate('restaurant_id');

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        let validUser = null;
        for (const u of users) {
            if (u.is_active === false) continue;
            const isMatch = await u.matchPassword(password);
            if (isMatch) {
                validUser = u;
                break;
            }
        }

        if (!validUser) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
        
        const user = validUser;

        const token = generateToken(user._id);

        // Fetch permissions directly from user
        let permissions = user.permissions || [];
        let customRoleName = user.role;

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                restaurant_id: user.restaurant_id._id,
                custom_role_id: user.custom_role_id,
                custom_role_name: customRoleName
            },
            restaurant: {
                name: user.restaurant_id?.company_name || 'RestoBoard',
                store_name: user.restaurant_id?.store_name || user.restaurant_id?.company_name || 'RestoBoard',
                restaurant_type: user.restaurant_id?.restaurant_type || 'SELF_SERVICE',
                billing_layout: user.restaurant_id?.billing_layout,
                logo_url: user.restaurant_id?.logo_url || ''
            },
            permissions
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


