import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, FileText, Lock, Calendar, Hash, User, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import './DocumentViewer.css';

const DocumentViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [documentUrl, setDocumentUrl] = useState(null);
    const [documentContent, setDocumentContent] = useState(null);

    useEffect(() => {
        fetchDocument();
        fetchAuditLogs();
        fetchDocumentPreview();
    }, [id]);

    const fetchDocument = async () => {
        try {
            const response = await axios.get(`/api/documents/${id}`);
            setDocument(response.data.document);
        } catch (error) {
            console.error('Failed to fetch document:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const response = await axios.get(`/api/audit/logs/${id}`);
            setAuditLogs(response.data.logs);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        }
    };

    const fetchDocumentPreview = async () => {
        try {
            const response = await axios.get(`/api/documents/${id}/download`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            setDocumentUrl(url);

            // If it's XML, also get text content for formatted display
            if (response.data.type.includes('xml')) {
                const text = await response.data.text();
                setDocumentContent(text);
            }
        } catch (error) {
            console.error('Failed to fetch document preview:', error);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get(`/api/documents/${id}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', document.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getRetentionColor = (days) => {
        if (days < 0) return 'error';
        if (days < 365) return 'warning';
        return 'success';
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'UPLOADED':
                return <FileText size={16} />;
            case 'VIEWED':
                return <Eye size={16} />;
            case 'DOWNLOADED':
                return <Download size={16} />;
            default:
                return <FileText size={16} />;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'UPLOADED':
                return 'primary';
            case 'VIEWED':
                return 'info';
            case 'DOWNLOADED':
                return 'warning';
            default:
                return 'primary';
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="document-viewer-page">
                <div className="empty-state">
                    <FileText size={64} className="text-muted" />
                    <h3>Document not found</h3>
                    <button onClick={() => navigate('/documents')} className="btn btn-primary">
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="document-viewer-page">
            <div className="viewer-header">
                <button onClick={() => navigate('/documents')} className="btn btn-secondary">
                    <ArrowLeft size={18} />
                    Back to Documents
                </button>
                <button onClick={handleDownload} className="btn btn-primary">
                    <Download size={18} />
                    Download
                </button>
            </div>

            <div className="viewer-container">
                <div className="document-details-card">
                    <div className="document-header">
                        <div className="document-icon-large">
                            <FileText size={48} />
                        </div>
                        <div>
                            <h1>{document.originalName}</h1>
                            <div className="document-badges">
                                <div className="badge badge-success">
                                    <Lock size={12} />
                                    LOCKED
                                </div>
                                <div className={`badge badge-${getRetentionColor(document.daysUntilExpiry)}`}>
                                    {document.daysUntilExpiry > 0
                                        ? `${Math.floor(document.daysUntilExpiry / 365)} years remaining`
                                        : 'Retention expired'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="details-grid">
                        <div className="detail-item">
                            <div className="detail-icon">
                                <Hash size={20} />
                            </div>
                            <div>
                                <div className="detail-label">SHA-256 Hash</div>
                                <div className="detail-value hash-value">{document.fileHash}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <div className="detail-label">Upload Date</div>
                                <div className="detail-value">
                                    {format(new Date(document.uploadDate), 'PPP')}
                                </div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <Clock size={20} />
                            </div>
                            <div>
                                <div className="detail-label">Retention Expiry</div>
                                <div className="detail-value">
                                    {format(new Date(document.retentionExpiryDate), 'PPP')}
                                </div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="detail-label">File Size</div>
                                <div className="detail-value">{formatFileSize(document.fileSize)}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="detail-label">MIME Type</div>
                                <div className="detail-value">{document.mimeType}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <User size={20} />
                            </div>
                            <div>
                                <div className="detail-label">Uploaded By</div>
                                <div className="detail-value">
                                    {document.uploadedBy?.name || 'Unknown'}
                                </div>
                                <div className="detail-subtitle">{document.uploadedBy?.email}</div>
                            </div>
                        </div>
                    </div>

                    <div className="compliance-notice">
                        <Lock size={20} />
                        <div>
                            <strong>GoBD Compliance:</strong> This document is immutably locked and cannot be modified or deleted for 10 years as required by §146 AO and §147 AO.
                        </div>
                    </div>
                </div>

                {/* Document Preview Section */}
                <div className="document-preview-card">
                    <h3>
                        <Eye size={20} />
                        Document Preview
                    </h3>

                    {documentUrl && document ? (
                        <div className="preview-container">
                            {document.mimeType === 'application/pdf' ? (
                                <iframe
                                    src={documentUrl}
                                    className="pdf-preview"
                                    title={document.originalName}
                                />
                            ) : (
                                <div className="xml-preview">
                                    <pre>
                                        <code>{documentContent || 'Loading XML content...'}</code>
                                    </pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="preview-loading">
                            <div className="spinner"></div>
                            <p>Loading document preview...</p>
                        </div>
                    )}
                </div>

                <div className="audit-trail-card">
                    <h3>
                        <Eye size={20} />
                        Document Audit Trail
                    </h3>
                    <p className="text-muted">Complete history of actions performed on this document</p>

                    {auditLogs.length > 0 ? (
                        <div className="audit-timeline">
                            {auditLogs.map((log, index) => (
                                <div key={log.id} className="timeline-item">
                                    <div className="timeline-marker">
                                        <div className={`timeline-icon ${log.action.toLowerCase()}`}>
                                            {getActionIcon(log.action)}
                                        </div>
                                        {index < auditLogs.length - 1 && <div className="timeline-line"></div>}
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <div className={`badge badge-${getActionColor(log.action)}`}>
                                                {log.action}
                                            </div>
                                            <span className="timeline-time">
                                                {format(new Date(log.timestamp), 'PPp')}
                                            </span>
                                        </div>
                                        <div className="timeline-details">
                                            <div className="timeline-user">
                                                <User size={14} />
                                                {log.user?.name || 'Unknown'}
                                            </div>
                                            {log.ipAddress && (
                                                <div className="timeline-ip">
                                                    IP: <code>{log.ipAddress}</code>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-small">
                            <Eye size={32} className="text-muted" />
                            <p>No audit logs available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
