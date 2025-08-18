/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Remove deprecated appDir option
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure proper module resolution
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Add experimental features that might help
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
