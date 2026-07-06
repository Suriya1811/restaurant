const express = require('express');
const router = express.Router();
const {
    getKitchens,
    createKitchen,
    updateKitchen,
    deleteKitchen,
    getKitchenOrders,
    updateKotItemStatus
} = require('../controllers/kitchenController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// CRUD - admin/owner only
router.get('/', getKitchens);
router.post('/', authorize('ADMIN', 'OWNER', 'STAFF'), createKitchen);
router.put('/:id', authorize('ADMIN', 'OWNER', 'STAFF'), updateKitchen);
router.delete('/:id', authorize('ADMIN', 'OWNER'), deleteKitchen);

// Kitchen display (orders) - anyone can view
router.get('/:id/orders', getKitchenOrders);
router.patch('/orders/:billId/item', updateKotItemStatus);

module.exports = router;
