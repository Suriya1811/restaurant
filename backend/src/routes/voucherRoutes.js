const express = require('express');
const router = express.Router();
const { getVouchers, createVoucher, deleteVoucher } = require('../controllers/voucherController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getVouchers)
    .post(authorize('ADMIN', 'OWNER'), createVoucher);

router.route('/:id')
    .delete(authorize('ADMIN', 'OWNER'), deleteVoucher);

module.exports = router;
