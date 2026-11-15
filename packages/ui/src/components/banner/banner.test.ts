import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthBanner, bannerSpec, registerMthBanner } from './index.js';

describe('<mth-banner>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and supports cancelable dismissal', async () => {
    const compiled = compileSpec(bannerSpec);
    expect(compiled.docs).toContain('`<mth-banner>`');

    const report = await runBehaviorSpecAssertions(bannerSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const banner = document.createElement('mth-banner') as MthBanner;
    banner.dismissible = true;
    banner.variant = 'warning';
    banner.heading = 'Maintenance';
    banner.textContent = 'Scheduled downtime tonight.';
    document.body.appendChild(banner);
    await banner.updateComplete;

    banner.addEventListener('mth-dismiss', (e) => e.preventDefault(), { once: true });
    expect(banner.dismiss()).toBe(false);
    expect(banner.dismissed).toBe(false);

    banner.shadowRoot?.querySelector<HTMLButtonElement>('[part="close-button"]')?.click();
    await banner.updateComplete;
    expect(banner.dismissed).toBe(true);
    expect(scanSameRootAria(banner).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-banner variant="info" heading="Notice">System update complete.</mth-banner>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-banner', '<hyd-banner')
      .replaceAll('</mth-banner>', '</hyd-banner>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBanner('hyd');
        customElements.upgrade(host);
        await (host as MthBanner).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
