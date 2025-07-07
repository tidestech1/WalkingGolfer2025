/** @type {import('next').NextConfig} */

/**
 * Next.js Configuration 
 * 
 * IMPORTANT: This config addresses the "UnhandledSchemeError with 'node:' prefixes" problem
 * that occurs when Firebase Admin and its dependencies are used in a Next.js app.
 * 
 * The solution:
 * 1. We set firebase-admin to 'false' in client-side webpack config to prevent it from being bundled
 * 2. We add transpilePackages for proper handling of node: scheme imports
 * 3. We've moved code that imports adminUtils (which uses Firebase Admin) to server components
 * 
 * If you encounter this error again, make sure:
 * - Firebase Admin is only used in server components/API routes (not in client components)
 * - Any component importing Firebase Admin code uses the 'use server' directive
 */
const nextConfig = {
  // Note: Removed experimental forceSwcTransforms flag as it was causing PostCSS issues
  // Note: Removed allowedDevOrigins as it's not a valid Next.js option
  
  // Add redirects to ensure all traffic goes to https://www.walkinggolfer.com
  async redirects() {
    return [
      // Redirect non-www to www (HTTP and HTTPS)
      {
        source: '/(.*)',
        has: [
          {
            type: 'host',
            value: 'walkinggolfer.com',
          },
        ],
        destination: 'https://www.walkinggolfer.com/:path*',
        permanent: true,
      },
      // Redirect HTTP www to HTTPS www
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
          {
            type: 'host',
            value: 'www.walkinggolfer.com',
          },
        ],
        destination: 'https://www.walkinggolfer.com/:path*',
        permanent: true,
      },
    ]
  },


  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  webpack: (config, { isServer }) => {
    // Client-side specific configurations
    if (!isServer) {
      // Completely exclude firebase-admin from client-side bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'firebase-admin': false,
        'firebase-admin/app': false,
        'firebase-admin/auth': false,
        'firebase-admin/firestore': false,
      };
    }
    
    return config;
  },
  
  // This option tells Next.js to properly transpile these packages
  transpilePackages: ['firebase-admin', 'google-auth-library', 'gcp-metadata', 'google-logging-utils']
};

export default nextConfig;
