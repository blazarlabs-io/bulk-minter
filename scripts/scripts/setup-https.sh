#!/bin/bash

# HTTPS Setup Script for Bulk Minter
# This script will set up SSL certificates using Let's Encrypt

set -e  # Exit on any error

echo "🔒 Setting up HTTPS for Bulk Minter..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Get domain name from user
echo "📝 Please enter your domain name (e.g., example.com):"
read -r DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Domain name cannot be empty"
    exit 1
fi

echo "✅ Domain: $DOMAIN_NAME"

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed. Please install nginx first."
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot is already installed"
fi

# Update nginx configuration with actual domain
echo "🔧 Updating nginx configuration..."
sed -i "s/your-domain.com/$DOMAIN_NAME/g" ../configs/nginx.conf

# Copy nginx configuration to sites-available
echo "📁 Copying nginx configuration..."
sudo cp ../configs/nginx.conf /etc/nginx/sites-available/bulk-minter

# Remove default nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️ Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Enable the bulk-minter site
echo "🔗 Enabling nginx site..."
sudo ln -sf /etc/nginx/sites-available/bulk-minter /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

# Check if port 80 and 443 are accessible
echo "🔍 Checking if ports 80 and 443 are accessible..."
if ! sudo netstat -tlnp | grep -q ":80 "; then
    echo "⚠️ Warning: Port 80 is not listening. Make sure nginx is running."
fi

if ! sudo netstat -tlnp | grep -q ":443 "; then
    echo "⚠️ Warning: Port 443 is not listening. This is normal before SSL setup."
fi

# Get SSL certificate
echo "🔐 Getting SSL certificate from Let's Encrypt..."
echo "📋 Make sure your domain points to this server's IP address!"
echo "📋 Also ensure ports 80 and 443 are open in your firewall."
echo ""
echo "Press Enter to continue with certificate generation..."
read -r

# Generate SSL certificate
sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email admin@"$DOMAIN_NAME"

# Test SSL configuration
echo "🧪 Testing SSL configuration..."
sudo nginx -t

# Reload nginx with new SSL configuration
echo "🔄 Reloading nginx with SSL configuration..."
sudo systemctl reload nginx

# Test HTTPS
echo "🔍 Testing HTTPS..."
if curl -s "https://$DOMAIN_NAME" > /dev/null; then
    echo "✅ HTTPS is working correctly!"
else
    echo "⚠️ HTTPS test failed. Please check the configuration."
fi

# Set up auto-renewal
echo "🔄 Setting up automatic certificate renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo ""
echo "🎉 HTTPS setup completed successfully!"
echo ""
echo "📋 Your app is now accessible at: https://$DOMAIN_NAME"
echo "📋 HTTP traffic will automatically redirect to HTTPS"
echo "📋 SSL certificates will auto-renew every 60 days"
echo ""
echo "🔍 To test:"
echo "   curl -I https://$DOMAIN_NAME"
echo ""
echo "📁 Configuration files:"
echo "   - Nginx: /etc/nginx/sites-available/bulk-minter"
echo "   - SSL: /etc/letsencrypt/live/$DOMAIN_NAME/"
echo ""
echo "🔄 To reload nginx after changes:"
echo "   sudo systemctl reload nginx"
