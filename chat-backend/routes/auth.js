const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Local authentication endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // CORRECT SANITIZATION - Create new variables instead of reassigning
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    const sanitizedPassword = password ? password.trim().normalize('NFC') : '';
    
    console.log('🔐 Local login attempt for:', sanitizedEmail);
    console.log('🔑 Password debug:', {
      original: JSON.stringify(password),
      sanitized: JSON.stringify(sanitizedPassword),
      length: sanitizedPassword.length
    });
    
    if (!sanitizedEmail || !sanitizedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user || (user.googleId && !user.password)) {
      console.log('❌ User not found or is Google user:', sanitizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isValidPassword = await user.comparePassword(sanitizedPassword);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', sanitizedEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Local login successful for:', sanitizedEmail);
    
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
    console.error('❌ Local auth error details:', error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // SANITIZATION for registration
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';
    const sanitizedPassword = password ? password.trim().normalize('NFC') : '';
    const sanitizedName = name ? name.trim().replace(/[<>]/g, '').normalize('NFC') : '';
    
    console.log('📝 Registration attempt for:', sanitizedEmail, 'with name:', sanitizedName);
    
    if (!sanitizedEmail || !sanitizedPassword || !sanitizedName) {
      console.log('❌ Missing required fields:', { 
        email: !!sanitizedEmail, 
        password: !!sanitizedPassword, 
        name: !!sanitizedName 
      });
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }
    
    console.log('🔍 Checking if user exists...');
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      console.log('❌ User already exists:', sanitizedEmail);
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    console.log('👤 Creating new user...');
    const user = new User({
      email: sanitizedEmail,
      password: sanitizedPassword,
      name: sanitizedName
    });
    
    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully:', sanitizedEmail);
    
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Registration completed successfully for:', sanitizedEmail);
    
    res.status(201).json({
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
    console.error('❌ Registration error details:');
    console.error('   - Message:', error.message);
    console.error('   - Code:', error.code);
    console.error('   - Name:', error.name);
    console.error('   - Stack:', error.stack);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      console.error('   - Duplicate key error detected');
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Google authentication endpoint
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;
    
    console.log('🔐 Google auth attempt for:', email);
    
    if (!googleId || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Google fields'
      });
    }
    
    let user = await User.findOne({ 
      $or: [
        { googleId: googleId },
        { email: email }
      ]
    });
    
    if (!user) {
      console.log('👤 Creating new Google user:', email);
      user = new User({
        googleId,
        email,
        name,
        picture
      });
      await user.save();
    } else if (!user.googleId) {
      console.log('🔗 Linking existing account with Google:', email);
      user.googleId = googleId;
      user.picture = picture;
      user.lastLogin = new Date();
      await user.save();
    } else {
      console.log('✅ Existing Google user login:', email);
      user.lastLogin = new Date();
      await user.save();
    }
    
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Google auth successful for:', email);
    
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
    console.error('❌ Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
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
    console.error('❌ Token verification error:', error.message);
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
});

// TEMPORARY DEBUG ENDPOINT - Update with current hash
router.post('/debug-password', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const { password } = req.body;
    
    // UPDATED: Use your current hash from MongoDB
    const storedHash = '$2b$12$jqwL8QsDc7hqEZrzN64wHewMincPpvxsJZ3uuCl5g4YrdYyXwBBKG';
    
    console.log('🔍 Debug password test:');
    console.log('   - Input password:', JSON.stringify(password));
    console.log('   - Stored hash:', storedHash);
    
    // Test direct bcrypt compare
    const directResult = await bcrypt.compare(password, storedHash);
    console.log('   - Direct bcrypt.compare result:', directResult);
    
    // Test with different variations
    const trimmedResult = await bcrypt.compare(password.trim(), storedHash);
    console.log('   - Trimmed password result:', trimmedResult);
    
    // Find the user and test the method
    const User = require('../models/User');
    const user = await User.findOne({ email: 'pranaypandey2005@gmail.com' });
    
    if (user) {
      console.log('   - User found, testing comparePassword method');
      const methodResult = await user.comparePassword(password);
      console.log('   - User.comparePassword result:', methodResult);
      
      const methodTrimmedResult = await user.comparePassword(password.trim());
      console.log('   - User.comparePassword (trimmed) result:', methodTrimmedResult);
    }
    
    res.json({
      success: true,
      tests: {
        directBcrypt: directResult,
        trimmedPassword: trimmedResult,
        userMethod: user ? await user.comparePassword(password) : null,
        userMethodTrimmed: user ? await user.comparePassword(password.trim()) : null
      }
    });
    
  } catch (error) {
    console.error('Debug test error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
