import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { statusIndicatorSpec } from './status-indicator.spec.js';
import { MthStatusIndicator, registerMthStatusIndicator } from './index.js';

describe('<mth-status-indicator>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and exposes live status semantics', async () => {
    const compiled = compileSpec(statusIndicatorSpec);
    expect(compiled.docs).toContain('`<mth-status-indicator>`');

    const report = await runBehaviorSpecAssertions(statusIndicatorSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const indicator = document.createElement('mth-status-indicator') as MthStatusIndicator;
    indicator.status = 'online';
    indicator.pulse = true;
    indicator.label = 'Connected';
    document.body.appendChild(indicator);
    await indicator.updateComplete;

    expect(indicator.hasCustomState('pulse')).toBe(true);
    expect(indicator.shadowRoot?.querySelector('[part="base"]')?.getAttribute('aria-label')).toBe(
      'Connected',
    );
    expect(scanSameRootAria(indicator).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-status-indicator status="busy" label="In meeting"></mth-status-indicator>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-status-indicator', '<hyd-status-indicator')
      .replaceAll('</mth-status-indicator>', '</hyd-status-indicator>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthStatusIndicator('hyd');
        customElements.upgrade(host);
        await (host as MthStatusIndicator).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
