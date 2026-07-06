const express = require('express');
const router = express.Router();
const { getBrands, createBrand, updateBrand, toggleBrandStatus, deleteBrand } = require('../controllers/brandController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getBrands)
    .post(authorize('ADMIN', 'OWNER'), createBrand);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateBrand)
    .delete(authorize('ADMIN', 'OWNER'), deleteBrand);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleBrandStatus);

module.exports = router;
