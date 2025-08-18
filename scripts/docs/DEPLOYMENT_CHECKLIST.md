# Deployment Checklist

## Pre-Deployment

- [ ] Server has Node.js 20+ installed
- [ ] Server has nginx installed
- [ ] Server has git installed
- [ ] SSH access to server is working
- [ ] Domain name is configured (if using)

## Application Setup

- [ ] Repository cloned to server
- [ ] Dependencies installed (`npm install`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Production build tested locally (`npm start`)

## Environment Configuration

- [ ] `.env.local` file created from template
- [ ] All API keys and URLs filled in
- [ ] Environment variables tested
- [ ] No sensitive data committed to git

## Process Management

- [ ] PM2 installed globally
- [ ] Application started with PM2
- [ ] PM2 configuration saved
- [ ] PM2 startup script configured
- [ ] Application accessible on port 3000

## Web Server Configuration

- [ ] Nginx configuration file copied to sites-available
- [ ] Server name updated in nginx config
- [ ] Nginx site enabled
- [ ] Nginx configuration tested
- [ ] Nginx reloaded successfully

## SSL Certificate (Optional)

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS redirect configured
- [ ] SSL certificate auto-renewal configured

## Testing

- [ ] Application accessible via domain/IP
- [ ] All API endpoints working
- [ ] Static files loading correctly
- [ ] Error pages working
- [ ] Health check endpoint responding

## Monitoring

- [ ] PM2 monitoring configured
- [ ] Log files accessible
- [ ] Error monitoring set up
- [ ] Performance monitoring configured

## Security

- [ ] Firewall configured
- [ ] Unnecessary ports closed
- [ ] Environment variables secured
- [ ] Nginx security headers enabled

## Backup

- [ ] Environment file backed up
- [ ] PM2 configuration backed up
- [ ] Nginx configuration backed up
- [ ] Database backed up (if applicable)

## Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Maintenance procedures documented

## Post-Deployment

- [ ] Application running stably
- [ ] Performance metrics acceptable
- [ ] Error rates within normal range
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured

---

## Quick Commands Reference

```bash
# Check application status
pm2 status

# View logs
pm2 logs bulk-minter

# Restart application
pm2 restart bulk-minter

# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check application health
curl http://localhost:3000/health
```
