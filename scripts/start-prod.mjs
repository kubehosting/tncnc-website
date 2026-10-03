import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:../data/prod.db";
}

if (!process.env.ADMIN_API_KEY) {
  process.env.ADMIN_API_KEY = "tncnc-siteground-session-key";
}

const push = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (push.status) {
  process.exit(push.status);
}

const seed = spawnSync("npx", ["prisma", "db", "seed"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (seed.status) {
  console.error("Database seed failed; the public site can still start.");
}

const start = spawnSync("npx", ["next", "start"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(start.status ?? 1);
