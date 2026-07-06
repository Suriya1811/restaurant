const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Helper to convert ObjectIds and Dates back to their MongoDB types recursively
const convertToBSON = (data) => {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
        return data.map(item => convertToBSON(item));
    }

    if (typeof data === 'object') {
        // If it's a string representation of an ObjectId ($oid is standard in MongoDB Extended JSON)
        if (data.$oid && typeof data.$oid === 'string') {
            return new mongoose.Types.ObjectId(data.$oid);
        }

        // If it's a string that looks like an ObjectId (24 hex chars) and we want to try converting it
        // Note: This can be aggressive, but for a full restore, it's often safer than leaving it as a string
        if (typeof data === 'string' && /^[0-9a-fA-F]{24}$/.test(data)) {
            return new mongoose.Types.ObjectId(data);
        }

        const converted = {};
        for (const key in data) {
            // Special handling for MongoDB Extended JSON dates if they exist
            if (key === '$date' && typeof data[key] === 'string') {
                return new Date(data[key]);
            }
            
            // Check if string is a valid ISO Date
            if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data[key])) {
                converted[key] = new Date(data[key]);
            } else {
                converted[key] = convertToBSON(data[key]);
            }
        }
        return converted;
    }

    // Handle plain strings that might be ObjectIds or Dates at top level (unlikely but possible)
    if (typeof data === 'string') {
        if (/^[0-9a-fA-F]{24}$/.test(data)) return new mongoose.Types.ObjectId(data);
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data)) return new Date(data);
    }

    return data;
};

exports.createBackup = async (req, res) => {
    try {
        const { backupPath } = req.body;
        const targetDir = backupPath || path.resolve(__dirname, '../../../backups');
        const company_id = req.user.restaurant_id;

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupData = {
            meta: {
                version: '2.0',
                company_id: company_id,
                timestamp: new Date().toISOString(),
                exported_by: req.user.name || 'System'
            },
            collections: {}
        };

        for (const col of collections) {
            // We backup all collections for a full system backup
            // In a multi-tenant cloud setup, we would filter by company_id here
            const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
            backupData.collections[col.name] = data;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.json`;
        const fullPath = path.join(targetDir, filename);

        fs.writeFileSync(fullPath, JSON.stringify(backupData, null, 2));

        res.status(200).json({
            success: true,
            message: 'Backup created successfully',
            data: {
                path: fullPath,
                filename: filename,
                timestamp: backupData.meta.timestamp
            }
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ success: false, message: 'Failed to create backup: ' + error.message });
    }
};

exports.restoreBackup = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { backupData } = req.body;

        if (!backupData || !backupData.collections) {
            return res.status(400).json({ success: false, message: 'Invalid backup file format' });
        }

        // Basic validation
        if (!backupData.meta) {
            console.warn('Restoring from a legacy backup file (no metadata)');
        }

        // Start a transaction for the entire restore process to ensure atomicity
        session.startTransaction();

        const collectionNames = Object.keys(backupData.collections);
        
        for (const colName of collectionNames) {
            const rawDocs = backupData.collections[colName];
            
            // 1. Clear existing collection
            await mongoose.connection.db.collection(colName).deleteMany({}, { session });

            // 2. Insert backed up documents (with BSON conversion)
            if (rawDocs && rawDocs.length > 0) {
                const bsonDocs = rawDocs.map(doc => convertToBSON(doc));
                await mongoose.connection.db.collection(colName).insertMany(bsonDocs, { session });
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'System data restored successfully. All ObjectIds and Dates have been preserved.'
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        console.error('Restore error:', error);
        res.status(500).json({ success: false, message: 'Restore failed: ' + error.message });
    }
};

exports.getBackupStatus = async (req, res) => {
    try {
        const targetDir = path.resolve(__dirname, '../../../backups');
        let lastBackup = null;

        if (fs.existsSync(targetDir)) {
            const files = fs.readdirSync(targetDir)
                .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
                .map(f => {
                    const stats = fs.statSync(path.join(targetDir, f));
                    return { filename: f, mtime: stats.mtime };
                })
                .sort((a, b) => b.mtime - a.mtime);

            if (files.length > 0) {
                lastBackup = {
                    filename: files[0].filename,
                    timestamp: files[0].mtime
                };
            }
        }

        res.status(200).json({
            success: true,
            data: {
                lastBackup,
                backup_directory: targetDir
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
