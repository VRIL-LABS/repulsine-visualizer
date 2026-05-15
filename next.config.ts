import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // R3F v8 JSX types are not yet fully compatible with React 19's
    // namespaced JSX. The types work correctly at runtime.
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
  ],
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
  },
};

export default nextConfig;
