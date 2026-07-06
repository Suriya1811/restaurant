const express = require('express');
const router = express.Router();
const { getFunctionTypes, createFunctionType, updateFunctionType, toggleFunctionTypeStatus, deleteFunctionType } = require('../controllers/functionTypeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getFunctionTypes)
    .post(authorize('ADMIN', 'OWNER'), createFunctionType);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateFunctionType)
    .delete(authorize('ADMIN', 'OWNER'), deleteFunctionType);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleFunctionTypeStatus);

module.exports = router;
