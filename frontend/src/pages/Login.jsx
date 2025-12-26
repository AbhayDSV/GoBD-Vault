import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, KeyRound, User, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                result = await register(formData.name, formData.email, formData.password);
            }

            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Left Panel - Branding */}
            <div className="login-branding">
                <div className="branding-content">
                    <div className="branding-icon">
                        <Lock size={60} />
                    </div>
                    <h1>GoBD Digital Vault</h1>
                    <p>Secure, compliant document archiving for German tax requirements</p>

                    <div className="branding-features">
                        <div className="feature-item">
                            <div className="feature-icon">
                                <Lock size={20} />
                            </div>
                            <span>10-Year immutable document retention</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <KeyRound size={20} />
                            </div>
                            <span>SHA-256 cryptographic integrity</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <AlertCircle size={20} />
                            </div>
                            <span>Complete audit trail logging</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="login-subtitle">
                            {isLogin ? 'Sign in to access your documents' : 'Register for GoBD Digital Vault'}
                        </p>
                    </div>

                    <div className="login-tabs">
                        <button
                            className={`tab ${isLogin ? 'active' : ''}`}
                            onClick={() => {
                                setIsLogin(true);
                                setError('');
                            }}
                        >
                            Login
                        </button>
                        <button
                            className={`tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => {
                                setIsLogin(false);
                                setError('');
                            }}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="error-message">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="form-group">
                                <label className="label">
                                    <User size={16} />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="label">
                                <Mail size={16} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="input"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">
                                <KeyRound size={16} />
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                className="input"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <div className="compliance-badge">
                            <Lock size={14} />
                            <span>GoBD Compliant • §146 AO • §147 AO</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
