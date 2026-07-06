const express = require('express');
const router = express.Router();
const { getCounters, createCounter, updateCounter } = require('../controllers/counterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getCounters)
    .post(authorize('ADMIN', 'OWNER'), createCounter);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateCounter);

module.exports = router;
