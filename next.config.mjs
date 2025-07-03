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

  // Add security headers for production
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // Content Security Policy
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://static.klaviyo.com https://www.gstatic.com https://www.google.com https://www.recaptcha.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com;
      img-src 'self' data: blob: https://firebasestorage.googleapis.com https://maps.googleapis.com https://maps.gstatic.com https://images.unsplash.com https://placehold.co https://www.googletagmanager.com https://www.google-analytics.com https://ssl.gstatic.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://firestore.googleapis.com https://firebase.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://maps.googleapis.com https://www.google-analytics.com https://a.klaviyo.com https://fast.apify.com;
      frame-src https://www.google.com https://www.recaptcha.net https://recaptcha.google.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();
    
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
          },
          {
            key: 'Content-Security-Policy',
            value: isDev ? '' : cspHeader
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=()'
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
