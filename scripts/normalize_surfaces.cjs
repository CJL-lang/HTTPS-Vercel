/**
 * Normalize translucent backgrounds to Apple-like frosted glass surfaces.
 * - Replace bg-white/5, bg-white/10, bg-black/xx with surface-* tokens
 * - Remove backdrop-blur-* utilities (surface tokens provide blur)
 *
 * Run: node golf_coach_frontend/scripts/normalize_surfaces.cjs
 */
const fs = require("fs");
const path = require("path");

// Resolve from script location so it works no matter where you run it from
const ROOT = path.join(__dirname, "..", "src");
const exts = new Set([".js", ".jsx"]);

// Order matters (more specific first)
const REPLACEMENTS = [
  [/\bbg-white\/5\b/g, "surface-weak"],
  [/\bbg-white\/10\b/g, "surface"],

  // Dark translucent backgrounds -> strong material
  [/\bbg-black\/60\b/g, "surface-strong"],
  [/\bbg-black\/40\b/g, "surface-strong"],

  // Very light dark overlays -> weak material (often used as subtle panels)
  [/\bbg-black\/30\b/g, "surface-weak"],
  [/\bbg-black\/20\b/g, "surface-weak"],

  // Remove explicit blur utilities (material provides blur)
  [/\bbackdrop-blur-2xl\b/g, ""],
  [/\bbackdrop-blur-xl\b/g, ""],
  [/\bbackdrop-blur-md\b/g, ""],
  [/\bbackdrop-blur-sm\b/g, ""],
];

function collapseClassNameSpaces(source) {
  // Clean up duplicated spaces inside className="..."
  return source.replace(/className="([^"]+)"/g, (m, classes) => {
    const next = classes.replace(/\s+/g, " ").trim();
    return `className="${next}"`;
  });
}

function processFile(filePath) {
  const before = fs.readFileSync(filePath, "utf8");
  let after = before;

  for (const [re, rep] of REPLACEMENTS) {
    after = after.replace(re, rep);
  }

  after = collapseClassNameSpaces(after);

  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    return true;
  }
  return false;
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (exts.has(path.extname(ent.name))) processFile(p);
  }
}

walk(ROOT);
console.log("normalize_surfaces: done");


