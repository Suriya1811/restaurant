const express = require('express');
const router = express.Router();
const {
    getPagesConfig,
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
    createSubUser,
    getSubUsers,
    updateSubUser,
    deleteSubUser
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and require OWNER or ADMIN role
router.use(protect);

// Pages config - must be before /:id
router.get('/pages-config', authorize('OWNER', 'ADMIN'), getPagesConfig);

// Sub-user management - must be before /:id to avoid route conflict
router.route('/users')
    .get(authorize('OWNER', 'ADMIN'), getSubUsers)
    .post(authorize('OWNER', 'ADMIN'), createSubUser);

router.route('/users/:id')
    .put(authorize('OWNER', 'ADMIN'), updateSubUser)
    .delete(authorize('OWNER', 'ADMIN'), deleteSubUser);

// Role CRUD
router.route('/')
    .get(authorize('OWNER', 'ADMIN'), getRoles)
    .post(authorize('OWNER', 'ADMIN'), createRole);

router.route('/:id')
    .get(authorize('OWNER', 'ADMIN'), getRole)
    .put(authorize('OWNER', 'ADMIN'), updateRole)
    .delete(authorize('OWNER', 'ADMIN'), deleteRole);

module.exports = router;
