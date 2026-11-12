import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // group photos are shrunk on the phone first; this leaves room for a full-size fallback
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
