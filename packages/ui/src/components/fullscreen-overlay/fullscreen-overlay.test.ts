import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthFullscreenOverlay, fullscreenOverlaySpec, registerMthFullscreenOverlay } from './index.js';

describe('<mth-fullscreen-overlay>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(fullscreenOverlaySpec);
    expect(compiled.docs).toContain('`<mth-fullscreen-overlay>`');

    const report = await runBehaviorSpecAssertions(fullscreenOverlaySpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          const overlay = document.createElement('mth-fullscreen-overlay') as MthFullscreenOverlay;
          overlay.label = 'Search overlay';
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthFullscreenOverlay).show();
        },
        close: async (overlay) => {
          await (overlay as MthFullscreenOverlay).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthFullscreenOverlay).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-fullscreen-overlay') as MthFullscreenOverlay;
        overlay.label = 'Search overlay';
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthFullscreenOverlay).show();
      },
      close: async (overlay) => {
        await (overlay as MthFullscreenOverlay).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthFullscreenOverlay).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(suiteReport.passed).toBe(true);
    expect(scanSameRootAria(document.body).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-fullscreen-overlay label="Search"><p>Results</p></mth-fullscreen-overlay>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-fullscreen-overlay', '<hyd-fullscreen-overlay')
      .replaceAll('</mth-fullscreen-overlay>', '</hyd-fullscreen-overlay>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFullscreenOverlay('hyd');
        customElements.upgrade(host);
        await (host as MthFullscreenOverlay).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
