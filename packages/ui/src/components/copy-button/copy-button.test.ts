import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { LiveAnnouncer } from '@methane/primitives';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { copyButtonSpec } from './copy-button.spec.js';
import { MthCopyButton, registerMthCopyButton } from './index.js';

describe('<mth-copy-button>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    LiveAnnouncer.clear();
    document.body.replaceChildren();
  });

  it('copies value or target text, announces copied feedback, and emits mth-copy', async () => {
    const compiled = compileSpec(copyButtonSpec);
    expect(compiled.docs).toContain('`<mth-copy-button>`');
    const specReport = await runBehaviorSpecAssertions(copyButtonSpec, {});
    expect(specReport.passed).toBe(true);

    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const source = document.createElement('code');
    source.id = 'copy-src';
    source.textContent = 'pnpm add @methane/ui';
    document.body.appendChild(source);

    const el = document.createElement('mth-copy-button') as MthCopyButton;
    el.target = 'copy-src';
    el.feedbackDuration = 50;
    document.body.appendChild(el);
    await el.updateComplete;

    let copiedDetail: { value: string; method: string } | null = null;
    el.addEventListener('mth-copy', (ev) => {
      copiedDetail = (ev as CustomEvent<{ value: string; method: string }>).detail;
    });

    const ok = await el.copy();
    await el.updateComplete;
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('pnpm add @methane/ui');
    expect(copiedDetail).toEqual({ value: 'pnpm add @methane/ui', method: 'navigator' });
    expect(LiveAnnouncer.getLastAnnouncement()).toEqual({
      message: 'Copied to clipboard',
      politeness: 'polite',
    });
    expect(el.shadowRoot!.querySelector('button')!.getAttribute('data-copied')).toBe('true');
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-copy-button value="abc"></mth-copy-button>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-copy-button>', 'hyd-copy-button>')
      .replaceAll('<mth-copy-button', '<hyd-copy-button');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCopyButton('hyd');
        customElements.upgrade(host);
        await (host as MthCopyButton).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
