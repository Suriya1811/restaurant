const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token, exclude password
            req.user = await User.findById(decoded.id).select('-password').populate('restaurant_id');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            // Check if company/restaurant is active (if applicable, here we just check if linked)
            if (!req.user.restaurant_id) {
                return res.status(401).json({ success: false, message: 'Not authorized, no linked company' });
            }

            // Check if user is active
            if (req.user.is_active === false) {
                return res.status(403).json({ success: false, message: 'Account deactivated. Contact your administrator.' });
            }

            // If user is STAFF with custom role, load their permissions
            if (req.user.role === 'STAFF' && req.user.custom_role_id) {
                const role = await Role.findById(req.user.custom_role_id);
                if (role) {
                    req.userPermissions = role.pages;
                    req.customRoleName = role.name;
                }
            }

            next();
        } catch (error) {
            console.error('Token verification error:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: 'Invalid token format' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired' });
            }
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        // OWNER and ADMIN always pass
        if (['OWNER', 'ADMIN'].includes(req.user.role)) {
            return next();
        }

        // If STAFF is in the allowed roles list, let them through
        // (frontend handles page/feature-level access)
        if (roles.includes('STAFF') && req.user.role === 'STAFF') {
            return next();
        }

        // Legacy: also check if the user's static role is in the allowed list
        if (roles.includes(req.user.role)) {
            return next();
        }

        // If user is STAFF and has custom role permissions, allow if they have
        // any active page access (the specific page check is done on frontend)
        if (req.user.role === 'STAFF' && req.userPermissions) {
            const hasAnyAccess = req.userPermissions.some(p => p.has_access);
            if (hasAnyAccess) {
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: `User role ${req.user.role} is not authorized to access this route`
        });
    };
};

module.exports = { protect, authorize };
