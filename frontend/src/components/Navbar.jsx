import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, FileText, History, Download, LogOut, User, Shield } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <Lock className="brand-icon" size={24} />
                    <div>
                        <div className="brand-title">GoBD Digital Vault</div>
                        <div className="brand-subtitle">Compliant Archive</div>
                    </div>
                </Link>

                <div className="navbar-links">
                    <Link
                        to="/"
                        className={`nav-link ${isActive('/') ? 'active' : ''}`}
                    >
                        <FileText size={18} />
                        Dashboard
                    </Link>
                    <Link
                        to="/documents"
                        className={`nav-link ${isActive('/documents') ? 'active' : ''}`}
                    >
                        <Shield size={18} />
                        Documents
                    </Link>
                    <Link
                        to="/upload"
                        className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
                    >
                        <FileText size={18} />
                        Upload
                    </Link>
                    <Link
                        to="/audit"
                        className={`nav-link ${isActive('/audit') ? 'active' : ''}`}
                    >
                        <History size={18} />
                        Audit Log
                    </Link>
                    <Link
                        to="/export"
                        className={`nav-link ${isActive('/export') ? 'active' : ''}`}
                    >
                        <Download size={18} />
                        Export
                    </Link>
                </div>

                <div className="navbar-user">
                    <div className="user-info">
                        <User size={18} />
                        <div>
                            <div className="user-name">{user?.name}</div>
                            <div className="user-role">{user?.role}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
