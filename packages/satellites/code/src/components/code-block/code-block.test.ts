import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { codeBlockSpec } from './code-block.spec.js';
import { MthCodeBlock, registerMthCodeBlock } from './index.js';

describe('<mth-code-block>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec and SatelliteEngineSuite (50x lifecycle + token sync)', async () => {
    const compiled = compileSpec(codeBlockSpec);
    expect(compiled.docs).toContain('`<mth-code-block>`');

    const report = await runBehaviorSpecAssertions(codeBlockSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-code-block') as MthCodeBlock;
          el.language = 'typescript';
          el.code = 'const answer = 42;';
          return el;
        },
        readAppliedToken: (el: HTMLElement, tokenName: string) =>
          (el as MthCodeBlock).engine?.getThemeToken(tokenName) ?? '',
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-code-block') as MthCodeBlock,
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthCodeBlock).engine?.getThemeToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);
  });

  it('highlights tokens via span fallback and cleans up CSS.highlights when supported', async () => {
    const el = document.createElement('mth-code-block') as MthCodeBlock;
    el.language = 'typescript';
    el.lineNumbers = true;
    el.highlightLines = '2';
    el.code = 'const a = "hello";\nreturn a;';
    document.body.appendChild(el);
    await el.updateComplete;

    const tokens = Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="token"]'));
    expect(tokens.some((t) => t.dataset['token'] === 'keyword' && t.textContent === 'const')).toBe(
      true,
    );
    expect(tokens.some((t) => t.dataset['token'] === 'string')).toBe(true);
    const lines = Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="line"]'));
    expect(lines[1]?.getAttribute('data-highlighted')).toBe('true');

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const copySpy = vi.fn();
    el.addEventListener('mth-copy', copySpy);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy-button"]')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(writeText).toHaveBeenCalledWith(el.code);
    expect(copySpy).toHaveBeenCalled();

    // Same-instance reconnect preserves rendered code
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('[part="line"]').length).toBe(2);
    expect(scanSameRootAria(el.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-code-block language="ts" code="export const x = 1;"></mth-code-block>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-code-block>', 'hyd-code-block>')
      .replaceAll('<mth-code-block', '<hyd-code-block');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCodeBlock('hyd');
        customElements.upgrade(host);
        await (host as MthCodeBlock).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
