import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DEFINED_FALLBACK_ANIMATION,
  LAYER_ORDER_DECLARATION,
  MTH_CASCADE_LAYERS,
} from './index.js';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = resolve(pkgRoot, 'src');
const distDir = resolve(pkgRoot, 'dist');

const PHYSICAL_PROPERTY_REGEX =
  /(?:^|[;{]\s*)(?:top|right|bottom|left|width|height|min-width|max-width|min-height|max-height|margin-top|margin-right|margin-bottom|margin-left|padding-top|padding-right|padding-bottom|padding-left|border-top|border-right|border-bottom|border-left|border-top-width|border-right-width|border-bottom-width|border-left-width|border-top-color|border-right-color|border-bottom-color|border-left-color|border-top-style|border-right-style|border-bottom-style|border-left-style|border-top-left-radius|border-top-right-radius|border-bottom-left-radius|border-bottom-right-radius)\s*:/im;

const PHYSICAL_DIRECTION_VALUE_REGEX =
  /(?:text-align|float|clear)\s*:\s*(?:left|right)\b/im;

describe('@methane/css cascade layers, logical reset, and fail-open defined guard', () => {
  const layersCss = readFileSync(resolve(srcDir, 'layers.css'), 'utf8');
  const resetCss = readFileSync(resolve(srcDir, 'reset.css'), 'utf8');
  const definedGuardCss = readFileSync(resolve(srcDir, 'defined-guard.css'), 'utf8');

  it('declares cascade layers in exact mth.reset -> mth.tokens -> mth.primitives -> mth.utilities order', () => {
    expect(MTH_CASCADE_LAYERS).toEqual([
      'mth.reset',
      'mth.tokens',
      'mth.primitives',
      'mth.utilities',
    ]);
    expect(layersCss.trim()).toBe(LAYER_ORDER_DECLARATION);
    expect(layersCss.trim()).toBe(
      '@layer mth.reset, mth.tokens, mth.primitives, mth.utilities;',
    );
  });

  it('wraps reset rules inside @layer mth.reset using CSS logical properties only', () => {
    expect(resetCss).toContain('@layer mth.reset {');
    expect(resetCss).toContain('margin-block: 0;');
    expect(resetCss).toContain('margin-inline: 0;');
    expect(resetCss).toContain('min-block-size: 100dvb;');
    expect(resetCss).toContain('max-inline-size: 100%;');
    expect(resetCss).not.toMatch(PHYSICAL_PROPERTY_REGEX);
    expect(resetCss).not.toMatch(PHYSICAL_DIRECTION_VALUE_REGEX);
  });

  it('implements fail-open :not(:defined) opacity reveal animation and never uses visibility: hidden', () => {
    expect(definedGuardCss).toContain(`@keyframes ${DEFINED_FALLBACK_ANIMATION}`);
    expect(definedGuardCss).toContain(':where(:not(:defined))');
    expect(definedGuardCss).toContain('opacity: 0;');
    expect(definedGuardCss).toContain('animation: mth-defined-fallback');
    expect(definedGuardCss).toContain('2s forwards');
    expect(definedGuardCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(definedGuardCss).not.toMatch(/visibility\s*:\s*hidden/i);
    expect(definedGuardCss).not.toMatch(PHYSICAL_PROPERTY_REGEX);
  });

  it('emits dist/base.css with layers declaration first followed by reset and defined guard', () => {
    const baseCssPath = resolve(distDir, 'base.css');
    if (existsSync(baseCssPath)) {
      const baseCss = readFileSync(baseCssPath, 'utf8');
      expect(baseCss.startsWith(LAYER_ORDER_DECLARATION)).toBe(true);
      expect(baseCss).toContain('margin-block: 0;');
      expect(baseCss).toContain(`@keyframes ${DEFINED_FALLBACK_ANIMATION}`);
      expect(baseCss).not.toMatch(/visibility\s*:\s*hidden/i);
    }
  });
});
