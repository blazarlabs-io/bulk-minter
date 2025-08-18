#!/bin/bash

# Bulk Minter Deployment Script
# Run this script on your server after cloning the repository

set -e  # Exit on any error

echo "🚀 Starting Bulk Minter deployment..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Start the application with PM2
echo "🚀 Starting the application with PM2..."
pm2 start ../configs/ecosystem.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on boot
echo "🔧 Setting up PM2 to start on boot..."
pm2 startup

echo "✅ Basic deployment completed successfully!"
echo ""

# Ask about HTTPS setup
echo "🔒 Would you like to set up HTTPS with Let's Encrypt? (y/n)"
read -r SETUP_HTTPS

if [[ $SETUP_HTTPS =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌐 Setting up HTTPS..."
    
    # Check if nginx is installed
    if ! command -v nginx &> /dev/null; then
        echo "📦 Installing nginx..."
        sudo apt update
        sudo apt install -y nginx
    fi
    
    # Run HTTPS setup
    echo "🔐 Running HTTPS setup script..."
    ./setup-https.sh
    
    echo ""
    echo "🎉 HTTPS setup completed!"
else
    echo ""
    echo "📋 To set up HTTPS later, run:"
    echo "   ./setup-https.sh"
fi

echo ""
echo "📋 Next steps:"
echo "1. Copy ../configs/nginx.conf to /etc/nginx/sites-available/bulk-minter (if not using HTTPS)"
echo "2. Update the server_name in nginx.conf to your domain"
echo "3. Enable the nginx site: sudo ln -s /etc/nginx/sites-available/bulk-minter /etc/nginx/sites-enabled/"
echo "4. Test nginx config: sudo nginx -t"
echo "5. Reload nginx: sudo systemctl reload nginx"
echo ""
echo "🔍 Useful commands:"
echo "- Check app status: pm2 status"
echo "- View logs: pm2 logs bulk-minter"
echo "- Restart app: pm2 restart bulk-minter"
echo "- Monitor resources: pm2 monit"
echo ""
echo "🔒 For HTTPS setup:"
echo "- Run: ./setup-https.sh"
echo "- Or manually: ./setup-firewall.sh then ./setup-https.sh"
echo ""
echo "📖 Documentation:"
echo "- See ../docs/ for detailed guides"
