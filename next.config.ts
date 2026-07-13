import type { NextConfig } from "next";
import path from "node:path";

const assetOrigin = (
  process.env.NEXT_PUBLIC_ASSET_ORIGIN ||
  process.env.API_PROXY_ORIGIN ||
  "http://localhost:9000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/uploads/**",
      },
    ],
  },
  // Admin badge uploads live on Nest; same-origin proxy for arc-app <img>.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${assetOrigin}/uploads/:path*`,
      },
    ];
  },
  // /api/v1/* proxied by src/app/api/v1/[...path]/route.ts (forwards Set-Cookie).
  // Old league notif deep links → actual League screen.
  async redirects() {
    return [
      { source: "/league/current", destination: "/leaderboard", permanent: false },
      { source: "/leagues/current", destination: "/leaderboard", permanent: false },
      { source: "/league", destination: "/leaderboard", permanent: false },
      { source: "/leagues", destination: "/leaderboard", permanent: false },
    ];
  },
};

export default nextConfig;
