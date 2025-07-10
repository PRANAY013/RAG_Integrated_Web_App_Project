const mongoose = require('mongoose');

const documentUploadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    files: [{
        originalName: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        filePath: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        mimetype: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['uploaded', 'processing', 'indexed', 'error'],
            default: 'uploaded'
        }
    }],
    totalFiles: {
        type: Number,
        required: true
    },
    totalSize: {
        type: Number,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
documentUploadSchema.index({ userId: 1, uploadedAt: -1 });

module.exports = mongoose.model('DocumentUpload', documentUploadSchema);
