#!/bin/bash

# Firewall Setup Script for Bulk Minter
# This script will configure UFW firewall for HTTPS access

set -e  # Exit on any error

echo "🔥 Setting up firewall for Bulk Minter..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    echo "📦 Installing UFW firewall..."
    sudo apt update
    sudo apt install -y ufw
else
    echo "✅ UFW is already installed"
fi

# Check UFW status
echo "📊 Current UFW status:"
sudo ufw status

# Reset UFW to default
echo "🔄 Resetting UFW to default settings..."
sudo ufw --force reset

# Set default policies
echo "⚙️ Setting default policies..."
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important!)
echo "🔑 Allowing SSH access..."
sudo ufw allow ssh
sudo ufw allow 22

# Allow HTTP and HTTPS
echo "🌐 Allowing HTTP and HTTPS..."
sudo ufw allow 80
sudo ufw allow 443

# Allow the port your app runs on (if different from 3000)
echo "🚀 Allowing application port..."
sudo ufw allow 3000

# Enable UFW
echo "✅ Enabling UFW firewall..."
sudo ufw --force enable

# Show final status
echo "📊 Final UFW status:"
sudo ufw status

echo ""
echo "🎉 Firewall setup completed!"
echo ""
echo "📋 Ports now open:"
echo "   - 22 (SSH)"
echo "   - 80 (HTTP)"
echo "   - 443 (HTTPS)"
echo "   - 3000 (Your app)"
echo ""
echo "⚠️ Important: Make sure you can still SSH to your server!"
echo "   If you get locked out, you may need to access the server console"
echo "   to disable UFW: sudo ufw disable"
echo ""
echo "🔍 To check firewall status anytime:"
echo "   sudo ufw status"
echo ""
echo "🔍 To see detailed rules:"
echo "   sudo ufw status verbose"
