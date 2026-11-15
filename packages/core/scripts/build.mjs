import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(__dirname, '..');
const distDir = resolve(pkgRoot, 'dist');
const devDir = resolve(distDir, 'development');

function main() {
  // Preserve full TypeScript-compiled dev build under dist/development/
  rmSync(devDir, { recursive: true, force: true });
  mkdirSync(devDir, { recursive: true });

  const entries = readdirSync(distDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const devCode = readFileSync(resolve(distDir, entry.name), 'utf8').replace(
      /\/\/# sourceMappingURL=.*\r?\n?/g,
      '',
    );
    writeFileSync(resolve(devDir, entry.name), devCode, 'utf8');
  }

  // Replace dist/env.js with a zero-overhead production stub for "default" exports
  writeFileSync(
    resolve(distDir, 'env.js'),
    [
      'export const IS_DEV = false;',
      'export function isDevMode() { return false; }',
      'export function devWarn() {}',
      'export function runElementDevDiagnostics() {}',
      '',
    ].join('\n'),
    'utf8',
  );

  // Dead-code eliminate IS_DEV branches and minify syntax/whitespace across production dist/*.js
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js') || entry.name === 'env.js') continue;
    const filePath = resolve(distDir, entry.name);
    const raw = readFileSync(filePath, 'utf8').replace(/\bif\s*\(\s*IS_DEV\s*\)/g, 'if (false)');
    const transformed = esbuild.transformSync(raw, {
      loader: 'js',
      minifySyntax: true,
      minifyWhitespace: true,
    });
    const cleaned = transformed.code.replace(/import\s*["']\.\/env\.js["'];?/g, '');
    writeFileSync(filePath, cleaned, 'utf8');
  }
}

main();
