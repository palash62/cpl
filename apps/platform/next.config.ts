import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "prisma"],
  transpilePackages: ["@cpl/database", "@cpl/shared"],
  productionBrowserSourceMaps: false,
  turbopack: {},
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
    webpackMemoryOptimizations: true,
    cpus: 1,
  },
  webpack: (config) => {
    config.parallelism = 1;
    config.resolve.alias = {
      ...config.resolve.alias,
      immer: path.join(root, "node_modules/immer"),
      "react-redux": path.join(root, "node_modules/react-redux"),
      "preact-render-to-string": path.join(root, "node_modules/preact-render-to-string"),
    };
    return config;
  },
};

export default nextConfig;
