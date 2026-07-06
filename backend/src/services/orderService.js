const Order = require('../models/Order');
const Table = require('../models/Table');
const Product = require('../models/Product');
const Bill = require('../models/Bill');

class OrderService {
    static async getAllOrders(companyId) {
        return await Order.find({ company_id: companyId, is_deleted: false })
            .populate('table', 'table_number seating_capacity')
            .populate('customer', 'name phone')
            .sort({ createdAt: -1 });
    }

    static async getOrderById(orderId, companyId) {
        return await Order.findOne({ _id: orderId, company_id: companyId })
            .populate('table')
            .populate('customer');
    }

    static async createOrder(orderData, companyId, userId) {
        const { table_id, no_of_persons, customer_id, items, notes } = orderData;

        let sub_total = 0;
        const processedItems = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.menu_item);
            if (!product) throw new Error(`Product not found: ${item.menu_item}`);

            const total_price = product.selling_price * item.quantity;
            sub_total += total_price;

            return {
                menu_item: product._id,
                name: product.name,
                quantity: item.quantity,
                unit_price: product.selling_price,
                total_price,
                notes: item.notes || ''
            };
        }));

        const count = await Order.countDocuments({ company_id: companyId });
        const order_number = `ORD-${new Date().getTime().toString().slice(-4)}-${count + 1}`;

        const grand_total = sub_total;

        const newOrder = await Order.create({
            company_id: companyId,
            order_number,
            table: table_id,
            no_of_persons: no_of_persons,
            customer: customer_id,
            items: processedItems,
            sub_total,
            grand_total,
            created_by: userId
        });

        if (table_id) {
            await Table.findByIdAndUpdate(table_id, { status: 'OCCUPIED' });
        }

        return newOrder;
    }

    static async updateOrder(orderId, updateData, companyId) {
        const { items, status } = updateData;
        const order = await Order.findOne({ _id: orderId, company_id: companyId });

        if (!order) {
            throw new Error('Order not found');
        }

        if (status) order.status = status;

        if (items) {
            let sub_total = 0;
            const processedItems = await Promise.all(items.map(async (item) => {
                const product = await Product.findById(item.menu_item);
                const total_price = product.selling_price * item.quantity;
                sub_total += total_price;
                return {
                    menu_item: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    unit_price: product.selling_price,
                    total_price,
                    status: item.status || 'PENDING',
                    notes: item.notes || ''
                };
            }));
            order.items = processedItems;
            order.sub_total = sub_total;
            order.grand_total = sub_total;
        }

        await order.save();
        return order;
    }

    static async generateBillFromOrder(orderId, companyId, userId) {
        const order = await Order.findOne({ _id: orderId, company_id: companyId });
        if (!order) throw new Error('Order not found');
        if (order.status === 'BILLED') throw new Error('Order already billed');

        const count = await Bill.countDocuments({ company_id: companyId });
        const bill_number = `INV-${new Date().getTime().toString().slice(-4)}-${count + 1}`;

        const itemsForBill = order.items.map(item => ({
            product_id: item.menu_item,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
        }));

        const newBill = await Bill.create({
            company_id: companyId,
            bill_number,
            order_id: order._id,
            customer_name: order.customer ? 'Customer' : '',
            items: itemsForBill,
            sub_total: order.sub_total,
            grand_total: order.grand_total,
            type: order.table ? 'DINE_IN' : 'TAKEAWAY',
            status: 'OPEN',
            created_by: userId
        });

        order.status = 'BILLED';
        order.bill_id = newBill._id;
        await order.save();

        if (order.table) {
            await Table.findByIdAndUpdate(order.table, { status: 'AVAILABLE' });
        }

        return newBill;
    }
}

module.exports = OrderService;
