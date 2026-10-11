import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vetsync/shared"],
  async rewrites() {
    const api = process.env.API_PROXY_TARGET ?? "http://localhost:4000";
    return [{ source: "/v1/:path*", destination: `${api}/:path*` }];
  },
};

export default nextConfig;
