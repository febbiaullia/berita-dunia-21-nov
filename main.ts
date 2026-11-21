// The World Today — Saturday 21 November 2026
// make.fun bounty: news-image-20261121
//
// The entry is a single poster image, entry.png (1024x1024), kept in this
// repository next to this program. The program's only job is to place an
// exact copy of that poster at <output>/entry.png and to prove, by reading
// the copy back, that it matches the original byte for byte. It uses no
// network and writes identical bytes on every run.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The poster lives in the same directory as this file.
const repoDir = dirname(fileURLToPath(import.meta.url));
const posterPath = join(repoDir, "entry.png");

// The harness provides MAKEFUN_OUTPUT_DIR; fall back to /output.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = join(outputDir, "entry.png");

if (!existsSync(posterPath)) {
  console.error(`poster not found: ${posterPath}`);
  process.exit(1);
}

const poster = readFileSync(posterPath);

// The poster must be a whole 1024x1024 PNG: check the 8-byte signature
// (89 50 4E 47 0D 0A 1A 0A) and the width and height stored in its IHDR
// chunk (bytes 16..24, big-endian). Refuse anything else with a clear error.
function assertPosterFormat(poster: Buffer, posterPath: string): void {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!poster.subarray(0, 8).equals(pngSignature)) {
    console.error(`not a PNG file (bad signature): ${posterPath}`);
    process.exit(1);
  }
  const width = poster.readUInt32BE(16);
  const height = poster.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    console.error(`poster must be 1024x1024, got ${width}x${height}: ${posterPath}`);
    process.exit(1);
  }
  console.log(`Poster format OK: PNG ${width}x${height}`);
}

assertPosterFormat(poster, posterPath);

console.log(`Loaded poster: ${poster.length} bytes from ${posterPath}`);
console.log(`Poster sha256: ${createHash("sha256").update(poster).digest("hex")}`);

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, poster);

// Read the copy back and check it against the original, byte for byte.
const copy = readFileSync(outputPath);
if (copy.length !== poster.length || !copy.equals(poster)) {
  console.error(
    `copy check failed: ${outputPath} is ${copy.length} bytes, expected ${poster.length}`,
  );
  process.exit(1);
}

console.log(`Wrote ${copy.length} bytes to ${outputPath} (verified identical)`);
