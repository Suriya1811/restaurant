const express = require('express');
const router = express.Router();
const {
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getMonthWiseReport,
    getSalesByCategory,
    getTopProducts,
    getSupplierOutstanding,
    getCustomerOutstanding,
    getStockValuation,
    getProfitLoss,
    getSalesByBrand,
    getSalesByCaptain,
    getPurchaseSummary,
    getDayWisePurchaseReport,
    getDaybook,
    getLedgerStatement,
    getAgingReport,
    getAccountBalances,
    getSalesProfitReport,
    getSalesRegister,
    getItemWiseSalesDetailed,
    getSalesTransactionSummary,
    getDaybookReport,
    getCashBankReport,
    getSalesSummary
} = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and admin/owner access
router.use(protect);
router.use(authorize('ADMIN', 'OWNER'));

// Transaction-wise Sales Summary
router.get('/sales/transaction-summary', getSalesTransactionSummary);

// Sales Summary
router.get('/sales/summary', getSalesSummary);

// Sales/Stock Detailed Report
router.get('/sales/item-detailed', getItemWiseSalesDetailed);

// Sales Register
router.get('/sales-register', getSalesRegister);

// Sales profit report
router.get('/sales-profit', getSalesProfitReport);

// Daily sales report
router.get('/daily', getDailyReport);

// Weekly sales report
router.get('/weekly', getWeeklyReport);

// Monthly sales report
router.get('/monthly', getMonthlyReport);

// Month-wise sales report for whole year/range
router.get('/month-wise', getMonthWiseReport);

// Sales by category
router.get('/sales-by-category', getSalesByCategory);

// Top selling products
router.get('/top-products', getTopProducts);

// Supplier outstanding
router.get('/supplier-outstanding', getSupplierOutstanding);

// Customer outstanding
router.get('/customer-outstanding', getCustomerOutstanding);

// Stock valuation
router.get('/stock-valuation', getStockValuation);

// Profit & Loss
router.get('/profit-loss', getProfitLoss);

// Sales by brand
router.get('/sales-by-brand', getSalesByBrand);

// Sales by captain
router.get('/sales-by-captain', getSalesByCaptain);

// Purchase summary
router.get('/purchase-summary', getPurchaseSummary);

// Day-wise purchase report
router.get('/purchase/day-wise', getDayWisePurchaseReport);

// Daybook
router.get('/daybook', getDaybook);

// Ledger Statement
router.get('/ledger-statement', getLedgerStatement);

// Aging Report
router.get('/aging-report', getAgingReport);

// Account Balances (Cash/Bank)
router.get('/account-balances', getAccountBalances);

// Accounts Reports
router.get('/accounts/daybook', getDaybookReport);
router.get('/accounts/ledger-statement', getLedgerStatement);
router.get('/accounts/cash-bank', getCashBankReport);

module.exports = router;