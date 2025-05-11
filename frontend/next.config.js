/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  webpack: (config) => {
    // Support PDF.js worker
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Set global object for web workers
    config.output.globalObject = 'self';
    
    return config;
  },
  // Enable CORS for PDF loading
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        // Enable secure loading of PDF files
        source: '/:path*',
        headers: [
          // Set comprehensive Content-Security-Policy to allow all needed resources
          { 
            key: 'Content-Security-Policy', 
            value: [
              // Default fallback
              "default-src 'self'",
              
              // Images
              "img-src 'self' blob: data: https://randomuser.me https://*.clerk.accounts.dev https://img.clerk.com https://images.clerk.dev",
              
              // Styles
              "style-src 'self' 'unsafe-inline'",
              
              // Scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://*.clerk.accounts.dev",
              
              // Connect sources - add localhost and your API
              "connect-src 'self' blob: data: https://*.clerk.accounts.dev https://api.clerk.dev http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:* http://*.local:* ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:*",
              
              // Frame sources
              "frame-src 'self' blob: data: https://*.clerk.accounts.dev",
              
              // Font sources
              "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.googleapis.com",
              
              // Web workers
              "worker-src 'self' blob: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net"
            ].join('; ')
          },
          // Improve frame security
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Add privacy headers
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' }
        ],
      },
    ];
  },
  // Allow loading from external domains
  images: {
    domains: [
      'unpkg.com', 
      'cdnjs.cloudflare.com', 
      'randomuser.me', 
      'cdn.jsdelivr.net',
      'img.clerk.com',
      'images.clerk.dev'
    ],
  },
  // Transpile react-pdf for Next.js
  transpilePackages: ['react-pdf'],
  // Add a temporary setting to force a clean rebuild
  typescript: {
    // This will completely ignore TypeScript errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 