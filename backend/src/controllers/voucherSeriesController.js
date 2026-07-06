const VoucherSeries = require('../models/VoucherSeries');
const Restaurant = require('../models/Restaurant');

exports.getVoucherSeries = async (req, res) => {
    try {
        const series = await VoucherSeries.find({ company_id: req.user.restaurant_id, is_active: true });
        res.status(200).json(series);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching voucher series', error: error.message });
    }
};

exports.createVoucherSeries = async (req, res) => {
    try {
        const { series_name, prefix, suffix, starting_number, numbering_method, restart_after, printer_path } = req.body;
        
        const existing = await VoucherSeries.findOne({ company_id: req.user.restaurant_id, series_name: { $regex: new RegExp(`^${series_name}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: 'Voucher series with this name already exists' });
        }

        const newSeries = new VoucherSeries({
            company_id: req.user.restaurant_id,
            series_name,
            prefix: prefix || '',
            suffix: suffix || '',
            starting_number: starting_number || 1,
            next_number: starting_number || 1,
            numbering_method: numbering_method || 'Automatic',
            restart_after: restart_after || 'Never',
            printer_path: printer_path || ''
        });

        await newSeries.save();

        // Sync to Restaurant bill_series if it matches billing type
        const nameLower = series_name.toLowerCase();
        let restaurantSeriesKey = null;
        if (nameLower === 'dine in' || nameLower === 'dine_in') restaurantSeriesKey = 'dine_in';
        else if (nameLower === 'takeaway' || nameLower === 'self service' || nameLower === 'self-service') restaurantSeriesKey = 'takeaway';
        else if (nameLower === 'delivery') restaurantSeriesKey = 'delivery';
        else if (nameLower === 'parcel') restaurantSeriesKey = 'parcel';
        else if (nameLower === 'party' || nameLower === 'party order' || nameLower === 'party_order') restaurantSeriesKey = 'party';

        if (restaurantSeriesKey) {
            const restartAfterMapped = restart_after === 'Restart Yearly' ? 'Yearly' : 
                                       restart_after === 'Restart Daily' ? 'Daily' : 
                                       restart_after === 'Restart Monthly' ? 'Monthly' : 'Never';
            await Restaurant.findByIdAndUpdate(req.user.restaurant_id, {
                $set: {
                    [`bill_series.${restaurantSeriesKey}.numbering_method`]: numbering_method || 'Automatic',
                    [`bill_series.${restaurantSeriesKey}.prefix`]: prefix || '',
                    [`bill_series.${restaurantSeriesKey}.suffix`]: suffix || '',
                    [`bill_series.${restaurantSeriesKey}.starting_number`]: starting_number || 1,
                    [`bill_series.${restaurantSeriesKey}.next_number`]: starting_number || 1,
                    [`bill_series.${restaurantSeriesKey}.restart_after`]: restartAfterMapped
                }
            });
        }

        res.status(201).json({ message: 'Voucher series created successfully', series: newSeries });
    } catch (error) {
        res.status(500).json({ message: 'Error creating voucher series', error: error.message });
    }
};

exports.updateVoucherSeries = async (req, res) => {
    try {
        const { id } = req.params;
        const { series_name, prefix, suffix, starting_number, numbering_method, restart_after, printer_path, is_active } = req.body;

        const series = await VoucherSeries.findOne({ _id: id, company_id: req.user.restaurant_id });
        if (!series) {
            return res.status(404).json({ message: 'Voucher series not found' });
        }

        if (series_name && series_name.toLowerCase() !== series.series_name.toLowerCase()) {
            const existing = await VoucherSeries.findOne({ company_id: req.user.restaurant_id, series_name: { $regex: new RegExp(`^${series_name}$`, 'i') } });
            if (existing) {
                return res.status(400).json({ message: 'Voucher series with this name already exists' });
            }
        }

        if (series_name) series.series_name = series_name;
        if (prefix !== undefined) series.prefix = prefix;
        if (suffix !== undefined) series.suffix = suffix;
        if (starting_number !== undefined) {
            series.starting_number = starting_number;
            series.next_number = starting_number;
        }
        if (numbering_method !== undefined) series.numbering_method = numbering_method;
        if (restart_after !== undefined) series.restart_after = restart_after;
        if (printer_path !== undefined) series.printer_path = printer_path;
        if (is_active !== undefined) series.is_active = is_active;

        await series.save();

        // Sync to Restaurant bill_series if it matches billing type
        const nameLower = series.series_name.toLowerCase();
        let restaurantSeriesKey = null;
        if (nameLower === 'dine in' || nameLower === 'dine_in') restaurantSeriesKey = 'dine_in';
        else if (nameLower === 'takeaway' || nameLower === 'self service' || nameLower === 'self-service') restaurantSeriesKey = 'takeaway';
        else if (nameLower === 'delivery') restaurantSeriesKey = 'delivery';
        else if (nameLower === 'parcel') restaurantSeriesKey = 'parcel';
        else if (nameLower === 'party' || nameLower === 'party order' || nameLower === 'party_order') restaurantSeriesKey = 'party';

        if (restaurantSeriesKey) {
            const restartAfterMapped = series.restart_after === 'Restart Yearly' ? 'Yearly' : 
                                       series.restart_after === 'Restart Daily' ? 'Daily' : 
                                       series.restart_after === 'Restart Monthly' ? 'Monthly' : 'Never';
            await Restaurant.findByIdAndUpdate(req.user.restaurant_id, {
                $set: {
                    [`bill_series.${restaurantSeriesKey}.numbering_method`]: series.numbering_method,
                    [`bill_series.${restaurantSeriesKey}.prefix`]: series.prefix,
                    [`bill_series.${restaurantSeriesKey}.suffix`]: series.suffix,
                    [`bill_series.${restaurantSeriesKey}.starting_number`]: series.starting_number,
                    [`bill_series.${restaurantSeriesKey}.next_number`]: series.next_number,
                    [`bill_series.${restaurantSeriesKey}.restart_after`]: restartAfterMapped
                }
            });
        }

        res.status(200).json({ message: 'Voucher series updated successfully', series });
    } catch (error) {
        res.status(500).json({ message: 'Error updating voucher series', error: error.message });
    }
};

exports.deleteVoucherSeries = async (req, res) => {
    try {
        const { id } = req.params;
        // Depending on requirements, we might just mark it inactive
        const series = await VoucherSeries.findOneAndUpdate(
            { _id: id, company_id: req.user.restaurant_id },
            { is_active: false },
            { new: true }
        );
        if (!series) {
            return res.status(404).json({ message: 'Voucher series not found' });
        }
        res.status(200).json({ message: 'Voucher series deactivated successfully', series });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting voucher series', error: error.message });
    }
};
