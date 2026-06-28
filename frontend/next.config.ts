import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}`,
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
