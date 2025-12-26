import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Eye, Lock, Search, Filter, Calendar, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import './Documents.css';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewModal, setViewModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentUrl, setDocumentUrl] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        filterDocuments();
    }, [searchTerm, filterType, documents]);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get('/api/documents');
            setDocuments(response.data.documents);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterDocuments = () => {
        let filtered = documents;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(doc =>
                doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.fileHash.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(doc => doc.mimeType === filterType);
        }

        setFilteredDocs(filtered);
    };

    const handleView = async (doc) => {
        setSelectedDocument(doc);
        setViewModal(true);

        try {
            const response = await axios.get(`/api/documents/${doc.id}/download`, {
                responseType: 'blob'
            });

            // Create blob with the correct MIME type from the response
            const blob = new Blob([response.data], { type: response.data.type || doc.mimeType });
            const url = window.URL.createObjectURL(blob);
            setDocumentUrl(url);
        } catch (error) {
            console.error('Failed to load document:', error);
            alert('Failed to load document');
        }
    };

    const closeModal = () => {
        setViewModal(false);
        setSelectedDocument(null);
        if (documentUrl) {
            window.URL.revokeObjectURL(documentUrl);
            setDocumentUrl(null);
        }
    };

    const handleDownload = async (docId, filename) => {
        try {
            const response = await axios.get(`/api/documents/${docId}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
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

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="documents-page">
            <div className="documents-header">
                <div>
                    <h1>Document Archive</h1>
                    <p className="text-muted">GoBD-compliant locked documents</p>
                </div>
                <div className="header-stats">
                    <div className="stat-badge">
                        <Lock size={16} />
                        {documents.length} Locked Documents
                    </div>
                </div>
            </div>

            <div className="documents-filters">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by filename or hash..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input"
                    />
                </div>

                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="input"
                    >
                        <option value="all">All Types</option>
                        <option value="application/pdf">PDF Only</option>
                        <option value="application/xml">XML Only</option>
                    </select>
                </div>
            </div>

            {filteredDocs.length > 0 ? (
                <div className="documents-grid">
                    {filteredDocs.map((doc) => (
                        <div key={doc.id} className="document-card">
                            <div className="document-icon">
                                <FileText size={32} />
                            </div>

                            <div className="document-content">
                                <h3 className="document-title">{doc.originalName}</h3>

                                <div className="document-meta">
                                    <div className="meta-item">
                                        <Calendar size={14} />
                                        <span>Uploaded: {format(new Date(doc.uploadDate), 'PP')}</span>
                                    </div>
                                    <div className="meta-item">
                                        <FileText size={14} />
                                        <span>{formatFileSize(doc.fileSize)}</span>
                                    </div>
                                </div>

                                <div className="document-hash">
                                    <Hash size={14} />
                                    <code>{doc.fileHash.substring(0, 16)}...</code>
                                </div>

                                <div className="document-badges">
                                    <div className="badge badge-success">
                                        <Lock size={12} />
                                        LOCKED
                                    </div>
                                    <div className={`badge badge-${getRetentionColor(doc.daysUntilExpiry)}`}>
                                        {doc.daysUntilExpiry > 0
                                            ? `${Math.floor(doc.daysUntilExpiry / 365)} years remaining`
                                            : 'Retention expired'}
                                    </div>
                                </div>
                            </div>

                            <div className="document-actions">
                                <button
                                    onClick={() => handleView(doc)}
                                    className="btn btn-secondary btn-sm"
                                    title="View Document"
                                >
                                    <Eye size={16} />
                                    View
                                </button>
                                <button
                                    onClick={() => handleDownload(doc.id, doc.originalName)}
                                    className="btn btn-primary btn-sm"
                                    title="Download"
                                >
                                    <Download size={16} />
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <FileText size={64} className="text-muted" />
                    <h3>No documents found</h3>
                    <p className="text-muted">
                        {searchTerm || filterType !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Upload your first document to get started'}
                    </p>
                </div>
            )}

            {/* Document Viewer Modal */}
            {viewModal && selectedDocument && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedDocument.originalName}</h2>
                            <button onClick={closeModal} className="modal-close">×</button>
                        </div>
                        <div className="modal-body">
                            {documentUrl ? (
                                selectedDocument.mimeType.startsWith('image/') ? (
                                    <img
                                        src={documentUrl}
                                        alt={selectedDocument.originalName}
                                        className="document-image"
                                    />
                                ) : (
                                    <iframe
                                        src={documentUrl}
                                        className="document-iframe"
                                        title={selectedDocument.originalName}
                                    />
                                )
                            ) : (
                                <div className="modal-loading">
                                    <div className="spinner"></div>
                                    <p>Loading document...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documents;
