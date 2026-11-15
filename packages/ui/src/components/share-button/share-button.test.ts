import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { shareButtonSpec } from './share-button.spec.js';
import { MthShareButton, registerMthShareButton } from './index.js';

describe('<mth-share-button>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('rejects unsafe URLs, supports Web Share, and falls back to clipboard', async () => {
    const compiled = compileSpec(shareButtonSpec);
    expect(compiled.docs).toContain('`<mth-share-button>`');
    const specReport = await runBehaviorSpecAssertions(shareButtonSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-share-button') as MthShareButton;
    el.url = 'javascript:alert(1)';
    document.body.appendChild(el);
    await el.updateComplete;

    let errorReason = '';
    el.addEventListener('mth-share-error', (ev) => {
      errorReason = (ev as CustomEvent<{ reason: string }>).detail.reason;
    });
    expect(await el.share()).toBe(false);
    expect(errorReason).toBe('unsafe-url');

    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    el.shareTitle = 'Methane UI';
    el.url = 'https://example.com/docs';
    let method = '';
    el.addEventListener('mth-share', (ev) => {
      method = (ev as CustomEvent<{ method: string }>).detail.method;
    });

    expect(await el.share()).toBe(true);
    expect(method).toBe('clipboard-fallback');
    expect(writeText).toHaveBeenCalled();
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-share-button share-title="Doc" url="https://example.com"></mth-share-button>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-share-button>', 'hyd-share-button>')
      .replaceAll('<mth-share-button', '<hyd-share-button');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthShareButton('hyd');
        customElements.upgrade(host);
        await (host as MthShareButton).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
