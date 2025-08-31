import type { NextConfig } from "next";

// The problematic import is removed.

const nextConfig: NextConfig = {


  /* config options here */
  async redirects() {
    return [

    ];
  },
  compiler: {
    // removeConsole: process.env.NODE_ENV === "production" ? { exclude: ['error', 'warn', 'debug'] }
    //   : false
  },
  async headers() {
    return [
      {
        source: '/(.*)?', // Matches all pages

        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          }
        ]
      }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    
    },
  },
  images: {
    // Add your image domain here use for nextjs Image componetes
    remotePatterns: [

    ],
  },

  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          net: false,
          dns: false,
          tls: false,
          assert: false,

          path: false,
          fs: false,

          events: false,

          process: false,

        }
      };
    }
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(/node:/, (resource: any) => {
      resource.request = resource.request.replace(/^node:/, "");
    }))
    // ignore replicate warning
    // config.ignoreWarnings = config.ignoreWarnings || [];
    // config.ignoreWarnings.push({
    //   module: /replicate/,
    //   message: /require function is used in a way in which dependencies cannot be statically extracted/,
    // });
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config
  },
};

export default nextConfig;
