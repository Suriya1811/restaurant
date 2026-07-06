const express = require('express');
const router = express.Router();
const {
    getLedgerGroups,
    createLedgerGroup,
    updateLedgerGroup,
    deleteLedgerGroup
} = require('../controllers/ledgerGroupController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getLedgerGroups)
    .post(authorize('ADMIN', 'OWNER'), createLedgerGroup);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateLedgerGroup)
    .delete(authorize('ADMIN', 'OWNER'), deleteLedgerGroup);

module.exports = router;
