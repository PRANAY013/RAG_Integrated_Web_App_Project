const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth'); // Import the middleware
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../documents');
        try {
            // Ensure directory exists
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
        cb(null, uniqueName);
    }
});


const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not supported`));
        }
    }
});

// Document upload endpoint
router.post('/upload', authenticateToken, upload.array('documents', 10), async (req, res) => {
    try {
        const userId = req.user.userId;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        console.log(`📁 Processing ${files.length} files for user ${userId}`);

        // Process each uploaded file
        const processedFiles = [];
        for (const file of files) {
            const fileInfo = {
                originalName: file.originalname,
                fileName: file.filename,
                filePath: file.path,
                size: file.size,
                mimetype: file.mimetype,
                uploadedAt: new Date(),
                userId: userId,
                status: 'uploaded'
            };
            
            processedFiles.push(fileInfo);
            console.log(`✅ File processed: ${file.originalname} -> ${file.filename}`);
        }

        // ENHANCED: Wait a moment for file system to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Trigger RAG service reindexing with retry logic
        let reindexSuccess = false;
        let reindexAttempts = 0;
        const maxRetries = 3;

        while (!reindexSuccess && reindexAttempts < maxRetries) {
            try {
                reindexAttempts++;
                console.log(`🔄 Triggering RAG reindexing (attempt ${reindexAttempts}/${maxRetries})...`);
                
                const reindexResponse = await axios.post('http://localhost:8000/reindex', {
                    user_id: userId,
                    new_files: processedFiles.map(f => f.fileName),
                    trigger_source: 'upload'
                }, {
                    timeout: 10000 // 10 second timeout
                });

                if (reindexResponse.data.success) {
                    console.log('✅ RAG reindexing completed successfully');
                    console.log(`📊 Indexed ${reindexResponse.data.documents_count} documents in ${reindexResponse.data.processing_time.toFixed(2)}s`);
                    reindexSuccess = true;
                } else {
                    throw new Error(reindexResponse.data.message || 'Reindex failed');
                }

            } catch (reindexError) {
                console.error(`⚠️ RAG reindexing attempt ${reindexAttempts} failed:`, reindexError.message);
                
                if (reindexAttempts < maxRetries) {
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * reindexAttempts));
                } else {
                    console.error('❌ All reindexing attempts failed - documents uploaded but not indexed');
                }
            }
        }

        res.json({
            success: true,
            message: `${files.length} document(s) uploaded successfully`,
            files: processedFiles,
            reindexed: reindexSuccess,
            reindex_attempts: reindexAttempts
        });

    } catch (error) {
        console.error('❌ Document upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user's uploaded documents
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const documentsPath = path.join(__dirname, '../documents');
        
        // Check if documents directory exists, create if it doesn't
        try {
            await fs.access(documentsPath);
        } catch (error) {
            // Directory doesn't exist, create it
            await fs.mkdir(documentsPath, { recursive: true });
            console.log('📁 Created documents directory:', documentsPath);
        }
        
        // Now safely read the directory
        const files = await fs.readdir(documentsPath);
        
        const documentList = files.map(filename => ({
            filename,
            uploadedAt: new Date(), // You'll want to get this from database later
            size: 0 // You'll want to get this from file stats later
        }));

        res.json({
            success: true,
            documents: documentList,
            totalCount: documentList.length
        });

    } catch (error) {
        console.error('❌ Error fetching documents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents'
        });
    }
});

// Document reindex endpoint
router.post('/reindex', authenticateToken, async (req, res) => {
    try {
        // Trigger RAG service to reindex documents
        await axios.post('http://localhost:8000/reindex');
        
        res.json({
            success: true,
            message: 'Document reindexing started'
        });
    } catch (error) {
        console.error('Reindex error:', error);
        res.status(500).json({
            success: false,
            message: 'Reindex failed'
        });
    }
});

// Add to documents.js
router.get('/rag-status', authenticateToken, async (req, res) => {
    try {
        const healthResponse = await axios.get('http://localhost:8000/health', {
            timeout: 5000
        });
        
        const statusResponse = await axios.get('http://localhost:8000/documents/status', {
            timeout: 5000
        });

        res.json({
            success: true,
            rag_service: {
                health: healthResponse.data,
                documents: statusResponse.data
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'RAG service unavailable',
            error: error.message
        });
    }
});


module.exports = router;
