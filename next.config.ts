import type { NextConfig } from "next";

const isElectron = process.env.BUILD_ELECTRON === "true";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tiny.cloud",
      "style-src 'self' 'unsafe-inline' https://cdn.tiny.cloud",
      "img-src 'self' data: blob: https://*.amazonaws.com https://cdn.tiny.cloud",
      "font-src 'self' data: https://cdn.tiny.cloud",
      "connect-src 'self' https://*.amazonaws.com https://cdn.tiny.cloud",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // For Electron builds, use standalone mode instead of static export
  ...(isElectron && {
    output: "standalone",
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
