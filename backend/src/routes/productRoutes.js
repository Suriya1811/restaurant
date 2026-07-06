const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    updateProduct,
    toggleProductStatus,
    deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, authorize('ADMIN', 'OWNER', 'BILLING'), getProducts);
router.post('/', protect, authorize('ADMIN', 'OWNER'), createProduct);
router.post('/upload', protect, authorize('ADMIN', 'OWNER'), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const imageUrl = `/uploads/products/${req.file.filename}`;
    res.status(200).json({ success: true, data: imageUrl });
});
router.put('/:id', protect, authorize('ADMIN', 'OWNER'), updateProduct);
router.patch('/:id/toggle-status', protect, authorize('ADMIN', 'OWNER'), toggleProductStatus);
router.delete('/:id', protect, authorize('ADMIN', 'OWNER'), deleteProduct);

module.exports = router;
