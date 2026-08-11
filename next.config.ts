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
      { source: "/StJosephTheWorker", destination: "/StJosephTheWorker.html" },
      // Product landing pages with the embedded live interactive demo.
      { source: "/supervisors", destination: "/supervisors.html" },
      { source: "/crews", destination: "/crews.html" },
      { source: "/workers", destination: "/crews.html" },
      { source: "/worker-portal", destination: "/crews.html" },
      { source: "/for-workers", destination: "/crews.html" },
      { source: "/incident-reporting", destination: "/incident-reporting.html" },
      { source: "/pricing", destination: "/pricing.html" },
      { source: "/contact", destination: "/contact.html" },
      { source: "/contact-us", destination: "/contact.html" },
      { source: "/features", destination: "/features.html" },
      { source: "/about", destination: "/about.html" },
      { source: "/privacy", destination: "/privacy.html" },
      { source: "/privacy-policy", destination: "/privacy.html" },
      { source: "/blog", destination: "/blog.html" },
      { source: "/blog/:slug", destination: "/blog/:slug.html" },
      { source: "/free-toolbox-talk", destination: "/free-toolbox-talk.html" },
      { source: "/toolbox-talk", destination: "/free-toolbox-talk.html" },
      { source: "/toolbox", destination: "/free-toolbox-talk.html" },
      { source: "/free-jsa", destination: "/free-jsa.html" },
      { source: "/jsa", destination: "/free-jsa.html" },
      { source: "/free-aha", destination: "/free-aha.html" },
      { source: "/aha", destination: "/free-aha.html" },
      { source: "/free-standdown", destination: "/free-standdown.html" },
      { source: "/standdown", destination: "/free-standdown.html" },
      { source: "/stand-down", destination: "/free-standdown.html" },
      { source: "/near-miss", destination: "/free-standdown.html" },
      { source: "/near-miss-report", destination: "/free-standdown.html" },
      { source: "/custom-portal", destination: "/custom-portal.html" },
      { source: "/custom", destination: "/custom-portal.html" },
      { source: "/white-label", destination: "/custom-portal.html" },
      { source: "/tools", destination: "/tools.html" },
      { source: "/resources", destination: "/tools.html" },
      { source: "/academy", destination: "/tools.html" },
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
