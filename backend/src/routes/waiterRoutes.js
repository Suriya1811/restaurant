const express = require('express');
const router = express.Router();
const { getWaiters, createWaiter, updateWaiter, toggleWaiterStatus, deleteWaiter } = require('../controllers/waiterController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', authorize('ADMIN', 'OWNER'), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const imageUrl = `/uploads/staff/${req.file.filename}`;
    res.status(200).json({ success: true, data: imageUrl });
});

router.route('/')
    .get(getWaiters)
    .post(authorize('ADMIN', 'OWNER'), createWaiter);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateWaiter)
    .delete(authorize('ADMIN', 'OWNER'), deleteWaiter);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleWaiterStatus);

module.exports = router;
