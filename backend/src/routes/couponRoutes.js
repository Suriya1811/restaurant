const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon, getActiveCoupons } = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCoupons);
router.get('/active', protect, getActiveCoupons);
router.post('/', protect, createCoupon);
router.put('/:id', protect, updateCoupon);
router.delete('/:id', protect, deleteCoupon);
router.post('/validate', protect, validateCoupon);

module.exports = router;
