import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { transformSync } from 'esbuild';

const pkgRoot = resolve(import.meta.dirname, '..');
const distDir = join(pkgRoot, 'dist');

const DECORATE_RE =
  /^var __decorate = \(this && this\.__decorate\) \|\| function [\s\S]*?^};\r?\n/m;
const CSS_TEMPLATE_RE = /\bcss\s*`([^`$\\]*(?:\\[\s\S][^`$\\]*)*)`/g;

function minifyCssTemplates(source) {
  return source.replace(CSS_TEMPLATE_RE, (_match, rawCss) => {
    const unescaped = rawCss
      .replace(/\\`/g, '`')
      .replace(/\\\$/g, '$')
      .replace(/\\\\/g, '\\');
    const minified = transformSync(unescaped, {
      loader: 'css',
      minify: true,
    }).code.trim();
    const escaped = minified
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    return `css\`${escaped}\``;
  });
}

for (const entry of readdirSync(distDir)) {
  if (!entry.endsWith('.js')) continue;
  const filePath = join(distDir, entry);
  let code = readFileSync(filePath, 'utf8');
  if (DECORATE_RE.test(code)) {
    code = code.replace(
      DECORATE_RE,
      "import { __decorate } from '@methane-ui/core';\n",
    );
  }
  if (entry === 'auto-loader.js') {
    code = minifyCssTemplates(code);
  }
  const result = transformSync(code, {
    loader: 'js',
    format: 'esm',
    target: 'es2023',
    minifySyntax: true,
    minifyWhitespace: true,
  });
  writeFileSync(filePath, result.code);
}
