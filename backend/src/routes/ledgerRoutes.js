const express = require('express');
const router = express.Router();
const {
    getLedgers,
    getLedgerById,
    createLedger,
    updateLedger,
    toggleLedgerStatus,
    deleteLedger,
    getLedgerSummaryByGroup
} = require('../controllers/ledgerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getLedgers)
    .post(authorize('ADMIN', 'OWNER'), createLedger);

router.route('/summary-by-group')
    .get(getLedgerSummaryByGroup);

router.route('/:id')
    .get(getLedgerById)
    .put(authorize('ADMIN', 'OWNER'), updateLedger)
    .delete(authorize('ADMIN', 'OWNER'), deleteLedger);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleLedgerStatus);

module.exports = router;
