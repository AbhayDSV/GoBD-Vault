import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        immutable: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    action: {
        type: String,
        required: true,
        enum: ['UPLOADED', 'VIEWED', 'DOWNLOADED', 'EXPORT_GENERATED'],
        immutable: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        immutable: true
    },
    fileHash: {
        type: String,
        immutable: true
    },
    ipAddress: {
        type: String,
        immutable: true
    },
    userAgent: {
        type: String,
        immutable: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        immutable: true
    }
}, {
    timestamps: false // We use our own timestamp field
});

// Prevent any updates to audit logs
auditLogSchema.pre('save', function (next) {
    if (!this.isNew) {
        const error = new Error('GoBD Compliance Violation: Audit logs are immutable and cannot be modified');
        error.statusCode = 403;
        return next(error);
    }
    next();
});

// Block all update operations
auditLogSchema.pre('findOneAndUpdate', function (next) {
    const error = new Error('GoBD Compliance Violation: Audit logs cannot be updated');
    error.statusCode = 403;
    return next(error);
});

auditLogSchema.pre('updateOne', function (next) {
    const error = new Error('GoBD Compliance Violation: Audit logs cannot be updated');
    error.statusCode = 403;
    return next(error);
});

// Block all delete operations
auditLogSchema.pre('remove', function (next) {
    const error = new Error('GoBD Compliance Violation: Audit logs cannot be deleted');
    error.statusCode = 403;
    return next(error);
});

auditLogSchema.pre('deleteOne', function (next) {
    const error = new Error('GoBD Compliance Violation: Audit logs cannot be deleted');
    error.statusCode = 403;
    return next(error);
});

auditLogSchema.pre('findOneAndDelete', function (next) {
    const error = new Error('GoBD Compliance Violation: Audit logs cannot be deleted');
    error.statusCode = 403;
    return next(error);
});

// Indexes for efficient querying
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ documentId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
