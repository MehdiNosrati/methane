import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { backToTopSpec } from './back-to-top.spec.js';
import { MthBackToTop, registerMthBackToTop } from './index.js';

describe('<mth-back-to-top>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('compiles spec, toggles visibility on threshold, and scrolls target container cleanly', async () => {
    const compiled = compileSpec(backToTopSpec);
    expect(compiled.docs).toContain('`<mth-back-to-top>`');

    const report = await runBehaviorSpecAssertions(backToTopSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const scroller = document.createElement('div');
    Object.defineProperty(scroller, 'scrollTop', { value: 0, writable: true });
    document.body.appendChild(scroller);

    const btt = document.createElement('mth-back-to-top') as MthBackToTop;
    btt.threshold = 150;
    btt.scrollTarget = scroller;
    document.body.appendChild(btt);
    await btt.updateComplete;

    const btn = btt.shadowRoot!.querySelector<HTMLButtonElement>('[part="button"]')!;
    expect(btn.hasAttribute('hidden')).toBe(true);

    scroller.scrollTop = 200;
    scroller.dispatchEvent(new Event('scroll'));
    await btt.updateComplete;

    expect(btt.visible).toBe(true);
    expect(btt.hasCustomState('visible')).toBe(true);
    expect(btn.hasAttribute('hidden')).toBe(false);

    const onScrollTop = vi.fn();
    btt.addEventListener('mth-scroll-top', onScrollTop);
    btn.click();
    await btt.updateComplete;

    expect(onScrollTop).toHaveBeenCalledTimes(1);
    expect(scroller.scrollTop).toBe(0);
    expect(scanSameRootAria(btt.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-back-to-top label="Return to top"></mth-back-to-top>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-back-to-top>', 'hyd-back-to-top>')
      .replaceAll('<mth-back-to-top', '<hyd-back-to-top');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBackToTop('hyd');
        customElements.upgrade(host);
        await (host as MthBackToTop).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
