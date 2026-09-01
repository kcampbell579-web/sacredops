import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This app lives in a subfolder of another project during development;
  // pin the tracing root to this folder so Next doesn't pick the parent.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
