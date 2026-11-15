import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthProgressRing, progressRingSpec, registerMthProgressRing } from './index.js';

describe('<mth-progress-ring>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and emits mth-complete at max', async () => {
    const compiled = compileSpec(progressRingSpec);
    expect(compiled.docs).toContain('`<mth-progress-ring>`');

    const report = await runBehaviorSpecAssertions(progressRingSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const ring = document.createElement('mth-progress-ring') as MthProgressRing;
    ring.value = 60;
    ring.showValue = true;
    document.body.appendChild(ring);
    await ring.updateComplete;

    expect(ring.shadowRoot?.querySelector('[part="label"]')?.textContent?.trim()).toBe('60%');

    let completed = false;
    ring.addEventListener('mth-complete', () => {
      completed = true;
    });
    ring.value = 100;
    await ring.updateComplete;
    expect(completed).toBe(true);
    expect(ring.hasCustomState('complete')).toBe(true);
    expect(scanSameRootAria(ring).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-progress-ring value="45" show-value></mth-progress-ring>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-progress-ring', '<hyd-progress-ring')
      .replaceAll('</mth-progress-ring>', '</hyd-progress-ring>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthProgressRing('hyd');
        customElements.upgrade(host);
        await (host as MthProgressRing).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
