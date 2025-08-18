# Bulk Minter - Deployment Scripts

This directory contains all the deployment and configuration scripts for the Bulk Minter application.

## 📁 Directory Structure

```
scripts/
├── README.md                    # This file
├── scripts/                     # Deployment scripts
│   ├── deploy.sh               # Main deployment script
│   ├── setup-https.sh          # HTTPS setup with Let's Encrypt
│   └── setup-firewall.sh       # Firewall configuration (UFW)
├── configs/                     # Configuration files
│   ├── nginx.conf              # Nginx configuration for HTTPS
│   ├── ecosystem.config.js     # PM2 process manager configuration
│   └── env.production.template # Environment variables template
└── docs/                        # Documentation
    ├── DEPLOYMENT.md            # Complete deployment guide
    ├── DEPLOYMENT_CHECKLIST.md  # Step-by-step deployment checklist
    └── HTTPS_SETUP.md           # HTTPS setup guide
```

## 🚀 Quick Start

From the project root directory, use the main deployment script:

```bash
# Show available commands
./deploy.sh help

# Deploy the application
./deploy.sh deploy

# Set up HTTPS
./deploy.sh https

# Configure firewall
./deploy.sh firewall

# Show project structure
./deploy.sh structure
```

## 📋 What Each Script Does

### Main Scripts (`scripts/scripts/`)
- **`deploy.sh`** - Deploys the app with PM2, installs dependencies, builds the app
- **`setup-https.sh`** - Sets up HTTPS with Let's Encrypt, configures nginx
- **`setup-firewall.sh`** - Configures UFW firewall for security

### Configuration Files (`scripts/configs/`)
- **`nginx.conf`** - Nginx configuration with HTTPS support
- **`ecosystem.config.js`** - PM2 configuration for process management
- **`env.production.template`** - Template for environment variables

### Documentation (`scripts/docs/`)
- **`DEPLOYMENT.md`** - Complete deployment guide
- **`DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist
- **`HTTPS_SETUP.md`** - Detailed HTTPS setup guide

## 🔧 Manual Usage

If you prefer to run scripts manually:

```bash
# Navigate to scripts directory
cd scripts

# Run deployment
./scripts/deploy.sh

# Set up HTTPS
./scripts/setup-https.sh

# Configure firewall
./scripts/setup-firewall.sh
```

## 📖 Documentation

- **Main Guide**: `docs/DEPLOYMENT.md` - Complete deployment process
- **Checklist**: `docs/DEPLOYMENT_CHECKLIST.md` - Step-by-step verification
- **HTTPS Guide**: `docs/HTTPS_SETUP.md` - SSL certificate setup

## ⚠️ Important Notes

1. **Run from project root**: Always run `./deploy.sh` from the project root directory
2. **Not as root**: Never run these scripts as the root user
3. **Domain required**: For HTTPS setup, you need a domain pointing to your server
4. **Ports open**: Ensure ports 80, 443, and 3000 are accessible

## 🆘 Troubleshooting

If you encounter issues:

1. Check the documentation in `docs/`
2. Verify you're running from the project root
3. Ensure you're not running as root
4. Check that all required software is installed
5. Verify your domain DNS configuration

## 🔄 Updates

To update the deployment scripts:

1. Pull the latest changes from git
2. Review any changes in the scripts
3. Test the deployment process
4. Update your production environment if needed

---

**Need Help?** Start with `./deploy.sh help` from the project root directory.
