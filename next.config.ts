import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*", // e.g., 'assets.example.com'
        port: "",
        pathname: "/**", // Wildcard syntax is supported
      },
    ],
  },
};

export default nextConfig;