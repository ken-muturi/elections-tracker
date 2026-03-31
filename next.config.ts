import type { NextConfig } from "next";

const isElectron = process.env.BUILD_ELECTRON === "true";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
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
