const mongoose = require('mongoose');

let retryCount = 0;
const MAX_RETRIES = 10;

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGODB_URI environment variable is not set');

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS:          45000,
            connectTimeoutMS:         15000,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        retryCount = 0; // reset on success
        return conn;

    } catch (error) {
        retryCount++;
        console.error(`MongoDB Connection Error (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);

        if (retryCount < MAX_RETRIES) {
            const delay = Math.min(retryCount * 2000, 10000); // backoff up to 10s
            console.log(`Retrying in ${delay / 1000}s…`);
            setTimeout(connectDB, delay);
        } else {
            console.error('Max MongoDB retries reached. Giving up.');
            if (process.env.NODE_ENV !== 'production' && process.env.ELECTRON_APP !== 'true') {
                process.exit(1);
            }
        }
    }
};

module.exports = connectDB;
