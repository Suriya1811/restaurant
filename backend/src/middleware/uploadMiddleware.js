const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Base uploads dir: use UPLOADS_DIR env var (set by Electron) or fallback
const BASE_UPLOADS = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subDir = 'products';
        if (req.originalUrl.includes('staff') || req.originalUrl.includes('waiters') || req.originalUrl.includes('captains')) subDir = 'staff';
        if (req.originalUrl.includes('products'))   subDir = 'products';
        if (req.originalUrl.includes('restaurant')) subDir = 'restaurant';

        const dir = path.join(BASE_UPLOADS, subDir);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits:     { fileSize: 5 * 1024 * 1024 },
    fileFilter,
});

module.exports = upload;
