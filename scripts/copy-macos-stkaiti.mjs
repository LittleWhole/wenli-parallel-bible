/**
 * Copies Apple's STKaiti (华文楷体) from a macOS installation into
 * public/fonts/stkaiti.ttf so the web build can @font-face it.
 *
 * STKaiti is an optional font on macOS. Install it first via Font Book:
 *   1. Open /Applications/Font Book.app
 *   2. File → Add Fonts from Apple… (or All Fonts → find 华文楷体 → Download)
 *   3. Run: npm run fonts:copy-macos-stkaiti
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, "..", "public", "fonts", "stkaiti.ttf");

if (process.platform !== "darwin") {
  console.error("This script only runs on macOS.");
  process.exit(1);
}

const candidates = [
  "/Library/Fonts/Supplemental/STKaiti.ttf",
  "/Library/Fonts/STKaiti.ttf",
  "/System/Library/Fonts/Supplemental/STKaiti.ttf",
  path.join(process.env.HOME || "", "Library/Fonts/STKaiti.ttf"),
  // Chinese-named variants
  "/Library/Fonts/Supplemental/华文楷体.ttf",
  "/Library/Fonts/华文楷体.ttf",
  path.join(process.env.HOME || "", "Library/Fonts/华文楷体.ttf"),
];

let src = "";
for (const p of candidates) {
  if (fs.existsSync(p)) {
    src = p;
    break;
  }
}

if (!src) {
  console.error("Could not find STKaiti on this Mac. Install it via Font Book first:");
  console.error("  1. Open /Applications/Font Book.app");
  console.error("  2. File → Add Fonts from Apple… and search for 华文楷体 (STKaiti)");
  console.error("  3. Click Download, then re-run this script.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Copied STKaiti from ${src} → ${dest}`);
