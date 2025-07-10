const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

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

module.exports = router;
