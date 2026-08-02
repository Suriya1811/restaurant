const { cleanupExpiredNewTables } = require('../controllers/tableController');

let cleanupInterval = null;

const startTableCleanupService = () => {
    // Immediate startup scan to release expired temporary sessions
    cleanupExpiredNewTables()
        .then(result => {
            if (result && result.released > 0) {
                console.log(`[TableCleanupService] Startup cleanup released ${result.released} expired temporary table session(s).`);
            }
        })
        .catch(err => console.error('[TableCleanupService] Startup error:', err));

    // Run periodic interval cleanup every 60 seconds
    if (!cleanupInterval) {
        cleanupInterval = setInterval(async () => {
            try {
                const result = await cleanupExpiredNewTables();
                if (result && result.released > 0) {
                    console.log(`[TableCleanupService] Periodic cleanup released ${result.released} expired temporary table session(s).`);
                }
            } catch (err) {
                console.error('[TableCleanupService] Periodic cleanup error:', err);
            }
        }, 60000);
    }
};

module.exports = { startTableCleanupService };
