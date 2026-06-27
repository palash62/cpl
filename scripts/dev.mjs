import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function nodeBinDirs() {
  const dirs = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/Applications/Cursor.app/Contents/Resources/app/resources/helpers",
  ];

  const nvmRoot = join(homedir(), ".nvm/versions/node");
  if (existsSync(nvmRoot)) {
    for (const version of readdirSync(nvmRoot).sort().reverse()) {
      dirs.push(join(nvmRoot, version, "bin"));
    }
  }

  return dirs.filter((dir) => existsSync(join(dir, "node")));
}

const pathDirs = [...nodeBinDirs(), process.env.PATH ?? ""];
const env = { ...process.env, PATH: pathDirs.join(":") };

const prismaBin = join(root, "node_modules/prisma/build/index.js");
spawnSync(process.execPath, [prismaBin, "generate"], { cwd: root, env, stdio: "inherit" });

const nextBin = join(root, "node_modules/next/dist/bin/next");
const result = spawnSync(
  process.execPath,
  [nextBin, "dev", "--webpack", ...process.argv.slice(2)],
  { cwd: root, env, stdio: "inherit" },
);

process.exit(result.status ?? 1);
