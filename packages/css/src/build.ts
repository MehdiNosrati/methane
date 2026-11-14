import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const srcDir = resolve(pkgRoot, 'src');
const distDir = resolve(pkgRoot, 'dist');

export function buildCssArtifacts(): void {
  mkdirSync(distDir, { recursive: true });

  const files = ['layers.css', 'reset.css', 'defined-guard.css'] as const;
  const contents: Record<string, string> = {};

  for (const file of files) {
    const srcPath = resolve(srcDir, file);
    const distPath = resolve(distDir, file);
    copyFileSync(srcPath, distPath);
    contents[file] = readFileSync(srcPath, 'utf8').trimEnd();
  }

  const baseCss = [
    contents['layers.css'],
    '',
    contents['reset.css'],
    '',
    contents['defined-guard.css'],
    '',
  ].join('\n');

  writeFileSync(resolve(distDir, 'base.css'), baseCss, 'utf8');
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isEntrypoint) {
  buildCssArtifacts();
}
