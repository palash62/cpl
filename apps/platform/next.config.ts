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
      // Keep craft.js on its nested immer@9 (default produce) — aliasing to v11 breaks undo/redo.
      "react-redux": path.join(root, "node_modules/react-redux"),
      "preact-render-to-string": path.join(root, "node_modules/preact-render-to-string"),
    };
    return config;
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
