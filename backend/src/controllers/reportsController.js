const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');
const Purchase = require('../models/Purchase');
const Voucher = require('../models/Voucher');
const mongoose = require('mongoose');

// @desc    Get daily/range sales report
// @route   GET /api/reports/daily?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getDailyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Parse dates or use today as default
        let start = new Date();
        let end = new Date();

        if (startDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        } else {
            start.setHours(0, 0, 0, 0);
        }

        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            end.setHours(23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Calculate metrics for the entire period
        const totalSales = bills.reduce((sum, bill) => sum + bill.grand_total, 0);
        const totalBills = bills.length;
        const cancelledBills = await Bill.countDocuments({
            company_id: req.user.restaurant_id,
            status: 'CANCELLED',
            createdAt: { $gte: start, $lte: end }
        });

        // Payment mode breakdown
        const paymentSummary = {};
        bills.forEach(bill => {
            if (bill.payment_modes && bill.payment_modes.length > 0) {
                bill.payment_modes.forEach(payment => {
                    if (!paymentSummary[payment.type]) {
                        paymentSummary[payment.type] = 0;
                    }
                    paymentSummary[payment.type] += payment.amount;
                });
            }
        });

        const paymentModes = Object.keys(paymentSummary).map(mode => ({
            mode,
            amount: paymentSummary[mode]
        }));

        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                },
                totalSales,
                totalBills,
                cancelledBills,
                paymentSummary: paymentModes
            }
        });
    } catch (error) {
        console.error('Daily report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get weekly sales report with daily breakdown
// @route   GET /api/reports/weekly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getWeeklyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to last 7 days
            start = new Date();
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Group by day
        const dailySales = {};
        const currentDate = new Date(start);

        // Initialize all dates in range
        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailySales[dateKey] = {
                date: dateKey,
                totalSales: 0,
                billCount: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate with actual data
        bills.forEach(bill => {
            const dateKey = bill.createdAt.toISOString().split('T')[0];
            if (dailySales[dateKey]) {
                dailySales[dateKey].totalSales += bill.grand_total;
                dailySales[dateKey].billCount += 1;
            }
        });

        const salesData = Object.values(dailySales);

        res.status(200).json({
            success: true,
            data: {
                period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
                totalSales: salesData.reduce((sum, day) => sum + day.totalSales, 0),
                totalBills: salesData.reduce((sum, day) => sum + day.billCount, 0),
                dailyBreakdown: salesData
            }
        });
    } catch (error) {
        console.error('Weekly report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get monthly sales report
// @route   GET /api/reports/monthly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getMonthlyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to current month
            const today = new Date();
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Group by week
        const weeks = {};
        bills.forEach(bill => {
            const weekNumber = Math.ceil(bill.createdAt.getDate() / 7);
            if (!weeks[weekNumber]) {
                weeks[weekNumber] = {
                    week: weekNumber,
                    totalSales: 0,
                    billCount: 0
                };
            }
            weeks[weekNumber].totalSales += bill.grand_total;
            weeks[weekNumber].billCount += 1;
        });

        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                },
                totalSales: bills.reduce((sum, bill) => sum + bill.grand_total, 0),
                totalBills: bills.length,
                weeklyBreakdown: Object.values(weeks)
            }
        });
    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get sales by category
// @route   GET /api/reports/sales-by-category?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getSalesByCategory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to last 30 days
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const Category = require('../models/Category');
        const categories = await Category.find({ company_id: req.user.restaurant_id });
        const categoryMap = {};
        categories.forEach(c => categoryMap[c._id.toString()] = c.name);

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        // Aggregate by category
        const categorySales = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                const catStr = item.category ? item.category.toString() : '';
                const catName = categoryMap[catStr] || catStr || 'Uncategorized';

                if (!categorySales[catName]) {
                    categorySales[catName] = {
                        category: catName,
                        totalSales: 0,
                        itemCount: 0
                    };
                }
                categorySales[catName].totalSales += item.total_price;
                categorySales[catName].itemCount += item.quantity;
            });
        });

        const sortedCategories = Object.values(categorySales)
            .sort((a, b) => b.totalSales - a.totalSales);

        res.status(200).json({
            success: true,
            data: sortedCategories
        });
    } catch (error) {
        console.error('Sales by category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get top selling products
// @route   GET /api/reports/top-products?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
// @access  Private (Admin, Owner)
exports.getTopProducts = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to last 30 days
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        // Aggregate product sales
        const productSales = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        productId: item.product_id,
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.product_id].quantity += item.quantity;
                productSales[item.product_id].revenue += item.total_price;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            data: topProducts
        });
    } catch (error) {
        console.error('Top products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get supplier outstanding balances (live DB synced)
// @route   GET /api/reports/supplier-outstanding
exports.getSupplierOutstanding = async (req, res) => {
    try {
        const companyId = req.user.restaurant_id;
        const { startDate, endDate } = req.query;

        const purchaseQuery = { company_id: companyId, is_deleted: { $ne: true } };
        const voucherQuery = { company_id: companyId, is_deleted: { $ne: true }, voucher_type: { $in: ['PAYMENT', 'JOURNAL'] } };

        if (startDate || endDate) {
            const pDate = {};
            const vDate = {};
            if (startDate) {
                pDate.$gte = new Date(startDate + 'T00:00:00.000Z');
                vDate.$gte = new Date(startDate + 'T00:00:00.000Z');
            }
            if (endDate) {
                pDate.$lte = new Date(endDate + 'T23:59:59.999Z');
                vDate.$lte = new Date(endDate + 'T23:59:59.999Z');
            }
            purchaseQuery.invoice_date = pDate;
            voucherQuery.date = vDate;
        }

        const [suppliers, creditorsLedgers, purchases, vouchers] = await Promise.all([
            Supplier.find({ company_id: companyId }).lean(),
            Ledger.find({ company_id: companyId, $or: [{ group: 'Sundry Creditors' }, { party_type: 'SUPPLIER' }] }).lean(),
            Purchase.find(purchaseQuery).lean(),
            Voucher.find(voucherQuery).populate('debit_ledger credit_ledger').lean()
        ]);

        const supplierMap = {};

        const getEntry = (id, rawName, mobile = '-') => {
            const key = rawName.trim().toLowerCase();
            if (!supplierMap[key]) {
                supplierMap[key] = {
                    id: id,
                    name: rawName.trim(),
                    mobile: mobile || '-',
                    pay_in: 0,
                    pay_out: 0,
                    balance: 0
                };
            }
            return supplierMap[key];
        };

        // 1. Process Supplier records
        (suppliers || []).forEach(s => {
            if (!s || !s.name) return;
            const entry = getEntry(s._id, s.name, s.contact_number || s.phone);
            const op = parseFloat(s.opening_balance) || 0;
            if (op > 0) entry.pay_in += op;
            else if (op < 0) entry.pay_out += Math.abs(op);
        });

        // 2. Process Creditors Ledgers
        (creditorsLedgers || []).forEach(l => {
            if (!l || !l.name) return;
            const cleanName = String(l.name).replace(/\(Supplier\)/gi, '').trim();
            const entry = getEntry(l._id, cleanName, l.phone || l.mobile2 || l.contact_person);
            if (entry.pay_in === 0 && entry.pay_out === 0) {
                const op = parseFloat(l.opening_balance) || 0;
                if (op > 0) entry.pay_in += op;
                else if (op < 0) entry.pay_out += Math.abs(op);
            }
        });

        // 3. Process Purchases (Increases Pay In by Grand Total, Increases Pay Out by Paid Amount on Purchase)
        (purchases || []).forEach(p => {
            const sName = p.supplier_name || (p.supplier_id ? String(p.supplier_id.name || p.supplier_id) : '');
            if (!sName) return;
            const entry = getEntry(p.supplier_id || p._id, sName, '-');
            const grand = parseFloat(p.grand_total) || 0;
            const paid = parseFloat(p.paid_amount) || 0;
            entry.pay_in += grand;
            entry.pay_out += paid;
        });

        // 4. Process Payment Vouchers that were NOT linked to purchases (advance / on-account payments)
        (vouchers || []).forEach(v => {
            if (v.settled_bills && v.settled_bills.length > 0) return;

            let sName = '';
            if (v.debit_ledger && v.debit_ledger.name) {
                sName = String(v.debit_ledger.name).replace(/\(Supplier\)/gi, '').trim();
            } else if (v.party_id) {
                sName = String(v.party_id.name || v.party_id);
            }
            if (!sName) return;
            const key = sName.trim().toLowerCase();
            if (supplierMap[key]) {
                const amt = parseFloat(v.amount) || 0;
                supplierMap[key].pay_out += amt;
            }
        });

        // Compute balances
        Object.values(supplierMap).forEach(item => {
            item.balance = item.pay_in - item.pay_out;
        });

        const dataList = Object.values(supplierMap);
        res.status(200).json({ success: true, data: dataList });
    } catch (error) {
        console.error('getSupplierOutstanding error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get customer outstanding balances (live DB synced)
// @route   GET /api/reports/customer-outstanding
exports.getCustomerOutstanding = async (req, res) => {
    try {
        const companyId = req.user.restaurant_id;
        const { startDate, endDate } = req.query;

        const billQuery = { company_id: companyId, is_deleted: { $ne: true } };
        const voucherQuery = { company_id: companyId, is_deleted: { $ne: true }, voucher_type: { $in: ['RECEIPT', 'JOURNAL'] } };

        if (startDate || endDate) {
            const bDate = {};
            const vDate = {};
            if (startDate) {
                bDate.$gte = new Date(startDate + 'T00:00:00.000Z');
                vDate.$gte = new Date(startDate + 'T00:00:00.000Z');
            }
            if (endDate) {
                bDate.$lte = new Date(endDate + 'T23:59:59.999Z');
                vDate.$lte = new Date(endDate + 'T23:59:59.999Z');
            }
            billQuery.createdAt = bDate;
            voucherQuery.date = vDate;
        }

        const [customers, debtorsLedgers, bills, vouchers] = await Promise.all([
            Customer.find({ company_id: companyId }).lean(),
            Ledger.find({ company_id: companyId, $or: [{ group: 'Sundry Debtors' }, { party_type: 'CUSTOMER' }] }).lean(),
            Bill.find(billQuery).populate('customer_id').lean(),
            Voucher.find(voucherQuery).populate('debit_ledger credit_ledger').lean()
        ]);

        const customerMap = {};

        const getEntry = (id, rawName, mobile = '-') => {
            const key = rawName.trim().toLowerCase();
            if (!customerMap[key]) {
                customerMap[key] = {
                    id: id,
                    name: rawName.trim(),
                    mobile: mobile || '-',
                    pay_in: 0,
                    pay_out: 0,
                    balance: 0
                };
            }
            return customerMap[key];
        };

        // 1. Process Customer records
        (customers || []).forEach(c => {
            if (!c || !c.name) return;
            const entry = getEntry(c._id, c.name, c.phone);
            const op = parseFloat(c.opening_balance) || 0;
            if (op > 0) entry.pay_in += op;
            else if (op < 0) entry.pay_out += Math.abs(op);
        });

        // 2. Process Debtors Ledgers
        (debtorsLedgers || []).forEach(l => {
            if (!l || !l.name) return;
            const cleanName = String(l.name).replace(/\(Customer\)/gi, '').trim();
            const entry = getEntry(l._id, cleanName, l.phone || l.mobile2);
            if (entry.pay_in === 0 && entry.pay_out === 0) {
                const op = parseFloat(l.opening_balance) || 0;
                if (op > 0) entry.pay_in += op;
                else if (op < 0) entry.pay_out += Math.abs(op);
            }
        });

        // 3. Process Sales Bills
        (bills || []).forEach(b => {
            const custName = b.customer_name || (b.customer_id ? b.customer_id.name : '');
            const rawName = custName ? String(custName).trim() : 'Walk-in Customer';
            const isWalkIn = !custName || rawName.toLowerCase() === 'walk-in customer';

            const grand = parseFloat(b.grand_total) || 0;
            const paid = b.status === 'PAID' ? grand : (parseFloat(b.total_paid || b.paid_amount) || 0);

            // Skip walk-in customers if they have zero balance
            if (isWalkIn && grand <= paid) return;

            const entry = getEntry(b.customer_id ? b.customer_id._id : b._id, rawName, b.customer_phone || (b.customer_id ? b.customer_id.phone : '-'));
            entry.pay_in += grand;
            entry.pay_out += paid;
        });

        // 4. Process Receipt Vouchers not linked directly to bills
        (vouchers || []).forEach(v => {
            if (v.settled_bills && v.settled_bills.length > 0) return;

            let cName = '';
            if (v.credit_ledger && v.credit_ledger.name) {
                cName = String(v.credit_ledger.name).replace(/\(Customer\)/gi, '').trim();
            } else if (v.party_id) {
                cName = String(v.party_id.name || v.party_id);
            }
            if (!cName) return;
            const key = cName.trim().toLowerCase();
            if (customerMap[key]) {
                const amt = parseFloat(v.amount) || 0;
                customerMap[key].pay_out += amt;
            }
        });

        // Calculate final balance
        Object.values(customerMap).forEach(item => {
            item.balance = item.pay_in - item.pay_out;
        });

        const dataList = Object.values(customerMap);
        res.status(200).json({ success: true, data: dataList });
    } catch (error) {
        console.error('getCustomerOutstanding error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get stock valuation report
// @route   GET /api/reports/stock-valuation
exports.getStockValuation = async (req, res) => {
    try {
        const products = await Product.find({ company_id: req.user.restaurant_id, current_stock: { $gt: 0 } });
        const valuation = products.map(p => ({
            name: p.name,
            stock: p.current_stock,
            purchase_price: p.purchase_price || 0,
            value: (p.current_stock * (p.purchase_price || 0))
        })).sort((a, b) => b.value - a.value);

        const totalValue = valuation.reduce((sum, item) => sum + item.value, 0);

        res.status(200).json({ success: true, data: { items: valuation, totalValue } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get sales by brand
exports.getSalesByBrand = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        const brandSales = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                const brand = item.brand || 'No Brand';
                if (!brandSales[brand]) brandSales[brand] = { brand, amount: 0, qty: 0 };
                brandSales[brand].amount += item.total_price;
                brandSales[brand].qty += item.quantity;
            });
        });

        res.status(200).json({ success: true, data: Object.values(brandSales).sort((a, b) => b.amount - a.amount) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get sales by captain
exports.getSalesByCaptain = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        const captainSales = {};
        bills.forEach(bill => {
            const captain = bill.captain_name || 'Direct / Walk-in';
            if (!captainSales[captain]) captainSales[captain] = { captain, amount: 0, count: 0 };
            captainSales[captain].amount += bill.grand_total;
            captainSales[captain].count += 1;
        });

        res.status(200).json({ success: true, data: Object.values(captainSales).sort((a, b) => b.amount - a.amount) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get generic sales summary (Universal grouping)
exports.getSalesSummary = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'CATEGORY' } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        const summary = {};
        bills.forEach(bill => {
            if (groupBy === 'CAPTAIN' || groupBy === 'WAITER' || groupBy === 'TYPE' || groupBy === 'PAYMENT_MODE') {
                const key = (groupBy === 'CAPTAIN') ? (bill.captain_name || 'Direct') : 
                            (groupBy === 'WAITER') ? (bill.waiter_name || 'Standard') :
                            (groupBy === 'TYPE') ? (bill.type || 'N/A') :
                            (bill.payment_mode || 'N/A');
                
                if (!summary[key]) summary[key] = { [groupBy.toLowerCase()]: key, amount: 0, count: 0 };
                summary[key].amount += bill.grand_total;
                summary[key].count += 1;
            } else if (groupBy === 'CATEGORY' || groupBy === 'BRAND' || groupBy === 'ITEM') {
                bill.items.forEach(item => {
                    const subKey = (groupBy === 'ITEM') ? (item.name || 'Unnamed') :
                                 (groupBy === 'CATEGORY') ? (item.category || 'Uncategorized') :
                                 ('No Brand'); // Brand might not be in Bill items, aggregate if needed
                    
                    if (!summary[subKey]) summary[subKey] = { [groupBy.toLowerCase()]: subKey, qty: 0, amount: 0 };
                    summary[subKey].qty += item.quantity;
                    summary[subKey].amount += item.total_price;
                });
            } else if (groupBy === 'BRAND') {
                // If brand is needed specifically, we already have getSalesByBrand, 
                // but for consistency we can use it here if we join products
            }
        });

        res.status(200).json({ success: true, data: Object.values(summary).sort((a, b) => b.amount - a.amount) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get purchase summary (Grouped by various filters)
exports.getPurchaseSummary = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'SUPPLIER' } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const purchases = await Purchase.find({
            company_id: req.user.restaurant_id,
            purchase_date: { $gte: start, $lte: end }
        }).populate('supplier_id', 'name');

        const summary = {};
        purchases.forEach(p => {
            let key = 'Unknown';
            
            if (groupBy === 'SUPPLIER') {
                key = p.supplier_id?.name || 'Walk-in / Unknown';
                if (!summary[key]) summary[key] = { name: key, amount: 0, paid: 0, due: 0, count: 0 };
                summary[key].amount += p.grand_total;
                summary[key].paid += p.paid_amount;
                summary[key].due += p.due_amount;
                summary[key].count += 1;
            } else if (groupBy === 'MONTH') {
                const d = new Date(p.purchase_date);
                key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                if (!summary[key]) summary[key] = { month: key, amount: 0, count: 0 };
                summary[key].amount += p.grand_total;
                summary[key].count += 1;
            } else if (groupBy === 'ITEM' || groupBy === 'CATEGORY' || groupBy === 'BRAND') {
                p.items.forEach(item => {
                    const subKey = (groupBy === 'ITEM') ? (item.item_name || 'Unnamed') : 
                                 (groupBy === 'CATEGORY') ? (item.category || 'Uncategorized') : 
                                 (item.brand || 'No Brand');
                    
                    if (!summary[subKey]) summary[subKey] = { [groupBy.toLowerCase()]: subKey, qty: 0, amount: 0 };
                    summary[subKey].qty += item.quantity;
                    summary[subKey].amount += item.total_amount;
                });
            }
        });

        res.status(200).json({ success: true, data: Object.values(summary).sort((a, b) => b.amount - a.amount) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Daybook (All transactions for a specific day)
exports.getDaybook = async (req, res) => {
    try {
        const { date, startDate, endDate } = req.query;
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            start = new Date(date || new Date());
            start.setHours(0, 0, 0, 0);
            end = new Date(date || new Date());
            end.setHours(23, 59, 59, 999);
        }

        const coId = req.user.restaurant_id;

        const [bills, purchases, vouchers] = await Promise.all([
            Bill.find({
                company_id: coId,
                status: { $in: ['PAID', 'OPEN', 'CREDIT'] },
                $or: [{ createdAt: { $gte: start, $lte: end } }, { delivery_date: { $gte: start, $lte: end } }]
            }),
            Purchase.find({
                company_id: coId,
                is_deleted: { $ne: true },
                $or: [{ purchase_date: { $gte: start, $lte: end } }, { invoice_date: { $gte: start, $lte: end } }, { createdAt: { $gte: start, $lte: end } }]
            }).populate('supplier_id', 'name'),
            require('../models/Voucher').find({
                company_id: coId,
                is_deleted: { $ne: true },
                date: { $gte: start, $lte: end }
            }).populate('debit_ledger credit_ledger', 'name')
        ]);

        const transactions = [
            ...bills.map(b => ({ time: b.createdAt || b.delivery_date, type: 'SALE', ref: b.bill_number, desc: `Sales Bill - ${b.customer_name || 'Walk-in Customer'}`, amount: b.grand_total, side: 'IN' })),
            ...purchases.map(p => ({ time: p.purchase_date || p.invoice_date || p.createdAt, type: 'PURCHASE', ref: p.invoice_number || 'PURCHASE', desc: `Purchase from ${p.supplier_id?.name || 'Supplier'}`, amount: p.grand_total, side: 'OUT' })),
            ...vouchers.map(v => ({ time: v.date, type: v.voucher_type, ref: v.voucher_number, desc: `${v.debit_ledger?.name || 'Debit'} / ${v.credit_ledger?.name || 'Credit'}`, amount: v.amount, side: v.voucher_type === 'RECEIPT' ? 'IN' : (v.voucher_type === 'PAYMENT' ? 'OUT' : 'TRANS') }))
        ].sort((a, b) => new Date(a.time) - new Date(b.time));

        res.status(200).json({ success: true, data: transactions });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Ledger Statement (Synced with AccountTransaction double-entry records)
exports.getLedgerStatement = async (req, res) => {
    try {
        const { ledgerId, startDate, endDate } = req.query;
        if (!ledgerId) return res.status(400).json({ success: false, error: 'Ledger ID required' });

        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const coId = req.user.restaurant_id;
        const ledger = await Ledger.findById(ledgerId);
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });

        const AccountTransaction = require('../models/AccountTransaction');
        let accTxns = await AccountTransaction.find({
            company_id: coId,
            ledger_id: ledgerId,
            date: { $gte: start, $lte: end },
            is_deleted: { $ne: true }
        }).sort({ date: 1, createdAt: 1 });

        let runningBalance = ledger.opening_balance || 0;
        let statement = [];

        if (accTxns && accTxns.length > 0) {
            statement = accTxns.map(t => {
                const dr = t.type === 'DEBIT' ? t.amount : 0;
                const cr = t.type === 'CREDIT' ? t.amount : 0;
                runningBalance += (dr - cr);
                return {
                    date: t.date,
                    voucher_no: t.voucher_number,
                    type: t.voucher_type,
                    particulars: t.narration || `${t.voucher_type} - ${t.voucher_number}`,
                    debit: dr,
                    credit: cr,
                    balance: runningBalance
                };
            });
        } else {
            // Fallback to Voucher query if no AccountTransactions exist
            const Voucher = require('../models/Voucher');
            const vTxns = await Voucher.find({
                company_id: coId,
                $or: [{ debit_ledger: ledgerId }, { credit_ledger: ledgerId }],
                date: { $gte: start, $lte: end },
                is_deleted: { $ne: true }
            }).populate('debit_ledger credit_ledger', 'name').sort({ date: 1 });

            statement = vTxns.map(t => {
                const isDebit = t.debit_ledger?._id?.toString() === ledgerId || t.debit_ledger === ledgerId;
                const dr = isDebit ? t.amount : 0;
                const cr = isDebit ? 0 : t.amount;
                runningBalance += (dr - cr);
                return {
                    date: t.date,
                    voucher_no: t.voucher_number,
                    type: t.voucher_type,
                    particulars: isDebit ? `To ${t.credit_ledger?.name || 'Credit Account'}` : `By ${t.debit_ledger?.name || 'Debit Account'}`,
                    debit: dr,
                    credit: cr,
                    balance: runningBalance
                };
            });
        }

        res.status(200).json({
            success: true,
            ledger: ledger.name,
            opening_balance: ledger.opening_balance || 0,
            data: statement
        });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Aging Report (live DB synced)
exports.getAgingReport = async (req, res) => {
    try {
        const { type = 'SUPPLIER', startDate, endDate } = req.query;
        const now = new Date();

        let dateFilter = {};
        if (startDate && endDate) {
            let start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            let end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: start, $lte: end } };
        }

        const itemsList = [];

        if (type === 'SUPPLIER') {
            const Purchase = require('../models/Purchase');
            let query = { company_id: req.user.restaurant_id, ...dateFilter };
            if (dateFilter.createdAt) {
                query.purchase_date = dateFilter.createdAt;
                delete query.createdAt;
            }
            const purchases = await Purchase.find(query).populate('supplier_id', 'name contact_number phone contact_person');

            purchases.forEach((p, idx) => {
                const pDate = new Date(p.purchase_date || p.createdAt || now);
                const diffDays = Math.max(0, Math.floor((now - pDate) / (1000 * 60 * 60 * 24)));
                const pendingAmt = p.due_amount !== undefined ? p.due_amount : ((p.grand_total || 0) - (p.paid_amount || 0));

                const entityName = p.supplier_id?.name || p.supplier_name || 'Supplier';
                const cell = p.supplier_id?.contact_number || p.supplier_id?.phone || p.supplier_id?.contact_person || '-';
                const billNo = p.invoice_number || `BIL-100${idx + 1}`;

                if (pendingAmt > 0) {
                    const days_1_15 = diffDays <= 15 ? pendingAmt : 0;
                    const days_16_30 = (diffDays > 15 && diffDays <= 30) ? pendingAmt : 0;
                    const days_31_60 = (diffDays > 30 && diffDays <= 60) ? pendingAmt : 0;
                    const above_60 = diffDays > 60 ? pendingAmt : 0;

                    itemsList.push({
                        id: p._id,
                        name: entityName,
                        cell: cell,
                        bill_number: billNo,
                        date: pDate.toLocaleDateString('en-GB'),
                        total_days: diffDays,
                        pending_amount: pendingAmt,
                        days_1_15,
                        days_16_30,
                        days_31_60,
                        above_60
                    });
                }
            });
        } else {
            // Customers
            let query = { company_id: req.user.restaurant_id, ...dateFilter };
            const bills = await Bill.find(query).populate('customer_id', 'name phone');

            bills.forEach((b, idx) => {
                const bDate = new Date(b.createdAt || now);
                const diffDays = Math.max(0, Math.floor((now - bDate) / (1000 * 60 * 60 * 24)));
                const pendingAmt = b.status === 'PAID' ? 0 : (b.due_amount !== undefined ? b.due_amount : ((b.grand_total || 0) - (b.paid_amount || 0)));

                const entityName = b.customer_id?.name || b.customer_name || 'Walk-in Customer';
                const cell = b.customer_phone || b.customer_id?.phone || '-';
                const billNo = b.bill_number || `INV-100${idx + 1}`;

                if (pendingAmt > 0) {
                    const days_1_15 = diffDays <= 15 ? pendingAmt : 0;
                    const days_16_30 = (diffDays > 15 && diffDays <= 30) ? pendingAmt : 0;
                    const days_31_60 = (diffDays > 30 && diffDays <= 60) ? pendingAmt : 0;
                    const above_60 = diffDays > 60 ? pendingAmt : 0;

                    itemsList.push({
                        id: b._id,
                        name: entityName,
                        cell: cell,
                        bill_number: billNo,
                        date: bDate.toLocaleDateString('en-GB'),
                        total_days: diffDays,
                        pending_amount: pendingAmt,
                        days_1_15,
                        days_16_30,
                        days_31_60,
                        above_60
                    });
                }
            });
        }

        res.status(200).json({ success: true, data: itemsList });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Account Balances (Cash/Bank)
// @route   GET /api/reports/account-balances
// @access  Private (Admin, Owner)
exports.getAccountBalances = async (req, res) => {
    try {
        const { type } = req.query; // 'CASH' or 'BANK'

        const filter = { company_id: req.user.restaurant_id };
        if (type === 'CASH') filter.group = 'Cash-in-Hand';
        else if (type === 'BANK') filter.group = 'Bank Accounts';
        else return res.status(400).json({ success: false, error: 'Valid type (CASH or BANK) required' });

        const ledgers = await Ledger.find(filter);

        const balances = ledgers.map(l => ({
            id: l._id,
            name: l.name,
            opening_balance: l.opening_balance || 0,
            current_balance: l.opening_balance // Future enhancement: compute real-time balance from vouchers
        })).sort((a, b) => b.current_balance - a.current_balance);

        const totalBalance = balances.reduce((sum, b) => sum + b.current_balance, 0);

        res.status(200).json({ success: true, data: balances, totalBalance });
    } catch (error) {
        console.error('Account Balances Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Profit & Loss Report
exports.getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const company_id = req.user.restaurant_id;

        const [bills, purchases, expenseVouchers] = await Promise.all([
            Bill.find({ company_id, status: 'PAID', createdAt: { $gte: start, $lte: end } }),
            Purchase.find({ company_id, purchase_date: { $gte: start, $lte: end } }),
            require('../models/Voucher').find({ company_id, voucher_type: 'PAYMENT', date: { $gte: start, $lte: end } }).populate({ path: 'debit_ledger', match: { group: { $in: ['Direct Expenses', 'Indirect Expenses'] } } })
        ]);

        const totalSales = bills.reduce((sum, b) => sum + b.grand_total, 0);
        const totalPurchases = purchases.reduce((sum, p) => sum + p.grand_total, 0);

        // Only count vouchers where the debit ledger is an EXPENSE
        const indirectExpenses = expenseVouchers.filter(v => v.debit_ledger).reduce((sum, v) => sum + v.amount, 0);

        const grossProfit = totalSales - totalPurchases;
        const netProfit = grossProfit - indirectExpenses;

        res.status(200).json({
            success: true,
            data: {
                income: { sales: totalSales, total: totalSales },
                direct_expenses: { purchases: totalPurchases, total: totalPurchases },
                indirect_expenses: { expenses: indirectExpenses, total: indirectExpenses },
                gross_profit: grossProfit,
                net_profit: netProfit
            }
        });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get month-wise sales report
// @route   GET /api/reports/month-wise?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getMonthWiseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to current year
            const today = new Date();
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Group by Month
        const months = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        let currentDate = new Date(start);
        currentDate.setDate(1);

        while (currentDate <= end) {
            const year = currentDate.getFullYear();
            const monthIdx = currentDate.getMonth();
            const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
            const monthLabel = `${monthNames[monthIdx]} ${year}`;

            if (!months[monthKey]) {
                months[monthKey] = {
                    month: monthLabel,
                    monthKey: monthKey,
                    totalSales: 0,
                    billCount: 0
                };
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        bills.forEach(bill => {
            const d = new Date(bill.createdAt);
            const year = d.getFullYear();
            const monthIdx = d.getMonth();
            const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

            if (months[monthKey]) {
                months[monthKey].totalSales += bill.grand_total;
                months[monthKey].billCount += 1;
            }
        });

        const sortedMonths = Object.values(months).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

        res.status(200).json({
            success: true,
            data: {
                period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
                totalSales: bills.reduce((sum, bill) => sum + bill.grand_total, 0),
                totalBills: bills.length,
                monthlyBreakdown: sortedMonths
            }
        });
    } catch (error) {
        console.error('Month-wise report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get day-wise purchase report
// @route   GET /api/reports/purchase/day-wise?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getDayWisePurchaseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start = new Date();
        start.setDate(start.getDate() - 30);
        let end = new Date();

        if (startDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        } else {
            start.setHours(0, 0, 0, 0);
        }

        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            end.setHours(23, 59, 59, 999);
        }

        const purchases = await Purchase.find({
            company_id: req.user.restaurant_id,
            purchase_date: { $gte: start, $lte: end }
        }).sort({ purchase_date: 1 });

        // Group by day
        const dailyPurchases = {};
        const currentDate = new Date(start);

        // Initialize all dates in range
        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyPurchases[dateKey] = {
                date: dateKey,
                totalPurchases: 0,
                billCount: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate with actual data
        purchases.forEach(p => {
            const dateKey = p.purchase_date.toISOString().split('T')[0];
            if (dailyPurchases[dateKey]) {
                dailyPurchases[dateKey].totalPurchases += p.grand_total;
                dailyPurchases[dateKey].billCount += 1;
            }
        });

        const purchaseData = Object.values(dailyPurchases);
        const totalAmount = purchaseData.reduce((sum, day) => sum + day.totalPurchases, 0);
        const totalDocs = purchaseData.reduce((sum, day) => sum + day.billCount, 0);

        res.status(200).json({
            success: true,
            data: {
                period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
                totalAmount,
                totalDocs,
                dailyBreakdown: purchaseData
            }
        });
    } catch (error) {
        console.error('Day-wise purchase report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Get sales profit report
// @route   GET /api/reports/sales-profit?startDate=...&endDate=...&groupBy=...
exports.getSalesProfitReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'BILL' } = req.query;
        const hotelId = req.user.restaurant_id;

        let start = new Date(startDate || new Date().toISOString().split('T')[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date().toISOString().split('T')[0]);
        end.setHours(23, 59, 59, 999);

        // 1. Fetch Summary Data (Total Sales and Returns)
        const summaryMatch = {
            company_id: hotelId?._id || hotelId,
            createdAt: { $gte: start, $lte: end }
        };

        const summaryData = await Bill.aggregate([
            { $match: summaryMatch },
            { $group: {
                _id: null,
                totalSales: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$grand_total", 0] } },
                totalReturns: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, "$grand_total", 0] } }
            }}
        ]);

        const summary = summaryData[0] || { totalSales: 0, totalReturns: 0 };

        // 2. Fetch Detailed Data Joined with Products
        const pipeline = [
            { $match: { 
                company_id: hotelId?._id || hotelId,
                status: 'PAID',
                createdAt: { $gte: start, $lte: end }
            }},
            { $unwind: "$items" },
            { $lookup: {
                from: 'products',
                localField: 'items.product_id',
                foreignField: '_id',
                as: 'product'
            }},
            { $unwind: "$product" },
            { $project: {
                bill_number: "$bill_number",
                date: "$createdAt",
                party_name: { $ifNull: ["$customer_name", "Walk-in"] },
                item_name: "$items.name",
                category: "$product.category",
                brand: { $ifNull: ["$product.brand", "No Brand"] },
                bill_amount: "$items.total_price",
                qty: "$items.quantity",
                pur_rate: "$product.purchase_price",
                cost_rate: "$product.cost_price",
                sales_rate: "$items.unit_price",
                mrp: "$product.mrp",
                cost_amount: { $multiply: ["$product.cost_price", "$items.quantity"] }
            }}
        ];

        let results = await Bill.aggregate(pipeline);

        // 3. Process Grouping
        let groupedResults = [];
        if (groupBy === 'BILL') {
            const billMap = new Map();
            results.forEach(r => {
                if (!billMap.has(r.bill_number)) {
                    billMap.set(r.bill_number, {
                        transaction_no: r.bill_number,
                        date: r.date,
                        party_name: r.party_name,
                        item_name: "Multi-Items",
                        category: "---",
                        brand: "---",
                        bill_amount: 0,
                        pur_rate: 0,
                        cost_rate: 0,
                        sales_rate: 0,
                        mrp: 0,
                        profit_amt: 0
                    });
                }
                const b = billMap.get(r.bill_number);
                b.bill_amount += r.bill_amount;
                b.profit_amt += (r.bill_amount - r.cost_amount);
            });
            groupedResults = Array.from(billMap.values());
        } else if (groupBy === 'ITEM') {
            const itemMap = new Map();
            results.forEach(r => {
                if (!itemMap.has(r.item_name)) {
                    itemMap.set(r.item_name, {
                        transaction_no: "---",
                        date: "---",
                        party_name: "---",
                        item_name: r.item_name,
                        category: r.category,
                        brand: r.brand,
                        bill_amount: 0,
                        pur_rate: r.pur_rate,
                        cost_rate: r.cost_rate,
                        sales_rate: r.sales_rate,
                        mrp: r.mrp,
                        profit_amt: 0
                    });
                }
                const i = itemMap.get(r.item_name);
                i.bill_amount += r.bill_amount;
                i.profit_amt += (r.bill_amount - r.cost_amount);
            });
            groupedResults = Array.from(itemMap.values());
        } else if (groupBy === 'CATEGORY') {
            const catMap = new Map();
            results.forEach(r => {
                const key = r.category || 'Uncategorized';
                if (!catMap.has(key)) {
                    catMap.set(key, {
                        transaction_no: "---",
                        date: "---",
                        party_name: "---",
                        item_name: "Category Summary",
                        category: key,
                        brand: "---",
                        bill_amount: 0,
                        pur_rate: 0,
                        cost_rate: 0,
                        sales_rate: 0,
                        mrp: 0,
                        profit_amt: 0
                    });
                }
                const c = catMap.get(key);
                c.bill_amount += r.bill_amount;
                c.profit_amt += (r.bill_amount - r.cost_amount);
            });
            groupedResults = Array.from(catMap.values());
        } else if (groupBy === 'BRAND') {
            const brandMap = new Map();
            results.forEach(r => {
                const key = r.brand || 'No Brand';
                if (!brandMap.has(key)) {
                    brandMap.set(key, {
                        transaction_no: "---",
                        date: "---",
                        party_name: "---",
                        item_name: "Brand Summary",
                        category: "---",
                        brand: key,
                        bill_amount: 0,
                        pur_rate: 0,
                        cost_rate: 0,
                        sales_rate: 0,
                        mrp: 0,
                        profit_amt: 0
                    });
                }
                const b = brandMap.get(key);
                b.bill_amount += r.bill_amount;
                b.profit_amt += (r.bill_amount - r.cost_amount);
            });
            groupedResults = Array.from(brandMap.values());
        }

        // Add percentages
        groupedResults.forEach(g => {
            g.profit_pct = g.bill_amount === 0 ? 0 : ((g.profit_amt / g.bill_amount) * 100).toFixed(2);
        });

        // Calculate Net Profit for summary (Sales - Returns? or just Sales Profit)
        // Usually Net Sales Profit = Sum(Profits of Paid Bills)
        const netSalesProfit = groupedResults.reduce((sum, g) => sum + g.profit_amt, 0);

        res.status(200).json({
            success: true,
            summary: {
                totalSales: summary.totalSales,
                return: summary.totalReturns,
                salesProfit: netSalesProfit
            },
            data: groupedResults
        });

    } catch (error) {
        console.error('Sales Profit Report Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get comprehensive sales register
// @route   GET /api/reports/sales-register?startDate=...&endDate=...&search=...&status=...&paymentMode=...
exports.getSalesRegister = async (req, res) => {
    try {
        const { startDate, endDate, search, status, paymentMode, orderType } = req.query;
        const hotelId = req.user.restaurant_id;

        let start = new Date(startDate || new Date().toISOString().split('T')[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date().toISOString().split('T')[0]);
        end.setHours(23, 59, 59, 999);

        const match = {
            company_id: hotelId?._id || hotelId,
            createdAt: { $gte: start, $lte: end }
        };

        if (status) match.status = status;
        if (paymentMode) match.payment_mode = paymentMode;
        if (orderType) match.type = orderType;
        if (search) {
            match.$or = [
                { bill_number: { $regex: search, $options: 'i' } },
                { customer_name: { $regex: search, $options: 'i' } },
                { table_no: { $regex: search, $options: 'i' } }
            ];
        }

        const bills = await Bill.find(match).sort({ createdAt: -1 }).lean();

        // Calculate Analytics
        let summary = {
            totalGross: 0,
            totalTax: 0,
            totalDiscount: 0,
            totalRoundOff: 0,
            totalNet: 0,
            billCount: 0,
            itemCount: 0,
            cancelledCount: 0,
            cancelledAmount: 0,
            paymentSummary: { CASH: 0, UPI: 0, CARD: 0, ONLINE: 0, DUE: 0 }
        };

        bills.forEach(b => {
            if (b.status === 'CANCELLED') {
                summary.cancelledCount++;
                summary.cancelledAmount += b.grand_total;
                return;
            }

            summary.billCount++;
            summary.totalGross += (b.sub_total || 0);
            summary.totalTax += (b.tax_amount || 0);
            summary.totalDiscount += (b.discount_amount || 0);
            summary.totalRoundOff += (b.round_off || 0);
            summary.totalNet += (b.grand_total || 0);
            summary.itemCount += (b.items?.reduce((s, i) => s + i.quantity, 0) || 0);

            // Payment tracking
            if (b.payment_modes && b.payment_modes.length > 0) {
                b.payment_modes.forEach(pm => {
                    if (summary.paymentSummary[pm.type] !== undefined) {
                        summary.paymentSummary[pm.type] += pm.amount;
                    } else {
                        summary.paymentSummary[pm.type] = pm.amount;
                    }
                });
            } else if (b.payment_mode) {
                if (summary.paymentSummary[b.payment_mode] !== undefined) {
                    summary.paymentSummary[b.payment_mode] += b.grand_total;
                }
            } else if (b.status === 'DUE' || b.status === 'CREDIT') {
                if (!summary.paymentSummary.DUE) summary.paymentSummary.DUE = 0;
                summary.paymentSummary.DUE += b.grand_total;
            }
        });

        res.status(200).json({
            success: true,
            summary,
            data: bills.map(b => ({
                ...b,
                item_names: b.items?.map(i => i.name).join(', '),
                item_qty: b.items?.reduce((s, i) => s + i.quantity, 0) || 0
            }))
        });

    } catch (error) {
        console.error('Sales Register Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Detailed Item-wise Sales Summary (Stock Wise)
// @route   GET /api/reports/sales/item-detailed?startDate=...&endDate=...&search=...
exports.getItemWiseSalesDetailed = async (req, res) => {
    try {
        const { startDate, endDate, search, category, brand } = req.query;
        const hotelId = req.user.restaurant_id;

        let start = new Date(startDate || new Date().toISOString().split('T')[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date().toISOString().split('T')[0]);
        end.setHours(23, 59, 59, 999);

        const match = {
            company_id: hotelId?._id || hotelId,
            createdAt: { $gte: start, $lte: end }
        };

        const bills = await Bill.find(match).lean();

        let itemMap = new Map();

        bills.forEach(bill => {
            const isReturn = bill.status === 'CANCELLED';
            
            bill.items.forEach(item => {
                const productId = item.product_id.toString();
                if (!itemMap.has(productId)) {
                    itemMap.set(productId, {
                        productId: item.product_id,
                        name: item.name,
                        category: item.category || 'N/A',
                        brand: item.brand || 'N/A',
                        salesQty: 0,
                        salesValue: 0,
                        returnQty: 0,
                        returnValue: 0
                    });
                }
                
                const stats = itemMap.get(productId);
                if (isReturn) {
                    stats.returnQty += item.quantity;
                    stats.returnValue += item.total_price;
                } else {
                    stats.salesQty += (item.quantity || 0);
                    stats.salesValue += (item.total_price || 0);
                }
            });
        });

        const productIds = Array.from(itemMap.keys()).map(id => (typeof id === 'string' && id.length === 24) ? new mongoose.Types.ObjectId(id) : id);
        const products = await Product.find({ _id: { $in: productIds } }).select('code barcode category brand').lean();
        const productMeta = new Map(products.map(p => [p._id.toString(), p]));

        let finalData = Array.from(itemMap.values()).map(item => {
            const meta = productMeta.get(item.productId.toString()) || {};
            return {
                ...item,
                code: meta.code || '---',
                barcode: meta.barcode || '---',
                category: meta.category || item.category,
                brand: meta.brand || item.brand,
                netQty: (item.salesQty || 0) - (item.returnQty || 0),
                netValue: (item.salesValue || 0) - (item.returnValue || 0)
            };
        });

        if (search) {
            const s = search.toLowerCase();
            finalData = finalData.filter(d => 
                d.name.toLowerCase().includes(s) || 
                d.code.toLowerCase().includes(s) || 
                d.barcode.toLowerCase().includes(s)
            );
        }
        if (category) finalData = finalData.filter(d => d.category === category);
        if (brand) finalData = finalData.filter(d => d.brand === brand);

        const summary = finalData.reduce((acc, d) => {
            acc.totalItems++;
            acc.totalSalesQty += d.salesQty;
            acc.totalReturnQty += d.returnQty;
            acc.totalNetQty += d.netQty;
            acc.totalSalesValue += d.salesValue;
            return acc;
        }, { totalItems: 0, totalSalesQty: 0, totalReturnQty: 0, totalNetQty: 0, totalSalesValue: 0 });

        res.status(200).json({
            success: true,
            summary: {
                totalItems: summary.totalItems,
                salesQty: summary.totalSalesQty,
                returnQty: summary.totalReturnQty,
                totalSalesQty: summary.totalNetQty,
                salesValue: summary.totalSalesValue
            },
            data: finalData
        });

    } catch (error) {
        console.error('Item Wise Sales Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Detailed Sales Transaction Summary (Day/Month/Party)
// @route   GET /api/reports/sales/transaction-summary?startDate=...&endDate=...&search=...&payMode=...&partyId=...&area=...
exports.getSalesTransactionSummary = async (req, res) => {
    try {
        const { startDate, endDate, search, payMode, partyId, area } = req.query;
        const hotelId = req.user.restaurant_id;

        let start = new Date(startDate || new Date().toISOString().split('T')[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date().toISOString().split('T')[0]);
        end.setHours(23, 59, 59, 999);

        const match = {
            company_id: hotelId?._id || hotelId,
            createdAt: { $gte: start, $lte: end }
        };

        if (search) {
            match.$or = [
                { bill_number: { $regex: search, $options: 'i' } },
                { customer_name: { $regex: search, $options: 'i' } }
            ];
        }

        const bills = await Bill.find(match).sort({ createdAt: -1 }).lean();

        // Calculate Flattened Transaction Data
        let totalStats = {
            totalBills: 0,
            cash: 0,
            card: 0,
            upi: 0,
            credit: 0
        };

        let data = bills.map(b => {
            let row = {
                _id: b._id,
                date: b.createdAt,
                transaction_no: b.bill_number,
                party_name: b.customer_name || 'Walk-in Guest',
                area: b.customer_address || 'Counter', // Area field from address
                cash: 0,
                card: 0,
                upi: 0,
                credit_amt: 0,
                total: b.grand_total,
                status: b.status
            };

            // Spread payment modes
            if (b.payment_modes && b.payment_modes.length > 0) {
                b.payment_modes.forEach(pm => {
                    if (pm.type === 'CASH') row.cash += pm.amount;
                    else if (pm.type === 'CARD') row.card += pm.amount;
                    else if (pm.type === 'UPI' || pm.type === 'ONLINE') row.upi += pm.amount;
                });
                
                // If bill total is more than paid amount, remainder is Credit (DUE)
                const totalPaid = b.payment_modes.reduce((s, pm) => s + pm.amount, 0);
                if (b.status !== 'CANCELLED' && b.grand_total > totalPaid + 0.1) {
                    row.credit_amt = b.grand_total - totalPaid;
                }
            } else {
                // Legacy or single mode
                if (b.payment_mode === 'CASH') row.cash = b.grand_total;
                else if (b.payment_mode === 'CARD') row.card = b.grand_total;
                else if (b.payment_mode === 'UPI' || b.payment_mode === 'ONLINE') row.upi = b.grand_total;
                else if (b.status === 'DUE' || b.status === 'CREDIT' || b.status === 'PARTIAL') {
                    row.credit_amt = b.grand_total;
                }
            }

            if (b.status !== 'CANCELLED') {
                totalStats.totalBills++;
                totalStats.cash += row.cash;
                totalStats.card += row.card;
                totalStats.upi += row.upi;
                totalStats.credit += row.credit_amt;
            }

            return row;
        });

        // Apply filters
        if (payMode) {
            data = data.filter(d => {
                if (payMode === 'CASH') return d.cash > 0;
                if (payMode === 'CARD') return d.card > 0;
                if (payMode === 'UPI') return d.upi > 0;
                if (payMode === 'CREDIT') return d.credit_amt > 0;
                return true;
            });
        }
        if (partyId) {
            const p = partyId.toLowerCase();
            data = data.filter(d => d.party_name.toLowerCase().includes(p));
        }
        if (area) {
            const a = area.toLowerCase();
            data = data.filter(d => d.area.toLowerCase().includes(a));
        }

        res.status(200).json({
            success: true,
            summary: totalStats,
            data
        });

    } catch (error) {
        console.error('Sales Transaction Summary Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Accounts Daybook Report
// @route   GET /api/reports/accounts/daybook?startDate=...&endDate=...&search=...
exports.getDaybookReport = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        const hotelId = req.user.restaurant_id;

        const AccountTransaction = require('../models/AccountTransaction');
        const Ledger = require('../models/Ledger');

        let start = new Date(startDate || new Date().toISOString().split('T')[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date().toISOString().split('T')[0]);
        end.setHours(23, 59, 59, 999);

        const LedgerGroup = require('../models/LedgerGroup');
        const groups = await LedgerGroup.find({ company_id: hotelId }).lean();
        const getSubgroups = (targetGroups) => {
            let result = new Set(targetGroups);
            let added = true;
            while(added) {
                added = false;
                groups.forEach(g => {
                    if (result.has(g.parent) && !result.has(g.name)) {
                        result.add(g.name);
                        added = true;
                    }
                });
            }
            return Array.from(result);
        };
        const cashBankGroups = getSubgroups(['Cash-in-Hand', 'Cash in Hand', 'Bank Accounts', 'Bank OD A/c']);
        const sundryGroups = getSubgroups(['Sundry Debtors', 'Sundry Creditors', 'Customers', 'Suppliers']);


        // Fetch transactions
        const txs = await AccountTransaction.find({
            company_id: hotelId,
            date: { $gte: start, $lte: end },
            is_deleted: { $ne: true }
        }).populate('ledger_id', 'name group').sort({ date: 1, createdAt: 1 }).lean();

        // Group by Voucher Number to get "Journal" lines
        const grouped = {};
        txs.forEach(t => {
            const key = `${t.voucher_type}-${t.voucher_number}`;
            if (!grouped[key]) {
                grouped[key] = {
                    date: t.date,
                    voucher_no: t.voucher_number,
                    type: t.voucher_type,
                    party: '',
                    payment_in: 0,
                    payment_out: 0,
                    credit_amt: 0,
                    narration: t.narration || '',
                    ledgers: []
                };
            }
            grouped[key].ledgers.push(t);
        });

        const daybookData = Object.values(grouped).map(g => {
            let partySet = false;
            
            g.ledgers.forEach(l => {
                const group = l.ledger_id?.group || '';
                const name = l.ledger_id?.name || '';

                // PAYMENT IN: Debit to Cash/Bank
                const isCashBank = cashBankGroups.includes(group) || group.includes('Cash') || group.includes('Bank');
                const isSundry = sundryGroups.includes(group) || group.includes('Sundry') || group.includes('Customer') || group.includes('Supplier');

                if (l.type === 'DEBIT' && isCashBank) {
                    g.payment_in += l.amount;
                }
                // PAYMENT OUT: Credit to Cash/Bank
                else if (l.type === 'CREDIT' && isCashBank) {
                    g.payment_out += l.amount;
                }
                // CREDIT AMT: If it's a SALES/PURCHASE and involves a Customer/Supplier ledger
                else if ((g.type === 'SALES' || g.type === 'PURCHASE') && isSundry) {
                    g.credit_amt += l.amount;
                    if (!partySet) { g.party = name; partySet = true; }
                }

                // If party not set yet, pick a non-cash/bank ledger as party
                if (!partySet && !isCashBank) {
                    g.party = name;
                    partySet = true;
                }
            });

            if (!g.party) g.party = 'Cash Transaction';
            return g;
        });

        // Summary Calculations
        const summary = {
            totalTransactions: daybookData.length,
            paymentIn: daybookData.reduce((s, d) => s + d.payment_in, 0),
            paymentOut: daybookData.reduce((s, d) => s + d.payment_out, 0),
            totalCash: 0, // Current cash balance
            totalCredit: daybookData.reduce((s, d) => s + d.credit_amt, 0)
        };

        // Get current Cash in Hand balance
        const cashLedger = await Ledger.findOne({ company_id: hotelId, name: 'Cash in Hand' });
        if (cashLedger) summary.totalCash = cashLedger.opening_balance;

        res.status(200).json({
            success: true,
            summary,
            data: daybookData
        });

    } catch (error) {
        console.error('Daybook Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Detailed Ledger Statement
// @route   GET /api/reports/accounts/ledger-statement?ledgerId=...&startDate=...&endDate=...
exports.getLedgerStatement = async (req, res) => {
    try {
        const { ledgerId, startDate, endDate } = req.query;
        if (!ledgerId) return res.status(200).json({ success: true, data: [], summary: { openingBalance: 0, totalSales: 0, totalReceived: 0, currentReceivable: 0 } });

        const hotelId = req.user.restaurant_id;
        const AccountTransaction = require('../models/AccountTransaction');
        const Ledger = require('../models/Ledger');

        const ledger = await Ledger.findOne({ _id: ledgerId, company_id: hotelId });
        if (!ledger) return res.status(404).json({ success: false, message: 'Ledger not found' });

        let start = new Date(startDate || new Date().toISOString().split('T')[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date().toISOString().split('T')[0]);
        end.setHours(23, 59, 59, 999);

        // 1. Calculate Opening Balance before Start Date
        let openingBalance = ledger.initial_opening_balance || 0; 
        
        const prevTxs = await AccountTransaction.aggregate([
            { $match: { 
                company_id: hotelId?._id || hotelId, 
                ledger_id: (typeof ledgerId === 'string' && ledgerId.length === 24) ? new mongoose.Types.ObjectId(ledgerId) : ledgerId,
                date: { $lt: start },
                is_deleted: { $ne: true }
            }},
            { $group: {
                _id: null,
                netAmount: { $sum: { $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', { $subtract: [0, '$amount'] }] } }
            }}
        ]);

        if (prevTxs.length > 0) openingBalance += prevTxs[0].netAmount;

        // 2. Fetch Transactions within range
        const txs = await AccountTransaction.find({
            company_id: hotelId,
            ledger_id: ledgerId,
            date: { $gte: start, $lte: end },
            is_deleted: { $ne: true }
        }).sort({ date: 1, createdAt: 1 }).lean();

        let runningBalance = openingBalance;
        let totalSales = 0;
        let totalReceived = 0;

        const statementData = txs.map(t => {
            const row = {
                _id: t._id,
                date: t.date,
                voucher_no: t.voucher_number,
                type: t.voucher_type,
                debit: t.type === 'DEBIT' ? t.amount : 0,
                credit: t.type === 'CREDIT' ? t.amount : 0,
                narration: t.narration
            };

            if (t.type === 'DEBIT') {
                runningBalance += t.amount;
                if (t.voucher_type === 'SALES') totalSales += t.amount;
            } else {
                runningBalance -= t.amount;
                if (t.voucher_type === 'RECEIPT') totalReceived += t.amount;
            }

            row.balance = runningBalance;
            return row;
        });

        res.status(200).json({
            success: true,
            ledger: {
                name: ledger.name,
                group: ledger.group
            },
            summary: {
                openingBalance,
                totalSales,
                totalReceived,
                currentReceivable: runningBalance
            },
            data: statementData
        });

    } catch (error) {
        console.error('Ledger Statement Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Cash & Bank Audit Report
// @route   GET /api/reports/accounts/cash-bank?startDate=...&endDate=...
exports.getCashBankReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const hotelId = req.user.restaurant_id;

        const AccountTransaction = require('../models/AccountTransaction');
        const Ledger = require('../models/Ledger');

        let start = new Date(startDate || new Date().toISOString().split('T')[0]);
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date().toISOString().split('T')[0]);
        end.setHours(23, 59, 59, 999);

        // 1. Identify all Cash and Bank Ledgers
        const LedgerGroup = require('../models/LedgerGroup');
        const groups = await LedgerGroup.find({ company_id: hotelId }).lean();
        const getSubgroups = (targetGroups) => {
            let result = new Set(targetGroups);
            let added = true;
            while(added) {
                added = false;
                groups.forEach(g => {
                    if (result.has(g.parent) && !result.has(g.name)) {
                        result.add(g.name);
                        added = true;
                    }
                });
            }
            return Array.from(result);
        };
        const cashGroups = getSubgroups(['Cash-in-Hand', 'Cash in Hand']);
        const bankGroups = getSubgroups(['Bank Accounts', 'Bank OD A/c']);
        
        const allLedgers = await Ledger.find({ company_id: hotelId }).lean();
        const cbLedgers = allLedgers.filter(l => 
            cashGroups.includes(l.group) || bankGroups.includes(l.group) ||
            l.group?.match(/Cash/i) || l.group?.match(/Bank/i) ||
            l.name?.match(/Cash/i) || l.name?.match(/Bank/i)
        );

        const cbIds = cbLedgers.map(l => l._id);
        const cashIds = cbLedgers.filter(l => cashGroups.includes(l.group) || l.group?.toLowerCase().includes('cash') || l.name?.toLowerCase().includes('cash')).map(l => l._id.toString());
        const bankIds = cbLedgers.filter(l => bankGroups.includes(l.group) || l.group?.toLowerCase().includes('bank') || l.name?.toLowerCase().includes('bank')).map(l => l._id.toString());

        // 2. Calculate Opening Balance before Start Date
        let openingCash = cbLedgers.filter(l => cashIds.includes(l._id.toString())).reduce((s, l) => s + (l.initial_opening_balance || 0), 0);
        let openingBank = cbLedgers.filter(l => bankIds.includes(l._id.toString())).reduce((s, l) => s + (l.initial_opening_balance || 0), 0);
        
        const prevTxs = await AccountTransaction.aggregate([
            { $match: { 
                company_id: hotelId?._id || hotelId, 
                ledger_id: { $in: cbIds },
                date: { $lt: start },
                is_deleted: { $ne: true }
            }},
            { $group: {
                _id: '$ledger_id',
                netAmount: { $sum: { $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', { $subtract: [0, '$amount'] }] } }
            }}
        ]);

        prevTxs.forEach(pt => {
            const pid = pt._id.toString();
            if (cashIds.includes(pid)) openingCash += pt.netAmount;
            else if (bankIds.includes(pid)) openingBank += pt.netAmount;
        });

        // 3. Fetch Transactions within range
        const txs = await AccountTransaction.find({
            company_id: hotelId,
            ledger_id: { $in: cbIds },
            date: { $gte: start, $lte: end },
            is_deleted: { $ne: true }
        }).populate('ledger_id', 'name group').sort({ date: 1, createdAt: 1 }).lean();

        // Group by Voucher
        const grouped = {};
        txs.forEach(t => {
            const key = `${t.voucher_type}-${t.voucher_number}`;
            if (!grouped[key]) {
                grouped[key] = {
                    date: t.date,
                    voucher_no: t.voucher_number,
                    type: t.voucher_type,
                    party: '',
                    received: 0,
                    paid: 0,
                    cash_impact: 0,
                    bank_impact: 0,
                    narration: t.narration,
                    ledgers: []
                };
            }
            grouped[key].ledgers.push(t);
        });

        let runningTotal = openingCash + openingBank;

        const statementData = Object.values(grouped).map(g => {
            g.ledgers.forEach(l => {
                const lid = l.ledger_id?._id?.toString() || l.ledger_id?.toString();
                const isCash = cashIds.includes(lid);
                
                if (l.type === 'DEBIT') {
                    g.received += l.amount;
                    if (isCash) g.cash_impact += l.amount;
                    else g.bank_impact += l.amount;
                    runningTotal += l.amount;
                } else {
                    g.paid += l.amount;
                    if (isCash) g.cash_impact -= l.amount;
                    else g.bank_impact -= l.amount;
                    runningTotal -= l.amount;
                }
            });

            g.balance = runningTotal;
            return g;
        });

        res.status(200).json({
            success: true,
            summary: {
                openingCash,
                openingBank,
                totalOpening: openingCash + openingBank,
                closingBalance: runningTotal,
                snapshots: cbLedgers.map(l => ({ name: l.name, balance: l.opening_balance }))
            },
            data: statementData
        });

    } catch (error) {
        console.error('Cash Bank Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get GSTR-1 Report data
// @route   GET /api/reports/gst/gstr1?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getGstr1Report = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Parse dates or use today as default
        let start = new Date();
        let end = new Date();

        if (startDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        } else {
            start.setHours(0, 0, 0, 0);
        }

        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            end.setHours(23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: { $in: ['PAID', 'CREDIT'] },
            is_deleted: false,
            createdAt: { $gte: start, $lte: end }
        }).populate('customer_id').populate('items.product_id').lean();

        const b2b = [];
        const b2cLarge = [];
        const b2cSmall = [];
        const hsnMap = {};

        bills.forEach(bill => {
            const customer = bill.customer_id;
            const hasGst = customer && customer.gst_number && customer.gst_number.trim() !== '';
            
            // Format dates
            const invDate = new Date(bill.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            }).replace(/\//g, '-');
            
            // Base values
            const invValue = bill.grand_total;
            const taxableValue = bill.sub_total - (bill.discount_amount || 0);
            
            // Default POS (State) to company state (assume Tamil Nadu for now as per mock, or derive from address)
            let pos = 'Tamil Nadu'; 
            if (customer && customer.address) {
                // simple heuristic
                if (customer.address.toLowerCase().includes('karnataka')) pos = 'Karnataka';
                else if (customer.address.toLowerCase().includes('maharashtra')) pos = 'Maharashtra';
                else if (customer.address.toLowerCase().includes('kerala')) pos = 'Kerala';
            }

            if (hasGst) {
                b2b.push({
                    gstin: customer.gst_number,
                    receiver: customer.name,
                    invNo: bill.bill_number,
                    invDate,
                    invValue,
                    pos,
                    revCharge: 'N',
                    appTaxRate: '18%', // Defaulting to 18% or derived from items
                    invType: 'Regular',
                    ecommGstin: '-',
                    rate: 18,
                    taxableValue,
                    cess: 0
                });
            } else {
                if (invValue > 250000) {
                    b2cLarge.push({
                        invNo: bill.bill_number,
                        invDate,
                        invValue,
                        pos,
                        appTaxRate: '18%',
                        taxableValue,
                        cess: 0,
                        ecommGstin: '-'
                    });
                } else {
                    b2cSmall.push({
                        type: pos === 'Tamil Nadu' ? 'Intra-State' : 'Inter-State', // simple logic
                        pos,
                        appTaxRate: '18%',
                        taxableValue,
                        cess: 0,
                        ecommGstin: '-'
                    });
                }
            }

            // HSN Aggregation
            if (bill.items && bill.items.length > 0) {
                bill.items.forEach(item => {
                    const product = item.product_id;
                    const hsn = product?.hsn_code || '00000000';
                    const taxRate = product?.gst_sales || 0;
                    
                    if (!hsnMap[hsn]) {
                        hsnMap[hsn] = {
                            hsn,
                            desc: product?.name || item.name,
                            uqc: product?.unit || 'NOS',
                            qty: 0,
                            val: 0,
                            rate: taxRate + '%',
                            taxVal: 0,
                            igst: 0,
                            cgst: 0,
                            sgst: 0,
                            cess: 0
                        };
                    }
                    
                    const itemTaxable = item.total_price;
                    const taxAmount = (itemTaxable * taxRate) / 100;
                    
                    hsnMap[hsn].qty += item.quantity;
                    hsnMap[hsn].taxVal += itemTaxable;
                    hsnMap[hsn].val += (itemTaxable + taxAmount);
                    
                    // Simple logic: if Tamil Nadu, split to CGST/SGST, else IGST
                    if (pos === 'Tamil Nadu') {
                        hsnMap[hsn].cgst += taxAmount / 2;
                        hsnMap[hsn].sgst += taxAmount / 2;
                    } else {
                        hsnMap[hsn].igst += taxAmount;
                    }
                });
            }
        });

        const hsn = Object.values(hsnMap);

        res.status(200).json({
            success: true,
            data: {
                b2b,
                b2cLarge,
                b2cSmall,
                hsn
            }
        });

    } catch (error) {
        console.error('GSTR1 report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Trial Balance
exports.getTrialBalance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const Ledger = require('../models/Ledger');
        const Voucher = require('../models/Voucher');

        // Fetch all ledgers
        const ledgers = await Ledger.find({ company_id: req.user.restaurant_id });

        // Fetch all vouchers up to end date (ignoring deleted/cancelled vouchers if applicable, wait, voucher doesn't have is_deleted by default but let's assume all valid)
        const vouchers = await Voucher.find({
            company_id: req.user.restaurant_id,
            date: { $lte: end }
        });

        const ledgerMap = {};
        ledgers.forEach(l => {
            ledgerMap[l._id.toString()] = {
                _id: l._id,
                name: l.name,
                group: l.group || 'Ungrouped',
                opDr: l.balance_type === 'DR' ? (l.opening_balance || 0) : 0,
                opCr: l.balance_type === 'CR' ? (l.opening_balance || 0) : 0,
                trxDr: 0,
                trxCr: 0,
                clDr: 0,
                clCr: 0
            };
        });

        vouchers.forEach(v => {
            const date = new Date(v.date);
            const amt = v.amount || 0;
            const isBeforeStart = date < start;
            
            // Debit Side
            if (v.debit_ledger && ledgerMap[v.debit_ledger.toString()]) {
                if (isBeforeStart) {
                    ledgerMap[v.debit_ledger.toString()].opDr += amt;
                } else {
                    ledgerMap[v.debit_ledger.toString()].trxDr += amt;
                }
            }

            // Credit Side
            if (v.credit_ledger && ledgerMap[v.credit_ledger.toString()]) {
                if (isBeforeStart) {
                    ledgerMap[v.credit_ledger.toString()].opCr += amt;
                } else {
                    ledgerMap[v.credit_ledger.toString()].trxCr += amt;
                }
            }
        });

        const groupMap = {};

        Object.values(ledgerMap).forEach(l => {
            // Net the Opening Balance
            const netOp = l.opDr - l.opCr;
            if (netOp > 0) { l.opDr = netOp; l.opCr = 0; }
            else if (netOp < 0) { l.opCr = Math.abs(netOp); l.opDr = 0; }
            else { l.opDr = 0; l.opCr = 0; }
            
            // Net the Closing Balance (Op + TrxDr - TrxCr)
            const netClosing = l.opDr - l.opCr + l.trxDr - l.trxCr;
            if (netClosing > 0) { l.clDr = netClosing; l.clCr = 0; }
            else if (netClosing < 0) { l.clCr = Math.abs(netClosing); l.clDr = 0; }
            else { l.clDr = 0; l.clCr = 0; }

            // Filter out ledgers with absolutely 0 balances and transactions
            if (l.opDr === 0 && l.opCr === 0 && l.trxDr === 0 && l.trxCr === 0 && l.clDr === 0 && l.clCr === 0) {
                return;
            }

            if (!groupMap[l.group]) {
                groupMap[l.group] = {
                    group: l.group,
                    opDr: 0, opCr: 0, trxDr: 0, trxCr: 0, clDr: 0, clCr: 0,
                    ledgers: []
                };
            }

            const g = groupMap[l.group];
            g.opDr += l.opDr;
            g.opCr += l.opCr;
            g.trxDr += l.trxDr;
            g.trxCr += l.trxCr;
            g.clDr += l.clDr;
            g.clCr += l.clCr;

            g.ledgers.push(l);
        });

        // Format and sort groups
        const groups = Object.values(groupMap).map(g => {
            // Net the group's Op and Cl balances just like ledgers
            const netOp = g.opDr - g.opCr;
            if (netOp > 0) { g.opDr = netOp; g.opCr = 0; }
            else if (netOp < 0) { g.opCr = Math.abs(netOp); g.opDr = 0; }
            else { g.opDr = 0; g.opCr = 0; }

            const netCl = g.clDr - g.clCr;
            if (netCl > 0) { g.clDr = netCl; g.clCr = 0; }
            else if (netCl < 0) { g.clCr = Math.abs(netCl); g.clDr = 0; }
            else { g.clDr = 0; g.clCr = 0; }

            g.ledgers.sort((a, b) => a.name.localeCompare(b.name));
            return g;
        });

        groups.sort((a, b) => a.group.localeCompare(b.group));

        res.status(200).json({ success: true, data: groups });

    } catch (error) {
        console.error('Trial Balance Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get aging report for Receivable (Customer) or Payable (Supplier)
// @route   GET /api/reports/aging-report?type=CUSTOMER|SUPPLIER
exports.getAgingReport = async (req, res) => {
    try {
        const companyId = req.user.restaurant_id;
        const { type = 'CUSTOMER', startDate, endDate } = req.query;
        const isSupplier = type.toUpperCase() === 'SUPPLIER';

        const today = new Date();

        if (isSupplier) {
            // Payable Aging Report (Purchases & Suppliers)
            const Purchase = require('../models/Purchase');
            const Supplier = require('../models/Supplier');

            const purchaseQuery = { company_id: companyId, is_deleted: { $ne: true } };
            if (startDate || endDate) {
                purchaseQuery.invoice_date = {};
                if (startDate) purchaseQuery.invoice_date.$gte = new Date(startDate + 'T00:00:00.000Z');
                if (endDate) purchaseQuery.invoice_date.$lte = new Date(endDate + 'T23:59:59.999Z');
            }

            const [purchases, suppliers] = await Promise.all([
                Purchase.find(purchaseQuery).populate('supplier_id').lean(),
                Supplier.find({ company_id: companyId }).lean()
            ]);

            const agingList = [];

            // Add Purchases with due balance
            purchases.forEach((p, idx) => {
                const grand = parseFloat(p.grand_total) || 0;
                const paid = parseFloat(p.paid_amount) || 0;
                const pending = p.due_amount !== undefined && p.due_amount > 0 ? parseFloat(p.due_amount) : Math.max(0, grand - paid);
                if (pending <= 0 || p.payment_status === 'PAID') return;

                const invDate = p.invoice_date || p.createdAt || today;
                const ageDays = Math.max(0, Math.floor((today - new Date(invDate)) / (1000 * 60 * 60 * 24)));

                agingList.push({
                    id: p._id,
                    name: p.supplier_id?.name || p.supplier_name || 'Supplier',
                    cell: p.supplier_id?.contact_number || p.supplier_id?.phone || '-',
                    bill_number: p.invoice_number || `INV-${1000 + idx}`,
                    date: new Date(invDate).toISOString().split('T')[0],
                    total_days: ageDays,
                    pending_amount: pending,
                    days_1_15: ageDays <= 15 ? pending : 0,
                    days_16_30: (ageDays > 15 && ageDays <= 30) ? pending : 0,
                    days_31_60: (ageDays > 30 && ageDays <= 60) ? pending : 0,
                    above_60: ageDays > 60 ? pending : 0
                });
            });

            // Add Suppliers with opening balance if no purchase entries yet
            suppliers.forEach((s) => {
                const pending = parseFloat(s.opening_balance) || 0;
                if (pending <= 0) return;
                const hasPurchases = agingList.some(item => item.name.trim().toLowerCase() === s.name.trim().toLowerCase());
                if (!hasPurchases) {
                    agingList.push({
                        id: s._id,
                        name: s.name,
                        cell: s.contact_number || s.phone || '-',
                        bill_number: 'OPENING-BAL',
                        date: new Date().toISOString().split('T')[0],
                        total_days: 0,
                        pending_amount: pending,
                        days_1_15: pending,
                        days_16_30: 0,
                        days_31_60: 0,
                        above_60: 0
                    });
                }
            });

            return res.status(200).json({ success: true, data: agingList });
        } else {
            // Receivable Aging Report (Sales Bills & Customers)
            const Bill = require('../models/Bill');
            const Customer = require('../models/Customer');

            const billQuery = { company_id: companyId, is_deleted: { $ne: true } };
            if (startDate || endDate) {
                billQuery.createdAt = {};
                if (startDate) billQuery.createdAt.$gte = new Date(startDate + 'T00:00:00.000Z');
                if (endDate) billQuery.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
            }

            const [bills, customers] = await Promise.all([
                Bill.find(billQuery).populate('customer_id').lean(),
                Customer.find({ company_id: companyId }).lean()
            ]);

            const agingList = [];

            bills.forEach((b, idx) => {
                const grand = parseFloat(b.grand_total) || 0;
                const paid = b.status === 'PAID' ? grand : (parseFloat(b.total_paid || b.paid_amount) || 0);
                const pending = Math.max(0, grand - paid);
                if (pending <= 0) return;

                const billDate = b.createdAt || today;
                const ageDays = Math.max(0, Math.floor((today - new Date(billDate)) / (1000 * 60 * 60 * 24)));

                agingList.push({
                    id: b._id,
                    name: b.customer_id?.name || b.customer_name || 'Walk-in Customer',
                    cell: b.customer_phone || b.customer_id?.phone || '-',
                    bill_number: b.bill_number || `INV-${1000 + idx}`,
                    date: new Date(billDate).toISOString().split('T')[0],
                    total_days: ageDays,
                    pending_amount: pending,
                    days_1_15: ageDays <= 15 ? pending : 0,
                    days_16_30: (ageDays > 15 && ageDays <= 30) ? pending : 0,
                    days_31_60: (ageDays > 30 && ageDays <= 60) ? pending : 0,
                    above_60: ageDays > 60 ? pending : 0
                });
            });

            customers.forEach((c) => {
                const pending = parseFloat(c.opening_balance) || 0;
                if (pending <= 0) return;
                const hasBills = agingList.some(item => item.name.trim().toLowerCase() === c.name.trim().toLowerCase());
                if (!hasBills) {
                    agingList.push({
                        id: c._id,
                        name: c.name,
                        cell: c.phone || '-',
                        bill_number: 'OPENING-BAL',
                        date: new Date().toISOString().split('T')[0],
                        total_days: 0,
                        pending_amount: pending,
                        days_1_15: pending,
                        days_16_30: 0,
                        days_31_60: 0,
                        above_60: 0
                    });
                }
            });

            return res.status(200).json({ success: true, data: agingList });
        }
    } catch (error) {
        console.error('getAgingReport error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
