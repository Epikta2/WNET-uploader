require('dotenv').config({ path: '../.env' });
const express = require('express');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand } = require('@aws-sdk/client-s3');
const config = require('./config/masv-config.json');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Initialize S3 client for R2
const s3Client = new S3Client({
    region: config.s3Integration.region,
    endpoint: config.s3Integration.endpoint,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Logging utility
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data ? JSON.stringify(data) : '');
    
    // Write to log file
    const logDir = path.dirname(config.logging.file);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(config.logging.file, JSON.stringify(logEntry) + '\n');
}

// MASV Webhook handler
app.post('/webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        log('info', 'MASV webhook received', webhookData);

        // Handle different webhook events
        switch (webhookData.event) {
            case 'upload.completed':
                await handleUploadCompleted(webhookData);
                break;
            case 'download.completed':
                await handleDownloadCompleted(webhookData);
                break;
            default:
                log('warn', 'Unknown webhook event', { event: webhookData.event });
        }

        res.json({ status: 'success', message: 'Webhook processed' });
    } catch (error) {
        log('error', 'Webhook processing failed', { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Handle upload completed event
async function handleUploadCompleted(webhookData) {
    try {
        log('info', 'Processing upload completion', webhookData);

        if (!config.s3Integration.enabled) {
            log('info', 'S3 integration disabled, skipping sync');
            return;
        }

        const files = webhookData.files || [];
        
        for (const file of files) {
            await syncFileToS3(file, webhookData);
        }

        // Log success
        await logTransfer({
            type: 'upload',
            packageId: webhookData.packageId,
            packageName: webhookData.packageName,
            fileCount: files.length,
            totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
            status: 'completed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log('error', 'Upload processing failed', { error: error.message, webhookData });
        throw error;
    }
}

// Handle download completed event
async function handleDownloadCompleted(webhookData) {
    try {
        log('info', 'Processing download completion', webhookData);

        // Log download activity
        await logTransfer({
            type: 'download',
            packageId: webhookData.packageId,
            packageName: webhookData.packageName,
            downloadedBy: webhookData.downloadedBy,
            status: 'completed',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log('error', 'Download processing failed', { error: error.message, webhookData });
        throw error;
    }
}

// Sync file from MASV to S3
async function syncFileToS3(file, webhookData) {
    try {
        if (!file.downloadUrl) {
            log('warn', 'No download URL provided for file', { fileName: file.name });
            return;
        }

        log('info', 'Starting S3 sync', { fileName: file.name, size: file.size });

        // Download file from MASV
        const response = await fetch(file.downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const fileBuffer = await response.arrayBuffer();
        
        // Generate S3 key
        const s3Key = `${config.s3Integration.syncPath}${webhookData.packageName}/${file.name}`;
        
        // Upload to S3
        const uploadCommand = new PutObjectCommand({
            Bucket: config.s3Integration.bucket,
            Key: s3Key,
            Body: Buffer.from(fileBuffer),
            ContentType: file.mimeType || 'application/octet-stream',
            Metadata: {
                'masv-package-id': webhookData.packageId,
                'masv-package-name': webhookData.packageName,
                'masv-file-id': file.id,
                'masv-uploaded-at': new Date().toISOString()
            }
        });

        await s3Client.send(uploadCommand);
        
        log('info', 'File synced to S3 successfully', { 
            fileName: file.name, 
            s3Key,
            size: file.size 
        });

    } catch (error) {
        log('error', 'S3 sync failed', { 
            fileName: file.name, 
            error: error.message 
        });
        throw error;
    }
}

// Log transfer activity
async function logTransfer(transferData) {
    try {
        const logEntry = {
            ...transferData,
            source: 'masv-agent'
        };

        // Write to transfer log
        const transferLogFile = './logs/masv-transfers.log';
        const logDir = path.dirname(transferLogFile);
        
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        fs.appendFileSync(transferLogFile, JSON.stringify(logEntry) + '\n');
        
        // Also send to main server if available
        try {
            await fetch('http://localhost:3000/api/masv/log-transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            });
        } catch (e) {
            // Ignore if main server is not available
            log('warn', 'Could not send transfer log to main server', { error: e.message });
        }

    } catch (error) {
        log('error', 'Transfer logging failed', { error: error.message });
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        config: {
            s3Integration: config.s3Integration.enabled,
            webhook: config.webhook.enabled
        }
    });
});

// Get transfer logs
app.get('/logs/transfers', (req, res) => {
    try {
        const transferLogFile = './logs/masv-transfers.log';
        
        if (!fs.existsSync(transferLogFile)) {
            return res.json([]);
        }

        const logs = fs.readFileSync(transferLogFile, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
            .slice(-100); // Last 100 entries

        res.json(logs);
    } catch (error) {
        log('error', 'Failed to retrieve transfer logs', { error: error.message });
        res.status(500).json({ error: 'Failed to retrieve logs' });
    }
});

const PORT = process.env.MASV_AGENT_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    log('info', `MASV Agent started on port ${PORT}`, { 
        config: {
            s3Integration: config.s3Integration.enabled,
            webhook: config.webhook.enabled,
            syncPath: config.s3Integration.syncPath
        }
    });
});

module.exports = app; 