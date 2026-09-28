// CI check: every PRECACHE entry in sw.js exists, every file the game needs offline is in PRECACHE, and the
// manifest only uses relative paths to files that exist (root-absolute paths break under the Pages sub-path).
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
const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
const manifestPaths = [manifest.start_url, manifest.scope, manifest.id, ...manifest.icons.map(i => i.src)].filter(Boolean);
const badManifest = manifestPaths.filter(p => p.startsWith("/") || (p !== "./" && !existsSync(join(root, p))));
if (badManifest.length) console.error("Manifest paths must be relative and exist:", badManifest);
if (missingFiles.length || notCached.length || badManifest.length) process.exit(1);
console.log(`PRECACHE ok: ${files.size} files`);
