import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import glob from 'glob';

const FUNCTIONS_SRC = path.join(process.cwd(), 'netlify', 'functions');
const OUT_DIR = path.join(process.cwd(), 'netlify', 'dist-functions');

async function ensureOutDir() {
  await fs.mkdir(OUT_DIR, { recursive: true });
}

function getEntries() {
  return new Promise((resolve, reject) => {
    glob('**/*.{js,ts,mjs,jsx,tsx}', { cwd: FUNCTIONS_SRC, nodir: true }, (err, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

async function buildAll() {
  await ensureOutDir();
  const entries = await getEntries();
  // For each file, build to OUT_DIR keeping filename but flattening subdirs
  await Promise.all(entries.map(async (rel) => {
    const src = path.join(FUNCTIONS_SRC, rel);
    // name output file by replacing path separators with - and ensure .js extension
    const name = rel.replace(/\//g, '-').replace(/\.[^/.]+$/, '') + '.js';
    const outfile = path.join(OUT_DIR, name);
    console.log('Building function', rel, '->', path.relative(process.cwd(), outfile));
    await build({
      entryPoints: [src],
      bundle: true,
      platform: 'node',
      target: ['node18'],
      format: 'esm',
      outfile,
      sourcemap: false,
      external: [],
    });
  }));
  console.log('Built', entries.length, 'functions to', OUT_DIR);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
