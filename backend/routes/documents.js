import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import Document from '../models/Document.js';
import { calculateFileHash, verifyFileHash } from '../utils/hashCalculator.js';
import { calculateExpiryDate, daysUntilExpiry } from '../utils/retentionCalculator.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Only accept PDF and XML files
    const allowedMimeTypes = ['application/pdf', 'application/xml', 'text/xml'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and XML files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

/**
 * POST /api/documents/upload
 * Upload a new document
 */
router.post('/upload', authenticate, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;

        // Calculate SHA-256 hash
        const fileHash = await calculateFileHash(filePath);

        // Check if file with same hash already exists
        const existingDoc = await Document.findOne({ fileHash });
        if (existingDoc) {
            // Delete the uploaded file
            fs.unlinkSync(filePath);
            return res.status(400).json({
                error: 'Document already exists',
                existingDocument: existingDoc
            });
        }

        // Calculate retention expiry date (10 years)
        const uploadDate = new Date();
        const retentionExpiryDate = calculateExpiryDate(uploadDate);

        // Create document record
        const document = new Document({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileHash,
            fileSize: req.file.size,
            uploadDate,
            status: 'LOCKED',
            retentionExpiryDate,
            uploadedBy: req.userId
        });

        await document.save();

        // Set file to read-only
        fs.chmodSync(filePath, 0o444);

        // Create audit log
        await createAuditLog({
            userId: req.userId,
            action: 'UPLOADED',
            documentId: document._id,
            fileHash: document.fileHash,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            metadata: {
                originalName: document.originalName,
                fileSize: document.fileSize
            }
        });

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: {
                id: document._id,
                originalName: document.originalName,
                fileHash: document.fileHash,
                uploadDate: document.uploadDate,
                retentionExpiryDate: document.retentionExpiryDate,
                status: document.status,
                fileSize: document.fileSize
            }
        });
    } catch (error) {
        console.error('Upload error:', error);

        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Upload failed' });
    }
});

/**
 * GET /api/documents
 * List all documents
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const documents = await Document.find()
            .populate('uploadedBy', 'name email')
            .sort({ uploadDate: -1 });

        const documentsWithRetention = documents.map(doc => ({
            id: doc._id,
            originalName: doc.originalName,
            fileHash: doc.fileHash,
            fileSize: doc.fileSize,
            uploadDate: doc.uploadDate,
            retentionExpiryDate: doc.retentionExpiryDate,
            daysUntilExpiry: daysUntilExpiry(doc.retentionExpiryDate),
            status: doc.status,
            uploadedBy: doc.uploadedBy,
            mimeType: doc.mimeType
        }));

        res.json({ documents: documentsWithRetention });
    } catch (error) {
        console.error('List documents error:', error);
        res.status(500).json({ error: 'Failed to retrieve documents' });
    }
});

/**
 * GET /api/documents/:id
 * Get document details
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'name email');

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Log view action
        await createAuditLog({
            userId: req.userId,
            action: 'VIEWED',
            documentId: document._id,
            fileHash: document.fileHash,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        });

        res.json({
            document: {
                id: document._id,
                originalName: document.originalName,
                filename: document.filename,
                fileHash: document.fileHash,
                fileSize: document.fileSize,
                mimeType: document.mimeType,
                uploadDate: document.uploadDate,
                retentionExpiryDate: document.retentionExpiryDate,
                daysUntilExpiry: daysUntilExpiry(document.retentionExpiryDate),
                status: document.status,
                uploadedBy: document.uploadedBy
            }
        });
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to retrieve document' });
    }
});

/**
 * GET /api/documents/:id/download
 * Download a document
 */
router.get('/:id/download', authenticate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const filePath = path.join(process.env.UPLOAD_DIR || './uploads', document.filename);

        // Verify file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        // Verify file integrity
        const isValid = await verifyFileHash(filePath, document.fileHash);
        if (!isValid) {
            console.error('SECURITY ALERT: File hash mismatch for document', document._id);
            return res.status(500).json({
                error: 'File integrity check failed - potential tampering detected'
            });
        }

        // Log download action
        await createAuditLog({
            userId: req.userId,
            action: 'DOWNLOADED',
            documentId: document._id,
            fileHash: document.fileHash,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        });

        // Set proper content-type and send file inline for viewing
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
        res.sendFile(path.resolve(filePath));
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

/**
 * DELETE /api/documents/:id
 * Attempt to delete a document (will fail for locked documents)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check if document is locked
        if (document.status === 'LOCKED') {
            return res.status(403).json({
                error: 'GoBD Compliance Violation: Locked documents cannot be deleted',
                retentionExpiryDate: document.retentionExpiryDate,
                daysUntilExpiry: daysUntilExpiry(document.retentionExpiryDate)
            });
        }

        // This code will only execute if document is not locked
        // (which should never happen in this system)
        const filePath = path.join(process.env.UPLOAD_DIR || './uploads', document.filename);

        // Delete file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete document record
        await document.deleteOne();

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);

        if (error.statusCode === 403) {
            return res.status(403).json({ error: error.message });
        }

        res.status(500).json({ error: 'Delete failed' });
    }
});

export default router;
