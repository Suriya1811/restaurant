const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, toggleCategoryStatus, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getCategories)
    .post(authorize('ADMIN', 'OWNER'), createCategory);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateCategory)
    .delete(authorize('ADMIN', 'OWNER'), deleteCategory);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleCategoryStatus);

module.exports = router;
