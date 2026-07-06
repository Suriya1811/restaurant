const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getPayments, getPaymentStats, getSupplierUnpaidBills,
    createPayment, deletePayment
} = require('../controllers/paymentController');

router.use(protect);

router.route('/')
    .get(getPayments)
    .post(authorize('ADMIN', 'OWNER', 'MANAGER'), createPayment);

router.get('/stats', getPaymentStats);
router.get('/party/:ledgerId/unpaid', getSupplierUnpaidBills);

router.route('/:id')
    .delete(authorize('ADMIN', 'OWNER'), deletePayment);

module.exports = router;
