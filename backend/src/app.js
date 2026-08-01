const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');
const connectDB = require('./config/db');

// ─── Load env vars ─────────────────────────────────────────────────────────────
dotenv.config();

// ─── JWT fallback ─────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not set. Using default.');
    process.env.JWT_SECRET = 'default_jwt_secret_change_me';
}

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Trust proxy (Render / reverse proxy) ─────────────────────────────────────
app.set('trust proxy', 1);

// ─── Uploads directory ────────────────────────────────────────────────────────
// In Electron mode the upload path is passed via env; fallback to src/uploads
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const isElectron = process.env.ELECTRON_APP === 'true';

const corsOptions = {
    origin: (origin, callback) => {
        // Allow Electron renderer (no origin), localhost, and configured frontend URLs
        const allowed = [
            'http://localhost:5055',
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.FRONTEND_URL,
            'https://hotelpostool.vercel.app',
        ].filter(Boolean);

        if (!origin || isElectron || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials:          true,
    optionsSuccessStatus: 200,
    methods:              ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders:       ['Content-Type', 'Authorization'],
};

// ─── Core middleware ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors(corsOptions));

// Helmet – relaxed CSP so the Electron-served SPA works
app.use(helmet({
    contentSecurityPolicy: false, // React handles its own CSP
    crossOriginEmbedderPolicy: false,
}));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/dashboard',    require('./routes/dashboardRoutes'));
app.use('/api/products',     require('./routes/productRoutes'));
app.use('/api/categories',   require('./routes/categoryRoutes'));
app.use('/api/brands',       require('./routes/brandRoutes'));
app.use('/api/suppliers',    require('./routes/supplierRoutes'));
app.use('/api/customers',    require('./routes/customerRoutes'));
app.use('/api/tables',       require('./routes/tableRoutes'));
app.use('/api/table-types',  require('./routes/tableTypeRoutes'));
app.use('/api/orders',       require('./routes/orderRoutes'));
app.use('/api/captains',     require('./routes/captainRoutes'));
app.use('/api/waiters',      require('./routes/waiterRoutes'));
app.use('/api/ledgers',      require('./routes/ledgerRoutes'));
app.use('/api/ledger-groups',require('./routes/ledgerGroupRoutes'));
app.use('/api/kitchens',     require('./routes/kitchenRoutes'));
app.use('/api/printers',     require('./routes/printerRoutes'));
app.use('/api/purchases',    require('./routes/purchaseRoutes'));
app.use('/api/vouchers',     require('./routes/voucherRoutes'));
app.use('/api/voucher-series',require('./routes/voucherSeriesRoutes'));
app.use('/api/counters',     require('./routes/counterRoutes'));
app.use('/api/bills',        require('./routes/billRoutes'));
app.use('/api/stock',        require('./routes/stockRoutes'));
app.use('/api/reports',      require('./routes/reportsRoutes'));
app.use('/api/settings',     require('./routes/settingsRoutes'));
app.use('/api/roles',        require('./routes/roleRoutes'));
app.use('/api/receipts',     require('./routes/receiptRoutes'));
app.use('/api/payments',     require('./routes/paymentRoutes'));
app.use('/api/coupons',      require('./routes/couponRoutes'));
app.use('/api/units',        require('./routes/unitRoutes'));
app.use('/api/taxes',        require('./routes/taxRoutes'));
app.use('/api/function-types', require('./routes/functionTypeRoutes'));
// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Serve React Frontend (Electron / production) ─────────────────────────────
const frontendBuild = process.env.FRONTEND_BUILD;
if (frontendBuild && fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    // SPA fallback – Express 5 compatible: use app.use() instead of app.get('(.*)')
    app.use((req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(frontendBuild, 'index.html'));
    });
    console.log(`Frontend served from: ${frontendBuild}`);
} else {
    app.get('/', (_req, res) => res.send('API is running…'));
}

// ─── Error handler ────────────────────────────────────────────────────────────
const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5055;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});

module.exports = app;

// ─── Table Auto-Cleanup (2 min timeout for empty occupied tables) ─────────────
const Table = require('./models/Table');
const Bill = require('./models/Bill');

setInterval(async () => {
    try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const tables = await Table.find({
            status: 'OCCUPIED',
            occupied_since: { $lt: fiveMinsAgo },
            bill_id: { $ne: null }
        });

        for (const table of tables) {
            const bill = await Bill.findById(table.bill_id);
            // If the bill has no items (not a running table), we consider it abandoned
            if (!bill || !bill.items || bill.items.length === 0) {
                table.status = 'AVAILABLE';
                table.bill_id = null;
                table.running_amount = 0;
                table.occupied_since = null;
                await table.save();

                if (bill) {
                    await Bill.findByIdAndDelete(bill._id);
                }
                console.log(`Auto-freed table ${table.table_number} after 5 mins of inactivity.`);
            }
        }
    } catch (err) {
        console.error('Error in table auto-cleanup:', err);
    }
}, 60000); // Check every minute

