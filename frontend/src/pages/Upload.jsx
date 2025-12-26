import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Lock, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Upload.css';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const navigate = useNavigate();

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (selectedFile) => {
        setError('');
        setUploadResult(null);

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/xml', 'text/xml'];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Only PDF and XML files are allowed');
            return;
        }

        // Validate file size (50MB)
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setFile(selectedFile);
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('document', file);

        try {
            const response = await axios.post('/api/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadResult(response.data.document);
            setFile(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="upload-page">
            <div className="upload-header">
                <h1>Upload Document</h1>
                <p className="text-muted">Upload tax-relevant documents for GoBD-compliant archiving</p>
            </div>

            {!uploadResult ? (
                <div className="upload-container">
                    <div
                        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {!file ? (
                            <>
                                <UploadIcon size={64} className="upload-icon" />
                                <h3>Drag and drop your document here</h3>
                                <p className="text-muted">or click to browse</p>
                                <input
                                    type="file"
                                    onChange={handleFileInput}
                                    accept=".pdf,.xml"
                                    className="file-input"
                                    id="file-input"
                                />
                                <label htmlFor="file-input" className="btn btn-primary">
                                    <FileText size={18} />
                                    Select File
                                </label>
                                <div className="upload-info">
                                    <p>Accepted formats: PDF, XML</p>
                                    <p>Maximum size: 50MB</p>
                                </div>
                            </>
                        ) : (
                            <div className="file-preview">
                                <FileText size={48} className="file-icon" />
                                <div className="file-details">
                                    <h4>{file.name}</h4>
                                    <p className="text-muted">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {file && (
                        <div className="upload-actions">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="btn btn-success btn-lg"
                            >
                                {uploading ? (
                                    <>
                                        <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon size={20} />
                                        Upload & Lock Document
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div className="upload-notice">
                        <Lock size={20} />
                        <div>
                            <strong>Important:</strong> Once uploaded, documents are immediately locked and cannot be modified or deleted for 10 years as required by GoBD compliance (§146 AO, §147 AO).
                        </div>
                    </div>
                </div>
            ) : (
                <div className="upload-success">
                    <div className="success-icon">
                        <CheckCircle size={64} />
                    </div>
                    <h2>Document Uploaded Successfully!</h2>
                    <p className="text-muted">Your document has been securely archived with WORM protection</p>

                    <div className="result-details">
                        <div className="result-item">
                            <FileText size={20} />
                            <div>
                                <div className="result-label">File Name</div>
                                <div className="result-value">{uploadResult.originalName}</div>
                            </div>
                        </div>

                        <div className="result-item">
                            <Hash size={20} />
                            <div>
                                <div className="result-label">SHA-256 Hash</div>
                                <div className="result-value hash-value">{uploadResult.fileHash}</div>
                            </div>
                        </div>

                        <div className="result-item">
                            <Lock size={20} />
                            <div>
                                <div className="result-label">Status</div>
                                <div className="badge badge-success">
                                    <Lock size={12} />
                                    LOCKED
                                </div>
                            </div>
                        </div>

                        <div className="result-item">
                            <FileText size={20} />
                            <div>
                                <div className="result-label">Retention Expiry</div>
                                <div className="result-value">
                                    {new Date(uploadResult.retentionExpiryDate).toLocaleDateString('de-DE')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="success-actions">
                        <button
                            onClick={() => setUploadResult(null)}
                            className="btn btn-primary"
                        >
                            <UploadIcon size={18} />
                            Upload Another Document
                        </button>
                        <button
                            onClick={() => navigate('/documents')}
                            className="btn btn-secondary"
                        >
                            <FileText size={18} />
                            View All Documents
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;
