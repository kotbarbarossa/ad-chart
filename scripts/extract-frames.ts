/**
 * Extract every frame of the reference GIF into PNGs under `docs/frames/`.
 *
 * The frames are the ground truth for colours and proportions — we eyedrop
 * them instead of guessing. They are regenerable, so `docs/frames/` is
 * git-ignored; run `pnpm extract-frames` to recreate them.
 *
 * Usage:
 *   pnpm extract-frames                 # all frames
 *   pnpm extract-frames --stride 10     # every 10th frame
 */
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const INPUT = join(import.meta.dirname, '..', 'docs', 'reference.gif');
const OUT_DIR = join(import.meta.dirname, '..', 'docs', 'frames');

function parseStride(argv: string[]): number {
  const i = argv.indexOf('--stride');
  if (i === -1) return 1;
  const value = Number(argv[i + 1]);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('--stride expects a positive integer');
  }
  return value;
}

async function main(): Promise<void> {
  const stride = parseStride(process.argv.slice(2));

  const meta = await sharp(INPUT).metadata();
  const pages = meta.pages ?? 1;
  if (!meta.pages) {
    console.warn('Input has no animation frames; extracting a single image.');
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  let written = 0;
  for (let page = 0; page < pages; page += stride) {
    const name = `frame-${String(page).padStart(3, '0')}.png`;
    await sharp(INPUT, { page, pages: 1 }).png().toFile(join(OUT_DIR, name));
    written += 1;
  }

  const files = await readdir(OUT_DIR);
  console.log(
    `Extracted ${written} frame(s) from ${pages} page(s) (stride ${stride}) -> docs/frames/ (${files.length} files)`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
