import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileDtcgTokens, type DtcgDocument } from './compiler.js';
import rawTokens from './tokens.dtcg.json' with { type: 'json' };

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const distDir = resolve(pkgRoot, 'dist');

export function buildTokensArtifacts(): void {
  const result = compileDtcgTokens(rawTokens as DtcgDocument);
  mkdirSync(distDir, { recursive: true });
  writeFileSync(resolve(distDir, 'tokens.css'), result.css, 'utf8');
  writeFileSync(
    resolve(distDir, 'tokens.compiled.json'),
    JSON.stringify(result.tokens, null, 2) + '\n',
    'utf8',
  );
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isEntrypoint) {
  buildTokensArtifacts();
}
