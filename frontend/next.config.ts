import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000" },
      { protocol: "https", hostname: "www.realsimple.com" },
    ],
  },
};

export default nextConfig;
