// The Copper Chip — make.fun entry program (Node 22, stdlib only).
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-game.ts. The output directory is taken from
// MAKEFUN_OUTPUT_DIR, or /output when that is not set. Deterministic:
// the same repository always writes the same bytes.
import { buildDossier } from "./vendor/makefun-game.ts";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here);
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

function clearInside(dir: string): void {
  // Only remove files inside the output directory, never the directory
  // itself: on the grader it is a mount point.
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const d = join(dest, name);
    if (statSync(s).isDirectory()) copyTree(s, d);
    else cpSync(s, d);
  }
}

mkdirSync(outDir, { recursive: true });
clearInside(outDir);
copyTree(join(repoRoot, "game"), join(outDir, "game"));
copyTree(join(repoRoot, "screenshots"), join(outDir, "screenshots"));
writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  }),
);

// Verify the hand-in before exiting: every file the grader reads must be
// present and non-empty, or the run fails loudly instead of handing in
// a hollow output.
function countFiles(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}
const required = [
  join(outDir, "game", "index.html"),
  join(outDir, "dossier.json"),
];
for (const file of required) {
  if (!existsSync(file) || statSync(file).size === 0) {
    throw new Error(`output incomplete: missing or empty ${file}`);
  }
}
const shots = readdirSync(join(outDir, "screenshots")).filter((n) => !n.startsWith("."));
if (shots.length < 3) throw new Error(`output incomplete: ${shots.length} screenshots, need 3`);
const totalFiles = countFiles(outDir);
if (totalFiles < 10) throw new Error(`output incomplete: only ${totalFiles} files`);
console.log(`wrote ${totalFiles} files to ${outDir} (${shots.length} screenshots)`);
