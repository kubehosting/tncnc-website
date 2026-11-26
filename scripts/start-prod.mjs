import { chmodSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
mkdirSync(path.join(root, "data"), { recursive: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:../data/prod.db";
}

// aaPanel file copies often drop the execute bit on node_modules/.bin and Prisma engines.
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

function chmodPrismaEngines(dir) {
  if (!existsSync(dir)) {
    return;
  }
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      chmodPrismaEngines(full);
      continue;
    }
    if (!/engine/i.test(entry.name)) {
      continue;
    }
    try {
      chmodSync(full, 0o755);
    } catch {
      // schema-engine may still fail with EACCES; db push is non-fatal below.
    }
  }
}

chmodPrismaEngines(path.join(root, "node_modules", "@prisma"));
chmodPrismaEngines(path.join(root, "node_modules", "prisma"));
chmodPrismaEngines(path.join(root, "node_modules", ".prisma"));

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

const generateStatus = runNode("node_modules/prisma/build/index.js", ["generate"]);
if (generateStatus) {
  process.exit(generateStatus);
}

const pushStatus = runNode("node_modules/prisma/build/index.js", [
  "db",
  "push",
  "--skip-generate",
]);
if (pushStatus) {
  console.error("prisma db push failed; continuing to start the site.");
}

const seedStatus = runNode("node_modules/prisma/build/index.js", ["db", "seed"]);
if (seedStatus) {
  console.error("Database seed failed; the public site can still start.");
}

function sourceIsNewer(dir, builtAt) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "data" || name === ".git") {
      continue;
    }
    const full = path.join(dir, name);
    const info = statSync(full);
    if (info.mtimeMs > builtAt) {
      return true;
    }
    if (info.isDirectory() && sourceIsNewer(full, builtAt)) {
      return true;
    }
  }
  return false;
}

const buildIdPath = path.join(root, ".next", "BUILD_ID");
const needsBuild = !existsSync(buildIdPath) || sourceIsNewer(root, statSync(buildIdPath).mtimeMs);
if (needsBuild) {
  console.log("Compiling TNCNC before start...");
  const buildStatus = runNode("node_modules/next/dist/bin/next", ["build", "--webpack"]);
  if (buildStatus) {
    process.exit(buildStatus);
  }
}

process.exit(runNode("node_modules/next/dist/bin/next", ["start"]));
