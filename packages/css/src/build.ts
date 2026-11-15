import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const srcDir = resolve(pkgRoot, 'src');
const distDir = resolve(pkgRoot, 'dist');

const CORE_FILES = ['layers.css', 'reset.css', 'defined-guard.css'] as const;
const PRIMITIVE_MODULES = ['layout.css', 'prose.css', 'marketing.css', 'forms.css'] as const;

export function buildCssArtifacts(): void {
  mkdirSync(distDir, { recursive: true });

  const contents: Record<string, string> = {};

  for (const file of CORE_FILES) {
    const srcPath = resolve(srcDir, file);
    const distPath = resolve(distDir, file);
    copyFileSync(srcPath, distPath);
    contents[file] = readFileSync(srcPath, 'utf8').trimEnd();
  }

  const activePrimitives: string[] = [];
  for (const file of PRIMITIVE_MODULES) {
    const srcPath = resolve(srcDir, file);
    if (!existsSync(srcPath)) continue;
    const distPath = resolve(distDir, file);
    copyFileSync(srcPath, distPath);
    contents[file] = readFileSync(srcPath, 'utf8').trimEnd();
    activePrimitives.push(file);
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

  const fullParts = [baseCss.trimEnd()];
  for (const file of activePrimitives) {
    fullParts.push('', contents[file]!);
  }
  fullParts.push('');

  writeFileSync(resolve(distDir, 'index.css'), fullParts.join('\n'), 'utf8');
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isEntrypoint) {
  buildCssArtifacts();
}
