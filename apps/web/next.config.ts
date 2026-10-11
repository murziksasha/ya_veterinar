import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vetsync/shared"],
  async redirects() {
    return [
      {
        source: "/:locale/registration",
        destination: "/:locale/register",
        permanent: false,
      },
      {
        source: "/registration",
        destination: "/uk/register",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
