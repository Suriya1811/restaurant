const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const Restaurant = require('../src/models/Restaurant');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Tax = require('../src/models/Tax');
const Unit = require('../src/models/Unit');
const Category = require('../src/models/Category');
const Brand = require('../src/models/Brand');
const Kitchen = require('../src/models/Kitchen');
const Printer = require('../src/models/Printer');
const Counter = require('../src/models/Counter');
const TableType = require('../src/models/TableType');
const Table = require('../src/models/Table');
const FunctionType = require('../src/models/FunctionType');
const Captain = require('../src/models/Captain');
const Waiter = require('../src/models/Waiter');
const Customer = require('../src/models/Customer');
const Supplier = require('../src/models/Supplier');
const Coupon = require('../src/models/Coupon');
const Product = require('../src/models/Product');
const LedgerGroup = require('../src/models/LedgerGroup');
const Ledger = require('../src/models/Ledger');
const VoucherSeries = require('../src/models/VoucherSeries');
const Voucher = require('../src/models/Voucher');
const Purchase = require('../src/models/Purchase');
const StockTransaction = require('../src/models/StockTransaction');
const Order = require('../src/models/Order');
const Bill = require('../src/models/Bill');
const Payment = require('../src/models/Payment');
const Setting = require('../src/models/Setting');
const AccountTransaction = require('../src/models/AccountTransaction');

const { seedDefaultGroups } = require('../src/controllers/ledgerGroupController');

async function seedSampleData(isStandalone = true) {
    let connection;
    try {
        if (isStandalone) {
            console.log('Connecting to MongoDB...');
            const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_new';
            connection = await mongoose.connect(mongoUri);
            console.log('Connected to MongoDB:', connection.connection.host);
        }

        console.log('\n--- Seeding Sample Data for RestoBoard ---');

        // 1. Restaurant
        let restaurant = await Restaurant.findOne({ email: 'admin@restoboard.com' });
        if (!restaurant) {
            restaurant = await Restaurant.create({
                company_name: 'RestoBoard Fine Dining & Cafe',
                store_name: 'Main Branch - Indiranagar',
                print_name: 'RestoBoard POS',
                restaurant_type: 'DINING',
                financial_year_start: new Date('2024-04-01'),
                financial_year_end: new Date('2025-03-31'),
                books_from: new Date('2024-04-01'),
                address: '100 Feet Road, Indiranagar, Bengaluru, KA 560038',
                fssai_no: '11223344556677',
                gstin: '29ABCDE1234F1Z5',
                billing_layout: 'SIDEBAR',
                printer_enabled: true,
                printer_width: '80mm',
                bill_header: 'Welcome to RestoBoard Fine Dining',
                bill_footer: 'Thank you for dining with us! Visit again.',
                gst_no: '29ABCDE1234F1Z5',
                auto_print: false,
                coupon_enabled: true,
                loyalty_enabled: true,
                loyalty_points_per_100: 1,
                loyalty_target_points: 100,
                loyalty_point_value: 1,
                kitchen_enabled: true,
                counter_enabled: true,
                dashboard_enabled: true,
                reports_enabled: true,
                staff_enabled: true,
                table_enabled: true,
                pay_mode_enabled: true,
                stock_level_enabled: true,
                kot_enabled: true
            });
            console.log('Created Restaurant:', restaurant.company_name);
        } else {
            console.log('Found existing Restaurant:', restaurant.company_name);
        }

        const companyId = restaurant._id;

        // 2. Admin User & Staff Users
        const usersData = [
            { name: 'Admin User', email: 'admin@restoboard.com', username: 'admin', mobile: '9988776655', role: 'ADMIN', user_id: 'admin' },
            { name: 'Store Manager', email: 'manager@restoboard.com', username: 'manager', mobile: '9988776654', role: 'MANAGER', user_id: 'manager' },
            { name: 'Head Cashier', email: 'cashier@restoboard.com', username: 'cashier', mobile: '9988776653', role: 'CASHIER', user_id: 'cashier' },
            { name: 'Senior Captain', email: 'captain@restoboard.com', username: 'captain', mobile: '9988776652', role: 'CAPTAIN', user_id: 'captain' },
            { name: 'Staff Waiter', email: 'waiter@restoboard.com', username: 'waiter', mobile: '9988776651', role: 'WAITER', user_id: 'waiter' }
        ];

        let adminUser;
        for (const u of usersData) {
            let user = await User.findOne({ restaurant_id: companyId, email: u.email });
            if (!user) {
                user = await User.create({
                    restaurant_id: companyId,
                    name: u.name,
                    email: u.email,
                    username: u.username,
                    user_id: u.user_id,
                    mobile: u.mobile,
                    password: 'password123', // User pre-save hook will hash this
                    role: u.role,
                    is_active: true,
                    password_enabled: true,
                    password_initialized: true
                });
            } else {
                user.password = 'password123';
                await user.save();
            }
            if (u.role === 'ADMIN') adminUser = user;
        }
        console.log('Seeded Users (Admin & Staff)');

        // 3. Roles
        const defaultPages = [
            { page_key: 'dashboard', page_label: 'Dashboard', has_access: true },
            { page_key: 'billing', page_label: 'POS Billing', has_access: true },
            { page_key: 'tables', page_label: 'Table Management', has_access: true },
            { page_key: 'kitchen', page_label: 'Kitchen Display (KDS)', has_access: true },
            { page_key: 'menu', page_label: 'Menu / Products', has_access: true },
            { page_key: 'stock', page_label: 'Stock / Inventory', has_access: true },
            { page_key: 'reports', page_label: 'Reports & Analytics', has_access: true },
            { page_key: 'accounts', page_label: 'Accounts & Ledgers', has_access: true },
            { page_key: 'settings', page_label: 'System Settings', has_access: true }
        ];

        const rolesList = ['ADMIN', 'MANAGER', 'CASHIER', 'CAPTAIN', 'WAITER', 'KITCHEN'];
        for (const rName of rolesList) {
            await Role.findOneAndUpdate(
                { restaurant_id: companyId, name: rName },
                {
                    restaurant_id: companyId,
                    name: rName,
                    description: `${rName} Role with preset permissions`,
                    pages: defaultPages,
                    is_active: true
                },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Roles');

        // 4. Default Ledger Groups
        await seedDefaultGroups(companyId);
        console.log('Seeded Default Accounting Ledger Groups');

        // 5. Taxes
        const taxesData = [
            { name: 'GST 5%', percentage: 5, tax_type: 'TAXABLE', cgst_rate: 2.5, sgst_rate: 2.5 },
            { name: 'GST 12%', percentage: 12, tax_type: 'TAXABLE', cgst_rate: 6, sgst_rate: 6 },
            { name: 'GST 18%', percentage: 18, tax_type: 'TAXABLE', cgst_rate: 9, sgst_rate: 9 },
            { name: 'EXEMPT 0%', percentage: 0, tax_type: 'EXEMPTED', cgst_rate: 0, sgst_rate: 0 }
        ];
        const taxDocs = {};
        for (const t of taxesData) {
            const taxDoc = await Tax.findOneAndUpdate(
                { company_id: companyId, name: t.name },
                { ...t, company_id: companyId, is_active: true },
                { upsert: true, new: true }
            );
            taxDocs[t.name] = taxDoc;
        }
        console.log('Seeded Taxes');

        // 6. Units
        const unitsList = ['Pcs', 'Kg', 'Ltr', 'Plate', 'Glass', 'Portion', 'Box'];
        for (const name of unitsList) {
            await Unit.findOneAndUpdate(
                { company_id: companyId, name },
                { company_id: companyId, name, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Measurement Units');

        // 7. Categories
        const categoriesData = [
            { name: 'Starters', description: 'Appetizers and quick bites' },
            { name: 'Main Course', description: 'Curries, Gravies & Main Dishes' },
            { name: 'Beverages', description: 'Hot & Cold Drinks, Lassi & Shakes' },
            { name: 'Desserts', description: 'Sweets, Ice Creams & Cakes' },
            { name: 'Breads & Naan', description: 'Freshly Baked Indian Breads' },
            { name: 'Chinese & Asian', description: 'Noodles, Fried Rice & Asian Specials' },
            { name: 'Snacks & Fast Food', description: 'Burgers, Rolls & Fries' }
        ];
        for (const cat of categoriesData) {
            await Category.findOneAndUpdate(
                { company_id: companyId, name: cat.name },
                { company_id: companyId, name: cat.name, description: cat.description, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Menu Categories');

        // 8. Brands
        const brandsList = ['House Special', 'Beverage Co', 'Dairy Pure', 'Bakery Fresh'];
        for (const name of brandsList) {
            await Brand.findOneAndUpdate(
                { company_id: companyId, name },
                { company_id: companyId, name, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Brands');

        // 9. Kitchens
        const kitchensData = [
            { name: 'Main Kitchen', code: 'MK-01', description: 'Hot Food & Main Dishes' },
            { name: 'Bar & Beverage Station', code: 'BAR-01', description: 'Mocktails, Drinks & Shakes' },
            { name: 'Dessert Counter', code: 'DS-01', description: 'Sweets & Desserts' }
        ];
        for (const k of kitchensData) {
            await Kitchen.findOneAndUpdate(
                { company_id: companyId, name: k.name },
                { company_id: companyId, ...k, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Kitchen Stations');

        // 10. Printers
        const printersData = [
            { name: 'Counter Billing Printer', ip_address: '192.168.1.100', port: 9100, printer_type: 'BILL', is_default: true },
            { name: 'Main Kitchen KOT Printer', ip_address: '192.168.1.101', port: 9100, printer_type: 'KOT', is_default: false },
            { name: 'Bar KOT Printer', ip_address: '192.168.1.102', port: 9100, printer_type: 'KOT', is_default: false }
        ];
        for (const p of printersData) {
            await Printer.findOneAndUpdate(
                { company_id: companyId, name: p.name },
                { company_id: companyId, ...p, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Network Printers');

        // 11. Counters
        const countersData = [
            { name: 'Main Billing Counter', code: 'MC01', is_active: true },
            { name: 'Express Counter', code: 'EC02', is_active: true },
            { name: 'Bar Counter', code: 'BC01', is_active: true }
        ];
        const counterDocs = [];
        for (const c of countersData) {
            const doc = await Counter.findOneAndUpdate(
                { company_id: companyId, code: c.code },
                { company_id: companyId, ...c },
                { upsert: true, new: true }
            );
            counterDocs.push(doc);
        }
        console.log('Seeded Counters');

        // 12. Table Types (Areas)
        const tableTypesData = [
            { name: 'AC Hall', description: 'Indoor Air-Conditioned Main Dining' },
            { name: 'Non-AC Dining', description: 'Standard Indoor Seating' },
            { name: 'Garden Patio', description: 'Outdoor Open Air Seating' },
            { name: 'VIP Lounge', description: 'Private Luxury Seating' }
        ];
        for (const tt of tableTypesData) {
            await TableType.findOneAndUpdate(
                { company_id: companyId, name: tt.name },
                { company_id: companyId, ...tt, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Table Types / Areas');

        // 13. Captains & Waiters
        const captainsData = [
            { name: 'Alex Rivera', phone: '9811122201' },
            { name: 'Priya Sharma', phone: '9811122202' },
            { name: 'David Miller', phone: '9811122203' }
        ];
        for (const cap of captainsData) {
            await Captain.findOneAndUpdate(
                { company_id: companyId, name: cap.name },
                { company_id: companyId, ...cap, is_active: true },
                { upsert: true, new: true }
            );
        }

        const waitersData = [
            { name: 'Rahul Kumar', phone: '9822233301' },
            { name: 'Sunita Verma', phone: '9822233302' },
            { name: 'Amit Patel', phone: '9822233303' },
            { name: 'John Doe', phone: '9822233304' }
        ];
        for (const w of waitersData) {
            await Waiter.findOneAndUpdate(
                { company_id: companyId, name: w.name },
                { company_id: companyId, ...w, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Captains & Waiters');

        // 14. Tables
        const tablesData = [
            { table_number: 'T-01', seating_capacity: 4, table_type: 'AC Hall', captain: 'Alex Rivera', waiter: 'Rahul Kumar', status: 'AVAILABLE' },
            { table_number: 'T-02', seating_capacity: 4, table_type: 'AC Hall', captain: 'Alex Rivera', waiter: 'Rahul Kumar', status: 'OCCUPIED' },
            { table_number: 'T-03', seating_capacity: 6, table_type: 'AC Hall', captain: 'Priya Sharma', waiter: 'Sunita Verma', status: 'AVAILABLE' },
            { table_number: 'T-04', seating_capacity: 2, table_type: 'AC Hall', captain: 'Priya Sharma', waiter: 'Sunita Verma', status: 'RESERVED', reservation_name: 'Mr. Kapoor', reservation_phone: '9876543210', reservation_time: '20:00' },
            { table_number: 'T-05', seating_capacity: 8, table_type: 'AC Hall', captain: 'Alex Rivera', waiter: 'Rahul Kumar', status: 'AVAILABLE' },
            { table_number: 'G-01', seating_capacity: 4, table_type: 'Garden Patio', captain: 'David Miller', waiter: 'Amit Patel', status: 'AVAILABLE' },
            { table_number: 'G-02', seating_capacity: 6, table_type: 'Garden Patio', captain: 'David Miller', waiter: 'Amit Patel', status: 'OCCUPIED' },
            { table_number: 'G-03', seating_capacity: 4, table_type: 'Garden Patio', captain: 'David Miller', waiter: 'John Doe', status: 'AVAILABLE' },
            { table_number: 'VIP-1', seating_capacity: 8, table_type: 'VIP Lounge', captain: 'Priya Sharma', waiter: 'John Doe', status: 'AVAILABLE' },
            { table_number: 'VIP-2', seating_capacity: 10, table_type: 'VIP Lounge', captain: 'Priya Sharma', waiter: 'John Doe', status: 'RESERVED', reservation_name: 'Corporate Party', reservation_phone: '9988771122', reservation_time: '21:00' }
        ];
        const tableDocs = {};
        for (const t of tablesData) {
            const doc = await Table.findOneAndUpdate(
                { company_id: companyId, table_number: t.table_number },
                { company_id: companyId, ...t, is_active: true },
                { upsert: true, new: true }
            );
            tableDocs[t.table_number] = doc;
        }
        console.log('Seeded Tables');

        // 15. Function Types
        const functionTypesData = [
            { name: 'Dine In', description: 'Table Service in Restaurant' },
            { name: 'Takeaway', description: 'Over-the-counter Takeout' },
            { name: 'Home Delivery', description: 'Direct Home Delivery' },
            { name: 'Swiggy', description: 'Online Aggregator Swiggy' },
            { name: 'Zomato', description: 'Online Aggregator Zomato' },
            { name: 'Party Catering', description: 'Event and Bulk Orders' }
        ];
        for (const ft of functionTypesData) {
            await FunctionType.findOneAndUpdate(
                { company_id: companyId, name: ft.name },
                { company_id: companyId, ...ft, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Function Types');

        // 16. Customers
        const customersData = [
            { name: 'Rajesh Sharma', phone: '9876543210', email: 'rajesh@example.com', address: 'Indiranagar, Bengaluru', loyalty_points: 150 },
            { name: 'Anita Desai', phone: '9876543211', email: 'anita@example.com', address: 'Koramangala, Bengaluru', loyalty_points: 85 },
            { name: 'Vikram Reddy', phone: '9876543212', email: 'vikram@example.com', address: 'HSR Layout, Bengaluru', loyalty_points: 210 },
            { name: 'Sneha Gupta', phone: '9876543213', email: 'sneha@example.com', address: 'Whitefield, Bengaluru', loyalty_points: 40 },
            { name: 'Prakash Nair', phone: '9876543214', email: 'prakash@example.com', address: 'Jayanagar, Bengaluru', loyalty_points: 120 }
        ];
        const customerDocs = [];
        for (const c of customersData) {
            const doc = await Customer.findOneAndUpdate(
                { company_id: companyId, phone: c.phone },
                { company_id: companyId, ...c, is_active: true },
                { upsert: true, new: true }
            );
            customerDocs.push(doc);
        }
        console.log('Seeded Customers');

        // 17. Suppliers
        const suppliersData = [
            { name: 'Metro Cash & Carry', contact_person: 'Suresh Kumar', contact_number: '9123456789', email: 'metro@supplier.com', gstin: '29AAAAA0000A1Z5', address: 'Whitefield, Bengaluru', opening_balance: 15000 },
            { name: 'Royal Dairy Products', contact_person: 'Ramesh Patel', contact_number: '9123456788', email: 'royaldairy@supplier.com', gstin: '29BBBBB1111B1Z2', address: 'Indiranagar, Bengaluru', opening_balance: 4500 },
            { name: 'Fresh Organic Farms', contact_person: 'Venkatesh N', contact_number: '9123456787', email: 'freshfarms@supplier.com', gstin: '29CCCCC2222C1Z8', address: 'Hebbal, Bengaluru', opening_balance: 8000 }
        ];
        const supplierDocs = [];
        for (const s of suppliersData) {
            const doc = await Supplier.findOneAndUpdate(
                { company_id: companyId, name: s.name },
                { company_id: companyId, ...s, is_active: true },
                { upsert: true, new: true }
            );
            supplierDocs.push(doc);
        }
        console.log('Seeded Suppliers');

        // 18. Coupons
        const couponsData = [
            { coupon_name: 'WELCOME10', num_from: 1001, num_to: 2000, start_date: new Date('2024-01-01'), end_date: new Date('2026-12-31'), type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 10, is_active: true },
            { coupon_name: 'FLAT50', num_from: 2001, num_to: 3000, start_date: new Date('2024-01-01'), end_date: new Date('2026-12-31'), type: 'DISCOUNT', discount_type: 'FIXED', discount_value: 50, is_active: true },
            { coupon_name: 'FESTIVE20', num_from: 3001, num_to: 4000, start_date: new Date('2024-01-01'), end_date: new Date('2026-12-31'), type: 'DISCOUNT', discount_type: 'PERCENT', discount_value: 20, is_active: true }
        ];
        for (const c of couponsData) {
            await Coupon.findOneAndUpdate(
                { restaurant_id: companyId, coupon_name: c.coupon_name },
                { restaurant_id: companyId, ...c },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Discount Coupons');

        // 19. Products (Menu Items)
        const productsData = [
            { code: 'P001', name: 'Paneer Tikka', category: 'Starters', food_type: 'VEG', unit: 'Plate', selling_price: 240, purchase_price: 90, cost_price: 90, opening_stock: 50, current_stock: 50, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P002', name: 'Chicken 65', category: 'Starters', food_type: 'NON_VEG', unit: 'Plate', selling_price: 280, purchase_price: 110, cost_price: 110, opening_stock: 40, current_stock: 40, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P003', name: 'Veg Spring Roll', category: 'Starters', food_type: 'VEG', unit: 'Plate', selling_price: 180, purchase_price: 65, cost_price: 65, opening_stock: 60, current_stock: 60, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P004', name: 'Crispy Chilli Mushrooms', category: 'Starters', food_type: 'VEG', unit: 'Plate', selling_price: 220, purchase_price: 80, cost_price: 80, opening_stock: 45, current_stock: 45, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            
            { code: 'P005', name: 'Paneer Butter Masala', category: 'Main Course', food_type: 'VEG', unit: 'Plate', selling_price: 290, purchase_price: 115, cost_price: 115, opening_stock: 50, current_stock: 50, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P006', name: 'Butter Chicken', category: 'Main Course', food_type: 'NON_VEG', unit: 'Plate', selling_price: 350, purchase_price: 145, cost_price: 145, opening_stock: 40, current_stock: 40, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P007', name: 'Dal Makhani', category: 'Main Course', food_type: 'VEG', unit: 'Plate', selling_price: 220, purchase_price: 75, cost_price: 75, opening_stock: 55, current_stock: 55, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P008', name: 'Chicken Dum Biryani', category: 'Main Course', food_type: 'NON_VEG', unit: 'Portion', selling_price: 330, purchase_price: 130, cost_price: 130, opening_stock: 35, current_stock: 35, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P009', name: 'Veg Hyderabadi Biryani', category: 'Main Course', food_type: 'VEG', unit: 'Portion', selling_price: 260, purchase_price: 95, cost_price: 95, opening_stock: 30, current_stock: 30, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            
            { code: 'P010', name: 'Butter Naan', category: 'Breads & Naan', food_type: 'VEG', unit: 'Pcs', selling_price: 50, purchase_price: 14, cost_price: 14, opening_stock: 100, current_stock: 100, hsn_code: '1905', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P011', name: 'Garlic Naan', category: 'Breads & Naan', food_type: 'VEG', unit: 'Pcs', selling_price: 65, purchase_price: 18, cost_price: 18, opening_stock: 100, current_stock: 100, hsn_code: '1905', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P012', name: 'Tandoori Roti', category: 'Breads & Naan', food_type: 'VEG', unit: 'Pcs', selling_price: 30, purchase_price: 8, cost_price: 8, opening_stock: 120, current_stock: 120, hsn_code: '1905', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            
            { code: 'P013', name: 'Mango Lassi', category: 'Beverages', food_type: 'VEG', unit: 'Glass', selling_price: 90, purchase_price: 28, cost_price: 28, opening_stock: 80, current_stock: 80, hsn_code: '2202', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P014', name: 'Fresh Lime Soda', category: 'Beverages', food_type: 'VEG', unit: 'Glass', selling_price: 70, purchase_price: 18, cost_price: 18, opening_stock: 100, current_stock: 100, hsn_code: '2202', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P015', name: 'Cold Coffee with Ice Cream', category: 'Beverages', food_type: 'VEG', unit: 'Glass', selling_price: 130, purchase_price: 42, cost_price: 42, opening_stock: 50, current_stock: 50, hsn_code: '2202', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            
            { code: 'P016', name: 'Gulab Jamun (2 Pcs)', category: 'Desserts', food_type: 'VEG', unit: 'Plate', selling_price: 90, purchase_price: 25, cost_price: 25, opening_stock: 60, current_stock: 60, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 },
            { code: 'P017', name: 'Chocolate Lava Cake', category: 'Desserts', food_type: 'VEG', unit: 'Pcs', selling_price: 160, purchase_price: 55, cost_price: 55, opening_stock: 30, current_stock: 30, hsn_code: '2106', tax_id: taxDocs['GST 5%']?._id, gst_sales: 5 }
        ];

        const productDocs = [];
        for (const p of productsData) {
            const doc = await Product.findOneAndUpdate(
                { company_id: companyId, name: p.name },
                { company_id: companyId, ...p, is_active: true, is_deleted: false },
                { upsert: true, new: true }
            );
            productDocs.push(doc);
        }
        console.log('Seeded Products (Menu Items)');

        // 20. Accounting Ledgers
        const salesGroup = await LedgerGroup.findOne({ company_id: companyId, name: 'Sales Accounts' });
        const purchaseGroup = await LedgerGroup.findOne({ company_id: companyId, name: 'Purchase Accounts' });
        const cashGroup = await LedgerGroup.findOne({ company_id: companyId, name: 'Cash-in-hand' });
        const bankGroup = await LedgerGroup.findOne({ company_id: companyId, name: 'Bank Accounts' });
        const expGroup = await LedgerGroup.findOne({ company_id: companyId, name: 'Direct Expenses' });

        const ledgersData = [
            { name: 'Cash Account', group_id: cashGroup?._id || salesGroup?._id, is_default: true, opening_balance: 25000, balance_type: 'Dr' },
            { name: 'HDFC Bank Account', group_id: bankGroup?._id || salesGroup?._id, is_default: true, opening_balance: 150000, balance_type: 'Dr' },
            { name: 'Food Sales Account', group_id: salesGroup?._id, is_default: true, opening_balance: 0, balance_type: 'Cr' },
            { name: 'Raw Material Purchase Account', group_id: purchaseGroup?._id, is_default: true, opening_balance: 0, balance_type: 'Dr' },
            { name: 'Restaurant Rent Expense', group_id: expGroup?._id, is_default: false, opening_balance: 0, balance_type: 'Dr' },
            { name: 'Electricity & Utility Expense', group_id: expGroup?._id, is_default: false, opening_balance: 0, balance_type: 'Dr' }
        ];

        const ledgerDocs = {};
        for (const l of ledgersData) {
            const doc = await Ledger.findOneAndUpdate(
                { company_id: companyId, name: l.name },
                { company_id: companyId, ...l, is_active: true },
                { upsert: true, new: true }
            );
            ledgerDocs[l.name] = doc;
        }
        console.log('Seeded Accounting Ledgers');

        // 21. Purchases (Supplier Invoices)
        const purchasesData = [
            {
                supplier_id: supplierDocs[0]._id,
                invoice_number: 'INV-METRO-901',
                invoice_date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
                purchase_date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
                payment_type: 'CREDIT',
                due_days: 15,
                due_date: new Date(Date.now() + 12 * 24 * 3600 * 1000),
                items: [
                    { product_id: productDocs[0]._id, item_name: 'Paneer Tikka Raw Material', quantity: 20, purchase_rate: 90, amount: 1800, total_amount: 1890, gst_percent: 5 },
                    { product_id: productDocs[4]._id, item_name: 'Paneer Butter Gravy Base', quantity: 30, purchase_rate: 115, amount: 3450, total_amount: 3622.5, gst_percent: 5 }
                ],
                sub_total: 5250,
                tax_amount: 262.5,
                grand_total: 5512.5,
                payment_status: 'PAID',
                paid_amount: 5512.5,
                due_amount: 0,
                remarks: 'Stock refill for weekend'
            },
            {
                supplier_id: supplierDocs[1]._id,
                invoice_number: 'INV-ROYAL-402',
                invoice_date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
                purchase_date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
                payment_type: 'CREDIT',
                due_days: 7,
                due_date: new Date(Date.now() + 6 * 24 * 3600 * 1000),
                items: [
                    { product_id: productDocs[12]._id, item_name: 'Mango Lassi Milk Base', quantity: 50, purchase_rate: 28, amount: 1400, total_amount: 1470, gst_percent: 5 }
                ],
                sub_total: 1400,
                tax_amount: 70,
                grand_total: 1470,
                payment_status: 'UNPAID',
                paid_amount: 0,
                due_amount: 1470,
                remarks: 'Dairy purchase'
            }
        ];

        for (const pur of purchasesData) {
            await Purchase.findOneAndUpdate(
                { company_id: companyId, invoice_number: pur.invoice_number },
                { company_id: companyId, ...pur, is_deleted: false },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Purchase Invoices');

        // 22. Seed Bills, Orders, Payments for Dashboard & Reports across past 7 days!
        console.log('Generating sample Bills, Orders & Payments across last 7 days...');

        await Bill.deleteMany({ company_id: companyId });
        await Order.deleteMany({ company_id: companyId });
        await Payment.deleteMany({ company_id: companyId });

        const payModes = ['CASH', 'UPI', 'CARD', 'SPLIT'];
        const billTypes = ['DINE_IN', 'TAKEAWAY', 'SELF_SERVICE', 'DELIVERY'];
        const sampleTables = ['T-01', 'T-02', 'T-03', 'G-01', 'G-02', 'VIP-1'];
        const sampleCaptains = ['Alex Rivera', 'Priya Sharma', 'David Miller'];
        const sampleWaiters = ['Rahul Kumar', 'Sunita Verma', 'Amit Patel', 'John Doe'];

        let billCount = 100;
        const nowMs = Date.now();

        for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
            const dailyBillsCount = 5;
            for (let i = 0; i < dailyBillsCount; i++) {
                billCount++;
                const billDate = new Date(nowMs - (dayOffset * 24 * 3600 * 1000) + (i * 2.5 * 3600 * 1000));

                const type = billTypes[i % billTypes.length];
                const mode = payModes[(i + dayOffset) % payModes.length];
                const cust = customerDocs[i % customerDocs.length];
                const tableNo = type === 'DINE_IN' ? sampleTables[i % sampleTables.length] : undefined;
                const counter = counterDocs[i % counterDocs.length];

                const prod1 = productDocs[(i + dayOffset) % productDocs.length];
                const prod2 = productDocs[(i + dayOffset + 3) % productDocs.length];
                const prod3 = productDocs[(i + dayOffset + 6) % productDocs.length];

                const items = [
                    { product_id: prod1._id, name: prod1.name, quantity: 2, unit_price: prod1.selling_price, total_price: prod1.selling_price * 2, category: prod1.category, sent_kot_qty: 2 },
                    { product_id: prod2._id, name: prod2.name, quantity: 1, unit_price: prod2.selling_price, total_price: prod2.selling_price * 1, category: prod2.category, sent_kot_qty: 1 },
                    { product_id: prod3._id, name: prod3.name, quantity: 2, unit_price: prod3.selling_price, total_price: prod3.selling_price * 2, category: prod3.category, sent_kot_qty: 2 }
                ];

                const subTotal = items.reduce((acc, it) => acc + it.total_price, 0);
                const taxAmount = Math.round(subTotal * 0.05 * 100) / 100;
                const discountAmount = i % 3 === 0 ? 50 : 0;
                const grandTotal = Math.round(subTotal + taxAmount - discountAmount);

                const billNum = `BILL-${billDate.getFullYear()}${String(billDate.getMonth() + 1).padStart(2, '0')}-${String(billCount).padStart(4, '0')}`;

                let paymentModesList = [];
                let singlePayMode = 'CASH';
                if (mode === 'SPLIT') {
                    singlePayMode = 'SPLIT';
                    paymentModesList = [
                        { type: 'CASH', amount: Math.floor(grandTotal / 2), cash_received: Math.floor(grandTotal / 2), balance_return: 0 },
                        { type: 'UPI', amount: Math.ceil(grandTotal / 2), upi_reference: `UPI-REF-${billCount}89` }
                    ];
                } else if (mode === 'CARD') {
                    singlePayMode = 'CARD';
                    paymentModesList = [{ type: 'CARD', amount: grandTotal }];
                } else if (mode === 'UPI') {
                    singlePayMode = 'UPI';
                    paymentModesList = [{ type: 'UPI', amount: grandTotal, upi_reference: `UPI-REF-${billCount}90` }];
                } else {
                    singlePayMode = 'CASH';
                    paymentModesList = [{ type: 'CASH', amount: grandTotal, cash_received: grandTotal + 50, balance_return: 50 }];
                }

                // Create Order
                const orderNum = `ORD-${billCount}`;
                const orderDoc = await Order.create({
                    company_id: companyId,
                    order_number: orderNum,
                    table: tableDocs[tableNo]?._id,
                    no_of_persons: 3,
                    customer: cust._id,
                    items: items.map(it => ({ menu_item: it.product_id, name: it.name, quantity: it.quantity, unit_price: it.unit_price, total_price: it.total_price, status: 'SERVED' })),
                    sub_total: subTotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    grand_total: grandTotal,
                    status: 'BILLED',
                    created_by: adminUser._id,
                    createdAt: billDate,
                    updatedAt: billDate
                });

                // Create Bill
                const billDoc = await Bill.create({
                    company_id: companyId,
                    bill_number: billNum,
                    counter_id: counter._id,
                    table_no: tableNo,
                    order_id: orderDoc._id,
                    customer_id: cust._id,
                    customer_name: cust.name,
                    customer_phone: cust.phone,
                    persons: 3,
                    captain_name: sampleCaptains[i % sampleCaptains.length],
                    waiter_name: sampleWaiters[i % sampleWaiters.length],
                    status: 'PAID',
                    kitchen_status: 'SERVED',
                    type: type,
                    items: items,
                    sub_total: subTotal,
                    tax_amount: taxAmount,
                    discount_amount: discountAmount,
                    grand_total: grandTotal,
                    payment_mode: singlePayMode,
                    payment_modes: paymentModesList,
                    total_paid: grandTotal,
                    created_by: adminUser._id,
                    createdAt: billDate,
                    updatedAt: billDate
                });

                orderDoc.bill_id = billDoc._id;
                await orderDoc.save();

                // Create Payment record
                await Payment.create({
                    company_id: companyId,
                    bill_id: billDoc._id,
                    order_id: orderDoc._id,
                    customer_id: cust._id,
                    amount: grandTotal,
                    payment_mode: singlePayMode === 'SPLIT' ? 'CASH' : singlePayMode,
                    status: 'SUCCESS',
                    cash_received: grandTotal,
                    change_returned: 0,
                    created_by: adminUser._id,
                    createdAt: billDate,
                    updatedAt: billDate
                });
            }
        }
        console.log(`Seeded 35 Bills, Orders & Payments across last 7 days!`);

        // 23. Voucher Series
        const vSeries = [
            { series_name: 'Sales Invoices', prefix: 'INV', starting_number: 1, next_number: billCount + 1 },
            { series_name: 'Purchase Series', prefix: 'PUR', starting_number: 1, next_number: 10 },
            { series_name: 'Payment Series', prefix: 'PAY', starting_number: 1, next_number: 5 },
            { series_name: 'Receipt Series', prefix: 'REC', starting_number: 1, next_number: 5 },
            { series_name: 'Journal Series', prefix: 'JRN', starting_number: 1, next_number: 5 }
        ];
        for (const vs of vSeries) {
            await VoucherSeries.findOneAndUpdate(
                { company_id: companyId, series_name: vs.series_name },
                { company_id: companyId, ...vs, is_active: true },
                { upsert: true, new: true }
            );
        }
        console.log('Seeded Voucher Series');

        // 24. Vouchers & Account Transactions
        if (ledgerDocs['HDFC Bank Account'] && ledgerDocs['Restaurant Rent Expense']) {
            await Voucher.deleteMany({ company_id: companyId });
            await AccountTransaction.deleteMany({ company_id: companyId });

            const vRent = await Voucher.create({
                company_id: companyId,
                voucher_type: 'PAYMENT',
                voucher_number: 'PAY-0001',
                date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
                debit_ledger: ledgerDocs['Restaurant Rent Expense']._id,
                credit_ledger: ledgerDocs['HDFC Bank Account']._id,
                amount: 35000,
                narration: 'Monthly restaurant premises rent payment'
            });

            await AccountTransaction.create({
                company_id: companyId,
                date: vRent.date,
                ledger_id: ledgerDocs['Restaurant Rent Expense']._id,
                type: 'DEBIT',
                amount: 35000,
                voucher_type: 'PAYMENT',
                voucher_number: 'PAY-0001',
                reference_id: vRent._id,
                narration: 'Monthly rent payment'
            });

            await AccountTransaction.create({
                company_id: companyId,
                date: vRent.date,
                ledger_id: ledgerDocs['HDFC Bank Account']._id,
                type: 'CREDIT',
                amount: 35000,
                voucher_type: 'PAYMENT',
                voucher_number: 'PAY-0001',
                reference_id: vRent._id,
                narration: 'Monthly rent payment'
            });
        }
        console.log('Seeded Vouchers & Accounting Transactions');

        // 25. Settings Setup
        await Setting.findOneAndUpdate(
            { company_id: companyId },
            {
                company_id: companyId,
                general: {
                    restaurant_name: 'RestoBoard Fine Dining & Cafe',
                    address: '100 Feet Road, Indiranagar, Bengaluru, KA 560038',
                    phone: '9988776655',
                    email: 'admin@restoboard.com',
                    gstin: '29ABCDE1234F1Z5',
                    currency: '₹',
                    footer_note: 'Thank you! Please visit again.'
                },
                printer: {
                    thermal_80mm: true,
                    kot_printer_ip: '192.168.1.101',
                    bill_printer_ip: '192.168.1.100',
                    auto_print_kot: false,
                    auto_print_bill: false
                },
                loyalty: {
                    enabled: true,
                    points_per_100_spent: 1,
                    target_points: 100,
                    point_value_rupees: 1
                }
            },
            { upsert: true, new: true }
        );
        console.log('Seeded Settings');

        console.log('\n======================================================');
        console.log(' SUCCESS: All Sample Data Seeded Successfully!');
        console.log(' Credentials to login:');
        console.log('   Email / Username: admin@restoboard.com (or admin)');
        console.log('   Password:         password123');
        console.log('======================================================\n');

        return { success: true, message: 'All sample data seeded successfully' };

    } catch (err) {
        console.error('\n❌ Seeding Failed:', err);
        throw err;
    } finally {
        if (isStandalone && connection) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    }
}

if (require.main === module) {
    seedSampleData(true);
}

module.exports = seedSampleData;
