# 🚀 WNET VPS Upload Proxy - Complete Deployment Guide

## **📋 Overview**

This VPS proxy setup eliminates the "browser limitations" that slow down R2 uploads, moving the optimized multipart logic to a VPS with superior connection quality.

**Performance Target:** Achieve MASV-level speeds (3.5+ MB/s) or better by leveraging VPS advantages:
- No browser connection limits
- Optimized HTTP/2 multiplexing  
- Professional network infrastructure
- Dedicated upload optimization

---

## **🏗️ Architecture**

```
Browser (192.241.137.246:3000) 
    ↓ (Upload file)
VPS (178.156.167.243:3000)
    ↓ (Optimized multipart to R2)
Cloudflare R2 Storage
```

**Key Benefits:**
- **Browser→VPS:** Single file upload (simple, reliable)
- **VPS→R2:** Optimized multipart (14MB parts, 120 parallel)
- **Real-time Progress:** SSE streaming from VPS to browser
- **Same UI:** Familiar interface with enhanced performance

---

## **📦 VPS Setup Instructions**

### **Step 1: Upload Files to VPS**

Upload these files to your Hetzner VPS (`178.156.167.243`):

```bash
# Create directory
mkdir -p ~/wnet-vps-proxy
cd ~/wnet-vps-proxy

# Upload files (use scp, rsync, or your preferred method):
# - vps-upload-proxy.js
# - package.json
# - vps-setup.sh
# - vps-env-template.txt (rename to .env)
```

### **Step 2: Run Setup Script**

```bash
# Make setup script executable
chmod +x vps-setup.sh

# Run the setup
./vps-setup.sh
```

This will:
- ✅ Install Node.js 18 LTS
- ✅ Install dependencies
- ✅ Create systemd service
- ✅ Configure firewall
- ✅ Start the service

### **Step 3: Configure R2 Credentials**

Edit the `.env` file:

```bash
nano .env
```

**Replace with your actual values:**
```env
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
R2_BUCKET_NAME=YOUR_BUCKET_NAME
PORT=3000
NODE_ENV=production
ALLOWED_ORIGIN=http://192.241.137.246:3000
```

### **Step 4: Restart Service**

```bash
sudo systemctl restart wnet-upload-proxy
```

### **Step 5: Verify Service**

```bash
# Check service status
sudo systemctl status wnet-upload-proxy

# Check logs
sudo journalctl -u wnet-upload-proxy -f

# Test health endpoint
curl http://178.156.167.243:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "VPS Upload Proxy is running"
}
```

---

## **💻 Local Setup Instructions**

### **Step 1: Backup Current Files**

```bash
# In your local project directory
cp index.html index-backup.html
cp server.js server-backup.js
```

### **Step 2: Deploy VPS-Compatible Files**

**Option A: Replace Existing Files**
```bash
cp index-vps.html index.html
cp server-vps-compatible.js server.js
```

**Option B: Test Side-by-Side**
```bash
# Keep both versions and test
# Access VPS version at: http://192.241.137.246:3000/index-vps.html
```

### **Step 3: Restart Local Server**

```bash
# Stop current server (Ctrl+C)
# Restart with CORS support
npm start
```

---

## **🧪 Testing the Setup**

### **1. Connection Test**

Visit `http://192.241.137.246:3000/index-vps.html`

**Expected:**
- ✅ Green "VPS Connected" status
- ✅ No CORS errors in console

### **2. Small File Test (< 1GB)**

Upload a small video file:
- **Expected:** Direct VPS upload (no multipart)
- **Speed:** Should match or exceed current performance

### **3. Large File Test (> 1GB)**

Upload a large video file:
- **Expected:** Multipart strategy (14MB parts, 120 parallel)
- **Target Speed:** 8+ MB/s (significantly faster than current)

### **4. Progress Monitoring**

Watch the upload log for:
```
🚀 VPS UPLOAD: 14MB parts, 120 parallel
📦 Multipart upload started: 1234abcd...
📊 Strategy: 216 parts × 14.0MB, 120 max parallel
✅ Progress: 50/216 parts, 12.5 MB/s avg
🏁 Multipart upload completed in 240.1s at 12.8 MB/s
```

---

## **⚙️ Configuration Tuning**

### **VPS Performance Settings**

Edit `vps-upload-proxy.js` and modify:

```javascript
// For different VPS specs:
function getUploadStrategy(connectionInfo) {
    return {
        partSize: 14 * 1024 * 1024,  // 14MB (tested optimal)
        maxParallel: 120             // 120 parallel (max efficiency)
    };
}
```

**Alternative Configurations:**
- **Conservative:** 10MB parts, 60 parallel
- **Aggressive:** 16MB parts, 150 parallel
- **Bandwidth Limited:** 20MB parts, 50 parallel

### **Firewall Configuration**

Ensure ports are open:
```bash
sudo ufw status
# Should show: 3000/tcp ALLOW Anywhere
```

---

## **🔧 Service Management**

### **Common Commands**

```bash
# Start service
sudo systemctl start wnet-upload-proxy

# Stop service
sudo systemctl stop wnet-upload-proxy

# Restart service
sudo systemctl restart wnet-upload-proxy

# Check status
sudo systemctl status wnet-upload-proxy

# View logs (live)
sudo journalctl -u wnet-upload-proxy -f

# View recent logs
sudo journalctl -u wnet-upload-proxy --since "1 hour ago"
```

### **Update Deployment**

```bash
# Upload new files
scp vps-upload-proxy.js root@178.156.167.243:~/wnet-vps-proxy/

# Restart service
ssh root@178.156.167.243 "systemctl restart wnet-upload-proxy"
```

---

## **📊 Performance Expectations**

### **Current Direct R2 Performance**
- **Speed:** 2.47 MB/s (optimized browser upload)
- **3GB File:** ~20 minutes

### **Expected VPS Performance**
- **Speed:** 8-15 MB/s (VPS optimized multipart)
- **3GB File:** ~3-6 minutes
- **Improvement:** 3-6x faster

### **Comparison to MASV**
- **MASV:** 3.7 MB/s
- **VPS Target:** 8+ MB/s (2x faster than MASV)

---

## **🐛 Troubleshooting**

### **VPS Connection Failed**

```javascript
❌ VPS Connection Failed: Network error
```

**Solutions:**
1. Check VPS service status: `systemctl status wnet-upload-proxy`
2. Check firewall: `ufw status`
3. Verify VPS IP is accessible: `ping 178.156.167.243`

### **CORS Errors**

```javascript
Access to fetch at 'http://178.156.167.243:3000' blocked by CORS
```

**Solutions:**
1. Ensure VPS has CORS headers configured
2. Check local server is using `server-vps-compatible.js`
3. Verify origin in VPS configuration

### **Upload Failures**

```javascript
❌ Upload failed: Failed to start multipart upload
```

**Solutions:**
1. Check R2 credentials in VPS `.env`
2. Verify R2 bucket permissions
3. Check VPS logs: `journalctl -u wnet-upload-proxy -f`

### **Slow Performance**

**If VPS isn't faster than direct upload:**

1. **Check VPS Resources:**
   ```bash
   htop  # Check CPU/memory usage
   ```

2. **Test VPS Network:**
   ```bash
   curl -w "%{speed_download}" -o /dev/null -s "https://fast.com"
   ```

3. **Adjust Strategy:**
   - Lower parallel connections (120 → 60)
   - Adjust part size (14MB → 10MB)

---

## **🔍 Monitoring and Logs**

### **VPS Logs**

```bash
# Service logs
sudo journalctl -u wnet-upload-proxy -f

# File upload logs
tail -f ~/wnet-vps-proxy/uploads.log
```

### **Local Logs**

- Browser console shows VPS progress
- Upload log panel shows detailed progress
- Network tab shows file transfer to VPS

### **Performance Metrics**

Track these key metrics:
- **Upload Speed:** Target 8+ MB/s
- **Time to Complete:** Target 3-6 min for 3GB
- **Error Rate:** Target <1%
- **VPS Resource Usage:** Target <50% CPU

---

## **📈 Success Criteria**

### **Phase 1: Basic Functionality**
- ✅ VPS service running and accessible
- ✅ File uploads complete successfully
- ✅ Progress tracking works correctly

### **Phase 2: Performance Goals**
- 🎯 Achieve 2x MASV speed (7.4+ MB/s)
- 🎯 3GB files upload in <6 minutes
- 🎯 Consistent performance across file sizes

### **Phase 3: Production Ready**
- 🎯 Zero failed uploads in testing
- 🎯 Reliable service availability
- 🎯 Easy monitoring and maintenance

---

**Ready to deploy? Start with Step 1 of VPS Setup! 🚀** 