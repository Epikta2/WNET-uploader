# 🚀 WNET Production Environment - Complete Documentation

**Generated:** 2025-01-28 18:58 UTC  
**Last Updated:** 2025-01-28 18:58 UTC

---

## 📋 **System Overview**

**WNET File Transfer System** is a production video upload/download service running on DigitalOcean, handling large media files (3GB+ MXF files) for broadcast operations.

### **Architecture Status**
- ✅ **Main Server:** `192.241.137.246` - ACTIVE & OPERATIONAL
- ❌ **VPS Proxy:** `178.156.167.243` - NOT ACCESSIBLE (planned but not deployed)
- ✅ **Storage:** Cloudflare R2 (`wnet-storage` bucket)
- ✅ **Application:** Running via PM2, serving on port 3000

---

## 🖥️ **Production Server Details**

### **Server Information**
- **IP Address:** `192.241.137.246`
- **SSH Access:** `ssh -p 22 -i ~/.ssh/id_ed25519 root@192.241.137.246`
- **OS:** Linux (DigitalOcean Droplet)
- **Directory:** `/root/R2test/`
- **Port:** 3000
- **Status:** ACTIVE - Currently serving traffic

### **File Structure**
```
/root/R2test/
├── .env                     # R2 credentials & config
├── index.html               # Main web interface (237KB)
├── server.js                # Node.js Express server (16KB)
├── package.json             # Dependencies
├── package-lock.json        # Lock file
├── node_modules/            # 103 dependencies
├── network-profiles/        # Connection optimization configs
│   ├── cable.js            # Cable connection profile (16KB)
│   ├── dsl.js              # DSL profile (20KB)
│   ├── enterprise.js       # Enterprise profile (21KB)
│   ├── fiber.js            # Fiber profile (21KB)
│   ├── gigabit.js          # Gigabit profile (26KB)
│   └── ultra.js            # Ultra-fast profile (26KB)
├── masv/                   # MASV integration
│   ├── masv.html           # MASV portal (10KB)
│   └── logs/               # MASV logs
├── uploads/                # Empty upload staging area
├── upload_successes.log    # 68 successful uploads logged
├── upload_failures.log     # 12 failed uploads logged
└── download_logs.log       # Download activity (30KB)
```

---

## 🔧 **Running Services**

### **PM2 Process Manager**
```bash
┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬─────────────┬──────────┬──────────┐
│ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem         │ user     │ watching │
├────┼───────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼─────────────┼──────────┼──────────┤
│ 3  │ r2test    │ default     │ 1.0.0   │ fork    │ 97959    │ 2M     │ 5    │ online    │ 0%       │ 64.5mb      │ root     │ disabled │
└────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴─────────────┴──────────┴──────────┘
```

**Service Details:**
- **Name:** `r2test`
- **PID:** 97959
- **Uptime:** 2+ Months (very stable)
- **Restarts:** 5 (low restart count indicates stability)
- **Memory:** 64.5MB (reasonable for Node.js app)
- **Status:** Online and healthy

### **Network Listening**
```bash
Port 3000: LISTENING
Process: node /root/R2test/server.js (PID: 97959)
```

---

## 🔐 **Configuration & Credentials**

### **Environment Variables** (`.env`)
```env
R2_ACCOUNT_ID=548a6dfe061f53d1fd79a5ef3ec8975e
R2_ACCESS_KEY_ID=96908843ffadbdf69d02a8667055f82c
R2_SECRET_ACCESS_KEY=86c5183cc0c7b48e14c204988935d7b8e626cf4efeae17fe89e1696406c86f07
R2_BUCKET_NAME=wnet-storage
PORT=3000
```

### **Application Dependencies**
```json
{
  "name": "wnet-r2-test",
  "version": "1.0.0",
  "description": "WNET R2 Upload/Download Test",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/lib-storage": "^3.0.0", 
    "@aws-sdk/s3-request-presigner": "^3.0.0",
    "dotenv": "^16.0.0",
    "express": "^4.17.1",
    "express-rate-limit": "^6.11.2",
    "express-throttle-bandwidth": "^1.0.1",
    "multer": "^1.4.5-lts.1"
  }
}
```

---

## 📊 **Production Usage Statistics**

### **Upload Performance** (from logs analysis)
- **Total Attempts:** 80 uploads
- **Successful:** 68 uploads (85% success rate)
- **Failed:** 12 uploads (15% failure rate)
- **File Types:** Primarily MXF video files (3GB+ each)
- **Users:** Mac and Windows clients

### **Recent Activity**
**Last Successful Upload:** `OETA_Mason Drumm_20250528_073047_20250728_080658.mxf` (3.25GB)  
**Timestamp:** 2025-07-28T15:10:35.291Z

### **Common File Patterns**
- **OETA Files:** `OETA_Mason Drumm_YYYYMMDD_HHMMSS.mxf` (~3.25GB)
- **ThinkTV Files:** `ThinkTV_Nancy Schwartz Katz_YYYYMMDD_HHMMSS.mxf` (~3.67GB)
- **Test Files:** `2_YYYYMMDD_HHMMSS.mov` (~26MB)

### **Failure Analysis**
**Common Errors:**
1. **Network Timeouts:** "Part X failed after 5 attempts: Network error" (66%)
2. **Application Bugs:** "Invalid array length" (25%)
3. **User Cancellation:** "Upload cancelled" (9%)

**Performance by Connection:**
- **Fast Connections (18 Mbps):** Higher success rate, some array length errors
- **Slow Connections (2-12 Mbps):** More network timeouts, variable performance

---

## 🌐 **VPS Setup Status**

### **Hetzner VPS** (`178.156.167.243`)
- **Status:** ❌ NOT ACCESSIBLE
- **Planned Use:** Upload acceleration proxy
- **Current State:** Not deployed or firewall blocked
- **Impact:** Direct uploads only, no VPS acceleration available

**VPS was intended to:**
- Proxy browser uploads through VPS for better performance
- Handle optimized multipart uploads (14MB parts, 120 parallel)
- Target 8+ MB/s speeds vs current 2-5 MB/s

---

## 🚀 **Application Features**

### **Core Functionality**
1. **File Upload:** Large video file uploads to Cloudflare R2
2. **Progress Tracking:** Real-time upload progress with speed monitoring
3. **Connection Testing:** Automatic bandwidth and latency detection
4. **Adaptive Strategy:** Dynamic upload parameters based on connection quality
5. **Download System:** Direct-to-disk downloads with turbo streaming

### **Advanced Features**
- **Multipart Upload:** Handles large files via S3-compatible multipart
- **Rate Limiting:** 200 requests per 15 minutes, 5000 for multipart
- **Error Recovery:** Automatic retry with exponential backoff
- **Authentication:** Simple password protection (`wnet`)
- **Logging:** Comprehensive success/failure tracking

### **Network Profiles**
Optimized upload strategies for different connection types:
- **Ultra:** Gigabit+ connections
- **Gigabit:** 1 Gbps connections
- **Fiber:** High-speed fiber
- **Enterprise:** Business connections
- **Cable:** Home cable internet
- **DSL:** Lower bandwidth connections

---

## 🔍 **Monitoring & Logs**

### **Application Logs**
- **Success Log:** `/root/R2test/upload_successes.log` (68 entries)
- **Failure Log:** `/root/R2test/upload_failures.log` (12 entries)
- **Download Log:** `/root/R2test/download_logs.log` (30KB)

### **PM2 Logs**
- **Output:** `/root/.pm2/logs/r2test-out.log`
- **Errors:** `/root/.pm2/logs/r2test-error.log`

### **Log Analysis Commands**
```bash
# View recent successes
ssh root@192.241.137.246 "tail -10 /root/R2test/upload_successes.log"

# View recent failures  
ssh root@192.241.137.246 "tail -10 /root/R2test/upload_failures.log"

# Monitor live PM2 logs
ssh root@192.241.137.246 "pm2 logs r2test -f"

# Check service status
ssh root@192.241.137.246 "pm2 status"
```

---

## 🛠️ **Operations & Maintenance**

### **Service Management**
```bash
# Check status
ssh root@192.241.137.246 "pm2 status"

# Restart service
ssh root@192.241.137.246 "pm2 restart r2test"

# Stop service
ssh root@192.241.137.246 "pm2 stop r2test"

# View logs
ssh root@192.241.137.246 "pm2 logs r2test"
```

### **File Deployment**
```bash
# Deploy updated index.html
scp -P 22 -i ~/.ssh/id_ed25519 index.html root@192.241.137.246:/root/R2test/

# Deploy updated server.js
scp -P 22 -i ~/.ssh/id_ed25519 server.js root@192.241.137.246:/root/R2test/

# Restart after deployment
ssh root@192.241.137.246 "cd /root/R2test && pm2 restart r2test"
```

### **Log Retrieval**
```bash
# Download logs to local
scp -P 22 -i ~/.ssh/id_ed25519 root@192.241.137.246:/root/R2test/upload_successes.log ./
scp -P 22 -i ~/.ssh/id_ed25519 root@192.241.137.246:/root/R2test/upload_failures.log ./
scp -P 22 -i ~/.ssh/id_ed25519 root@192.241.137.246:/root/R2test/download_logs.log ./
```

---

## 🚨 **Known Issues & Solutions**

### **1. "Invalid Array Length" Errors**
**Problem:** JavaScript array size limitations on large files  
**Frequency:** 25% of failures  
**Solution:** Server-side chunking improvements needed

### **2. Network Timeout Failures**
**Problem:** Unreliable internet causing part upload failures  
**Frequency:** 66% of failures  
**Solution:** Better retry logic, smaller part sizes for slow connections

### **3. VPS Acceleration Unavailable**
**Problem:** Hetzner VPS not accessible/deployed  
**Impact:** Limited to direct browser uploads (2-5 MB/s vs 8+ MB/s target)  
**Solution:** Deploy VPS or fix connectivity

---

## 📈 **Performance Metrics**

### **Current Performance**
- **Upload Speed:** 1-5 MB/s (varies by connection)
- **Success Rate:** 85% (good but could be better)
- **File Size Range:** 26MB - 3.67GB
- **Typical Upload Time:** 10-20 minutes for 3GB files

### **Target Performance** (with VPS)
- **Upload Speed:** 8-15 MB/s
- **Success Rate:** 95%+
- **Upload Time:** 3-6 minutes for 3GB files

---

## 🔧 **Technical Architecture**

### **Frontend**
- **Technology:** Pure HTML/JavaScript (5001 lines)
- **Features:** File System Access API, drag-drop, progress tracking
- **Browser Support:** Modern browsers with File System Access API

### **Backend**
- **Technology:** Node.js + Express
- **Storage:** Cloudflare R2 (S3-compatible)
- **Authentication:** Simple password protection
- **Rate Limiting:** Express-rate-limit middleware

### **Storage**
- **Provider:** Cloudflare R2
- **Bucket:** `wnet-storage`
- **Region:** Auto (Cloudflare global)
- **Access:** S3-compatible API

---

## 🎯 **Business Impact**

### **Current Usage**
- **Active Production System:** Handling real broadcast content
- **Users:** Video production staff (Mac & Windows)
- **Content:** Professional video files for broadcast
- **Volume:** ~80 uploads tracked, likely hundreds more

### **Value Delivered**
- ✅ Reliable large file transfer solution
- ✅ Web-based, no software installation required
- ✅ Real-time progress tracking
- ✅ Direct cloud storage integration
- ✅ Cross-platform compatibility

### **Improvement Opportunities**
- 🎯 Deploy VPS acceleration for 3x faster uploads
- 🎯 Fix "Invalid array length" bugs
- 🎯 Improve retry logic for network issues
- 🎯 Add file compression options
- 🎯 Enhanced monitoring/alerting

---

## 📞 **Emergency Procedures**

### **If Service Goes Down**
1. **Check PM2 Status:** `ssh root@192.241.137.246 "pm2 status"`
2. **Restart Service:** `ssh root@192.241.137.246 "pm2 restart r2test"`
3. **Check Logs:** `ssh root@192.241.137.246 "pm2 logs r2test"`
4. **Verify Access:** Test upload at `http://192.241.137.246:3000`

### **If R2 Issues**
1. **Check Credentials:** Verify `.env` file
2. **Test R2 Access:** Manual API test
3. **Check Billing:** Ensure Cloudflare account active

### **If Upload Failures Spike**
1. **Check Error Patterns:** Review `upload_failures.log`
2. **Network Issues:** Check if widespread
3. **Code Issues:** Look for new error patterns

---

**📋 Summary:** Production system is stable and operational, handling real broadcast video uploads with 85% success rate. VPS acceleration planned but not yet deployed. System ready for improvements and scaling.

---

*This documentation was generated through comprehensive production server analysis on 2025-01-28.* 