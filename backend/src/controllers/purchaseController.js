const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

// GET /api/purchases — list with optional date/search filters
exports.getPurchases = async (req, res) => {
    try {
        const { startDate, endDate, search, invoiceNo } = req.query;
        const query = { company_id: req.user.restaurant_id, is_deleted: { $ne: true } };

        if (startDate || endDate) {
            query.invoice_date = {};
            if (startDate) query.invoice_date.$gte = new Date(startDate + 'T00:00:00.000Z');
            if (endDate) query.invoice_date.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        if (invoiceNo || search) {
            const term = invoiceNo || search;
            query.$or = [
                { invoice_number: { $regex: term, $options: 'i' } }
            ];
        }

        const purchases = await Purchase.find(query)
            .populate('supplier_id', 'name contact_person contact_number address gst_number opening_balance')
            .sort({ invoice_date: -1 });

        res.status(200).json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        console.error('getPurchases error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// GET /api/purchases/stats — summary totals for the list page header cards
exports.getPurchaseStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { company_id: req.user.restaurant_id, is_deleted: { $ne: true } };

        if (startDate || endDate) {
            query.invoice_date = {};
            if (startDate) query.invoice_date.$gte = new Date(startDate + 'T00:00:00.000Z');
            if (endDate) query.invoice_date.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        const [result] = await Purchase.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total_purchase: { $sum: '$grand_total' },
                    total_paid: { $sum: '$paid_amount' },
                    total_unpaid: { $sum: '$due_amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: result || { total_purchase: 0, total_paid: 0, total_unpaid: 0, count: 0 }
        });
    } catch (error) {
        console.error('getPurchaseStats error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// GET /api/purchases/:id — single purchase detail
exports.getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findOne({
            _id: req.params.id,
            company_id: req.user.restaurant_id,
            is_deleted: { $ne: true }
        }).populate('supplier_id', 'name contact_person contact_number address gst_number opening_balance')
          .populate('items.product_id', 'name code barcode unit selling_price purchase_price cost_price mrp gst_purchase hsn_code');

        if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
        res.status(200).json({ success: true, data: purchase });
    } catch (error) {
        console.error('getPurchaseById error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// POST /api/purchases — create purchase bill
exports.createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            supplier_id, invoice_number, invoice_date, payment_type,
            due_days, items,
            sub_total, discount_amount, tax_amount, cgst_amount, sgst_amount,
            other_charges, round_off, net_amount, grand_total,
            paid_amount, remarks, notes
        } = req.body;

        const company_id = req.user.restaurant_id;

        // Calculate due_date from invoice_date + due_days
        let due_date = null;
        if (due_days && due_days > 0) {
            const base = invoice_date ? new Date(invoice_date) : new Date();
            due_date = new Date(base);
            due_date.setDate(due_date.getDate() + parseInt(due_days));
        }

        const paidAmt = parseFloat(paid_amount) || 0;
        const grandTotal = parseFloat(grand_total) || 0;
        const dueAmt = grandTotal - paidAmt;
        let payStatus = 'UNPAID';
        if (paidAmt >= grandTotal && grandTotal > 0) payStatus = 'PAID';
        else if (paidAmt > 0) payStatus = 'PARTIAL';

        // Get supplier for balance display
        const supplierDoc = await Supplier.findOne({ _id: supplier_id, company_id }).session(session);
        if (!supplierDoc) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, error: 'Supplier not found' });
        }

        const [purchase] = await Purchase.create([{
            company_id, supplier_id, invoice_number,
            invoice_date: invoice_date || new Date(),
            purchase_date: invoice_date || new Date(),
            payment_type: payment_type || 'CREDIT',
            due_days: parseInt(due_days) || 0,
            due_date,
            items,
            sub_total: parseFloat(sub_total) || 0,
            discount_amount: parseFloat(discount_amount) || 0,
            tax_amount: parseFloat(tax_amount) || 0,
            cgst_amount: parseFloat(cgst_amount) || 0,
            sgst_amount: parseFloat(sgst_amount) || 0,
            other_charges: parseFloat(other_charges) || 0,
            round_off: parseFloat(round_off) || 0,
            net_amount: parseFloat(net_amount) || grandTotal,
            grand_total: grandTotal,
            paid_amount: paidAmt,
            due_amount: dueAmt,
            payment_status: payStatus,
            remarks: remarks || '',
            notes: notes || ''
        }], { session });

        // Update stock for each product
        const StockTransaction = require('../models/StockTransaction');
        for (const item of items) {
            if (!item.product_id) continue;
            const product = await Product.findOne({ _id: item.product_id, company_id }).session(session);
            if (product) {
                const prev = product.current_stock;
                product.current_stock += parseFloat(item.quantity) || 0;
                if (item.purchase_rate) product.purchase_price = parseFloat(item.purchase_rate);
                if (item.gst_percent !== undefined) product.gst_purchase = parseFloat(item.gst_percent);
                if (item.cost_rate) product.cost_price = parseFloat(item.cost_rate);
                if (item.sales_rate) product.selling_price = parseFloat(item.sales_rate);
                if (item.mrp) product.mrp = parseFloat(item.mrp);
                if (item.hsn_code) product.hsn_code = item.hsn_code;
                await product.save({ session });

                await StockTransaction.create([{
                    company_id, product_id: product._id, type: 'IN',
                    quantity: parseFloat(item.quantity),
                    previous_stock: prev, new_stock: product.current_stock,
                    reference_type: 'PURCHASE', reference_id: purchase._id,
                    remark: `Purchase Inv ${invoice_number}`
                }], { session });
            }
        }

        // Update supplier balance (amount we owe them = due amount)
        if (dueAmt > 0) {
            await Supplier.findOneAndUpdate(
                { _id: supplier_id, company_id },
                { $inc: { opening_balance: dueAmt } },
                { session }
            );
        }

        // Accounting integration
        try {
            const Ledger = require('../models/Ledger');
            const AccountTransaction = require('../models/AccountTransaction');

            const purchaseLedger = await Ledger.findOne({ company_id, name: 'Purchase Account' }).session(session);
            const supplierLedger = await Ledger.findOne({ company_id, name: `${supplierDoc.name} (Supplier)` }).session(session);

            if (purchaseLedger && supplierLedger) {
                await AccountTransaction.create([{
                    company_id, ledger_id: purchaseLedger._id, type: 'DEBIT', amount: grandTotal,
                    voucher_type: 'PURCHASE', voucher_number: invoice_number, reference_id: purchase._id,
                    narration: `Purchase - Inv ${invoice_number}`, date: invoice_date || new Date()
                }], { session });
                await Ledger.findByIdAndUpdate(purchaseLedger._id, { $inc: { opening_balance: grandTotal } }, { session });

                await AccountTransaction.create([{
                    company_id, ledger_id: supplierLedger._id, type: 'CREDIT', amount: grandTotal,
                    voucher_type: 'PURCHASE', voucher_number: invoice_number, reference_id: purchase._id,
                    narration: `Purchase - Inv ${invoice_number}`, date: invoice_date || new Date()
                }], { session });
                await Ledger.findByIdAndUpdate(supplierLedger._id, { $inc: { opening_balance: -grandTotal } }, { session });

                if (paidAmt > 0) {
                    const cashLedger = await Ledger.findOne({ company_id, name: 'Cash in Hand' }).session(session);
                    if (cashLedger) {
                        await AccountTransaction.create([{
                            company_id, ledger_id: supplierLedger._id, type: 'DEBIT', amount: paidAmt,
                            voucher_type: 'PAYMENT', voucher_number: `PAY-${invoice_number}`, reference_id: purchase._id,
                            narration: `Payment for Inv ${invoice_number}`, date: invoice_date || new Date()
                        }], { session });
                        await Ledger.findByIdAndUpdate(supplierLedger._id, { $inc: { opening_balance: paidAmt } }, { session });

                        await AccountTransaction.create([{
                            company_id, ledger_id: cashLedger._id, type: 'CREDIT', amount: paidAmt,
                            voucher_type: 'PAYMENT', voucher_number: `PAY-${invoice_number}`, reference_id: purchase._id,
                            narration: `Payment for Inv ${invoice_number}`, date: invoice_date || new Date()
                        }], { session });
                        await Ledger.findByIdAndUpdate(cashLedger._id, { $inc: { opening_balance: -paidAmt } }, { session });
                    }
                }
            }
        } catch (accErr) {
            console.error('Accounting integration error (non-fatal):', accErr.message);
        }

        await session.commitTransaction();
        const populated = await Purchase.findById(purchase._id)
            .populate('supplier_id', 'name contact_person contact_number address gst_number opening_balance');
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        await session.abortTransaction();
        console.error('createPurchase error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

// PUT /api/purchases/:id — update purchase (limited: remarks, notes, payment updates)
exports.updatePurchase = async (req, res) => {
    try {
        const { remarks, notes, paid_amount } = req.body;
        const purchase = await Purchase.findOne({
            _id: req.params.id,
            company_id: req.user.restaurant_id,
            is_deleted: { $ne: true }
        });
        if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });

        if (remarks !== undefined) purchase.remarks = remarks;
        if (notes !== undefined) purchase.notes = notes;
        if (paid_amount !== undefined) {
            const paidAmt = parseFloat(paid_amount) || 0;
            purchase.paid_amount = paidAmt;
            purchase.due_amount = purchase.grand_total - paidAmt;
            if (paidAmt >= purchase.grand_total) purchase.payment_status = 'PAID';
            else if (paidAmt > 0) purchase.payment_status = 'PARTIAL';
            else purchase.payment_status = 'UNPAID';
        }

        await purchase.save();
        res.status(200).json({ success: true, data: purchase });
    } catch (error) {
        console.error('updatePurchase error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// DELETE /api/purchases/:id — delete and reverse stock
exports.deletePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchase = await Purchase.findOne({
            _id: req.params.id,
            company_id: req.user.restaurant_id,
            is_deleted: { $ne: true }
        });
        if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });

        const StockTransaction = require('../models/StockTransaction');
        const company_id = req.user.restaurant_id;

        for (const item of purchase.items) {
            if (!item.product_id) continue;
            const product = await Product.findOne({ _id: item.product_id, company_id }).session(session);
            if (product) {
                const prev = product.current_stock;
                product.current_stock = Math.max(0, product.current_stock - parseFloat(item.quantity));
                await product.save({ session });

                await StockTransaction.create([{
                    company_id, product_id: product._id, type: 'OUT',
                    quantity: parseFloat(item.quantity),
                    previous_stock: prev, new_stock: product.current_stock,
                    reference_type: 'PURCHASE',
                    remark: `Purchase Cancelled: ${purchase.invoice_number}`
                }], { session });
            }
        }

        // Reverse supplier balance
        const balanceToSubtract = purchase.due_amount || 0;
        if (balanceToSubtract > 0) {
            await Supplier.findOneAndUpdate(
                { _id: purchase.supplier_id, company_id },
                { $inc: { opening_balance: -balanceToSubtract } },
                { session }
            );
        }

        await Purchase.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Purchase deleted and stock reverted' });
    } catch (error) {
        await session.abortTransaction();
        console.error('deletePurchase error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};
