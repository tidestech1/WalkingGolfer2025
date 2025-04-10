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
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // Use this ONLY if blocked by a suspected Next.js bug like the PageProps issue.
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Allow Replit's development environment
  allowedDevOrigins: [
    'a33281ec-5c44-4565-8d75-65e2cd2cc533-00-10fziv3cz1fuc.worf.replit.dev'
  ],
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
        hostname: "www.presidio.gov",
      },
      {
        protocol: "https",
        hostname: "www.pebblebeach.com",
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
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.openai.com/:path*",
      },
    ];
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
    
    // Add the transpilePackages option to handle node: imports in dependencies
    return config;
  },
  // This option tells Next.js to properly transpile these packages
  transpilePackages: ['firebase-admin', 'google-auth-library', 'gcp-metadata', 'google-logging-utils']
};

export default nextConfig;
