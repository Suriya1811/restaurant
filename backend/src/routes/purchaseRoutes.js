const express = require('express');
const router = express.Router();
const {
    getPurchases,
    getPurchaseStats,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getPurchaseStats);

router.route('/')
    .get(getPurchases)
    .post(authorize('ADMIN', 'OWNER'), createPurchase);

router.route('/:id')
    .get(getPurchaseById)
    .put(authorize('ADMIN', 'OWNER'), updatePurchase)
    .delete(authorize('ADMIN', 'OWNER'), deletePurchase);

module.exports = router;
