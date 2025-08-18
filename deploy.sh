#!/bin/bash

# Bulk Minter - Main Deployment Script
# This script provides easy access to all deployment tools

set -e  # Exit on any error

echo "🚀 Bulk Minter Deployment Suite"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "scripts" ]; then
    echo "❌ Error: 'scripts' directory not found!"
    echo "   Please run this script from the project root directory."
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Available Commands:"
    echo "  deploy          - Deploy the application with PM2"
    echo "  https           - Set up HTTPS with Let's Encrypt"
    echo "  firewall        - Configure firewall (UFW)"
    echo "  nginx           - Set up nginx configuration"
    echo "  help            - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy       # Deploy the app"
    echo "  $0 https        # Set up HTTPS"
    echo "  $0 firewall     # Configure firewall"
    echo ""
    echo "Documentation:"
    echo "  See scripts/docs/ for detailed guides"
    echo ""
}

# Function to run deployment
run_deploy() {
    echo "🚀 Running deployment..."
    ./scripts/scripts/deploy.sh
}

# Function to run HTTPS setup
run_https() {
    echo "🔒 Setting up HTTPS..."
    ./scripts/scripts/setup-https.sh
}

# Function to run firewall setup
run_firewall() {
    echo "🔥 Setting up firewall..."
    ./scripts/scripts/setup-firewall.sh
}

# Function to run nginx setup
run_nginx() {
    echo "🌐 Setting up nginx..."
    echo "📁 Configuration files are in: scripts/configs/"
    echo "📖 Documentation is in: scripts/docs/"
    echo ""
    echo "To set up nginx manually:"
    echo "1. Copy scripts/configs/nginx.conf to /etc/nginx/sites-available/bulk-minter"
    echo "2. Update the server_name in the config"
    echo "3. Enable the site: sudo ln -s /etc/nginx/sites-available/bulk-minter /etc/nginx/sites-enabled/"
    echo "4. Test: sudo nginx -t"
    echo "5. Reload: sudo systemctl reload nginx"
}

# Function to show project structure
show_structure() {
    echo "📁 Project Structure:"
    echo "====================="
    echo ""
    echo "scripts/"
    echo "├── scripts/          # Deployment scripts"
    echo "│   ├── deploy.sh     # Main deployment script"
    echo "│   ├── setup-https.sh # HTTPS setup"
    echo "│   └── setup-firewall.sh # Firewall setup"
    echo "├── configs/          # Configuration files"
    echo "│   ├── nginx.conf    # Nginx configuration"
    echo "│   ├── ecosystem.config.js # PM2 configuration"
    echo "│   └── env.production.template # Environment template"
    echo "└── docs/             # Documentation"
    echo "    ├── DEPLOYMENT.md # Main deployment guide"
    echo "    ├── DEPLOYMENT_CHECKLIST.md # Deployment checklist"
    echo "    └── HTTPS_SETUP.md # HTTPS setup guide"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "deploy")
        run_deploy
        ;;
    "https")
        run_https
        ;;
    "firewall")
        run_firewall
        ;;
    "nginx")
        run_nginx
        ;;
    "structure")
        show_structure
        ;;
    "help"|*)
        show_usage
        show_structure
        ;;
esac
