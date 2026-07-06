const OrderService = require('../services/orderService');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res, next) => {
    try {
        const orders = await OrderService.getAllOrders(req.user.company_id || req.user.restaurant_id);
        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
    try {
        const order = await OrderService.getOrderById(req.params.id, req.user.company_id || req.user.restaurant_id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
    try {
        const newOrder = await OrderService.createOrder(req.body, req.user.company_id || req.user.restaurant_id, req.user._id);
        res.status(201).json({ success: true, data: newOrder });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order items
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res, next) => {
    try {
        const order = await OrderService.updateOrder(req.params.id, req.body, req.user.company_id || req.user.restaurant_id);
        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// @desc    Convert order to Bill
// @route   POST /api/orders/:id/bill
// @access  Private
const generateBill = async (req, res, next) => {
    try {
        const newBill = await OrderService.generateBillFromOrder(req.params.id, req.user.company_id || req.user.restaurant_id, req.user._id);
        res.json({ success: true, data: newBill });
    } catch (error) {
        if (error.message === 'Order not found' || error.message === 'Order already billed') {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    generateBill
};
