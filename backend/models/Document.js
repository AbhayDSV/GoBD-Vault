import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['application/pdf', 'application/xml', 'text/xml']
  },
  fileHash: {
    type: String,
    required: true,
    unique: true,
    immutable: true // MongoDB 5.0+ prevents modification
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    required: true,
    default: Date.now,
    immutable: true
  },
  status: {
    type: String,
    required: true,
    enum: ['LOCKED'],
    default: 'LOCKED',
    immutable: true // Cannot be changed once set
  },
  retentionExpiryDate: {
    type: Date,
    required: true,
    immutable: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  }
}, {
  timestamps: true
});

// Pre-save hook: Prevent any updates to locked documents
documentSchema.pre('save', function(next) {
  if (!this.isNew && this.status === 'LOCKED') {
    const error = new Error('GoBD Compliance Violation: Locked documents cannot be modified');
    error.statusCode = 403;
    return next(error);
  }
  next();
});

// Pre-update hook: Block all update operations on locked documents
documentSchema.pre('findOneAndUpdate', async function(next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate && docToUpdate.status === 'LOCKED') {
    const error = new Error('GoBD Compliance Violation: Locked documents cannot be modified');
    error.statusCode = 403;
    return next(error);
  }
  next();
});

// Pre-remove hook: Prevent deletion before retention period expires
documentSchema.pre('remove', function(next) {
  const now = new Date();
  if (this.retentionExpiryDate > now) {
    const error = new Error('GoBD Compliance Violation: Document cannot be deleted before retention period expires');
    error.statusCode = 403;
    return next(error);
  }
  next();
});

// Pre-deleteOne hook
documentSchema.pre('deleteOne', async function(next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const now = new Date();
    if (doc.retentionExpiryDate > now) {
      const error = new Error('GoBD Compliance Violation: Document cannot be deleted before retention period expires');
      error.statusCode = 403;
      return next(error);
    }
  }
  next();
});

// Pre-findOneAndDelete hook
documentSchema.pre('findOneAndDelete', async function(next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const now = new Date();
    if (doc.retentionExpiryDate > now) {
      const error = new Error('GoBD Compliance Violation: Document cannot be deleted before retention period expires');
      error.statusCode = 403;
      return next(error);
    }
  }
  next();
});

// Index for efficient queries
documentSchema.index({ uploadedBy: 1, uploadDate: -1 });
documentSchema.index({ retentionExpiryDate: 1 });
documentSchema.index({ fileHash: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
