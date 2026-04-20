/**
 * Copies Microsoft’s SimKai / 楷体 (KaiTi) from a licensed Windows installation
 * into public/fonts/simkai.ttf so the web build can @font-face it.
 *
 * Run on Windows: npm run fonts:copy-windows-kaiti
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, "..", "public", "fonts", "simkai.ttf");

if (process.platform !== "win32") {
  console.error("This copy script only runs on Windows (needs %WINDIR%\\Fonts\\simkai.ttf).");
  console.error("On other OSes, copy simkai.ttf from a licensed Windows/Office install into:");
  console.error("  public/fonts/simkai.ttf");
  process.exit(1);
}

const windir = process.env.WINDIR || "C:\\Windows";
const candidates = ["simkai.ttf", "SIMKAI.TTF", "SimKai.ttf"];
let src = "";
for (const name of candidates) {
  const p = path.join(windir, "Fonts", name);
  if (fs.existsSync(p)) {
    src = p;
    break;
  }
}

if (!src) {
  console.error("Could not find simkai.ttf under", path.join(windir, "Fonts"));
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("Copied Microsoft KaiTi (SimKai) to", dest);
