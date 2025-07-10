const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth'); // Import shared middleware
const router = express.Router();
const axios = require('axios');

// Send message endpoint
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user.userId;
        
        // Validate message
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Message content is required' 
            });
        }
        
        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Create new message
        const newMessage = new Message({
            userId,
            userEmail: user.email,
            userName: user.name,
            message: message.trim(),
            sessionId,
            metadata: {
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip
            }
        });
        
        const savedMessage = await newMessage.save();
        
        console.log(`💬 Message saved for ${user.email}: ${message.substring(0, 50)}...`);
        
        res.json({
            success: true,
            message: savedMessage
        });
        
    } catch (error) {
        console.error('❌ Message save error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save message',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user messages
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        
        const messages = await Message.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip);
            
        res.json({
            success: true,
            messages,
            count: messages.length
        });
        
    } catch (error) {
        console.error('❌ Messages fetch error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch messages',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete message endpoint
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.userId;
        
        const message = await Message.findOneAndDelete({ 
            _id: messageId, 
            userId: userId 
        });
        
        if (!message) {
            return res.status(404).json({ 
                success: false, 
                message: 'Message not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Message delete error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete message' 
        });
    }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const totalMessages = await Message.countDocuments({ userId });
        const todayMessages = await Message.countDocuments({
            userId,
            timestamp: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });
        
        res.json({
            success: true,
            stats: {
                totalMessages,
                todayMessages,
                userId
            }
        });
        
    } catch (error) {
        console.error('❌ Stats fetch error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch statistics' 
        });
    }
});

// RAG Query Endpoint
router.post('/rag/query', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.userId;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Forward query to RAG service
    const ragResponse = await axios.post('http://localhost:8000/query', {
      query: message,
      user_id: userId,
      session_id: sessionId
    }, {
      timeout: 30000 // 30 second timeout
    });

    const ragResult = ragResponse.data;

    // Save both user query and AI response
    const userMessage = new Message({
      userId,
      userEmail: user.email,
      userName: user.name,
      message: message.trim(),
      sessionId,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        messageType: 'user_query'
      }
    });

    const aiMessage = new Message({
      userId,
      userEmail: user.email,
      userName: 'RAG Assistant',
      message: ragResult.response,
      sessionId,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        messageType: 'ai_response',
        modelUsed: ragResult.model_used,
        processingTime: ragResult.processing_time,
        sources: ragResult.sources
      }
    });

    await Promise.all([userMessage.save(), aiMessage.save()]);

    res.json({
      success: true,
      userMessage,
      aiResponse: {
        message: ragResult.response,
        sources: ragResult.sources,
        processingTime: ragResult.processing_time
      }
    });

  } catch (error) {
    console.error('❌ RAG query error:', error);
    res.status(500).json({
      success: false,
      message: 'RAG query failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get conversation history with AI responses
router.get('/conversation/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = req.params.sessionId;

    const messages = await Message.find({ 
      userId, 
      sessionId 
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('❌ Conversation fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
});


module.exports = router;
