import express from 'express';
import { authenticate } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

/**
 * GET /api/audit/logs
 * Get audit logs with optional filters
 */
router.get('/logs', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, userId, action, documentId, limit = 100, skip = 0 } = req.query;

        // Build query
        const query = {};

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (documentId) query.documentId = documentId;

        // Get logs
        const logs = await AuditLog.find(query)
            .populate('userId', 'name email')
            .populate('documentId', 'originalName')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await AuditLog.countDocuments(query);

        res.json({
            logs: logs.map(log => ({
                id: log._id,
                timestamp: log.timestamp,
                user: log.userId,
                action: log.action,
                document: log.documentId,
                fileHash: log.fileHash,
                ipAddress: log.ipAddress,
                metadata: log.metadata
            })),
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
});

/**
 * GET /api/audit/logs/:documentId
 * Get audit logs for a specific document
 */
router.get('/logs/:documentId', authenticate, async (req, res) => {
    try {
        const logs = await AuditLog.find({ documentId: req.params.documentId })
            .populate('userId', 'name email')
            .sort({ timestamp: -1 });

        res.json({
            logs: logs.map(log => ({
                id: log._id,
                timestamp: log.timestamp,
                user: log.userId,
                action: log.action,
                fileHash: log.fileHash,
                ipAddress: log.ipAddress
            }))
        });
    } catch (error) {
        console.error('Get document audit logs error:', error);
        res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
});

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();

        const actionStats = await AuditLog.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentActivity = await AuditLog.find()
            .populate('userId', 'name email')
            .populate('documentId', 'originalName')
            .sort({ timestamp: -1 })
            .limit(10);

        res.json({
            totalLogs,
            actionStats: actionStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            recentActivity: recentActivity.map(log => ({
                timestamp: log.timestamp,
                user: log.userId,
                action: log.action,
                document: log.documentId
            }))
        });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve audit statistics' });
    }
});

export default router;
