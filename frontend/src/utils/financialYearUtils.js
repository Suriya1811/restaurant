/**
 * Financial Year calculation & helper utilities
 */

export const getAutomaticFinancialYear = (refDate = new Date()) => {
    const d = new Date(refDate);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed: Jan=0, Feb=1, Mar=2, Apr=3...

    let startYear, endYear;
    if (month >= 3) {
        // On or after 1st April: 01-04-CurrentYear to 31-03-NextYear
        startYear = year;
        endYear = year + 1;
    } else {
        // Before 1st April: 01-04-PrevYear to 31-03-CurrentYear
        startYear = year - 1;
        endYear = year;
    }

    const startDate = `${startYear}-04-01`;
    const endDate = `${endYear}-03-31`;
    const booksFromDate = `${startYear}-04-01`;
    const label = `01-04-${startYear} to 31-03-${endYear}`;

    return {
        startYear,
        endYear,
        startDate,
        endDate,
        booksFromDate,
        label
    };
};

export const getActiveFinancialYear = () => {
    try {
        const stored = localStorage.getItem('pos_active_fy');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.startDate && parsed.endDate) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error reading pos_active_fy:', e);
    }
    // Default to automatically calculated current FY
    return getAutomaticFinancialYear();
};

export const setActiveFinancialYear = (fyObj) => {
    localStorage.setItem('pos_active_fy', JSON.stringify(fyObj));
    window.dispatchEvent(new CustomEvent('financial_year_changed', { detail: fyObj }));
};

/**
 * Validates if the given start and end date range is a valid single Financial Year (maximum 12 months / 366 days).
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {{ isValid: boolean, isMultiYear: boolean, message: string }}
 */
export const validateSingleFinancialYear = (startDate, endDate) => {
    if (!startDate || !endDate) {
        return { isValid: false, isMultiYear: false, message: 'Financial Year start and end dates are required.' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { isValid: false, isMultiYear: false, message: 'Invalid Financial Year dates.' };
    }

    if (start >= end) {
        return { isValid: false, isMultiYear: false, message: 'Financial Year start date must be before end date.' };
    }

    // Calculate duration in days
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate duration in months
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    // Single FY cannot exceed 366 days or 12 months
    if (diffDays > 366 || monthDiff > 12) {
        return {
            isValid: false,
            isMultiYear: true,
            message: "Please keep only one Financial Year. Change the Financial Year to continue."
        };
    }

    return { isValid: true, isMultiYear: false, message: '' };
};

export const checkFinancialYearActive = () => {
    try {
        const activeFY = getActiveFinancialYear();
        if (!activeFY || !activeFY.endDate) return { isExpired: false, isInvalid: false, message: '' };

        // 1. Check if Financial Year is configured for more than 1 year (> 12 months)
        const valResult = validateSingleFinancialYear(activeFY.startDate, activeFY.endDate);
        if (!valResult.isValid && valResult.isMultiYear) {
            return {
                isExpired: false,
                isInvalid: true,
                message: valResult.message
            };
        }

        // 2. Check if Financial Year has expired
        const now = new Date();
        const endDate = new Date(activeFY.endDate);
        endDate.setHours(23, 59, 59, 999);

        if (now > endDate) {
            const formattedEndDate = endDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            return {
                isExpired: true,
                isInvalid: false,
                message: `The Financial Year (${activeFY.label || activeFY.startDate}) ended on ${formattedEndDate}. You cannot process new transactions until the Financial Year is changed. Please press Alt + F2 to switch to the new Financial Year.`
            };
        }

        return { isExpired: false, isInvalid: false, message: '' };
    } catch (err) {
        console.error('checkFinancialYearActive error:', err);
        return { isExpired: false, isInvalid: false, message: '' };
    }
};

export const generateFYPresets = (count = 6) => {
    const currentFY = getAutomaticFinancialYear();
    const presets = [];
    for (let i = 0; i < count; i++) {
        const startY = currentFY.startYear - i;
        const endY = currentFY.endYear - i;
        presets.push({
            startYear: startY,
            endYear: endY,
            startDate: `${startY}-04-01`,
            endDate: `${endY}-03-31`,
            label: `01-04-${startY} to 31-03-${endY}`
        });
    }
    return presets;
};
