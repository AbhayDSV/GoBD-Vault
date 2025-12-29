import express from 'express';
import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import { authenticate } from '../middleware/auth.js';
import { generateVerificationCode, sendVerificationEmail } from '../utils/emailService.js';

const router = express.Router();

/**
 * POST /api/auth/send-verification
 * Send verification code to email
 */
router.post('/send-verification', async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Delete any existing verification codes for this email
        await VerificationCode.deleteMany({ email });

        // Generate 6-digit code
        const code = generateVerificationCode();

        // Save verification code (expires in 10 minutes)
        const verificationCode = new VerificationCode({
            email,
            code, // Will be hashed by pre-save hook
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        await verificationCode.save();

        // Send email
        await sendVerificationEmail(email, name, code);

        res.json({
            message: 'Verification code sent to your email',
            expiresIn: 600 // seconds
        });
    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

/**
 * POST /api/auth/verify-code
 * Verify the email code
 */
router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        // Find verification code
        const verificationRecord = await VerificationCode.findOne({ email });

        if (!verificationRecord) {
            return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
        }

        // Check if expired
        if (new Date() > verificationRecord.expiresAt) {
            await VerificationCode.deleteOne({ email });
            return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
        }

        // Check attempts
        if (verificationRecord.attempts >= 3) {
            await VerificationCode.deleteOne({ email });
            return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
        }

        // Verify code
        const isValid = await verificationRecord.verifyCode(code);

        if (!isValid) {
            verificationRecord.attempts += 1;
            await verificationRecord.save();
            return res.status(400).json({
                error: 'Invalid verification code',
                attemptsRemaining: 3 - verificationRecord.attempts
            });
        }

        // Code is valid - delete it
        await VerificationCode.deleteOne({ email });

        res.json({
            message: 'Email verified successfully',
            verified: true
        });
    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

/**
 * POST /api/auth/register
 * Register a new user (requires verified email)
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            name,
            role: 'user' // First user can be manually changed to admin in DB
        });

        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = user.generateAuthToken();

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        }
    });
});

export default router;
