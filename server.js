const { mkdirSync } = require("node:fs");
const { createServer } = require("node:http");
const path = require("node:path");
const { parse } = require("node:url");
const next = require("next");

if (typeof PhusionPassenger !== "undefined") {
  PhusionPassenger.configure({ autoInstall: false });
}

process.chdir(__dirname);
mkdirSync(path.join(__dirname, "data"), { recursive: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:../data/prod.db";
}
process.env.NODE_ENV = process.env.NODE_ENV || "production";

const app = next({
  dev: false,
  dir: __dirname,
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      handle(req, res, parse(req.url, true));
    });

    if (typeof PhusionPassenger !== "undefined") {
      server.listen("passenger");
      return;
    }

    const port = Number(process.env.PORT) || 3000;
    const hostname = process.env.HOSTNAME || "0.0.0.0";
    server.listen(port, hostname, () => {
      console.log(`TNCNC listening on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
