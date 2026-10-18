// Run with: node generate-motions.js
// Scans assets/ for video files and creates assets/motions.json for the portfolio gallery.
const fs = require('fs');
const path = require('path');
const assetsDir = path.join(__dirname, 'assets');
const output = path.join(assetsDir, 'motions.json');
const extensions = new Set(['.mp4', '.webm', '.ogv', '.ogg', '.mov']);
const files = fs.readdirSync(assetsDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
  .map(entry => ({
    title: path.basename(entry.name, path.extname(entry.name)).replace(/[_-]+/g, ' ').trim(),
    src: `assets/${encodeURIComponent(entry.name)}`
  }))
  .sort((a, b) => a.title.localeCompare(b.title));
fs.writeFileSync(output, JSON.stringify(files, null, 2) + '\n');
console.log(`Found ${files.length} motion video(s). Wrote assets/motions.json`);
