const express = require('express');
const router = express.Router();
const {
    getUserSettings,
    updateProfile,
    changePassword,
    updatePrinterSettings,
    updateBillFormat,
    updateBillingLayout,
    updateAdvancedSettings,
    updateLoyaltySettings,
    updateBillSeries,
    updateModuleSettings,
    createNewProfile,
    verifyExtraModulesPassword,
    togglePasswordProtection
} = require('../controllers/settingsController');
const {
    createBackup,
    restoreBackup,
    getBackupStatus
} = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and admin/owner access
router.use(protect);
router.use(authorize('ADMIN', 'OWNER'));

// Get all settings
router.get('/', getUserSettings);

// Update advanced settings
router.put('/advanced', updateAdvancedSettings);

// Update profile
router.put('/profile', updateProfile);

// Change password
router.put('/password', changePassword);
router.put('/toggle-password', togglePasswordProtection);

// Update printer settings
router.put('/printer', updatePrinterSettings);

// Update bill format
router.put('/bill-format', updateBillFormat);

// Update loyalty settings
router.put('/loyalty', updateLoyaltySettings);

// Update billing layout only (Appearance tab)
router.put('/layout', updateBillingLayout);

// Update module toggle settings
router.put('/modules', updateModuleSettings);

// Update bill series settings
router.put('/bill-series', updateBillSeries);

// New profile creation
router.post('/new-profile', createNewProfile);

// Verify extra modules password
router.post('/extra-modules/verify-password', verifyExtraModulesPassword);

// Backup & Restore
router.get('/backup/status', getBackupStatus);
router.post('/backup', createBackup);
router.post('/restore', restoreBackup);

module.exports = router;