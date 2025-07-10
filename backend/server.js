const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3001' , 
        'http://127.0.0.1:5500' , 
        'http://localhost:5500' ,
        'http://localhost:8080'  
    ],
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/MongoServerJS_RAG-WebApp')
.then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Root endpoint - UPDATED to show all authentication options
app.get('/', (req, res) => {
    res.json({
        message: 'Chat Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            googleAuth: '/api/auth/google',
            localLogin: '/api/auth/login',      // NEW
            register: '/api/auth/register',     // NEW
            verify: '/api/auth/verify',
            messages: '/api/messages'
        },
        authentication: {
            google: 'Use /api/auth/google for Google OAuth',
            local: 'Use /api/auth/login for email/password login',
            register: 'Use /api/auth/register to create new account'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Authentication endpoints available:`);
    console.log(`   - Google OAuth: http://localhost:${PORT}/api/auth/google`);
    console.log(`   - Local Login: http://localhost:${PORT}/api/auth/login`);
    console.log(`   - Register: http://localhost:${PORT}/api/auth/register`);
});
