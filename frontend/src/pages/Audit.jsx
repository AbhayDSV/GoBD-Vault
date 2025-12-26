import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Download, Eye, FileText, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import './Audit.css';

const Audit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            const response = await axios.get('/api/audit/logs?limit=100');
            setLogs(response.data.logs);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'UPLOADED':
                return <FileText size={16} />;
            case 'VIEWED':
                return <Eye size={16} />;
            case 'DOWNLOADED':
                return <Download size={16} />;
            case 'EXPORT_GENERATED':
                return <Download size={16} />;
            default:
                return <History size={16} />;
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
            case 'EXPORT_GENERATED':
                return 'success';
            default:
                return 'primary';
        }
    };

    const filteredLogs = filterAction
        ? logs.filter(log => log.action === filterAction)
        : logs;

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="audit-page">
            <div className="audit-header">
                <div>
                    <h1>Audit Trail</h1>
                    <p className="text-muted">Immutable log of all document actions</p>
                </div>
                <div className="audit-stats">
                    <div className="badge badge-success">
                        <History size={14} />
                        {logs.length} Log Entries
                    </div>
                </div>
            </div>

            <div className="audit-filters">
                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="input"
                    >
                        <option value="">All Actions</option>
                        <option value="UPLOADED">Uploaded</option>
                        <option value="VIEWED">Viewed</option>
                        <option value="DOWNLOADED">Downloaded</option>
                        <option value="EXPORT_GENERATED">Export Generated</option>
                    </select>
                </div>
            </div>

            <div className="audit-notice">
                <History size={20} />
                <div>
                    <strong>Immutable Audit Trail:</strong> All entries are append-only and cannot be modified or deleted. This ensures complete traceability as required by GoBD compliance.
                </div>
            </div>

            {filteredLogs.length > 0 ? (
                <div className="audit-table-container">
                    <table className="table audit-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>User</th>
                                <th>Document</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>
                                        <div className="timestamp">
                                            <Calendar size={14} />
                                            {format(new Date(log.timestamp), 'PPp')}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`badge badge-${getActionColor(log.action)}`}>
                                            {getActionIcon(log.action)}
                                            {log.action}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-name">{log.user?.name || 'Unknown'}</div>
                                            <div className="user-email">{log.user?.email || ''}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="document-cell">
                                            {log.document?.originalName || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <code className="ip-address">{log.ipAddress || 'N/A'}</code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <History size={64} className="text-muted" />
                    <h3>No audit logs found</h3>
                    <p className="text-muted">
                        {filterAction ? 'Try adjusting your filter' : 'Audit logs will appear here'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Audit;
