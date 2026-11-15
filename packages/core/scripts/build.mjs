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

  // Compile-time env stub bound to esbuild `define` so any IS_DEV expression folds reliably
  writeFileSync(
    resolve(distDir, 'env.js'),
    [
      'export const IS_DEV = __METHANE_IS_DEV__;',
      'export function isDevMode() { return false; }',
      'export function devWarn() {}',
      'export function runElementDevDiagnostics() {}',
      '',
    ].join('\n'),
    'utf8',
  );

  const siblingExternals = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'env.js')
    .map((entry) => `./${entry.name}`);

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js') || entry.name === 'env.js') continue;
    const filePath = resolve(distDir, entry.name);
    if (entry.name === 'index.js') {
      const transformed = esbuild.transformSync(readFileSync(filePath, 'utf8'), {
        loader: 'js',
        format: 'esm',
        target: 'es2023',
        define: { IS_DEV: 'false', __DEV__: 'false' },
        minifySyntax: true,
        minifyWhitespace: true,
      });
      writeFileSync(filePath, transformed.code, 'utf8');
      continue;
    }

    const bundled = esbuild.buildSync({
      entryPoints: [filePath],
      bundle: true,
      packages: 'external',
      external: siblingExternals,
      format: 'esm',
      target: 'es2023',
      define: { __METHANE_IS_DEV__: 'false', IS_DEV: 'false', __DEV__: 'false' },
      minifySyntax: true,
      minifyWhitespace: true,
      write: false,
    });
    const outFile = bundled.outputFiles[0];
    if (!outFile) {
      throw new Error(`esbuild produced no output for ${entry.name}`);
    }
    const cleaned = esbuild.transformSync(outFile.text, {
      loader: 'js',
      format: 'esm',
      target: 'es2023',
      minifySyntax: true,
      minifyWhitespace: true,
    });
    writeFileSync(filePath, cleaned.code, 'utf8');
  }

  // Write final runtime production stub for external callers resolving "./env.js"
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
}

main();
