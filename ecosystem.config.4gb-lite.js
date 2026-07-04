const path = require("node:path");
const root = path.join(__dirname);

/** 4GB fallback: tracking (production) + lightweight platform internal API only. */
module.exports = {
  apps: [
    {
      name: "cpl-tracking",
      script: "node_modules/next/dist/bin/next",
      args: "start --port 3001",
      cwd: path.join(root, "apps/tracking"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "320M",
      node_args: "--max-old-space-size=224",
      env: { NODE_ENV: "production", PORT: 3001 },
    },
    {
      name: "cpl-platform-api",
      script: "npx",
      args: "tsx scripts/internal-api-server.ts",
      cwd: path.join(root, "apps/platform"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "384M",
      node_args: "--max-old-space-size=256",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        INTERNAL_API_PORT: 3000,
        INTERNAL_API_HOST: "0.0.0.0",
      },
    },
  ],
};
