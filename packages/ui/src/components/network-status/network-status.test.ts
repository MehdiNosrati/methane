import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthNetworkStatus, networkStatusSpec, registerMthNetworkStatus } from './index.js';

describe('<mth-network-status>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and tracks online/offline transitions', async () => {
    const compiled = compileSpec(networkStatusSpec);
    expect(compiled.docs).toContain('`<mth-network-status>`');

    const report = await runBehaviorSpecAssertions(networkStatusSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const ns = document.createElement('mth-network-status') as MthNetworkStatus;
    document.body.appendChild(ns);
    await ns.updateComplete;

    expect(ns.shadowRoot?.querySelector('[part="base"]')?.hasAttribute('hidden')).toBe(true);

    const transitions: boolean[] = [];
    ns.addEventListener('mth-status-change', (e: Event) => {
      transitions.push((e as CustomEvent<{ online: boolean }>).detail.online);
    });

    window.dispatchEvent(new Event('offline'));
    await ns.updateComplete;
    expect(ns.online).toBe(false);
    expect(ns.hasCustomState('offline')).toBe(true);
    expect(ns.shadowRoot?.querySelector('[part="base"]')?.hasAttribute('hidden')).toBe(false);

    let retried = false;
    ns.addEventListener('mth-retry', () => {
      retried = true;
    });
    ns.shadowRoot?.querySelector<HTMLButtonElement>('[part="retry-button"]')?.click();
    expect(retried).toBe(true);

    window.dispatchEvent(new Event('online'));
    await ns.updateComplete;
    expect(transitions).toEqual([false, true]);
    expect(scanSameRootAria(ns).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-network-status show-when-online></mth-network-status>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-network-status', '<hyd-network-status')
      .replaceAll('</mth-network-status>', '</hyd-network-status>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthNetworkStatus('hyd');
        customElements.upgrade(host);
        await (host as MthNetworkStatus).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
