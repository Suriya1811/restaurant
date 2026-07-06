const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, updateCustomer, toggleCustomerStatus, deleteCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getCustomers)
    .post(authorize('ADMIN', 'OWNER'), createCustomer);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateCustomer)
    .delete(authorize('ADMIN', 'OWNER'), deleteCustomer);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleCustomerStatus);

module.exports = router;
