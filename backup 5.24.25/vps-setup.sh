#!/bin/bash

echo "🚀 WNET VPS Upload Proxy Setup"
echo "================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
echo "🟢 Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create project directory
echo "📁 Creating project directory..."
mkdir -p ~/wnet-vps-proxy
cd ~/wnet-vps-proxy

# Copy files (you'll need to upload these separately)
echo "📋 Project files should be uploaded to: $(pwd)"
echo "   - vps-upload-proxy.js"
echo "   - package.json"
echo "   - .env (copy from vps-env-template.txt)"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create systemd service
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/wnet-upload-proxy.service > /dev/null <<EOF
[Unit]
Description=WNET Upload Proxy
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/wnet-vps-proxy
Environment=NODE_ENV=production
ExecStart=/usr/bin/node vps-upload-proxy.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🔄 Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable wnet-upload-proxy
sudo systemctl start wnet-upload-proxy

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Show status
echo "✅ Setup complete!"
echo ""
echo "📊 Service status:"
sudo systemctl status wnet-upload-proxy --no-pager -l

echo ""
echo "🔧 Next steps:"
echo "1. Edit .env file with your R2 credentials"
echo "2. Restart service: sudo systemctl restart wnet-upload-proxy"
echo "3. Check logs: sudo journalctl -u wnet-upload-proxy -f"
echo "4. Test endpoint: curl http://YOUR_VPS_IP:3000/health" 