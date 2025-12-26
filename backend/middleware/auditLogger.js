import AuditLog from '../models/AuditLog.js';

/**
 * Create audit log entry
 * @param {Object} logData - Audit log data
 */
export const createAuditLog = async (logData) => {
    try {
        const auditLog = new AuditLog({
            timestamp: new Date(),
            userId: logData.userId,
            action: logData.action,
            documentId: logData.documentId,
            fileHash: logData.fileHash,
            ipAddress: logData.ipAddress,
            userAgent: logData.userAgent,
            metadata: logData.metadata
        });

        await auditLog.save();
        return auditLog;
    } catch (error) {
        console.error('Audit log creation error:', error);
        // Don't throw error - audit logging should not break main operations
        // But log it for monitoring
    }
};

/**
 * Middleware to automatically log document actions
 */
export const auditLogMiddleware = (action) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to log after successful response
        res.send = function (data) {
            // Only log on successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                createAuditLog({
                    userId: req.userId,
                    action: action,
                    documentId: req.params.id || req.body.documentId,
                    fileHash: req.fileHash,
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    metadata: {
                        path: req.path,
                        method: req.method
                    }
                });
            }

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};
