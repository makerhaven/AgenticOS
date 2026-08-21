import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/control",
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
