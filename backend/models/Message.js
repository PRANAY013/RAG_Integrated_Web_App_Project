const mongoose = require('mongoose');

// Update models/Message.js
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
    maxlength: 10000 // Increased for AI responses
  },
  sessionId: {
    type: String,
    default: null,
    index: true // Add index for faster queries
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    messageType: {
      type: String,
      enum: ['user_query', 'ai_response'],
      default: 'user_query'
    },
    modelUsed: String,
    processingTime: Number,
    sources: [String]
  }
});

// Compound index for efficient conversation queries
messageSchema.index({ userId: 1, sessionId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);
