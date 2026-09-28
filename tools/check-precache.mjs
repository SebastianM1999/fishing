// CI check: every PRECACHE entry in sw.js exists, and every file the game needs offline is in PRECACHE.
// Usage: node tools/check-precache.mjs
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const sw = readFileSync(join(root, "sw.js"), "utf8");
const list = JSON.parse(`[${/const PRECACHE = \[([\s\S]*?)\];/.exec(sw)[1].replace(/,\s*$/, "")}]`);
const files = new Set(list.map(p => (p === "./" ? "index.html" : p)));
const walk = dir => readdirSync(join(root, dir)).flatMap(f => (statSync(join(root, dir, f)).isDirectory() ? walk(`${dir}/${f}`) : [`${dir}/${f}`]));
const needed = [...walk("js"), ...walk("assets"), ...walk("icons"), "index.html", "style.css", "manifest.webmanifest"];
const missingFiles = [...files].filter(f => !existsSync(join(root, f)));
const notCached = needed.filter(f => !files.has(f));
if (missingFiles.length) console.error("PRECACHE lists files that don't exist:", missingFiles);
if (notCached.length) console.error("Files missing from PRECACHE (won't work offline):", notCached);
if (missingFiles.length || notCached.length) process.exit(1);
console.log(`PRECACHE ok: ${files.size} files`);
