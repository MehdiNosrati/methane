import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/tour-step';
import type { MthTourStep } from '@methane-ui/ui/tour-step';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { tourSpec } from './tour.spec.js';
import { MthTour, registerMthTour } from './index.js';

describe('<mth-tour>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(tourSpec);
    expect(compiled.docs).toContain('`<mth-tour>`');

    const report = await runBehaviorSpecAssertions(tourSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          const overlay = document.createElement('mth-tour') as MthTour;
          overlay.label = 'Onboarding';
          overlay.forceFallback = true;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthTour).show();
        },
        close: async (overlay) => {
          await (overlay as MthTour).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthTour).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-tour') as MthTour;
        overlay.label = 'Onboarding';
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthTour).show();
      },
      close: async (overlay) => {
        await (overlay as MthTour).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthTour).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(suiteReport.passed).toBe(true);
  });

  it('steps through Light-DOM <mth-tour-step> elements and completes', async () => {
    const tour = document.createElement('mth-tour') as MthTour;
    const s1 = document.createElement('mth-tour-step') as MthTourStep;
    s1.stepId = 'one';
    s1.heading = 'First';
    s1.textContent = 'Step one';
    const s2 = document.createElement('mth-tour-step') as MthTourStep;
    s2.stepId = 'two';
    s2.heading = 'Second';
    s2.textContent = 'Step two';
    tour.append(s1, s2);
    document.body.appendChild(tour);

    let completed = false;
    tour.addEventListener('mth-complete', () => {
      completed = true;
    });

    await tour.start();
    await tour.updateComplete;
    expect(s1.active).toBe(true);
    expect(s2.active).toBe(false);

    tour.next();
    await tour.updateComplete;
    expect(tour.currentStep).toBe(1);
    expect(s1.active).toBe(false);
    expect(s2.active).toBe(true);

    tour.next();
    await new Promise((r) => setTimeout(r, 20));
    expect(completed).toBe(true);
    expect(tour.open).toBe(false);

    // RTL keyboard direction flips ArrowLeft / ArrowRight
    tour.setAttribute('dir', 'rtl');
    await tour.start(0);
    await tour.updateComplete;
    const base = tour.shadowRoot?.querySelector<HTMLElement>('[part="base"]');
    base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await tour.updateComplete;
    expect(tour.currentStep).toBe(1);
    base?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await tour.updateComplete;
    expect(tour.currentStep).toBe(0);

    expect(scanSameRootAria(tour).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tour label="Welcome"><mth-tour-step heading="Start">Hi</mth-tour-step></mth-tour>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-tour>', '<hyd-tour>')
      .replaceAll('<mth-tour ', '<hyd-tour ')
      .replaceAll('</mth-tour>', '</hyd-tour>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTour('hyd');
        customElements.upgrade(host);
        await (host as MthTour).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
