const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, toggleSupplierStatus, deleteSupplier } = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSuppliers)
    .post(authorize('ADMIN', 'OWNER'), createSupplier);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateSupplier)
    .delete(authorize('ADMIN', 'OWNER'), deleteSupplier);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleSupplierStatus);

module.exports = router;
