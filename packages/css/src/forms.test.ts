import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const distDir = resolve(pkgRoot, 'dist');
const configFile = resolve(pkgRoot, '../../stylelint.config.mjs');

describe('@methane/css form & button primitives', () => {
  it('compiles forms.css and bundles it in dist/index.css', () => {
    const formsDist = resolve(distDir, 'forms.css');
    const bundleDist = resolve(distDir, 'index.css');
    expect(existsSync(formsDist)).toBe(true);
    expect(existsSync(bundleDist)).toBe(true);

    const formsCss = readFileSync(formsDist, 'utf8');
    const bundleCss = readFileSync(bundleDist, 'utf8');
    expect(formsCss).toContain('.mth-btn');
    expect(formsCss).toContain('.mth-btn-soft');
    expect(formsCss).toContain('.mth-btn-outline');
    expect(formsCss).toContain('.mth-btn-outlined');
    expect(formsCss).toContain('.mth-input');
    expect(formsCss).toContain('select.mth-input');
    expect(formsCss).toContain('.mth-select');
    expect(bundleCss).toContain('select.mth-input');
  });

  it('styles select.mth-input and .mth-select with appearance: none, SVG chevron, RTL flip, and forced-colors fallback', () => {
    const formsCss = readFileSync(resolve(here, 'forms.css'), 'utf8');
    expect(formsCss).toContain('appearance: none');
    expect(formsCss).toContain('padding-inline: var(--mth-space-control-inline, 0.75rem) 2.375rem');
    expect(formsCss).toContain('background-position: right 0.75rem center');
    expect(formsCss).toContain(':dir(rtl) select.mth-input');
    expect(formsCss).toContain('background-position: left 0.75rem center');
    expect(formsCss).toContain(':user-invalid');
    expect(formsCss).toContain('@media (forced-colors: active)');
    expect(formsCss).toContain('appearance: auto');
    expect(formsCss).toContain('background-image: none');
    expect(formsCss).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('passes stylelint on forms.css and layout/prose/marketing updates', async () => {
    const result = await stylelint.lint({
      files: [
        resolve(here, 'forms.css'),
        resolve(here, 'layout.css'),
        resolve(here, 'prose.css'),
        resolve(here, 'marketing.css'),
      ],
      configFile,
    });
    const errors = result.results.flatMap((r) => r.warnings.filter((w) => w.severity === 'error'));
    expect(errors).toEqual([]);
  });
});
