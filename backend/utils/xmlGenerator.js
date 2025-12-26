import { js2xml } from 'xml-js';

/**
 * Generate GoBD-compliant index.xml for tax authority export
 * @param {Array} documents - Array of document objects
 * @param {Array} auditLogs - Array of audit log objects
 * @returns {string} - XML string
 */
export const generateIndexXML = (documents, auditLogs) => {
    const exportDate = new Date().toISOString();

    const xmlObject = {
        _declaration: {
            _attributes: {
                version: '1.0',
                encoding: 'UTF-8'
            }
        },
        GoBD_Export: {
            _attributes: {
                version: '1.0',
                exportDate: exportDate
            },
            ExportMetadata: {
                ExportDate: { _text: exportDate },
                RetentionPeriod: { _text: '10 years' },
                ComplianceStandard: { _text: 'GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff)' },
                LegalBasis: { _text: '§146 AO, §147 AO' },
                DocumentCount: { _text: documents.length.toString() },
                AuditLogCount: { _text: auditLogs.length.toString() }
            },
            Documents: {
                Document: documents.map(doc => ({
                    DocumentID: { _text: doc._id.toString() },
                    OriginalFilename: { _text: doc.originalName },
                    StoredFilename: { _text: doc.filename },
                    MimeType: { _text: doc.mimeType },
                    FileSize: { _text: doc.fileSize.toString() },
                    SHA256Hash: { _text: doc.fileHash },
                    UploadDate: { _text: doc.uploadDate.toISOString() },
                    RetentionExpiryDate: { _text: doc.retentionExpiryDate.toISOString() },
                    Status: { _text: doc.status },
                    UploadedBy: { _text: doc.uploadedBy.toString() }
                }))
            },
            AuditTrail: {
                AuditEntry: auditLogs.map(log => ({
                    Timestamp: { _text: log.timestamp.toISOString() },
                    UserID: { _text: log.userId.toString() },
                    Action: { _text: log.action },
                    DocumentID: { _text: log.documentId ? log.documentId.toString() : '' },
                    FileHash: { _text: log.fileHash || '' },
                    IPAddress: { _text: log.ipAddress || '' }
                }))
            }
        }
    };

    const xml = js2xml(xmlObject, { compact: true, spaces: 2 });
    return xml;
};
