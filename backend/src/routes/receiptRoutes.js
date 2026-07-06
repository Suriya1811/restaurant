const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getReceipts, getReceiptStats, getUnpaidBills, createReceipt, deleteReceipt } = require('../controllers/receiptController');

router.use(protect); // Ensure all standard APIs are protected

router.route('/')
    .get(getReceipts)
    .post(authorize('ADMIN', 'OWNER', 'MANAGER'), createReceipt);

router.get('/stats', getReceiptStats);
router.get('/party/:partyId/unpaid', getUnpaidBills);

router.route('/:id')
    .delete(authorize('ADMIN', 'OWNER'), deleteReceipt);

module.exports = router;
