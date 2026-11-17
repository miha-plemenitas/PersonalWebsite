import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/stamp/sw.js",
        headers: [{ key: "Service-Worker-Allowed", value: "/stamp" }],
      },
    ];
  },
};

export default nextConfig;
