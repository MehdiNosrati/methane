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

  it('never relies on @container self-queries without a matching @media fallback rule', () => {
    const cssFiles = ['layout.css', 'prose.css', 'marketing.css'].map((file) => ({
      file,
      css: readFileSync(resolve(srcDir, file), 'utf8'),
    }));

    const stripComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, '');
    const splitSelectors = (header: string): string[] => {
      const out: string[] = [];
      let parenDepth = 0;
      let bracketDepth = 0;
      let start = 0;
      for (let idx = 0; idx < header.length; idx++) {
        const ch = header[idx];
        if (ch === '(') parenDepth++;
        else if (ch === ')' && parenDepth > 0) parenDepth--;
        else if (ch === '[') bracketDepth++;
        else if (ch === ']' && bracketDepth > 0) bracketDepth--;
        else if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
          const item = header.slice(start, idx).trim().replace(/\s+/g, ' ');
          if (item) out.push(item);
          start = idx + 1;
        }
      }
      const tail = header.slice(start).trim().replace(/\s+/g, ' ');
      if (tail) out.push(tail);
      return out;
    };
    const subjectBaseClass = (selector: string): string | null => {
      // Find the last compound selector after top-level combinators (ignoring spaces inside () / []).
      let parenDepth = 0;
      let bracketDepth = 0;
      let lastCombinatorEnd = 0;
      for (let idx = 0; idx < selector.length; idx++) {
        const ch = selector[idx];
        if (ch === '(') parenDepth++;
        else if (ch === ')' && parenDepth > 0) parenDepth--;
        else if (ch === '[') bracketDepth++;
        else if (ch === ']' && bracketDepth > 0) bracketDepth--;
        else if (parenDepth === 0 && bracketDepth === 0 && /[\s>~+]/.test(ch ?? '')) {
          lastCombinatorEnd = idx + 1;
        }
      }
      const subject = selector.slice(lastCombinatorEnd).trim();
      const match = subject.match(/^\.[a-z0-9-]+/i);
      return match ? match[0] : null;
    };

    const parseBlocks = (
      source: string,
      atContext: 'root' | 'media' | 'container' = 'root',
      containerDeclarations: Set<string> = new Set(),
      containerTargets: Array<{ file: string; selector: string; baseClass: string }> = [],
      mediaSelectors: Set<string> = new Set(),
    ) => {
      let i = 0;
      while (i < source.length) {
        const braceOpen = source.indexOf('{', i);
        if (braceOpen === -1) break;
        const header = source.slice(i, braceOpen).trim().replace(/\s+/g, ' ');
        let depth = 1;
        let j = braceOpen + 1;
        while (j < source.length && depth > 0) {
          if (source[j] === '{') depth++;
          else if (source[j] === '}') depth--;
          j++;
        }
        const body = source.slice(braceOpen + 1, j - 1);
        if (header.startsWith('@layer ')) {
          parseBlocks(body, atContext, containerDeclarations, containerTargets, mediaSelectors);
        } else if (header.startsWith('@media')) {
          parseBlocks(body, 'media', containerDeclarations, containerTargets, mediaSelectors);
        } else if (header.startsWith('@container')) {
          parseBlocks(body, 'container', containerDeclarations, containerTargets, mediaSelectors);
        } else if (header.startsWith('@')) {
          parseBlocks(body, atContext, containerDeclarations, containerTargets, mediaSelectors);
        } else {
          const selectors = splitSelectors(header);
          if (/container-type\s*:\s*(?!normal\b)/i.test(body)) {
            for (const sel of selectors) {
              const base = subjectBaseClass(sel);
              if (base) containerDeclarations.add(base);
            }
          }
          if (atContext === 'media') {
            for (const sel of selectors) mediaSelectors.add(sel);
          } else if (atContext === 'container') {
            for (const sel of selectors) {
              const base = subjectBaseClass(sel);
              if (base) containerTargets.push({ file: '', selector: sel, baseClass: base });
            }
          }
        }
        i = j;
      }
      return { containerDeclarations, containerTargets, mediaSelectors };
    };

    for (const { file, css } of cssFiles) {
      const { containerDeclarations, containerTargets, mediaSelectors } = parseBlocks(
        stripComments(css),
      );
      for (const target of containerTargets) {
        if (containerDeclarations.has(target.baseClass)) {
          expect(
            mediaSelectors.has(target.selector),
            `${file}: "${target.selector}" targets a selector whose base class (${target.baseClass}) declares container-type without a @media rule`,
          ).toBe(true);
        }
      }
    }

    // Explicitly verify app-shell, hero split, article-layout, and dl provide @media layout rules
    // and app-shell collapses empty aside track when no aside child exists.
    const marketingCss = readFileSync(resolve(srcDir, 'marketing.css'), 'utf8');
    expect(layoutCss).toContain('@media (width >= 60rem)');
    expect(layoutCss).toContain(
      ".mth-app-shell:not(:has(> .mth-app-shell-aside, > [data-region='aside']))",
    );
    expect(marketingCss).toContain('@media (width >= 56rem)');
    expect(proseCss).toContain('@media (width >= 30rem)');
  });
});
