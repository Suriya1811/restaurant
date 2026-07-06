const express = require('express');
const router = express.Router();
const {
    getStockItems,
    getLowStockItems,
    updateStock,
    bulkUpdateStock,
    getStockHistory,
    getStockReport
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and admin/owner access
router.use(protect);
router.use(authorize('ADMIN', 'OWNER'));

// Get stock report with summary and dates
router.get('/report', getStockReport);

// Get all stock items
router.get('/', getStockItems);

// Get stock history
router.get('/history', getStockHistory);

// Get low stock items
router.get('/low-stock', getLowStockItems);

// Bulk update stock (must be before /:id to avoid route conflict)
router.put('/bulk-update', bulkUpdateStock);

// Update single product stock
router.put('/:id', updateStock);

module.exports = router;