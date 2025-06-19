const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    sessionId: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        userAgent: String,
        ipAddress: String
    }
});

// Index for faster queries
messageSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
