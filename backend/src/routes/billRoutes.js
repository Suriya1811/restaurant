const express = require('express');
const router = express.Router();
const { createBill, addItemToBill, getBill, processPayment, removeItemFromBill, getAllBills, cancelBill, updateBill } = require('../controllers/billController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAllBills);
router.post('/', createBill);
router.post('/:id/items', addItemToBill);
router.delete('/:id/items/:productId', removeItemFromBill);
router.get('/:id', getBill);
router.put('/:id', updateBill);
router.patch('/:id/party-status', require('../controllers/billController').updatePartyStatus);
router.put('/:id/pay', processPayment);
router.delete('/:id', authorize('ADMIN', 'OWNER'), cancelBill);

module.exports = router;
