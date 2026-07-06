const express = require('express');
const router = express.Router();
const voucherSeriesController = require('../controllers/voucherSeriesController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', voucherSeriesController.getVoucherSeries);
router.post('/', voucherSeriesController.createVoucherSeries);
router.put('/:id', voucherSeriesController.updateVoucherSeries);
router.delete('/:id', voucherSeriesController.deleteVoucherSeries);

module.exports = router;
