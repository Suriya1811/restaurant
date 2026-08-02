const express = require('express');
const router = express.Router();
const { 
    getTables, createTable, updateTable, toggleTableStatus, deleteTable, 
    reserveTable, cancelReservation,
    occupyTable, markTablePrinted, freeTable, updateTableAmount, updateKotStatus, transferItems,
    tempOpenTable, cleanupExpiredNewTables
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/cleanup-expired', async (req, res) => {
    try {
        const result = await cleanupExpiredNewTables(req.user.restaurant_id);
        res.status(200).json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.route('/')
    .get(getTables)
    .post(authorize('ADMIN', 'OWNER'), createTable);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateTable)
    .delete(authorize('ADMIN', 'OWNER'), deleteTable);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleTableStatus);

router.route('/:id/reserve')
    .patch(reserveTable);

router.route('/:id/cancel-reserve')
    .patch(cancelReservation);

// Live session tracking routes
router.route('/:id/temp-open').post(tempOpenTable).patch(tempOpenTable);
router.route('/:id/occupy').patch(occupyTable);
router.route('/:id/mark-printed').patch(markTablePrinted);
router.route('/:id/free').patch(freeTable);
router.route('/:id/update-amount').patch(updateTableAmount);
router.route('/:id/kot-status').patch(updateKotStatus);
router.route('/:id/transfer-items').post(transferItems);

module.exports = router;
