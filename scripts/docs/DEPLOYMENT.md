# Bulk Minter - Server Deployment Guide

This guide will walk you through deploying the Bulk Minter application to your server.

## Prerequisites

- Ubuntu/Debian server with Node.js 20+ installed
- Nginx web server
- Domain name (optional but recommended)
- SSH access to your server

## Quick Deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd bulk-minter

# Run the automated deployment script
./deploy.sh
```

### 2. Manual Deployment Steps

If you prefer to deploy manually:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Nginx Configuration

### 1. Copy the nginx configuration

```bash
sudo cp nginx.conf /etc/nginx/sites-available/bulk-minter
```

### 2. Update the configuration

Edit `/etc/nginx/sites-available/bulk-minter` and change:

- `your-domain.com` to your actual domain
- Adjust any paths if needed

### 3. Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/bulk-minter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables

### 1. Create production environment file

```bash
cp env.production.template .env.local
```

### 2. Fill in your actual values

Edit `.env.local` with your real API keys and URLs:

```bash
TOKENIZATION_API_URL=https://your-actual-api.com
TOKENIZATION_API_USERNAME=your_real_username
TOKENIZATION_API_PASSWORD=your_real_password
BLOCKFROST_API_KEY=your_real_blockfrost_key
# ... etc
```

## SSL Certificate (Optional but Recommended)

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 2. Get SSL certificate

```bash
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Maintenance

### PM2 Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs bulk-minter

# Restart application
pm2 restart bulk-minter

# Monitor resources
pm2 monit

# Stop application
pm2 stop bulk-minter
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**

   ```bash
   sudo netstat -tlnp | grep :3000
   # Kill the process using that port
   ```

2. **Permission denied errors**

   ```bash
   # Make sure you're not running as root
   # Check file permissions
   ls -la
   ```

3. **Build failures**

   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

4. **Nginx configuration errors**
   ```bash
   # Test configuration
   sudo nginx -t
   # Check syntax in your config file
   ```

### Log Locations

- **Application logs**: `./logs/` directory
- **PM2 logs**: `pm2 logs bulk-minter`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `journalctl -u nginx`

## Security Considerations

1. **Firewall**: Ensure only necessary ports are open
2. **Environment variables**: Never commit `.env.local` to version control
3. **Updates**: Keep Node.js and npm updated
4. **Monitoring**: Set up log monitoring and alerts

## Performance Optimization

1. **PM2 clustering**: Adjust instances in ecosystem.config.js
2. **Nginx caching**: Static files are already configured for caching
3. **Gzip compression**: Already enabled in nginx config
4. **Memory limits**: Adjust `max_memory_restart` in PM2 config

## Backup and Recovery

### Backup important files

```bash
# Environment variables
cp .env.local .env.local.backup

# PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup

# Nginx configuration
sudo cp /etc/nginx/sites-available/bulk-minter /etc/nginx/sites-available/bulk-minter.backup
```

### Recovery

```bash
# Restore PM2 configuration
pm2 resurrect

# Restore nginx configuration
sudo cp /etc/nginx/sites-available/bulk-minter.backup /etc/nginx/sites-available/bulk-minter
sudo nginx -t && sudo systemctl reload nginx
```

## Support

If you encounter issues:

1. Check the logs first
2. Verify all environment variables are set
3. Ensure Node.js version is 20+
4. Check nginx configuration syntax
5. Verify PM2 is running the application

---

**Note**: This application requires specific API keys and external services to function properly. Make sure all required services are accessible from your server.
