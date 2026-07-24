import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Clean URL for the Facebook-ad landing page (duplicate of the marketing
      // site). Point the ad at sacredops.app/opStTherese to track that campaign.
      { source: "/opStTherese", destination: "/opStTherese.html" },
      { source: "/StIsidore", destination: "/StIsidore.html" },
      { source: "/StMichael", destination: "/StMichael.html" },
      // Product landing pages with the embedded live interactive demo.
      { source: "/supervisors", destination: "/supervisors.html" },
      { source: "/crews", destination: "/crews.html" },
    ];
  },
};

export default nextConfig;
