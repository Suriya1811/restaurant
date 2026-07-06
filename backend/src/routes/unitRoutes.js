const express = require('express');
const router = express.Router();
const { getUnits, createUnit, updateUnit, deleteUnit } = require('../controllers/unitController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getUnits)
    .post(authorize('admin', 'owner'), createUnit);

router.route('/:id')
    .put(authorize('admin', 'owner'), updateUnit)
    .delete(authorize('admin', 'owner'), deleteUnit);

module.exports = router;
