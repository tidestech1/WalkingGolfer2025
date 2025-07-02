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
  
  // Add security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
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
