/**
 * Calculate retention expiry date (10 years from upload date)
 * @param {Date} uploadDate - Document upload date
 * @returns {Date} - Retention expiry date
 */
export const calculateExpiryDate = (uploadDate) => {
    const expiryDate = new Date(uploadDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 10);
    return expiryDate;
};

/**
 * Check if retention period has expired
 * @param {Date} expiryDate - Retention expiry date
 * @returns {boolean} - True if retention period has expired
 */
export const isRetentionExpired = (expiryDate) => {
    const now = new Date();
    return now >= expiryDate;
};

/**
 * Calculate days remaining until retention expiry
 * @param {Date} expiryDate - Retention expiry date
 * @returns {number} - Days remaining (negative if expired)
 */
export const daysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};
