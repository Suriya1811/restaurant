const express = require('express');
const router = express.Router();
const { getCaptains, createCaptain, updateCaptain, toggleCaptainStatus, deleteCaptain } = require('../controllers/captainController');
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
    .get(getCaptains)
    .post(authorize('ADMIN', 'OWNER'), createCaptain);

router.route('/:id')
    .put(authorize('ADMIN', 'OWNER'), updateCaptain)
    .delete(authorize('ADMIN', 'OWNER'), deleteCaptain);

router.route('/:id/toggle-status')
    .patch(authorize('ADMIN', 'OWNER'), toggleCaptainStatus);

module.exports = router;
