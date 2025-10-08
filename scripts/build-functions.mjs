import { build as esbuildBuild } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const FUNCTIONS_SRC = path.join(process.cwd(), 'netlify', 'functions');
const OUT_DIR = path.join(process.cwd(), 'netlify', 'dist-functions');
const EXT = ['.js', '.ts', '.mjs', '.jsx', '.tsx'];

async function ensureOutDir() {
  await fs.mkdir(OUT_DIR, { recursive: true });
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (e.isFile()) {
      if (EXT.includes(path.extname(e.name))) files.push(full);
    }
  }
  return files;
}

async function buildAll() {
  await ensureOutDir();
  const all = await walk(FUNCTIONS_SRC);
  await Promise.all(all.map(async (src) => {
    const rel = path.relative(FUNCTIONS_SRC, src);
    // sanitize name: replace path separators with '-', strip extension, and replace any disallowed chars with '-'
    const base = rel.replace(/[/\\]/g, '-').replace(/\.[^/.]+$/, '');
    const safe = base.replace(/[^a-zA-Z0-9-_]/g, '-');
    const name = safe + '.js';
    const outfile = path.join(OUT_DIR, name);
    console.log('Building function', rel, '->', path.relative(process.cwd(), outfile));
    await esbuildBuild({
      entryPoints: [src],
      bundle: true,
      platform: 'node',
      target: ['node18'],
      format: 'esm',
      outfile,
      sourcemap: false,
    });
  }));
  console.log('Built', all.length, 'functions to', OUT_DIR);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
