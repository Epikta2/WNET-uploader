require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const path = require('path');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const rateLimit = require('express-rate-limit');
const throttle = require('express-throttle-bandwidth');

const app = express();

// 🚀 VPS COMPATIBILITY: Add CORS middleware
app.use((req, res, next) => {
    // Allow VPS to access local APIs
    res.header('Access-Control-Allow-Origin', 'http://178.156.167.243:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // limit each IP to 200 requests per windowMs
});

// Higher limit for multipart upload endpoints (apply BEFORE general limiter)
const multipartLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000 // allow up to 5000 requests per 15 minutes
});

// Apply multipart limiter first (before general API limiter)
app.use('/api/multipart/presign-part', multipartLimiter);
app.use('/api/multipart/start', multipartLimiter);
app.use('/api/multipart/complete', multipartLimiter);
app.use('/api/multipart/abort', multipartLimiter);

// Apply general rate limiting to remaining API routes (but not multipart or ping)
app.use(/^\/api\/(?!multipart|ping)/, apiLimiter);

// Bandwidth throttling options
const throttleOptions = {
    bps: 1024 * 1024, // 1MB/s default
    burst: 1024 * 1024 * 2 // 2MB burst
};

// Apply bandwidth throttling to download endpoint
app.use('/api/download/:filename', throttle(throttleOptions));

// Increase payload size limit for Express
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ limit: '10gb', extended: true }));

// Multer disk storage for large files
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// R2 client configuration
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Upload endpoint with multipart support
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Stream file from disk to R2 using multipart upload
        const fileStream = fs.createReadStream(req.file.path);
        const parallelUploads3 = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: req.file.originalname,
                Body: fileStream,
                ContentType: req.file.mimetype,
            },
        });

        await parallelUploads3.done();
        // Remove file from disk after upload
        fs.unlink(req.file.path, () => {});
        res.json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ error: 'Upload failed' });
    }
});

// 🚀 VPS COMPATIBILITY: Add list-files endpoint with CORS
app.get('/api/list-files', async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
        });

        const response = await s3Client.send(command);
        const files = (response.Contents || []).map(item => ({
            name: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
        }));

        res.json(files);
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// List files endpoint (legacy)
app.get('/api/files', async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
        });

        const response = await s3Client.send(command);
        const files = (response.Contents || []).map(item => ({
            name: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
        }));

        res.json(files);
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Download endpoint with caching headers
app.get('/api/download/:filename', async (req, res) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: req.params.filename,
        });

        const response = await s3Client.send(command);
        
        // Set caching headers
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.setHeader('ETag', response.ETag);
        res.setHeader('Last-Modified', response.LastModified.toUTCString());
        
        // Set content headers
        res.setHeader('Content-Type', response.ContentType);
        res.setHeader('Content-Length', response.ContentLength);
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
        
        // Check if client has cached version
        const ifNoneMatch = req.headers['if-none-match'];
        const ifModifiedSince = req.headers['if-modified-since'];
        
        if (ifNoneMatch && ifNoneMatch === response.ETag) {
            return res.status(304).end(); // Not Modified
        }
        
        if (ifModifiedSince && new Date(ifModifiedSince) >= response.LastModified) {
            return res.status(304).end(); // Not Modified
        }
        
        response.Body.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Endpoint to generate a pre-signed URL for direct-to-R2 uploads
app.post('/api/presign', express.json(), async (req, res) => {
    try {
        const { fileName, contentType } = req.body;
        if (!fileName || !contentType) {
            return res.status(400).json({ error: 'Missing fileName or contentType' });
        }
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            ContentType: contentType,
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 7200 }); // 2 hours
        res.json({ url });
    } catch (error) {
        console.error('Presign error:', error);
        res.status(500).json({ error: 'Failed to generate pre-signed URL' });
    }
});

// Notify backend after upload
app.post('/api/notify-upload', express.json(), async (req, res) => {
    try {
        const { fileName, size, contentType, connectionQuality, speed, userAgent } = req.body;
        // Log to console
        console.log(`File uploaded: ${fileName}, size: ${size}, type: ${contentType}`);
        // Write to a file:
        fs.appendFileSync('upload_successes.log', JSON.stringify({
            fileName,
            fileSize: size,
            contentType,
            connectionQuality: connectionQuality || 'unknown',
            speed: speed || 'unknown',
            timestamp: new Date().toISOString(),
            userAgent: userAgent || (req.headers['user-agent'] || 'unknown')
        }) + '\n');
        res.json({ message: 'Notification received' });
    } catch (error) {
        console.error('Notify error:', error);
        res.status(500).json({ error: 'Failed to process notification' });
    }
});

// Multipart upload endpoints (scaffold)

// Start multipart upload
app.post('/api/multipart/start', express.json(), async (req, res) => {
    try {
        const { fileName, contentType } = req.body;
        const command = new CreateMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            ContentType: contentType,
        });
        const response = await s3Client.send(command);
        res.json({ uploadId: response.UploadId });
    } catch (error) {
        console.error('Multipart start error:', error);
        res.status(500).json({ error: 'Failed to start multipart upload' });
    }
});

// Get pre-signed URL for a part
app.post('/api/multipart/presign-part', express.json(), async (req, res) => {
    console.log("presign-part endpoint hit", req.body);
    try {
        const { fileName, uploadId, partNumber, contentType } = req.body;
        const command = new UploadPartCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            UploadId: uploadId,
            PartNumber: partNumber,
            ContentType: contentType,
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
        console.log("Pre-signed URL for part:", url);
        res.json({ url });
    } catch (error) {
        console.error('Presign part error:', error);
        res.status(500).json({ error: 'Failed to generate part pre-signed URL' });
    }
});

// Complete multipart upload
app.post('/api/multipart/complete', express.json(), async (req, res) => {
    try {
        const { fileName, uploadId, parts } = req.body;
        const command = new CompleteMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts },
        });
        await s3Client.send(command);
        res.json({ message: 'Multipart upload completed' });
    } catch (error) {
        console.error('Multipart complete error:', error);
        res.status(500).json({ error: 'Failed to complete multipart upload' });
    }
});

// Abort multipart upload
app.post('/api/multipart/abort', express.json(), async (req, res) => {
    try {
        const { fileName, uploadId } = req.body;
        const command = new AbortMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            UploadId: uploadId,
        });
        await s3Client.send(command);
        res.json({ message: 'Multipart upload aborted' });
    } catch (error) {
        console.error('Multipart abort error:', error);
        res.status(500).json({ error: 'Failed to abort multipart upload' });
    }
});

// Add ping endpoint for connection quality detection
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add bandwidth control endpoint
app.post('/api/set-bandwidth', express.json(), (req, res) => {
    const { bps } = req.body;
    if (bps && typeof bps === 'number' && bps > 0) {
        throttleOptions.bps = bps;
        throttleOptions.burst = bps * 2;
        res.json({ message: 'Bandwidth limit updated', bps });
    } else {
        res.status(400).json({ error: 'Invalid bandwidth value' });
    }
});

// Log upload failures
app.post('/api/log-upload-failure', express.json(), async (req, res) => {
    try {
        const log = req.body;
        // Log to console
        console.error('UPLOAD FAILURE LOG:', JSON.stringify(log, null, 2));
        // Write to a file:
        fs.appendFileSync('upload_failures.log', JSON.stringify(log) + '\n');
        res.json({ message: 'Failure log received' });
    } catch (error) {
        console.error('Log upload failure error:', error);
        res.status(500).json({ error: 'Failed to log upload failure' });
    }
});

// Log download attempts
app.post('/api/log-download', express.json(), async (req, res) => {
    try {
        const { fileName, fileSize, contentType, connectionQuality, speed, userAgent } = req.body;
        // Log to console
        console.log('DOWNLOAD LOG:', JSON.stringify({
            fileName,
            fileSize,
            contentType,
            connectionQuality: connectionQuality || 'unknown',
            speed: speed || 'unknown',
            timestamp: new Date().toISOString(),
            userAgent: userAgent || (req.headers['user-agent'] || 'unknown')
        }, null, 2));
        // Write to a file:
        fs.appendFileSync('download_logs.log', JSON.stringify({
            fileName,
            fileSize,
            contentType,
            connectionQuality: connectionQuality || 'unknown',
            speed: speed || 'unknown',
            timestamp: new Date().toISOString(),
            userAgent: userAgent || (req.headers['user-agent'] || 'unknown')
        }) + '\n');
        res.json({ message: 'Download log received' });
    } catch (error) {
        console.error('Log download error:', error);
        res.status(500).json({ error: 'Failed to log download' });
    }
});

// Apply a strict rate limiter to sensitive endpoints only
app.use('/api/notify-upload', apiLimiter);
app.use('/api/log-upload-failure', apiLimiter);
app.use('/api/log-download', apiLimiter);

// Multipart limiters already applied above

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (VPS Compatible)`);
    console.log(`📡 CORS enabled for VPS: http://178.156.167.243:3000`);
}); 