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
      { source: "/StExpeditus", destination: "/StExpeditus.html" },
      // Product landing pages with the embedded live interactive demo.
      { source: "/supervisors", destination: "/supervisors.html" },
      { source: "/crews", destination: "/crews.html" },
      { source: "/incident-reporting", destination: "/incident-reporting.html" },
      { source: "/pricing", destination: "/pricing.html" },
      { source: "/contact", destination: "/contact.html" },
      { source: "/contact-us", destination: "/contact.html" },
      { source: "/features", destination: "/features.html" },
      { source: "/about", destination: "/about.html" },
      { source: "/free-toolbox-talk", destination: "/free-toolbox-talk.html" },
      { source: "/toolbox-talk", destination: "/free-toolbox-talk.html" },
      { source: "/toolbox", destination: "/free-toolbox-talk.html" },
      { source: "/about-us", destination: "/about.html" },
      { source: "/company", destination: "/about.html" },
      // OSHA 30 course: registration landing + obscure post-purchase thank-you.
      { source: "/osha-30", destination: "/osha-30.html" },
      { source: "/osha30", destination: "/osha-30.html" },
      { source: "/osha30-enrolled-9f3ax72kq", destination: "/osha30-enrolled-9f3ax72kq.html" },
    ];
  },
};

export default nextConfig;
