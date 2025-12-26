import crypto from 'crypto';
import fs from 'fs';

/**
 * Calculate SHA-256 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - SHA-256 hash in hexadecimal format
 */
export const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => {
            hash.update(data);
        });

        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });

        stream.on('error', (error) => {
            reject(error);
        });
    });
};

/**
 * Verify file integrity by comparing calculated hash with expected hash
 * @param {string} filePath - Path to the file
 * @param {string} expectedHash - Expected SHA-256 hash
 * @returns {Promise<boolean>} - True if hashes match, false otherwise
 */
export const verifyFileHash = async (filePath, expectedHash) => {
    try {
        const calculatedHash = await calculateFileHash(filePath);
        return calculatedHash === expectedHash;
    } catch (error) {
        console.error('Hash verification error:', error);
        return false;
    }
};
