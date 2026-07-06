const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, createOrder, updateOrder, generateBill } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');
const { z } = require('zod');

const orderSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            menu_item: z.string().min(1, 'Menu item ID is required'),
            quantity: z.number().min(1, 'Quantity must be at least 1')
        })).min(1, 'Order must contain at least 1 item'),
        table_id: z.string().optional(),
        no_of_persons: z.number().int().min(1).optional(),
        customer_id: z.string().optional()
    })
});

router.use(protect);

router.route('/')
    .get(getOrders)
    .post(validate(orderSchema), createOrder);

router.route('/:id')
    .get(getOrderById)
    .put(updateOrder);

router.post('/:id/bill', generateBill);

module.exports = router;
