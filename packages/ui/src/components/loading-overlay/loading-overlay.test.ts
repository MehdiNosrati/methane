import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthLoadingOverlay, loadingOverlaySpec, registerMthLoadingOverlay } from './index.js';

describe('<mth-loading-overlay>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and toggles active scrim + aria-busy', async () => {
    const compiled = compileSpec(loadingOverlaySpec);
    expect(compiled.docs).toContain('`<mth-loading-overlay>`');

    const report = await runBehaviorSpecAssertions(loadingOverlaySpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const overlay = document.createElement('mth-loading-overlay') as MthLoadingOverlay;
    overlay.textContent = 'Table content';
    document.body.appendChild(overlay);
    await overlay.updateComplete;

    expect(overlay.shadowRoot?.querySelector('[part="backdrop"]')?.hasAttribute('hidden')).toBe(true);

    let changedTo: boolean | null = null;
    overlay.addEventListener('mth-active-change', (e: Event) => {
      changedTo = (e as CustomEvent<{ active: boolean }>).detail.active;
    });
    overlay.active = true;
    await overlay.updateComplete;

    expect(changedTo).toBe(true);
    expect(overlay.shadowRoot?.querySelector('[part="backdrop"]')?.hasAttribute('hidden')).toBe(false);
    expect(overlay.shadowRoot?.querySelector('[part="content"]')?.getAttribute('aria-busy')).toBe('true');
    expect(scanSameRootAria(overlay).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-loading-overlay active label="Saving"><p>Body</p></mth-loading-overlay>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-loading-overlay', '<hyd-loading-overlay')
      .replaceAll('</mth-loading-overlay>', '</hyd-loading-overlay>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthLoadingOverlay('hyd');
        customElements.upgrade(host);
        await (host as MthLoadingOverlay).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
