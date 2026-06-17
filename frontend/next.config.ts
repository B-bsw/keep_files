import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "keep_file_api.b-bsw.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
