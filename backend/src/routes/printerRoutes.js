const express = require('express');
const router = express.Router();
const {
    getPrinters,
    createPrinter,
    updatePrinter,
    deletePrinter,
    getPrinterOrders
} = require('../controllers/printerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// CRUD
router.get('/', getPrinters);
router.post('/', authorize('ADMIN', 'OWNER', 'STAFF'), createPrinter);
router.put('/:id', authorize('ADMIN', 'OWNER', 'STAFF'), updatePrinter);
router.delete('/:id', authorize('ADMIN', 'OWNER'), deletePrinter);

// Printer orders (for the "Printer Display" functionality)
router.get('/:id/orders', getPrinterOrders);

module.exports = router;
