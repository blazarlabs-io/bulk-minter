# HTTPS Setup Guide for Bulk Minter

This guide will walk you through setting up HTTPS for your Bulk Minter application using Let's Encrypt.

## Prerequisites

- ✅ Domain name pointing to your server's IP address
- ✅ Server with ports 80 and 443 accessible from the internet
- ✅ SSH access to your server
- ✅ Bulk Minter application already deployed and running

## Quick Setup (Automated)

### Option 1: Use the Updated Deployment Script
```bash
# Run the main deployment script
./deploy.sh

# When prompted, choose 'y' for HTTPS setup
# The script will automatically set up everything
```

### Option 2: Run HTTPS Setup Separately
```bash
# If you already deployed, just run HTTPS setup
./setup-https.sh
```

## Manual Setup (Step by Step)

### Step 1: Prepare Your Domain
1. **DNS Configuration**: Ensure your domain points to your server's IP address
2. **Wait for DNS Propagation**: This can take up to 24 hours (usually much faster)

### Step 2: Install Required Software
```bash
# Update package list
sudo apt update

# Install nginx (if not already installed)
sudo apt install -y nginx

# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
```

### Step 3: Configure Firewall
```bash
# Run the firewall setup script
./setup-firewall.sh

# Or manually configure UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Your app
sudo ufw enable
```

### Step 4: Update Nginx Configuration
1. **Edit the nginx.conf file**:
   ```bash
   # Replace 'your-domain.com' with your actual domain
   sed -i 's/your-domain.com/YOUR_ACTUAL_DOMAIN.com/g' nginx.conf
   ```

2. **Copy to nginx sites**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/bulk-minter
   sudo ln -sf /etc/nginx/sites-available/bulk-minter /etc/nginx/sites-enabled/
   ```

3. **Remove default site** (if exists):
   ```bash
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

4. **Test configuration**:
   ```bash
   sudo nginx -t
   ```

5. **Reload nginx**:
   ```bash
   sudo systemctl reload nginx
   ```

### Step 5: Get SSL Certificate
```bash
# Replace YOUR_DOMAIN with your actual domain
sudo certbot --nginx -d YOUR_DOMAIN.com --non-interactive --agree-tos --email admin@YOUR_DOMAIN.com
```

### Step 6: Test HTTPS
```bash
# Test if HTTPS is working
curl -I https://YOUR_DOMAIN.com

# Check SSL certificate
sudo certbot certificates
```

### Step 7: Set Up Auto-Renewal
```bash
# Add renewal to crontab
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

# Test renewal process
sudo certbot renew --dry-run
```

## Verification

### Check HTTPS Status
```bash
# Test HTTPS response
curl -I https://YOUR_DOMAIN.com

# Check SSL certificate details
openssl s_client -connect YOUR_DOMAIN.com:443 -servername YOUR_DOMAIN.com < /dev/null
```

### Check Nginx Status
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx configuration
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Firewall Status
```bash
# Check UFW status
sudo ufw status

# Check open ports
sudo netstat -tlnp
```

## Troubleshooting

### Common Issues

#### 1. **Domain Not Resolving**
```bash
# Check DNS resolution
nslookup YOUR_DOMAIN.com
dig YOUR_DOMAIN.com

# Verify your domain points to the correct IP
curl -s ifconfig.me  # Get your server's public IP
```

#### 2. **Ports Not Accessible**
```bash
# Check if ports are open
sudo netstat -tlnp | grep -E ':(80|443|3000)'

# Check firewall status
sudo ufw status

# Test port accessibility from outside
# Use an online port checker or test from another machine
```

#### 3. **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate files
sudo ls -la /etc/letsencrypt/live/YOUR_DOMAIN.com/
```

#### 4. **Nginx Configuration Errors**
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx after fixes
sudo systemctl reload nginx
```

### SSL Certificate Renewal

#### Manual Renewal
```bash
sudo certbot renew
```

#### Check Renewal Status
```bash
sudo certbot renew --dry-run
```

#### View Renewal Logs
```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Security Considerations

### SSL Configuration
- ✅ TLS 1.2 and 1.3 only
- ✅ Strong cipher suites
- ✅ HSTS header enabled
- ✅ Security headers configured

### Firewall Rules
- ✅ Only necessary ports open
- ✅ SSH access maintained
- ✅ Default deny incoming policy

### Certificate Management
- ✅ Auto-renewal configured
- ✅ Certificate monitoring
- ✅ Backup procedures

## Performance Optimization

### Nginx Optimizations
- ✅ Gzip compression enabled
- ✅ Static file caching
- ✅ HTTP/2 support
- ✅ Connection pooling

### SSL Optimizations
- ✅ OCSP stapling enabled
- ✅ Session caching
- ✅ Modern cipher suites

## Monitoring

### SSL Certificate Monitoring
```bash
# Check certificate expiration
sudo certbot certificates

# Monitor renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Nginx Monitoring
```bash
# Check nginx status
sudo systemctl status nginx

# Monitor access logs
sudo tail -f /var/log/nginx/access.log

# Monitor error logs
sudo tail -f /var/log/nginx/error.log
```

## Backup and Recovery

### Backup SSL Configuration
```bash
# Backup nginx configuration
sudo cp /etc/nginx/sites-available/bulk-minter /etc/nginx/sites-available/bulk-minter.backup

# Backup SSL certificates
sudo cp -r /etc/letsencrypt /etc/letsencrypt.backup
```

### Recovery Procedures
```bash
# Restore nginx configuration
sudo cp /etc/nginx/sites-available/bulk-minter.backup /etc/nginx/sites-available/bulk-minter

# Restore SSL certificates
sudo cp -r /etc/letsencrypt.backup /etc/letsencrypt

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Maintenance

### Regular Tasks
- ✅ Monitor certificate expiration
- ✅ Check nginx logs for errors
- ✅ Verify firewall rules
- ✅ Update SSL configuration

### Updates
```bash
# Update certbot
sudo apt update && sudo apt upgrade certbot

# Update nginx
sudo apt update && sudo apt upgrade nginx
```

---

## Quick Reference Commands

```bash
# Check HTTPS status
curl -I https://YOUR_DOMAIN.com

# Check SSL certificate
sudo certbot certificates

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check firewall
sudo ufw status

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

**Need Help?** Check the logs first, then refer to the troubleshooting section above.
