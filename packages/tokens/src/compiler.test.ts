import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  compileDtcgTokens,
  compiledTokens,
  cssVar,
  dtcgSource,
  pathToCssVar,
  tokenMap,
  tokenVars,
  tokensCss,
} from './index.js';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function flattenVars(obj: unknown, out: string[] = []): string[] {
  if (typeof obj === 'string') {
    out.push(obj);
    return out;
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const v of Object.values(obj)) {
      flattenVars(v, out);
    }
  }
  return out;
}

describe('@methane-ui/tokens W3C DTCG compiler', () => {
  it('compiles source DTCG tokens into @layer mth.tokens CSS with light-dark and oklch relative ramps', () => {
    expect(tokensCss).toContain('@layer mth.tokens');
    expect(tokensCss).toContain('color-scheme: light dark;');
    expect(tokensCss).toContain('--mth-color-seed-brand: oklch(0.55 0.23 264);');
    expect(tokensCss).toContain(
      '--mth-color-brand-600: oklch(from var(--mth-color-seed-brand) calc(l - 0.07) c h);',
    );
    expect(tokensCss).toContain(
      '--mth-color-bg: light-dark(oklch(0.985 0.004 262), oklch(0.145 0.012 262));',
    );
    expect(tokensCss).toContain(
      '--mth-color-border: light-dark(oklch(0.89 0.01 262), oklch(0.28 0.016 262));',
    );
    expect(tokensCss).toContain(
      '--mth-color-border-strong: light-dark(oklch(0.76 0.016 262), oklch(0.40 0.02 262));',
    );
    expect(tokensCss).toContain(
      '--mth-color-bg-muted: light-dark(oklch(0.925 0.01 262), oklch(0.24 0.016 262));',
    );
    expect(tokensCss).toContain(
      '--mth-color-danger-fg: light-dark(oklch(0.99 0 0), oklch(0.14 0.02 25));',
    );
    expect(tokensCss).toContain('--mth-focus-ring-width: 2px;');
    expect(tokensCss).toContain('--mth-focus-ring-offset: 2px;');
  });

  it('includes density presets (compact, default, comfortable), re-emits derived density vars, and emits scoped light/dark themes', () => {
    expect(tokensCss).toContain('--mth-density: 1;');
    expect(tokensCss).toContain("[data-mth-density='compact']");
    expect(tokensCss).toContain('--mth-density: 0.8;');
    expect(tokensCss).toContain("[data-mth-density='comfortable']");
    expect(tokensCss).toContain('--mth-density: 1.2;');
    expect(tokensCss).toContain('--mth-space-control-inline: calc(var(--mth-space-3) * var(--mth-density));');

    // Derived density tokens must be re-emitted inside each scoped density block
    const compactBlockMatch = /\[data-mth-density='compact'\],\s*\.mth-density-compact\s*\{([^}]+)\}/.exec(
      tokensCss,
    );
    expect(compactBlockMatch?.[1]).toContain('--mth-density: 0.8;');
    expect(compactBlockMatch?.[1]).toContain('--mth-space-control-inline:');
    expect(compactBlockMatch?.[1]).toContain('--mth-space-control-block:');
    expect(compactBlockMatch?.[1]).toContain('--mth-space-control-gap:');

    // Scoped light/dark theme selectors must set color-scheme
    expect(tokensCss).toMatch(/\[data-mth-theme='light'\],\s*\.mth-theme-light\s*\{[^}]*color-scheme:\s*light;/);
    expect(tokensCss).toMatch(/\[data-mth-theme='dark'\],\s*\.mth-theme-dark\s*\{[^}]*color-scheme:\s*dark;/);
  });

  it('includes typography, radii, shadows, motion, reduced-motion, and forced-colors high-contrast support', () => {
    expect(tokensCss).toContain('--mth-font-sans:');
    expect(tokensCss).toContain('--mth-font-size-2xl: 1.5rem;');
    expect(tokensCss).toContain('--mth-radius-md: 0.5rem;');
    expect(tokensCss).toContain('--mth-radius-lg: 0.75rem;');
    expect(tokensCss).toContain(
      '--mth-shadow-md: 0px 4px 8px -2px oklch(0.14 0.016 262 / 0.11), 0px 2px 4px -2px oklch(0.14 0.016 262 / 0.06);',
    );
    expect(tokensCss).toContain('--mth-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);');
    expect(tokensCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(tokensCss).toContain('--mth-motion-duration-normal: 0ms;');
    expect(tokensCss).toContain('@media (forced-colors: active)');
    expect(tokensCss).toContain('--mth-color-bg: Canvas;');
    expect(tokensCss).toContain('--mth-color-bg-muted: Canvas;');
    expect(tokensCss).toContain('--mth-color-fg: CanvasText;');
    expect(tokensCss).toContain('--mth-color-accent: Highlight;');
    expect(tokensCss).toContain('--mth-color-danger-fg: HighlightText;');
  });

  it('keeps typed tokenVars 1:1 in sync with compiled tokenMap', () => {
    const typedSet = new Set(flattenVars(tokenVars));
    const compiledSet = new Set(Object.values(tokenMap));
    expect(typedSet).toEqual(compiledSet);
    expect(compiledTokens.length).toBe(typedSet.size);
    expect(cssVar(tokenVars.color.accent)).toBe('var(--mth-color-accent)');
    expect(cssVar(tokenVars.radius.md, '6px')).toBe('var(--mth-radius-md, 6px)');
  });

  it('formats token paths into --mth-* kebab-case CSS custom properties', () => {
    expect(pathToCssVar('color.bgSubtle')).toBe('--mth-color-bg-subtle');
    expect(pathToCssVar('fontSize.2xl')).toBe('--mth-font-size-2xl');
    expect(pathToCssVar('zIndex.modal')).toBe('--mth-z-index-modal');
  });

  it('rejects unresolved references, circular references, and invalid DTCG types', () => {
    expect(() =>
      compileDtcgTokens({
        color: { $type: 'color', broken: { $value: '{color.missing}' } },
      }),
    ).toThrow(/Unresolved token reference/);

    expect(() =>
      compileDtcgTokens({
        color: {
          $type: 'color',
          a: { $value: '{color.b}' },
          b: { $value: '{color.a}' },
        },
      }),
    ).toThrow(/Circular token reference/);

    expect(() =>
      compileDtcgTokens({
        bad: { $type: 'unknown-type', $value: '1px' },
      }),
    ).toThrow(/Invalid DTCG \$type/);
  });

  it('matches built dist/tokens.css on disk when built', () => {
    const distCssPath = resolve(pkgRoot, 'dist/tokens.css');
    if (existsSync(distCssPath)) {
      expect(readFileSync(distCssPath, 'utf8')).toBe(compileDtcgTokens(dtcgSource).css);
    }
  });
});
