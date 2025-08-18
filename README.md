# Bulk Minter

A Next.js application for bulk tokenization and minting on the Cardano blockchain.

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
```

### Production Deployment

```bash
# Use the organized deployment scripts
./deploy.sh deploy      # Deploy the application
./deploy.sh https       # Set up HTTPS
./deploy.sh firewall    # Configure firewall
./deploy.sh help        # Show all available commands
```

## 📁 Project Structure

```
bulk-minter/
├── src/                    # Application source code
├── public/                 # Static assets
├── scripts/                # Deployment and configuration
│   ├── scripts/           # Deployment scripts
│   ├── configs/           # Configuration files
│   ├── docs/              # Deployment documentation
│   └── README.md          # Scripts documentation
├── deploy.sh               # Main deployment entry point
├── package.json            # Dependencies and scripts
├── next.config.js          # Next.js configuration
└── README.md               # This file
```

## 🔧 Deployment

The project includes a comprehensive deployment suite with:

- **Automated deployment** with PM2 process management
- **HTTPS setup** with Let's Encrypt SSL certificates
- **Firewall configuration** for security
- **Nginx reverse proxy** configuration
- **Environment management** for production

### Quick Deployment Commands

```bash
# Show available commands
./deploy.sh help

# Deploy the application
./deploy.sh deploy

# Set up HTTPS (requires domain)
./deploy.sh https

# Configure firewall
./deploy.sh firewall

# Show project structure
./deploy.sh structure
```

## 📖 Documentation

- **Main Deployment Guide**: `scripts/docs/DEPLOYMENT.md`
- **Deployment Checklist**: `scripts/docs/DEPLOYMENT_CHECKLIST.md`
- **HTTPS Setup Guide**: `scripts/docs/HTTPS_SETUP.md`
- **Scripts Documentation**: `scripts/README.md`

## 🛠️ Requirements

- Node.js 20+
- npm or bun
- Ubuntu/Debian server (for deployment)
- Domain name (for HTTPS)

## 🔒 Security Features

- HTTPS with modern SSL/TLS
- Security headers
- Firewall configuration
- Environment variable protection

## 📱 Features

- Bulk token minting
- Cardano blockchain integration
- IPFS image storage
- Real-time monitoring
- Responsive UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need Help?** Start with `./deploy.sh help` for deployment assistance.
