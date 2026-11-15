import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';
import {
  LAYER_ORDER_DECLARATION,
  MTH_CSS_PRIMITIVES,
  MTH_MARKETING_PRIMITIVES,
} from './index.js';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(pkgRoot, '../..');
const srcDir = resolve(pkgRoot, 'src');
const distDir = resolve(pkgRoot, 'dist');
const stylelintConfigFile = resolve(repoRoot, 'stylelint.config.mjs');

describe('@methane/css progressive HTML/CSS content and marketing primitives', () => {
  const marketingCss = readFileSync(resolve(srcDir, 'marketing.css'), 'utf8');

  it('defines all 10 marketing and content primitives inside @layer mth.primitives', () => {
    expect(MTH_MARKETING_PRIMITIVES).toHaveLength(10);
    expect(MTH_CSS_PRIMITIVES).toHaveLength(23);
    expect(marketingCss).toContain('@layer mth.primitives {');
    for (const primitive of MTH_MARKETING_PRIMITIVES) {
      expect(marketingCss).toContain(`.${primitive}`);
    }
  });

  it('uses progressive native <details> accordion styling for .mth-faq', () => {
    expect(marketingCss).toContain('.mth-faq > details');
    expect(marketingCss).toContain('.mth-faq > details > summary');
    expect(marketingCss).toContain('.mth-faq > details[open] > summary::after');
    expect(marketingCss).toContain('::details-content');
    expect(marketingCss).toContain('@supports (interpolate-size: allow-keywords)');
  });

  it('uses light-dark(), --mth-* semantic tokens, reduced-motion, and forced-colors safety', () => {
    expect(marketingCss).toContain('light-dark(');
    expect(marketingCss).toContain('--mth-color-accent');
    expect(marketingCss).toContain('--mth-color-border');
    expect(marketingCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(marketingCss).toContain('@media (forced-colors: active)');
    expect(marketingCss).toContain('CanvasText');
    expect(marketingCss).toContain('ButtonBorder');
    expect(marketingCss).toContain('Highlight');
  });

  it('passes Stylelint (stylelint-config-standard + @methane/lint-plugin logical-properties-only) on marketing.css', async () => {
    const result = await stylelint.lint({
      files: [resolve(srcDir, 'marketing.css')],
      configFile: stylelintConfigFile,
    });
    expect(result.errored).toBe(false);
    for (const fileResult of result.results) {
      expect(fileResult.warnings).toEqual([]);
    }
  });

  it('builds dist/marketing.css and full dist/index.css containing all 23 Light-DOM primitives', () => {
    expect(existsSync(resolve(distDir, 'marketing.css'))).toBe(true);
    const indexCss = readFileSync(resolve(distDir, 'index.css'), 'utf8');
    expect(indexCss.startsWith(LAYER_ORDER_DECLARATION)).toBe(true);
    for (const primitive of MTH_CSS_PRIMITIVES) {
      expect(indexCss).toContain(`.${primitive}`);
    }
  });

  it('declares modular subpaths and full export in package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports['.']).toMatchObject({
      types: './dist/index.d.ts',
      style: './dist/index.css',
      default: './dist/index.js',
    });
    expect(pkg.exports['./layout.css']).toBe('./dist/layout.css');
    expect(pkg.exports['./prose.css']).toBe('./dist/prose.css');
    expect(pkg.exports['./marketing.css']).toBe('./dist/marketing.css');
    expect(pkg.exports['./index.css']).toBe('./dist/index.css');
  });
});
