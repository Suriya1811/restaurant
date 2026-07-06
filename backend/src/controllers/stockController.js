const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');
const mongoose = require('mongoose');

// @desc    Get all products with stock information
exports.getStockItems = async (req, res) => {
    try {
        const products = await Product.find({ company_id: req.user.restaurant_id, is_deleted: false })
            .populate('category', 'name')
            .sort({ name: 1 });
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Get detailed stock report with summary and periodical data
exports.getStockReport = async (req, res) => {
    try {
        const { startDate, endDate, category, brand, search } = req.query;
        const hotelId = req.user.restaurant_id;

        // 1. Build product filter
        let productFilter = { company_id: hotelId, is_deleted: false };
        if (category) productFilter.category = category;
        if (brand) productFilter.brand = brand;
        if (search) {
            productFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(productFilter).lean();

        // 2. Build transaction period filter
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Transaction totals per product in the selected period
        const periodTransactions = await StockTransaction.aggregate([
            { $match: { 
                company_id: new mongoose.Types.ObjectId(hotelId),
                createdAt: { $gte: start, $lte: end }
            }},
            { $group: {
                _id: "$product_id",
                stockIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", { $cond: [{ $gt: ["$quantity", 0] }, "$quantity", 0] }] } },
                stockOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, { $abs: "$quantity" }, { $cond: [{ $lt: ["$quantity", 0] }, { $abs: "$quantity" }, 0] }] } }
            }}
        ]);

        // Transactions from EndDate to Today (to calculate ending stock of the period vs current stock)
        const laterTransactions = await StockTransaction.aggregate([
            { $match: { 
                company_id: new mongoose.Types.ObjectId(hotelId),
                createdAt: { $gt: end }
            }},
            { $group: {
                _id: "$product_id",
                netChange: { $sum: "$quantity" }
            }}
        ]);

        // Transactions from StartDate to Today (to calculate opening stock)
        const sinceStartTransactions = await StockTransaction.aggregate([
            { $match: { 
                company_id: new mongoose.Types.ObjectId(hotelId),
                createdAt: { $gte: start }
            }},
            { $group: {
                _id: "$product_id",
                netChange: { $sum: "$quantity" }
            }}
        ]);

        const transMap = new Map(periodTransactions.map(t => [t._id.toString(), t]));
        const laterMap = new Map(laterTransactions.map(t => [t._id.toString(), t.netChange]));
        const sinceStartMap = new Map(sinceStartTransactions.map(t => [t._id.toString(), t.netChange]));

        let totalStock = 0;
        let totalStockValue = 0;
        let nilStockCount = 0;
        let negativeStockCount = 0;
        let minStockCount = 0;

        const reportData = products.map(p => {
            const pid = p._id.toString();
            const pt = transMap.get(pid) || { stockIn: 0, stockOut: 0 };
            
            // Current Stock is as of NOW in DB.
            // Opening Stock as of StartDate = Current - NetChangeSinceStart
            const openingStock = p.current_stock - (sinceStartMap.get(pid) || 0);
            
            // Closing Stock as of EndDate = Current - NetChangeSinceEndDate
            const closingStock = p.current_stock - (laterMap.get(pid) || 0);

            const stockVal = closingStock * (p.purchase_price || 0);

            // Summary Metrics (based on current/active state usually, or period end?)
            // Usually summary cards on a report show the "Current" or "Period End" state.
            // Let's use Period End state for the report's summary cards.
            totalStock += closingStock;
            totalStockValue += stockVal;
            if (closingStock === 0) nilStockCount++;
            if (closingStock < 0) negativeStockCount++;
            if (closingStock <= (p.min_stock || 0)) minStockCount++;

            return {
                ...p,
                openingStk: openingStock,
                stockIn: pt.stockIn,
                stockOut: pt.stockOut,
                closingStk: closingStock,
                stockValue: stockVal
            };
        });

        res.status(200).json({
            success: true,
            summary: {
                totalStock,
                totalStockValue,
                nilStock: nilStockCount,
                negativeStock: negativeStockCount,
                minStock: minStockCount
            },
            data: reportData
        });

    } catch (error) {
        console.error('Stock Report Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get low stock items (below reorder level)
exports.getLowStockItems = async (req, res) => {
    try {
        const products = await Product.find({
            company_id: req.user.restaurant_id,
            $expr: { $lt: ["$current_stock", "$reorder_level"] },
            is_active: true,
            is_deleted: false
        }).sort({ current_stock: 1 });

        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Update stock for a single product with logging
exports.updateStock = async (req, res) => {
    try {
        const { current_stock, remark = 'Manual Adjustment' } = req.body;
        const product = await Product.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const prevStock = product.current_stock;
        product.current_stock = current_stock;
        await product.save();

        // Log transaction
        await StockTransaction.create({
            company_id: req.user.restaurant_id,
            product_id: product._id,
            type: current_stock > prevStock ? 'IN' : 'OUT',
            quantity: current_stock - prevStock,
            previous_stock: prevStock,
            new_stock: current_stock,
            reference_type: 'MANUAL',
            remark,
            performed_by: req.user.id
        });

        res.status(200).json({ success: true, data: product });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Bulk update stock for multiple products
exports.bulkUpdateStock = async (req, res) => {
    try {
        const { updates } = req.body; // Array of { productId, current_stock }
        const updatedProducts = [];
        for (const update of updates) {
            const product = await Product.findOne({ _id: update.productId, company_id: req.user.restaurant_id });
            if (product) {
                const prev = product.current_stock;
                product.current_stock = update.current_stock;
                await product.save();
                await StockTransaction.create({
                    company_id: req.user.restaurant_id, 
                    product_id: product._id, 
                    type: update.current_stock > prev ? 'IN' : 'OUT',
                    quantity: update.current_stock - prev, 
                    previous_stock: prev, 
                    new_stock: update.current_stock,
                    reference_type: 'MANUAL', bookmark: 'Bulk Update', performed_by: req.user.id
                });
                updatedProducts.push(product);
            }
        }
        res.status(200).json({ success: true, message: `Updated ${updatedProducts.length} items`, data: updatedProducts });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Get stock transaction history
exports.getStockHistory = async (req, res) => {
    try {
        const history = await StockTransaction.find({ company_id: req.user.restaurant_id })
            .populate('product_id', 'name')
            .populate('performed_by', 'username')
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json({ success: true, data: history });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};