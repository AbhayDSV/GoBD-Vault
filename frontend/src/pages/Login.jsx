import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, KeyRound, User, AlertCircle, Check } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);

    // Registration steps: 1 = email, 2 = verify code, 3 = password
    const [registrationStep, setRegistrationStep] = useState(1);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        code: ['', '', '', '', '', '']
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Refs for OTP inputs
    const otpRefs = useRef([]);

    // Timer countdown
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newCode = [...formData.code];
        newCode[index] = value.slice(-1); // Only last digit
        setFormData({ ...formData, code: newCode });
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !formData.code[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleSendVerification = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification code');
            }

            setRegistrationStep(2);
            setTimer(600); // 10 minutes
            setCanResend(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const code = formData.code.join('');
        if (code.length !== 6) {
            setError('Please enter all 6 digits');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    code
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid verification code');
            }

            setRegistrationStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend) return;

        setError('');
        setLoading(true);
        setFormData({ ...formData, code: ['', '', '', '', '', ''] });

        try {
            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend code');
            }

            setTimer(600);
            setCanResend(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const result = await register(formData.name, formData.email, formData.password);

            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData.email, formData.password);

            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetRegistration = () => {
        setRegistrationStep(1);
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            code: ['', '', '', '', '', '']
        });
        setError('');
        setTimer(0);
        setCanResend(false);
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

            {/* Right Panel - Login/Register Form */}
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="login-subtitle">
                            {isLogin ? 'Sign in to access your documents' : 'Register for GoBD Digital Vault'}
                        </p>
                    </div>

                    {!isLogin && registrationStep > 1 && (
                        <div className="step-indicator">
                            <div className={`step ${registrationStep >= 1 ? 'active' : ''} ${registrationStep > 1 ? 'completed' : ''}`}>
                                <div className="step-circle">
                                    {registrationStep > 1 ? <Check size={16} /> : '1'}
                                </div>
                                <span>Email</span>
                            </div>
                            <div className="step-line"></div>
                            <div className={`step ${registrationStep >= 2 ? 'active' : ''} ${registrationStep > 2 ? 'completed' : ''}`}>
                                <div className="step-circle">
                                    {registrationStep > 2 ? <Check size={16} /> : '2'}
                                </div>
                                <span>Verify</span>
                            </div>
                            <div className="step-line"></div>
                            <div className={`step ${registrationStep >= 3 ? 'active' : ''}`}>
                                <div className="step-circle">3</div>
                                <span>Password</span>
                            </div>
                        </div>
                    )}

                    <div className="login-tabs">
                        <button
                            className={`tab ${isLogin ? 'active' : ''}`}
                            onClick={() => {
                                setIsLogin(true);
                                resetRegistration();
                            }}
                        >
                            Login
                        </button>
                        <button
                            className={`tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => {
                                setIsLogin(false);
                                resetRegistration();
                            }}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    {isLogin && (
                        <form onSubmit={handleLogin} className="login-form">
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
                                />
                            </div>

                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Sign In'}
                            </button>
                        </form>
                    )}

                    {/* Registration Step 1: Name & Email */}
                    {!isLogin && registrationStep === 1 && (
                        <form onSubmit={handleSendVerification} className="login-form">
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
                                    required
                                />
                            </div>

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

                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Send Verification Code'}
                            </button>
                        </form>
                    )}

                    {/* Registration Step 2: Verify Code */}
                    {!isLogin && registrationStep === 2 && (
                        <form onSubmit={handleVerifyCode} className="login-form">
                            <div className="form-group">
                                <label className="label">
                                    <Mail size={16} />
                                    Verification Code
                                </label>
                                <p className="input-hint">Enter the 6-digit code sent to {formData.email}</p>

                                <div className="otp-container">
                                    {formData.code.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={el => otpRefs.current[index] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            className="otp-input"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>

                                {timer > 0 && (
                                    <p className="timer-text">Code expires in {formatTime(timer)}</p>
                                )}
                            </div>

                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Verify Code'}
                            </button>

                            <button
                                type="button"
                                className="resend-button"
                                onClick={handleResendCode}
                                disabled={!canResend || loading}
                            >
                                {canResend ? 'Resend Code' : `Resend in ${formatTime(timer)}`}
                            </button>

                            <button
                                type="button"
                                className="back-button"
                                onClick={() => setRegistrationStep(1)}
                            >
                                ← Change Email
                            </button>
                        </form>
                    )}

                    {/* Registration Step 3: Create Password */}
                    {!isLogin && registrationStep === 3 && (
                        <form onSubmit={handleRegister} className="login-form">
                            <div className="form-group">
                                <label className="label">
                                    <KeyRound size={16} />
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    className="input"
                                    placeholder="Create a password (min 6 characters)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">
                                    <KeyRound size={16} />
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="input"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Create Account'}
                            </button>
                        </form>
                    )}

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
