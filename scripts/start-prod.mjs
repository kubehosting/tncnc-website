import { chmodSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
mkdirSync(path.join(root, "data"), { recursive: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:../data/prod.db";
}

// aaPanel file copies often drop the execute bit on node_modules/.bin.
const binDir = path.join(root, "node_modules", ".bin");
if (existsSync(binDir)) {
  for (const name of readdirSync(binDir)) {
    try {
      chmodSync(path.join(binDir, name), 0o755);
    } catch {
      // The commands below call Node directly, so a failed chmod is not fatal.
    }
  }
}

function runNode(script, args) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(result.error);
    return 1;
  }
  return result.status ?? 1;
}

const pushStatus = runNode("node_modules/prisma/build/index.js", [
  "db",
  "push",
  "--skip-generate",
]);
if (pushStatus) {
  process.exit(pushStatus);
}

const seedStatus = runNode("node_modules/prisma/build/index.js", ["db", "seed"]);
if (seedStatus) {
  console.error("Database seed failed; the public site can still start.");
}

process.exit(runNode("node_modules/next/dist/bin/next", ["start"]));
