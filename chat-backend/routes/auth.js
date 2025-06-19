const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Google authentication endpoint
router.post('/google', async (req, res) => {
    try {
        const { googleId, email, name, picture } = req.body;
        
        console.log('🔐 Authentication attempt for:', email);
        
        // Validate required fields
        if (!googleId || !email || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }
        
        // Find or create user
        let user = await User.findOne({ googleId });
        
        if (!user) {
            // Create new user
            user = new User({
                googleId,
                email,
                name,
                picture
            });
            await user.save();
            console.log('👤 New user created:', email);
        } else {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            console.log('👤 Existing user logged in:', email);
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                name: user.name 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture
            }
        });
        
    } catch (error) {
        console.error('❌ Auth error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Authentication failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Token verification endpoint
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture
            }
        });
        
    } catch (error) {
        res.status(403).json({ success: false, message: 'Invalid token' });
    }
});

module.exports = router;
