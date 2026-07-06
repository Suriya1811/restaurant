const express = require('express');
const router = express.Router();
const { getTableTypes, createTableType, updateTableType, deleteTableType } = require('../controllers/tableTypeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getTableTypes)
    .post(authorize('ADMIN', 'OWNER'), createTableType);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateTableType)
    .delete(authorize('ADMIN', 'OWNER'), deleteTableType);

module.exports = router;
