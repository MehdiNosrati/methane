import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthKeyValue, keyValueSpec, registerMthKeyValue } from './index.js';

describe('<mth-key-value>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('compiles spec, renders semantic <dl>/<dt>/<dd>, and passes same-root ARIA', async () => {
    const compiled = compileSpec(keyValueSpec);
    expect(compiled.docs).toContain('`<mth-key-value>`');

    const report = await runBehaviorSpecAssertions(keyValueSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const kv = document.createElement('mth-key-value') as MthKeyValue;
    kv.label = 'Region';
    kv.value = 'us-west-2';
    kv.monospace = true;
    kv.copyable = true;
    document.body.appendChild(kv);
    await kv.updateComplete;

    expect(kv.shadowRoot!.querySelector('dl')).not.toBeNull();
    expect(kv.shadowRoot!.querySelector('dt')?.textContent?.trim()).toBe('Region');
    expect(kv.shadowRoot!.querySelector('dd')?.textContent).toContain('us-west-2');
    expect(scanSameRootAria(kv).valid).toBe(true);
  });

  it('copies value and emits mth-copy when copyable', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const kv = document.createElement('mth-key-value') as MthKeyValue;
    kv.label = 'API Key';
    kv.value = 'mth_live_12345';
    kv.copyable = true;
    document.body.appendChild(kv);
    await kv.updateComplete;

    const events: Array<{ value: string; ok: boolean }> = [];
    kv.addEventListener('mth-copy', (e) => {
      events.push((e as CustomEvent<{ value: string; ok: boolean }>).detail);
    });

    const copyBtn = kv.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy"]')!;
    const copyAria = copyBtn.getAttribute('aria-label') ?? '';
    expect(copyAria).toContain('Copy');
    expect(copyAria).toContain('API Key');
    copyBtn.click();
    await Promise.resolve();
    await kv.updateComplete;

    expect(writeText).toHaveBeenCalledWith('mth_live_12345');
    expect(events).toEqual([{ value: 'mth_live_12345', ok: true }]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-key-value label="Status" value="Healthy" orientation="vertical"></mth-key-value>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-key-value>', 'hyd-key-value>')
      .replaceAll('<mth-key-value', '<hyd-key-value');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthKeyValue('hyd');
        customElements.upgrade(host);
        await (host as MthKeyValue).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
