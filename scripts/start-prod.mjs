import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:../data/prod.db";
}

const push = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (push.status) {
  process.exit(push.status);
}

const start = spawnSync("npx", ["next", "start"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(start.status ?? 1);
