import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-41d52824b0bb4f44898c39e1c3c63cb8.r2.dev" },
      { protocol: "https", hostname: "pub-b7a958248070423db848a79644c934ea.r2.dev" },
      { protocol: "https", hostname: "pub-176caad97cac44369ba9cef0291eb27d.r2.dev" }
    ]
  },
  turbopack: {
    root: process.cwd()
  },
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;
