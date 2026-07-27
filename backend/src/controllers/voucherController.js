const Voucher = require('../models/Voucher');
const Ledger = require('../models/Ledger');
const AccountTransaction = require('../models/AccountTransaction');
const VoucherSeries = require('../models/VoucherSeries');
const mongoose = require('mongoose');
const { safeIncBalance } = require('../utils/balanceUtils');

// @desc    Get all vouchers (excluding deleted)
exports.getVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find({
            company_id: req.user.restaurant_id,
            is_deleted: { $ne: true }
        })
            .populate('debit_ledger', 'name group')
            .populate('credit_ledger', 'name group')
            .sort({ date: -1, createdAt: -1 });
        res.status(200).json({ success: true, count: vouchers.length, data: vouchers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create a new voucher with double-entry accounting
exports.createVoucher = async (req, res) => {
    try {
        const { voucher_type, date, debit_ledger, credit_ledger, amount, narration, reference_id } = req.body;
        const company_id = req.user.restaurant_id;

        // Fetch dynamic series
        const series = await VoucherSeries.findOne({ company_id, series_name: voucher_type });
        if (!series) {
            throw new Error(`Voucher series not found for type: ${voucher_type}`);
        }

        // Generate dynamic voucher number
        const nextNumStr = series.next_number.toString().padStart(4, '0');
        const voucher_number = `${series.prefix || ''}${nextNumStr}${series.suffix || ''}`;

        // Increment series next_number
        series.next_number += 1;
        await series.save();

        // 1. Create the Voucher record
        const voucher = await Voucher.create({
            company_id,
            voucher_type,
            voucher_number,
            date: date || Date.now(),
            debit_ledger,
            credit_ledger,
            amount,
            narration,
            reference_id
        });

        const voucherId = voucher._id;

        // 2. Create Double Entry Account Transactions
        // DEBIT Entry
        await AccountTransaction.create({
            company_id,
            ledger_id: debit_ledger,
            type: 'DEBIT',
            amount,
            voucher_type,
            voucher_number,
            reference_id: voucherId,
            narration,
            date: date || Date.now()
        });

        // CREDIT Entry
        await AccountTransaction.create({
            company_id,
            ledger_id: credit_ledger,
            type: 'CREDIT',
            amount,
            voucher_type,
            voucher_number,
            reference_id: voucherId,
            narration,
            date: date || Date.now()
        });

        // 3. Update Ledger Balances (Opening balance is treated as net balance here)
        await safeIncBalance(Ledger, debit_ledger, amount);
        await safeIncBalance(Ledger, credit_ledger, -amount);

        res.status(201).json({ success: true, data: voucher });
    } catch (error) {
        console.error("Voucher Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Soft delete voucher and revert balances
exports.deleteVoucher = async (req, res) => {
    try {
        const company_id = req.user.restaurant_id;
        const voucher = await Voucher.findOne({ _id: req.params.id, company_id });

        if (!voucher) return res.status(404).json({ success: false, error: 'Voucher not found' });
        if (voucher.is_deleted) return res.status(400).json({ success: false, error: 'Voucher already deleted' });

        // 1. Soft delete the voucher
        voucher.is_deleted = true;
        await voucher.save();

        // 2. Soft delete the associated account transactions
        await AccountTransaction.updateMany(
            { reference_id: voucher._id, company_id },
            { is_deleted: true }
        );

        // 3. Revert Ledger Balances
        await safeIncBalance(Ledger, voucher.debit_ledger, -voucher.amount);
        await safeIncBalance(Ledger, voucher.credit_ledger, voucher.amount);

        res.status(200).json({ success: true, message: 'Voucher deleted and balances reverted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
