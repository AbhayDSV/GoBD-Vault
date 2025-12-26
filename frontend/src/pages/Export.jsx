import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, History, Package, CheckCircle, AlertCircle } from 'lucide-react';
import './Export.css';

const Export = () => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPreview();
    }, []);

    const fetchPreview = async () => {
        try {
            const response = await axios.get('/api/export/preview');
            setPreview(response.data);
        } catch (error) {
            console.error('Failed to fetch export preview:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setError('');
        setSuccess(false);

        try {
            const response = await axios.post('/api/export/tax-authority', {}, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `GoBD-Export-${new Date().toISOString().split('T')[0]}.zip`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Export generation failed');
        } finally {
            setExporting(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="export-page">
            <div className="export-header">
                <h1>Export for Tax Authority</h1>
                <p className="text-muted">Generate GoBD-compliant export for Finanzamt audit</p>
            </div>

            <div className="export-container">
                <div className="export-card">
                    <div className="export-icon">
                        <Package size={48} />
                    </div>

                    <h2>Tax Authority Export Package</h2>
                    <p className="text-muted">
                        This export includes all documents, machine-readable index, and complete audit trail
                        in compliance with §146 AO and §147 AO.
                    </p>

                    {preview && (
                        <div className="export-preview">
                            <h3>Export Contents</h3>
                            <div className="preview-grid">
                                <div className="preview-item">
                                    <FileText size={24} />
                                    <div>
                                        <div className="preview-label">Documents</div>
                                        <div className="preview-value">{preview.documentCount} files</div>
                                    </div>
                                </div>

                                <div className="preview-item">
                                    <History size={24} />
                                    <div>
                                        <div className="preview-label">Audit Logs</div>
                                        <div className="preview-value">{preview.auditLogCount} entries</div>
                                    </div>
                                </div>

                                <div className="preview-item">
                                    <Package size={24} />
                                    <div>
                                        <div className="preview-label">Total Size</div>
                                        <div className="preview-value">{formatFileSize(preview.totalSize)}</div>
                                    </div>
                                </div>

                                {preview.dateRange?.start && (
                                    <div className="preview-item">
                                        <FileText size={24} />
                                        <div>
                                            <div className="preview-label">Date Range</div>
                                            <div className="preview-value">
                                                {new Date(preview.dateRange.start).toLocaleDateString('de-DE')} - {new Date(preview.dateRange.end).toLocaleDateString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="export-includes">
                        <h3>Package Includes:</h3>
                        <ul>
                            <li>
                                <CheckCircle size={16} />
                                All original documents (PDF/XML)
                            </li>
                            <li>
                                <CheckCircle size={16} />
                                index.xml (machine-readable GoBD format)
                            </li>
                            <li>
                                <CheckCircle size={16} />
                                Complete audit trail (CSV + Text)
                            </li>
                            <li>
                                <CheckCircle size={16} />
                                SHA-256 hash verification data
                            </li>
                        </ul>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <CheckCircle size={18} />
                            Export generated successfully! Download should start automatically.
                        </div>
                    )}

                    <button
                        onClick={handleExport}
                        disabled={exporting || preview?.documentCount === 0}
                        className="btn btn-success btn-lg export-button"
                    >
                        {exporting ? (
                            <>
                                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                                Generating Export...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Generate Export for Tax Authority
                            </>
                        )}
                    </button>

                    {preview?.documentCount === 0 && (
                        <p className="text-muted" style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
                            No documents available to export
                        </p>
                    )}
                </div>

                <div className="compliance-card">
                    <h3>GoBD Compliance Information</h3>
                    <div className="compliance-content">
                        <div className="compliance-section">
                            <h4>Legal Requirements</h4>
                            <p>
                                The export package complies with §146 AO (Ordnungsvorschriften für die Buchführung)
                                and §147 AO (Aufbewahrung von Unterlagen) of the German Fiscal Code.
                            </p>
                        </div>

                        <div className="compliance-section">
                            <h4>What Tax Auditors Will Verify</h4>
                            <ul>
                                <li>Completeness of all tax-relevant documents</li>
                                <li>File integrity via SHA-256 hash verification</li>
                                <li>Chronological consistency of audit trail</li>
                                <li>Machine readability of index.xml</li>
                                <li>10-year retention period compliance</li>
                            </ul>
                        </div>

                        <div className="compliance-section">
                            <h4>Export Format</h4>
                            <p>
                                The export is provided as a ZIP archive containing all documents in their original
                                format, along with a GoBD-compliant XML index that can be imported into standard
                                tax audit software (IDEA, ACL).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Export;
