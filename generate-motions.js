// Generates assets/motions.json from the video files inside assets/.
// Usage (from the site folder):  node generate-motions.js
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "assets");
const exts = new Set([".mp4", ".webm"]); // H.264 .mp4 or .webm play everywhere

if (!fs.existsSync(dir)) {
  console.error("Folder not found: assets/  (create it and put your videos inside)");
  process.exit(1);
}

const pretty = name =>
  name
    .replace(/\.[^.]+$/, "")        // remove extension
    .replace(/_web$/i, "")          // remove the suffix added by convert-motions.sh
    .replace(/[_-]+/g, " ")         // my_motion-01 -> my motion 01
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());

const items = fs
  .readdirSync(dir, { withFileTypes: true })
  .filter(f => f.isFile() && exts.has(path.extname(f.name).toLowerCase()))
  .map(f => ({ name: f.name, time: fs.statSync(path.join(dir, f.name)).mtimeMs }))
  .sort((a, b) => b.time - a.time || a.name.localeCompare(b.name, undefined, { numeric: true })) // newest first
  .map(f => ({ title: pretty(f.name), src: `assets/${encodeURIComponent(f.name).replace(/%2F/g, "/")}` }));

fs.writeFileSync(path.join(dir, "motions.json"), JSON.stringify(items, null, 2));
console.log(`✔ assets/motions.json updated with ${items.length} motion${items.length === 1 ? "" : "s"}:`);
items.forEach(i => console.log("  - " + i.title + "  →  " + i.src));
