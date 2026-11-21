import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/about", destination: "/#about", permanent: true },
      { source: "/work", destination: "/#selected-work", permanent: true },
      { source: "/toolbox", destination: "/#toolbox", permanent: true },
    ];
  },
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
