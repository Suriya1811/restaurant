/**
 * Utility to check if a given entry / transaction date is locked under Data Auto Lock rules.
 *
 * Rules:
 * 1. If Data Auto Lock toggle is OFF, no entries are locked.
 * 2. If Data Auto Lock toggle is ON and Unlock Days = N (e.g. 3):
 *    Users can alter entries ONLY for the last N days (including today). Older entries are locked.
 * 3. If Data Auto Lock toggle is ON and Unlock Days is left blank / empty:
 *    Users can manually set Lock Date Up To to lock all entries created on or before that date.
 *
 * @param {Date|string} entryDate - The creation or transaction date of the record being edited/deleted.
 * @param {Object} [settingsOverride] - Optional settings object.
 * @returns {{ isLocked: boolean, message: string }}
 */
export const checkDataLock = (entryDate, settingsOverride = null) => {
    try {
        let settings = settingsOverride;
        if (!settings) {
            const raw = localStorage.getItem('moduleSettings');
            if (raw) {
                try { settings = JSON.parse(raw); } catch (e) { settings = {}; }
            } else {
                settings = {};
            }
        }

        const isAutoLockEnabled = !!settings.data_auto_lock_enabled;
        if (!isAutoLockEnabled) {
            return { isLocked: false, message: '' };
        }

        if (!entryDate) {
            return { isLocked: false, message: '' };
        }

        const dateToCheck = new Date(entryDate);
        if (isNaN(dateToCheck.getTime())) {
            return { isLocked: false, message: '' };
        }

        const unlockDaysVal = settings.unlock_days;
        const hasUnlockDays = unlockDaysVal !== null && unlockDaysVal !== undefined && String(unlockDaysVal).trim() !== '' && !isNaN(Number(unlockDaysVal)) && Number(unlockDaysVal) > 0;

        if (hasUnlockDays) {
            const days = Number(unlockDaysVal);
            const today = new Date();
            // Start of today minus (days - 1) days
            const allowedStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1), 0, 0, 0, 0);

            if (dateToCheck < allowedStart) {
                const formattedCutoff = allowedStart.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return {
                    isLocked: true,
                    message: `Data Auto Lock Enabled! Only entries from the last ${days} days (from ${formattedCutoff} onwards) can be altered.`
                };
            }
            return { isLocked: false, message: '' };
        }

        // If Unlock Days is left blank, check Lock Date Up To
        if (settings.lock_date_up_to) {
            const lockDate = new Date(settings.lock_date_up_to);
            // End of selected lock date
            lockDate.setHours(23, 59, 59, 999);

            if (dateToCheck <= lockDate) {
                const formattedLockDate = lockDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return {
                    isLocked: true,
                    message: `Data is locked up to ${formattedLockDate}! Entries created on or before this date cannot be altered or deleted.`
                };
            }
        }

        return { isLocked: false, message: '' };
    } catch (err) {
        console.error('checkDataLock error:', err);
        return { isLocked: false, message: '' };
    }
};
