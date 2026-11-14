import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';
import {
  LAYER_ORDER_DECLARATION,
  MTH_LAYOUT_PRIMITIVES,
  MTH_TYPOGRAPHY_PRIMITIVES,
  MTH_UNUPGRADED_TAG_PRIMITIVES,
} from './index.js';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(pkgRoot, '../..');
const srcDir = resolve(pkgRoot, 'src');
const distDir = resolve(pkgRoot, 'dist');
const stylelintConfigFile = resolve(repoRoot, 'stylelint.config.mjs');

describe('@methane/css Light-DOM layout, typography, and surface primitives', () => {
  const layoutCss = readFileSync(resolve(srcDir, 'layout.css'), 'utf8');
  const proseCss = readFileSync(resolve(srcDir, 'prose.css'), 'utf8');

  it('defines all 11 layout primitives inside @layer mth.primitives', () => {
    expect(MTH_LAYOUT_PRIMITIVES).toHaveLength(11);
    expect(layoutCss).toContain('@layer mth.primitives {');
    for (const primitive of MTH_LAYOUT_PRIMITIVES) {
      expect(layoutCss).toContain(`.${primitive}`);
    }
  });

  it('includes un-upgraded custom-tag selectors and exempts them from the :not(:defined) delay', () => {
    expect(MTH_UNUPGRADED_TAG_PRIMITIVES).toEqual([
      'mth-stack',
      'mth-grid',
      'mth-flex',
      'mth-container',
      'mth-spacer',
    ]);
    for (const tag of MTH_UNUPGRADED_TAG_PRIMITIVES) {
      expect(layoutCss).toMatch(new RegExp(`\\.${tag},\\s*${tag}\\b`));
    }
    expect(layoutCss).toContain(
      ':where(mth-stack, mth-grid, mth-flex, mth-container, mth-spacer):not(:defined)',
    );
    expect(layoutCss).toContain('opacity: 1;');
    expect(layoutCss).toContain('animation: none;');
  });

  it('defines both typography & surface primitives (.mth-prose, .mth-dl) inside @layer mth.primitives', () => {
    expect(MTH_TYPOGRAPHY_PRIMITIVES).toEqual(['mth-prose', 'mth-dl']);
    expect(proseCss).toContain('@layer mth.primitives {');
    for (const primitive of MTH_TYPOGRAPHY_PRIMITIVES) {
      expect(proseCss).toContain(`.${primitive}`);
    }
  });

  it('references --mth-* semantic tokens, light-dark() fallbacks, and forced-colors overrides', () => {
    expect(layoutCss).toContain('--mth-space-');
    expect(layoutCss).toContain('--mth-color-border');
    expect(layoutCss).toContain('light-dark(');
    expect(layoutCss).toContain('@media (forced-colors: active)');
    expect(proseCss).toContain('--mth-color-fg');
    expect(proseCss).toContain('--mth-font-sans');
    expect(proseCss).toContain('light-dark(');
    expect(proseCss).toContain('@media (forced-colors: active)');
  });

  it('passes Stylelint (stylelint-config-standard + @methane/lint-plugin logical-properties-only) on layout.css and prose.css', async () => {
    const result = await stylelint.lint({
      files: [resolve(srcDir, 'layout.css'), resolve(srcDir, 'prose.css')],
      configFile: stylelintConfigFile,
    });
    expect(result.errored).toBe(false);
    for (const fileResult of result.results) {
      expect(fileResult.warnings).toEqual([]);
    }
  });

  it('builds dist/layout.css, dist/prose.css, and full dist/index.css with layer order first', () => {
    for (const artifact of ['layout.css', 'prose.css', 'index.css']) {
      expect(existsSync(resolve(distDir, artifact))).toBe(true);
    }
    const indexCss = readFileSync(resolve(distDir, 'index.css'), 'utf8');
    expect(indexCss.startsWith(LAYER_ORDER_DECLARATION)).toBe(true);
    for (const primitive of [...MTH_LAYOUT_PRIMITIVES, ...MTH_TYPOGRAPHY_PRIMITIVES]) {
      expect(indexCss).toContain(`.${primitive}`);
    }
  });

  it('computes expected display, opacity: 1, and animation: none on pure-CSS Light-DOM tags in JSDOM', () => {
    const indexCss = readFileSync(resolve(distDir, 'index.css'), 'utf8');
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
    const { document, getComputedStyle } = dom.window;

    const styleEl = document.createElement('style');
    styleEl.textContent = indexCss;
    document.head.appendChild(styleEl);

    const expectedDisplays: Readonly<Record<(typeof MTH_UNUPGRADED_TAG_PRIMITIVES)[number], string>> = {
      'mth-stack': 'flex',
      'mth-grid': 'grid',
      'mth-flex': 'flex',
      'mth-container': 'block',
      'mth-spacer': 'block',
    };

    // Verify defined-guard.css still guards unregistered custom elements in general
    const unknownEl = document.createElement('mth-unknown-widget');
    document.body.appendChild(unknownEl);
    expect(getComputedStyle(unknownEl).opacity).toBe('0');

    for (const tag of MTH_UNUPGRADED_TAG_PRIMITIVES) {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      const computed = getComputedStyle(el);
      expect(computed.display).toBe(expectedDisplays[tag]);
      expect(computed.opacity).toBe('1');
      expect(computed.animationName).toBe('none');
    }
  });
});
