const mongoose = require('mongoose');

// Enhanced source schema for detailed metadata
const sourceSchema = new mongoose.Schema({
  file_name: {
    type: String,
    required: true
  },
  original_filename: {
    type: String,
    default: null
  },
  page_label: {
    type: String,
    default: 'N/A'
  },
  file_size: {
    type: Number,
    default: 0
  },
  document_title: {
    type: String,
    default: null
  },
  content_preview: {
    type: String,
    default: null,
    maxlength: 500
  },
  relevance_score: {
    type: Number,
    default: 0.0,
    min: 0,
    max: 1
  }
}, { _id: false });

// Enhanced message schema
const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15000 // Increased for AI responses with formatting
  },
  sessionId: {
    type: String,
    default: null,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    userAgent: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    messageType: {
      type: String,
      enum: ['user_query', 'ai_response', 'system_message'],
      default: 'user_query',
      index: true
    },
    modelUsed: {
      type: String,
      trim: true
    },
    processingTime: {
      type: Number,
      min: 0
    },
    sources: [sourceSchema], // Enhanced to use source objects instead of strings
    responseQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: undefined // Changed from null to undefined to avoid enum validation
    },
    userFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 1000
      }
    }
  }
}, {
  timestamps: true,
  collection: 'messages'
});

// Compound indexes for efficient queries
messageSchema.index({ userId: 1, sessionId: 1, timestamp: -1 });
messageSchema.index({ userId: 1, 'metadata.messageType': 1, timestamp: -1 });
messageSchema.index({ sessionId: 1, timestamp: 1 });
messageSchema.index({ 'metadata.messageType': 1, timestamp: -1 });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60 * 60 * 24));
});

// Instance method to format sources for display
messageSchema.methods.getFormattedSources = function() {
  if (!this.metadata.sources || this.metadata.sources.length === 0) {
    return [];
  }
  
  return this.metadata.sources.map((source, index) => ({
    index: index + 1,
    fileName: source.file_name,
    pageLabel: source.page_label,
    preview: source.content_preview,
    relevance: source.relevance_score ? `${(source.relevance_score * 100).toFixed(1)}%` : 'N/A'
  }));
};

// Static method to get conversation history
messageSchema.statics.getConversation = function(userId, sessionId, limit = 50) {
  return this.find({ 
    userId, 
    sessionId 
  })
  .sort({ timestamp: 1 })
  .limit(limit)
  .lean();
};

// Pre-save middleware for validation
messageSchema.pre('save', function(next) {
  // Ensure sessionId exists for conversation tracking
  if (!this.sessionId) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Remove responseQuality if it's null to avoid enum validation
  if (this.metadata.responseQuality === null) {
    this.metadata.responseQuality = undefined;
  }
  
  next();
});

module.exports = mongoose.model('Message', messageSchema);
