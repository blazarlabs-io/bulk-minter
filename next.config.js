/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure proper module resolution
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Add node-fetch as external to avoid bundling issues
      config.externals = config.externals || [];
      config.externals.push("node-fetch");
    }
    return config;
  },

  // Add experimental features that might help
  experimental: {
    serverComponentsExternalPackages: ["node-fetch"],
  },
};

module.exports = nextConfig;
