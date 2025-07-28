const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for requests from your local server
app.use(cors({
    origin: 'http://192.241.137.246:3000',
    credentials: true
}));

// Configure multer for file uploads (store temporarily on VPS)
const upload = multer({ 
    dest: '/tmp/uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 * 1024 // 10GB max file size
    }
});

// Configure AWS SDK for R2
const r2 = new AWS.S3({
    endpoint: process.env.R2_ENDPOINT || 'https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'YOUR_SECRET_ACCESS_KEY',
    region: 'auto',
    signatureVersion: 'v4'
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'YOUR_BUCKET_NAME';

// Connection quality detection for adaptive strategy
function detectConnectionQuality(clientIP) {
    // For VPS, we assume good connection quality
    // Could be enhanced with actual testing
    return {
        type: 'vps-unlimited',
        bandwidth: 100, // VPS typically has excellent bandwidth
        latency: 10
    };
}

// Get upload strategy based on connection
function getUploadStrategy(connectionInfo) {
    // VPS has excellent connection, use optimal settings
    return {
        partSize: 14 * 1024 * 1024, // 14MB parts (our proven optimal)
        maxParallel: 120 // 120 parallel connections
    };
}

// Generate timestamped filename
function getTimestampedFilename(originalName) {
    const dotIndex = originalName.lastIndexOf('.');
    const base = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    const ext = dotIndex !== -1 ? originalName.substring(dotIndex) : '';
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    return `${base}_${timestamp}${ext}`;
}

// Main upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const uniqueFilename = getTimestampedFilename(originalName);

    console.log(`🚀 VPS received file: ${originalName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Set up SSE for progress updates
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': 'http://192.241.137.246:3000',
        'Access-Control-Allow-Credentials': 'true'
    });

    function sendProgress(data) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    try {
        // Detect connection and get strategy
        const connectionInfo = detectConnectionQuality(req.ip);
        const strategy = getUploadStrategy(connectionInfo);
        
        sendProgress({
            type: 'started',
            message: `🚀 VPS UPLOAD: ${strategy.partSize / (1024*1024)}MB parts, ${strategy.maxParallel} parallel`,
            filename: uniqueFilename,
            fileSize: fileSize
        });

        // Use multipart upload for large files
        if (fileSize > 1 * 1024 * 1024 * 1024) { // > 1GB
            await multipartUploadToR2(filePath, uniqueFilename, fileSize, strategy, sendProgress);
        } else {
            await simpleUploadToR2(filePath, uniqueFilename, fileSize, sendProgress);
        }

        // Clean up temporary file
        fs.unlinkSync(filePath);

        sendProgress({
            type: 'completed',
            message: '✅ Upload completed successfully!',
            filename: uniqueFilename
        });

        res.end();

    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up temporary file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        sendProgress({
            type: 'error',
            message: `❌ Upload failed: ${error.message}`
        });

        res.end();
    }
});

// Simple upload for smaller files
async function simpleUploadToR2(filePath, filename, fileSize, sendProgress) {
    const fileStream = fs.createReadStream(filePath);
    
    const params = {
        Bucket: R2_BUCKET_NAME,
        Key: filename,
        Body: fileStream,
        ContentType: 'application/octet-stream'
    };

    sendProgress({
        type: 'progress',
        progress: 0,
        message: 'Starting simple upload...'
    });

    const result = await r2.upload(params).promise();
    
    sendProgress({
        type: 'progress',
        progress: 100,
        message: 'Simple upload completed'
    });

    return result;
}

// Multipart upload for large files (using our optimized strategy)
async function multipartUploadToR2(filePath, filename, fileSize, strategy, sendProgress) {
    const { partSize, maxParallel } = strategy;
    
    // Step 1: Initiate multipart upload
    const createParams = {
        Bucket: R2_BUCKET_NAME,
        Key: filename,
        ContentType: 'application/octet-stream'
    };

    const multipart = await r2.createMultipartUpload(createParams).promise();
    const uploadId = multipart.UploadId;

    sendProgress({
        type: 'multipart_started',
        message: `📦 Multipart upload started: ${uploadId.substring(0, 8)}...`,
        partSize: partSize,
        maxParallel: maxParallel
    });

    // Step 2: Calculate parts
    const partCount = Math.ceil(fileSize / partSize);
    const parts = [];
    let completedParts = 0;
    let totalUploaded = 0;

    sendProgress({
        type: 'strategy',
        message: `📊 Strategy: ${partCount} parts × ${(partSize/1024/1024).toFixed(1)}MB, ${maxParallel} max parallel`
    });

    // Step 3: Upload parts in parallel
    const uploadPromises = [];
    let activeUploads = 0;
    let partIndex = 0;

    const uploadStartTime = Date.now();

    async function uploadPart(partNumber) {
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, fileSize);
        const partData = fs.createReadStream(filePath, { start, end: end - 1 });

        const partParams = {
            Bucket: R2_BUCKET_NAME,
            Key: filename,
            PartNumber: partNumber,
            UploadId: uploadId,
            Body: partData
        };

        const partStartTime = Date.now();
        
        try {
            const result = await r2.uploadPart(partParams).promise();
            const partTime = Date.now() - partStartTime;
            const partBytes = end - start;
            const partSpeed = (partBytes / 1024 / 1024) / (partTime / 1000);
            
            parts[partNumber - 1] = {
                ETag: result.ETag,
                PartNumber: partNumber
            };
            
            completedParts++;
            totalUploaded += partBytes;
            
            const progress = (completedParts / partCount * 100).toFixed(1);
            const elapsedSec = (Date.now() - uploadStartTime) / 1000;
            const avgSpeed = (totalUploaded / 1024 / 1024) / elapsedSec;
            
            sendProgress({
                type: 'part_completed',
                partNumber: partNumber,
                progress: parseFloat(progress),
                avgSpeed: avgSpeed.toFixed(2),
                partSpeed: partSpeed.toFixed(2),
                completedParts: completedParts,
                totalParts: partCount,
                message: `✅ Part ${partNumber}: ${partSpeed.toFixed(2)} MB/s`
            });

            return result;
        } catch (error) {
            console.error(`Part ${partNumber} failed:`, error);
            throw error;
        }
    }

    // Manage parallel uploads
    async function runParallelUploads() {
        return new Promise((resolve, reject) => {
            let finished = 0;
            
            function startNextBatch() {
                while (activeUploads < maxParallel && partIndex < partCount) {
                    activeUploads++;
                    const currentPart = partIndex + 1;
                    partIndex++;
                    
                    uploadPart(currentPart)
                        .then(() => {
                            finished++;
                            activeUploads--;
                            
                            if (partIndex < partCount) {
                                startNextBatch();
                            } else if (finished === partCount) {
                                resolve();
                            }
                        })
                        .catch(err => {
                            reject(err);
                        });
                }
            }
            
            startNextBatch();
        });
    }

    await runParallelUploads();

    // Step 4: Complete multipart upload
    const completeParams = {
        Bucket: R2_BUCKET_NAME,
        Key: filename,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts.filter(Boolean).sort((a, b) => a.PartNumber - b.PartNumber)
        }
    };

    await r2.completeMultipartUpload(completeParams).promise();

    const totalTime = Date.now() - uploadStartTime;
    const finalSpeed = (fileSize / 1024 / 1024) / (totalTime / 1000);

    sendProgress({
        type: 'multipart_completed',
        message: `🏁 Multipart upload completed in ${(totalTime/1000).toFixed(1)}s at ${finalSpeed.toFixed(2)} MB/s`,
        totalTime: totalTime,
        finalSpeed: finalSpeed
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'VPS Upload Proxy is running'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VPS Upload Proxy running on port ${PORT}`);
    console.log(`📡 Accepting uploads from: http://192.241.137.246:3000`);
    console.log(`🔧 Configure R2 credentials in environment variables`);
}); 