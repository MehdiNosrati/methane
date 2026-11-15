import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthCookieBanner, cookieBannerSpec, registerMthCookieBanner } from './index.js';

describe('<mth-cookie-banner>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(cookieBannerSpec);
    expect(compiled.docs).toContain('`<mth-cookie-banner>`');

    const report = await runBehaviorSpecAssertions(cookieBannerSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          const overlay = document.createElement('mth-cookie-banner') as MthCookieBanner;
          overlay.open = false;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthCookieBanner).show();
        },
        close: async (overlay) => {
          await (overlay as MthCookieBanner).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthCookieBanner).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-cookie-banner') as MthCookieBanner;
        overlay.open = false;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthCookieBanner).show();
      },
      close: async (overlay) => {
        await (overlay as MthCookieBanner).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthCookieBanner).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(suiteReport.passed).toBe(true);
  });

  it('emits mth-consent for acceptAll and rejectOptional actions', async () => {
    const banner = document.createElement('mth-cookie-banner') as MthCookieBanner;
    document.body.appendChild(banner);
    await banner.show();
    await banner.updateComplete;

    const events: Array<{ essential: boolean; analytics: boolean; marketing: boolean }> = [];
    banner.addEventListener('mth-consent', (e: Event) => {
      events.push((e as CustomEvent<{ essential: boolean; analytics: boolean; marketing: boolean }>).detail);
    });

    banner.shadowRoot?.querySelector<HTMLButtonElement>('[part="accept-button"]')?.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(events[0]).toEqual({ essential: true, analytics: true, marketing: true });
    expect(banner.open).toBe(false);

    await banner.show();
    banner.shadowRoot?.querySelector<HTMLButtonElement>('[part="reject-button"]')?.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(events[1]).toEqual({ essential: true, analytics: false, marketing: false });
    expect(scanSameRootAria(banner).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-cookie-banner></mth-cookie-banner>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-cookie-banner', '<hyd-cookie-banner')
      .replaceAll('</mth-cookie-banner>', '</hyd-cookie-banner>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCookieBanner('hyd');
        customElements.upgrade(host);
        await (host as MthCookieBanner).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
