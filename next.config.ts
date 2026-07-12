import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.join(__dirname),
  },
  // /api/v1/* proxied by src/app/api/v1/[...path]/route.ts (forwards Set-Cookie).
};

export default nextConfig;
