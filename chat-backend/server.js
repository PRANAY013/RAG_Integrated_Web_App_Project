const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
// Updated MongoDB connection (removes deprecated options)
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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Chat Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/google',
            messages: '/api/messages'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
