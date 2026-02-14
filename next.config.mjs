/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.google.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com',
      },
    ],
    // formats: ['image/webp', 'image/avif'], // Temporarily disabled
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // React 19: Fix memory leak warnings and exclude MongoDB from client
  serverExternalPackages: ['mongodb', 'bson'],

  // Webpack optimizations for better performance
  webpack: (config, { dev, isServer }) => {
    // Disable all inline data URIs for fonts and assets
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name].[hash][ext]',
      },
    });

    if (!dev && !isServer) {
      // Production optimizations for client-side only
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // React 19: Development server optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };

      // Increase max listeners for development
      config.target = 'node';
      config.node = {
        ...config.node,
        __dirname: true,
      };
    }

    // Optimizations for both dev and prod
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Optimize imports
        '@components': './src/components',
        '@utils': './src/utils',
        '@actions': './src/actions',
        '@getData': './src/getData',
        '@interfaces': './src/interfaces',
        '@app': './src/app',
        '@libs': './src/app/libs',
      },
    };

    return config;
  },

  // Optimize bundle analyzer and experimental features
  experimental: {
    caseSensitiveRoutes: false,
    optimizePackageImports: [
      'react',
      'react-dom',
      'react-icons',
      'date-fns',
      'lodash',
      '@headlessui/react',
    ],
    scrollRestoration: true,
  },

  // Headers with security improvements
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            // Based on official Google Maps CSP documentation
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com *.google.com https://*.ggpht.com *.googleusercontent.com blob:;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: https: blob: https://*.googleapis.com https://*.gstatic.com *.google.com *.googleusercontent.com https://lh3.googleusercontent.com https://res.cloudinary.com;
              font-src 'self' data: https://fonts.gstatic.com;
              connect-src 'self' https://*.googleapis.com *.google.com https://*.gstatic.com data: blob: https://lh3.googleusercontent.com https://res.cloudinary.com;
              frame-src *.google.com;
              worker-src blob:;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `
              .replace(/\s{2,}/g, ' ')
              .trim(),
          },
        ],
      },
      // API routes CORS
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      // Cache static assets
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Optimize output (commented out for Vercel compatibility)
  // output: 'standalone',

  // Vercel-specific optimizations
  trailingSlash: false,
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Power headers for caching
  poweredByHeader: false,

  // Optimize CSS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable source maps for production (helps with Lighthouse analysis)
  productionBrowserSourceMaps: true,
};

export default nextConfig;
