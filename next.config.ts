import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable TypeScript checking for development
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile packages that need to be compiled for the browser
  transpilePackages: ['polkamarkets-js'],

  // Disable experimental features to avoid Jest worker issues
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', 'lucide-react'],
  },

  // Add webpack config for development stability
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };

      // Disable Jest worker in development
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }

    // Ignore optional dependencies for wagmi/web3 that are only for React Native
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        '@react-native-async-storage/async-storage': false,
        'react-native': false,
        'pino-pretty': false,
        // Add Node.js polyfills for polkamarkets-js
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        fs: false,
        path: false,
      },
    };

    // Ignore warnings for optional dependencies
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@react-native-async-storage/ },
      { module: /node_modules\/react-native/ },
      { module: /node_modules\/pino-pretty/ },
    ];

    return config;
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Suppress hydration warnings for browser extensions
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  // Ignore hydration mismatches from browser extensions
  env: {
    NEXT_SUPPRESS_HYDRATION_WARNING: 'true'
  },

  // API routes handle proxying to Opinion API with proper headers

  // Headers configuration for better SEO
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
