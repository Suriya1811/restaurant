const express = require('express');
const router = express.Router();
const { getTaxes, createTax, updateTax, deleteTax } = require('../controllers/taxController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getTaxes)
    .post(authorize('admin', 'owner'), createTax);

router.route('/:id')
    .put(authorize('admin', 'owner'), updateTax)
    .delete(authorize('admin', 'owner'), deleteTax);

module.exports = router;
