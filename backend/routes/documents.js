const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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

        // Process and save files
        const uploadedFiles = [];
        for (const file of files) {
            // Move file to documents directory
            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = path.join('./documents', fileName);
            
            await fs.promises.rename(file.path, filePath);
            
            uploadedFiles.push({
                originalName: file.originalname,
                fileName: fileName,
                size: file.size,
                uploadedAt: new Date()
            });
        }

        // Save upload record to database
        const uploadRecord = new DocumentUpload({
            userId,
            files: uploadedFiles,
            uploadedAt: new Date()
        });

        await uploadRecord.save();

        res.json({
            success: true,
            message: `${files.length} document(s) uploaded successfully`,
            files: uploadedFiles
        });

    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed'
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
