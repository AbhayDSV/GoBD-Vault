import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Lock, Clock, TrendingUp, Activity, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalDocuments: 0,
        lockedDocuments: 0,
        expiringSoon: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [docsRes, auditRes] = await Promise.all([
                axios.get('/api/documents'),
                axios.get('/api/audit/stats')
            ]);

            const documents = docsRes.data.documents;
            const expiringSoon = documents.filter(doc =>
                doc.daysUntilExpiry > 0 && doc.daysUntilExpiry < 365
            ).length;

            setStats({
                totalDocuments: documents.length,
                lockedDocuments: documents.filter(d => d.status === 'LOCKED').length,
                expiringSoon,
                recentActivity: auditRes.data.recentActivity || []
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="text-muted">GoBD-compliant document archive overview</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                        <FileText size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Documents</div>
                        <div className="stat-value">{stats.totalDocuments}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <Lock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Locked Documents</div>
                        <div className="stat-value">{stats.lockedDocuments}</div>
                        <div className="stat-badge badge-success">
                            <Lock size={12} />
                            Immutable
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Expiring Soon</div>
                        <div className="stat-value">{stats.expiringSoon}</div>
                        <div className="stat-subtitle">Within 1 year</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Compliance Status</div>
                        <div className="stat-value">100%</div>
                        <div className="stat-badge badge-success">GoBD Compliant</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>
                            <Activity size={20} />
                            Recent Activity
                        </h3>
                    </div>
                    <div className="activity-list">
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    <div className={`activity-icon ${activity.action.toLowerCase()}`}>
                                        {activity.action === 'UPLOADED' && <FileText size={16} />}
                                        {activity.action === 'VIEWED' && <Activity size={16} />}
                                        {activity.action === 'DOWNLOADED' && <Download size={16} />}
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-title">
                                            {activity.user?.name || 'Unknown'} {activity.action.toLowerCase()} a document
                                        </div>
                                        <div className="activity-subtitle">
                                            {activity.document?.originalName || 'Document'} • {format(new Date(activity.timestamp), 'PPp')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <Activity size={48} className="text-muted" />
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>
                            <Lock size={20} />
                            Quick Actions
                        </h3>
                    </div>
                    <div className="quick-actions">
                        <button
                            className="action-button"
                            onClick={() => navigate('/upload')}
                        >
                            <FileText size={20} />
                            <div>
                                <div className="action-title">Upload Document</div>
                                <div className="action-subtitle">Add new tax-relevant document</div>
                            </div>
                        </button>

                        <button
                            className="action-button"
                            onClick={() => navigate('/documents')}
                        >
                            <Lock size={20} />
                            <div>
                                <div className="action-title">View Documents</div>
                                <div className="action-subtitle">Browse locked archive</div>
                            </div>
                        </button>

                        <button
                            className="action-button"
                            onClick={() => navigate('/export')}
                        >
                            <Download size={20} />
                            <div>
                                <div className="action-title">Export for Tax Authority</div>
                                <div className="action-subtitle">Generate GoBD export</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="compliance-info">
                <Lock size={20} />
                <div>
                    <strong>GoBD Compliance Active</strong>
                    <p>All documents are stored with immutable WORM protection and 10-year retention enforcement as required by §146 AO and §147 AO.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
