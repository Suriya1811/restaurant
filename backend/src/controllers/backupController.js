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
        if (data.$oid && typeof data.$oid === 'string') {
            return new mongoose.Types.ObjectId(data.$oid);
        }

        if (typeof data === 'string' && /^[0-9a-fA-F]{24}$/.test(data)) {
            return new mongoose.Types.ObjectId(data);
        }

        const converted = {};
        for (const key in data) {
            if (key === '$date' && typeof data[key] === 'string') {
                return new Date(data[key]);
            }
            
            if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data[key])) {
                converted[key] = new Date(data[key]);
            } else {
                converted[key] = convertToBSON(data[key]);
            }
        }
        return converted;
    }

    if (typeof data === 'string') {
        if (/^[0-9a-fA-F]{24}$/.test(data)) return new mongoose.Types.ObjectId(data);
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(data)) return new Date(data);
    }

    return data;
};

const Restaurant = require('../models/Restaurant');

// Helper for formatted date and time folder name: DD-MM-YYYY_hh-mm_AM/PM
const getTimestampedFolderName = (d = new Date()) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day}-${month}-${year}_${strHours}-${minutes}_${ampm}`;
};

// Default backup directory inside application installation path (Never root C: drive)
const getDefaultBackupDir = () => {
    return path.resolve(__dirname, '../../../Backup');
};

exports.createBackup = async (req, res) => {
    try {
        const { backupPath } = req.body;
        const company_id = req.user.restaurant_id;

        const restaurant = await Restaurant.findById(company_id);
        const defaultDir = getDefaultBackupDir();
        
        let targetRoot = backupPath || restaurant?.backup_settings?.backup_dir || defaultDir;
        if (!targetRoot || targetRoot.trim() === 'C:\\' || targetRoot.trim() === 'C:/' || targetRoot.includes('RestoBoard')) {
            targetRoot = defaultDir;
        }

        const now = new Date();
        const folderName = getTimestampedFolderName(now);
        const timestampedSubfolder = path.join(targetRoot, folderName);

        if (!fs.existsSync(timestampedSubfolder)) {
            fs.mkdirSync(timestampedSubfolder, { recursive: true });
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupData = {
            meta: {
                version: '2.0',
                company_id: company_id,
                timestamp: now.toISOString(),
                folder_name: folderName,
                exported_by: req.user.name || 'System'
            },
            collections: {}
        };

        for (const col of collections) {
            const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
            backupData.collections[col.name] = data;
        }

        const filename = `resfin_backup_${folderName}.json`;
        const fullPath = path.join(timestampedSubfolder, filename);

        fs.writeFileSync(fullPath, JSON.stringify(backupData, null, 2));

        // Save application settings JSON file in same timestamped folder
        const settingsFilename = `application_settings_${folderName}.json`;
        const settingsPath = path.join(timestampedSubfolder, settingsFilename);
        const appSettingsData = {
            restaurant: restaurant || {},
            backup_settings: restaurant?.backup_settings || {},
            timestamp: now.toISOString()
        };
        fs.writeFileSync(settingsPath, JSON.stringify(appSettingsData, null, 2));

        if (restaurant) {
            restaurant.backup_settings = restaurant.backup_settings || {};
            restaurant.backup_settings.last_backup_at = now;
            restaurant.backup_settings.backup_dir = targetRoot;
            await restaurant.save();
        }

        res.status(200).json({
            success: true,
            message: 'Backup created successfully in timestamped folder',
            data: {
                path: fullPath,
                folder: timestampedSubfolder,
                folderName: folderName,
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
        let { backupData, filename, mode } = req.body;
        if (!mode) mode = 'RESTORE';

        if (!backupData && filename) {
            const restaurant = await Restaurant.findById(req.user.restaurant_id);
            const defaultDir = getDefaultBackupDir();
            let targetDir = restaurant?.backup_settings?.backup_dir || defaultDir;
            if (!targetDir || targetDir.trim() === 'C:\\' || targetDir.trim() === 'C:/' || targetDir.includes('RestoBoard')) {
                targetDir = defaultDir;
            }
            let fullPath = filename;
            if (!path.isAbsolute(filename)) {
                fullPath = path.join(targetDir, filename);
                if (!fs.existsSync(fullPath)) {
                    const findFile = (dir, name) => {
                        if (!fs.existsSync(dir)) return null;
                        const entries = fs.readdirSync(dir, { withFileTypes: true });
                        for (const entry of entries) {
                            const p = path.join(dir, entry.name);
                            if (entry.isDirectory()) {
                                const found = findFile(p, name);
                                if (found) return found;
                            } else if (entry.name === name || p.endsWith(name)) {
                                return p;
                            }
                        }
                        return null;
                    };
                    const match = findFile(targetDir, filename);
                    if (match) fullPath = match;
                }
            }

            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({ success: false, message: `Backup file not found at: ${fullPath}` });
            }
            const fileContent = fs.readFileSync(fullPath, 'utf8');
            backupData = JSON.parse(fileContent);
        }

        if (!backupData) {
            return res.status(400).json({ success: false, message: 'No backup data or file provided' });
        }

        let collectionsObj = {};
        if (backupData.collections && typeof backupData.collections === 'object') {
            collectionsObj = backupData.collections;
        } else if (typeof backupData === 'object' && !Array.isArray(backupData)) {
            collectionsObj = backupData;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid database data format' });
        }

        session.startTransaction();
        const collectionNames = Object.keys(collectionsObj).filter(k => k !== 'meta');
        
        for (const colName of collectionNames) {
            const rawDocs = collectionsObj[colName];
            if (!Array.isArray(rawDocs)) continue;

            if (mode === 'RESTORE') {
                await mongoose.connection.db.collection(colName).deleteMany({}, { session });
                if (rawDocs.length > 0) {
                    const bsonDocs = rawDocs.map(doc => convertToBSON(doc));
                    await mongoose.connection.db.collection(colName).insertMany(bsonDocs, { session });
                }
            } else if (mode === 'ATTACH') {
                if (rawDocs.length > 0) {
                    for (const doc of rawDocs) {
                        const bsonDoc = convertToBSON(doc);
                        if (bsonDoc._id) {
                            await mongoose.connection.db.collection(colName).replaceOne(
                                { _id: bsonDoc._id },
                                bsonDoc,
                                { upsert: true, session }
                            );
                        } else {
                            await mongoose.connection.db.collection(colName).insertOne(bsonDoc, { session });
                        }
                    }
                }
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: mode === 'ATTACH' 
                ? 'External database data attached & merged successfully!' 
                : 'System database restored successfully from backup!'
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        console.error('Restore error:', error);
        res.status(500).json({ success: false, message: 'Operation failed: ' + error.message });
    }
};

exports.getBackupStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.user.restaurant_id);
        const defaultDir = getDefaultBackupDir();
        let targetDir = restaurant?.backup_settings?.backup_dir || defaultDir;
        if (!targetDir || targetDir.trim() === 'C:\\' || targetDir.trim() === 'C:/' || targetDir.includes('RestoBoard')) {
            targetDir = defaultDir;
        }

        let lastBackup = null;
        let filesList = [];

        const scanDirectory = (dir) => {
            if (!fs.existsSync(dir)) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('application_settings_')) {
                    const stats = fs.statSync(fullPath);
                    const relPath = path.relative(targetDir, fullPath);
                    filesList.push({
                        filename: entry.name,
                        relativePath: relPath,
                        fullPath: fullPath,
                        mtime: stats.mtime,
                        size: stats.size
                    });
                }
            }
        };

        scanDirectory(targetDir);
        filesList.sort((a, b) => b.mtime - a.mtime);

        if (filesList.length > 0) {
            lastBackup = {
                filename: filesList[0].filename,
                relativePath: filesList[0].relativePath,
                timestamp: filesList[0].mtime
            };
        }

        res.status(200).json({
            success: true,
            data: {
                lastBackup,
                backup_directory: targetDir,
                default_directory: defaultDir,
                settings: restaurant?.backup_settings || {
                    backup_dir: defaultDir,
                    on_startup: false,
                    on_exit: false,
                    auto_interval: 0
                },
                history: filesList.slice(0, 20)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBackupSettings = async (req, res) => {
    try {
        const { backup_dir, on_startup, on_exit, auto_interval } = req.body;
        const defaultDir = getDefaultBackupDir();
        let targetDir = backup_dir || defaultDir;
        if (!targetDir || targetDir.trim() === 'C:\\' || targetDir.trim() === 'C:/' || targetDir.includes('RestoBoard')) {
            targetDir = defaultDir;
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.user.restaurant_id,
            {
                'backup_settings.backup_dir': targetDir,
                'backup_settings.on_startup': !!on_startup,
                'backup_settings.on_exit': !!on_exit,
                'backup_settings.auto_interval': parseInt(auto_interval, 10) || 0
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Backup settings updated successfully',
            data: restaurant.backup_settings
        });
    } catch (error) {
        console.error('Update backup settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
