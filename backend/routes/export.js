import express from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import { generateIndexXML } from '../utils/xmlGenerator.js';

const router = express.Router();

/**
 * POST /api/export/tax-authority
 * Generate export for tax authority (Finanzamt)
 */
router.post('/tax-authority', authenticate, async (req, res) => {
    try {
        // Get all documents
        const documents = await Document.find()
            .populate('uploadedBy', 'name email')
            .sort({ uploadDate: 1 });

        if (documents.length === 0) {
            return res.status(400).json({ error: 'No documents to export' });
        }

        // Get all audit logs
        const auditLogs = await AuditLog.find()
            .populate('userId', 'name email')
            .sort({ timestamp: 1 });

        // Generate index.xml
        const indexXML = generateIndexXML(documents, auditLogs);

        // Create temporary directory for export
        const exportDir = path.join(process.env.UPLOAD_DIR || './uploads', 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const timestamp = Date.now();
        const exportPath = path.join(exportDir, `gobd-export-${timestamp}`);
        fs.mkdirSync(exportPath, { recursive: true });

        // Write index.xml
        fs.writeFileSync(path.join(exportPath, 'index.xml'), indexXML);

        // Generate audit log CSV
        const csvHeader = 'Timestamp,User ID,User Name,Action,Document ID,Document Name,File Hash,IP Address\n';
        const csvRows = auditLogs.map(log => {
            const userName = log.userId ? log.userId.name : 'Unknown';
            const docName = log.documentId ? (typeof log.documentId === 'object' ? log.documentId.originalName : '') : '';
            return `"${log.timestamp.toISOString()}","${log.userId?._id || ''}","${userName}","${log.action}","${log.documentId?._id || ''}","${docName}","${log.fileHash || ''}","${log.ipAddress || ''}"`;
        }).join('\n');
        const csvContent = csvHeader + csvRows;
        fs.writeFileSync(path.join(exportPath, 'audit_log.csv'), csvContent);

        // Generate audit log PDF (simple text format)
        const pdfContent = `GoBD AUDIT LOG REPORT
Generated: ${new Date().toISOString()}
Total Entries: ${auditLogs.length}

${'='.repeat(80)}

${auditLogs.map(log => {
            const userName = log.userId ? log.userId.name : 'Unknown';
            const docName = log.documentId ? (typeof log.documentId === 'object' ? log.documentId.originalName : '') : '';
            return `Timestamp: ${log.timestamp.toISOString()}
User: ${userName} (${log.userId?._id || ''})
Action: ${log.action}
Document: ${docName} (${log.documentId?._id || ''})
File Hash: ${log.fileHash || 'N/A'}
IP Address: ${log.ipAddress || 'N/A'}
${'-'.repeat(80)}`;
        }).join('\n')}

${'='.repeat(80)}

End of Audit Log Report
`;
        fs.writeFileSync(path.join(exportPath, 'audit_log.txt'), pdfContent);

        // Create documents directory
        const docsDir = path.join(exportPath, 'documents');
        fs.mkdirSync(docsDir, { recursive: true });

        // Copy all documents
        for (const doc of documents) {
            const sourcePath = path.join(process.env.UPLOAD_DIR || './uploads', doc.filename);
            const destPath = path.join(docsDir, doc.originalName);

            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
            }
        }

        // Create ZIP archive
        const zipPath = path.join(exportDir, `GoBD-Export-${timestamp}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', async () => {
            // Log export action
            await createAuditLog({
                userId: req.userId,
                action: 'EXPORT_GENERATED',
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                metadata: {
                    documentCount: documents.length,
                    auditLogCount: auditLogs.length,
                    exportSize: archive.pointer()
                }
            });

            // Send ZIP file
            res.download(zipPath, `GoBD-Export-${new Date().toISOString().split('T')[0]}.zip`, (err) => {
                // Clean up temporary files
                fs.rmSync(exportPath, { recursive: true, force: true });
                fs.unlinkSync(zipPath);

                if (err) {
                    console.error('Download error:', err);
                }
            });
        });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Export generation failed' });
        });

        archive.pipe(output);
        archive.directory(exportPath, false);
        archive.finalize();

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export generation failed' });
    }
});

/**
 * GET /api/export/preview
 * Get export preview information
 */
router.get('/preview', authenticate, async (req, res) => {
    try {
        const documentCount = await Document.countDocuments();
        const auditLogCount = await AuditLog.countDocuments();

        const oldestDoc = await Document.findOne().sort({ uploadDate: 1 });
        const newestDoc = await Document.findOne().sort({ uploadDate: -1 });

        const totalSize = await Document.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$fileSize' }
                }
            }
        ]);

        res.json({
            documentCount,
            auditLogCount,
            dateRange: {
                start: oldestDoc?.uploadDate,
                end: newestDoc?.uploadDate
            },
            totalSize: totalSize[0]?.total || 0
        });
    } catch (error) {
        console.error('Export preview error:', error);
        res.status(500).json({ error: 'Failed to generate export preview' });
    }
});

export default router;
