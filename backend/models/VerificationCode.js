import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const verificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    code: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index - auto-delete when expired
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash code before saving
verificationCodeSchema.pre('save', async function (next) {
    if (this.isModified('code')) {
        this.code = await bcrypt.hash(this.code, 10);
    }
    next();
});

// Method to verify code
verificationCodeSchema.methods.verifyCode = async function (code) {
    return await bcrypt.compare(code, this.code);
};

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

export default VerificationCode;
