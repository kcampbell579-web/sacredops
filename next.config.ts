import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Clean URL for the Facebook-ad landing page (duplicate of the marketing
      // site). Point the ad at sacredops.app/opStTherese to track that campaign.
      { source: "/opStTherese", destination: "/opStTherese.html" },
      { source: "/StIsidore", destination: "/StIsidore.html" },
    ];
  },
};

export default nextConfig;
