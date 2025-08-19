# 🍷 Bulk Minter - Cardano Wine Tokenization Platform

A professional-grade application for bulk minting and tokenizing wine collections on the Cardano blockchain. Built with Next.js, TypeScript, and Tailwind CSS, this platform provides a seamless interface for wineries to digitize their wine collections as NFTs with IoT sensor data integration.

## ✨ Features

### 🚀 Core Functionality

- **Bulk Minting**: Process multiple wines simultaneously with automated workflows
- **Single NFT Minting**: Individual wine tokenization with real-time monitoring
- **Dual Network Support**: Testnet and Mainnet environments
- **Real-time Monitoring**: Live transaction status tracking via Blockfrost API
- **Resume Capability**: Continue interrupted minting sessions from where they left off

### 🔗 Blockchain Integration

- **Cardano Blockchain**: Native Cardano token minting
- **IPFS Storage**: Decentralized image and metadata storage
- **Blockfrost API**: Real-time transaction confirmation
- **Smart Contract Integration**: Automated minting workflows

### 📊 IoT Data Integration

- **Sensor Data Binding**: Attach real-time IoT sensor data to wine tokens
- **External API Integration**: Fetch live data from IoT storage systems
- **Metadata Enrichment**: Enhanced token metadata with environmental data

### 🎨 User Experience

- **Retro UI Design**: Modern, professional interface with retro aesthetics
- **Real-time Console**: Live logging and operation monitoring
- **Progress Tracking**: Visual progress indicators for bulk operations
- **Error Handling**: Comprehensive error reporting and recovery

## 🏗️ Architecture

### Frontend

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS v3**: Utility-first CSS framework
- **Responsive Design**: Mobile and desktop optimized

### Backend

- **API Routes**: Server-side API endpoints
- **External Integrations**: Cardano API, IPFS, IoT storage
- **Authentication**: Basic auth for external services
- **Error Handling**: Robust error management and logging

### Data Flow

```
Wine Data → Image Processing → IPFS Upload → Token Minting → Blockchain Confirmation
     ↓              ↓              ↓            ↓              ↓
  Validation    Download      IPFS Hash    Cardano API    Blockfrost
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cardano wallet (for mainnet operations)
- Access to external APIs (Cardano, IPFS, IoT storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd bulk-minter
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file with the following variables:

   ```env
   # Cardano API Configuration
   TOKENIZATION_API_URL="https://api.cardano.vip"
   TOKENIZATION_API_USERNAME="your_username"
   TOKENIZATION_API_PASSWORD="your_password"

   # IPFS Configuration
   IPFS_GATEWAY="https://ipfs.cardano.vip/ipfs"

   # IoT Storage API
   IOT_STORAGE_SENSORS_API_URL="https://your-iot-api.com/endpoint"

   # Blockfrost API (for transaction monitoring)
   BLOCKFROST_API_KEY="your_blockfrost_api_key"

   # Application Settings
   PORT=3000
   NODE_ENV=development
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📖 Usage Guide

### Bulk Minting Mode

1. **Select Environment**: Choose between Testnet and Mainnet
2. **Configure Wineries**: Select wineries and wines to process
3. **Start Process**: Initiate bulk minting with automated workflows
4. **Monitor Progress**: Real-time progress tracking and status updates
5. **Handle Results**: Download results and manage minted tokens

### Single NFT Minting

1. **Select Wine**: Choose specific winery and wine
2. **Process Image**: Automatic image download and IPFS upload
3. **Create Token**: Generate and mint individual NFT
4. **Monitor Transaction**: Real-time blockchain confirmation
5. **Verify Success**: Confirm token creation and ownership

### Console Monitoring

- **Real-time Logs**: Live operation updates and status messages
- **Error Tracking**: Comprehensive error reporting and debugging
- **Progress Updates**: Step-by-step operation progress
- **Transaction Status**: Live blockchain confirmation updates

## 🔧 Configuration

### Network Settings

- **Testnet**: Development and testing environment
- **Mainnet**: Production blockchain operations
- **API Endpoints**: Configurable external service URLs
- **Timeout Settings**: Adjustable request timeouts

### Performance Tuning

- **Batch Sizes**: Configurable processing batch sizes
- **Retry Logic**: Automatic retry for failed operations
- **Rate Limiting**: Respectful API usage patterns
- **Memory Management**: Efficient resource utilization

## 🛠️ Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/             # React components
│   └── BatchMintingTest.tsx
├── services/               # Business logic services
│   ├── batchMintingProcessor.ts
│   ├── blockfrost/        # Cardano API integration
│   ├── iot-storage/       # IoT data services
│   └── tokenization/      # Token minting services
├── types/                  # TypeScript type definitions
└── lib/                    # Utility functions
```

### Key Components

- **BatchMintingProcessor**: Core minting workflow engine
- **Blockfrost Client**: Cardano blockchain integration
- **IoT Storage Client**: External sensor data integration
- **Tokenization API**: Cardano token minting service

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🔒 Security

### Authentication

- **Environment Variables**: Secure credential management
- **API Keys**: Protected external service access
- **Request Validation**: Input sanitization and validation
- **Error Handling**: Secure error message handling

### Best Practices

- **HTTPS Only**: Secure communication protocols
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API abuse prevention
- **Logging**: Secure audit trail maintenance

## 📊 Monitoring & Logging

### Console Output

- **Real-time Updates**: Live operation status
- **Error Reporting**: Detailed error information
- **Progress Tracking**: Step-by-step operation progress
- **Transaction Status**: Blockchain confirmation updates

### Log Levels

- **Info**: General operation information
- **Success**: Successful operation completion
- **Warning**: Non-critical issues
- **Error**: Critical operation failures
- **Step**: Operation progress markers

## 🚨 Troubleshooting

### Common Issues

#### API Connection Failures

- Verify environment variables are correctly set
- Check external API service status
- Validate authentication credentials
- Review network connectivity

#### Minting Failures

- Ensure sufficient Cardano wallet balance
- Verify wine data completeness
- Check IPFS upload success
- Review transaction confirmation status

#### Performance Issues

- Adjust batch processing sizes
- Monitor memory usage
- Review API rate limits
- Check network latency

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development` in your environment configuration.

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript and React best practices
2. **Testing**: Ensure all changes pass linting and type checking
3. **Documentation**: Update relevant documentation for changes
4. **Commit Messages**: Use conventional commit format

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cardano Foundation**: Blockchain infrastructure
- **Blockfrost**: Cardano API services
- **IPFS**: Decentralized storage protocol
- **Next.js Team**: React framework
- **Tailwind CSS**: Utility-first CSS framework

## 📞 Support

For support and questions:

- **Issues**: Create a GitHub issue
- **Documentation**: Check this README and inline code comments
- **Community**: Join our development community

---

**Built with ❤️ for the Cardano ecosystem**

_Last updated: August 2025_
