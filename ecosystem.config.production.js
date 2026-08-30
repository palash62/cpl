const path = require("node:path");
const root = path.join(__dirname);
const tsx = path.join(root, "node_modules/.bin/tsx");

/** Production PM2 — uses Next.js standalone server.js (no next build on server). */
module.exports = {
  apps: [
    {
      name: "cpl-tracking",
      script: "server.js",
      cwd: path.join(root, "apps/tracking/.next/standalone/apps/tracking"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "384M",
      node_args: "--max-old-space-size=256",
      env: { NODE_ENV: "production", PORT: 3001, HOSTNAME: "0.0.0.0" },
    },
    {
      name: "cpl-platform",
      script: "server.js",
      cwd: path.join(root, "apps/platform/.next/standalone/apps/platform"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1200M",
      node_args: "--max-old-space-size=768",
      env: { NODE_ENV: "production", PORT: 3000, HOSTNAME: "0.0.0.0" },
    },
    {
      name: "cpl-email-worker",
      script: "src/workers/email.worker.ts",
      interpreter: tsx,
      cwd: path.join(root, "apps/platform"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      node_args: "--max-old-space-size=192",
      min_uptime: "10s",
      max_restarts: 100,
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      env_file: path.join(root, "apps/platform/.env"),
      env: { NODE_ENV: "production" },
    },
  ],
};
