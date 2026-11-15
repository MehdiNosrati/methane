import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, OverlaySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthCoachmark, coachmarkSpec, registerMthCoachmark } from './index.js';

describe('<mth-coachmark>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and OverlaySuite conformance', async () => {
    const compiled = compileSpec(coachmarkSpec);
    expect(compiled.docs).toContain('`<mth-coachmark>`');

    const report = await runBehaviorSpecAssertions(coachmarkSpec, {
      overlay: {
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.id = 'target-btn';
          const overlay = document.createElement('mth-coachmark') as MthCoachmark;
          overlay.target = '#target-btn';
          overlay.heading = 'New command bar';
          overlay.forceFallback = true;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthCoachmark).show();
        },
        close: async (overlay) => {
          await (overlay as MthCoachmark).hide('programmatic');
        },
        isOpen: (overlay) => (overlay as MthCoachmark).open,
        supportsCancelableOpen: true,
        supportsLightDismiss: false,
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const suiteReport = await OverlaySuite.run({
      mount: () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-coachmark') as MthCoachmark;
        overlay.heading = 'Tip';
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthCoachmark).show();
      },
      close: async (overlay) => {
        await (overlay as MthCoachmark).hide('programmatic');
      },
      isOpen: (overlay) => (overlay as MthCoachmark).open,
      supportsCancelableOpen: true,
      supportsLightDismiss: false,
    });
    expect(suiteReport.passed).toBe(true);
  });

  it('emits mth-dismiss and hides when primary button is clicked', async () => {
    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    const cm = document.createElement('mth-coachmark') as MthCoachmark;
    cm.heading = 'Try filters';
    cm.step = 2;
    cm.total = 4;
    document.body.appendChild(cm);
    await cm.show(anchor);
    await cm.updateComplete;

    let dismissed = false;
    cm.addEventListener('mth-dismiss', () => {
      dismissed = true;
    });
    const progressText = cm.shadowRoot?.querySelector('.progress')?.textContent?.replace(/[\u2068\u2069]/g, '');
    expect(progressText).toContain('2 of 4');

    cm.shadowRoot?.querySelector<HTMLButtonElement>('[part="dismiss-button"]')?.click();
    await new Promise((r) => setTimeout(r, 20));
    expect(dismissed).toBe(true);
    expect(cm.open).toBe(false);
    expect(scanSameRootAria(cm).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-coachmark heading="Hint">Press K to search</mth-coachmark>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-coachmark', '<hyd-coachmark')
      .replaceAll('</mth-coachmark>', '</hyd-coachmark>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCoachmark('hyd');
        customElements.upgrade(host);
        await (host as MthCoachmark).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
