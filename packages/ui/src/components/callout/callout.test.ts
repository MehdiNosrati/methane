import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthCallout, calloutSpec, registerMthCallout } from './index.js';

describe('<mth-callout>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions and collapsible toggle behavior', async () => {
    const compiled = compileSpec(calloutSpec);
    expect(compiled.docs).toContain('`<mth-callout>`');

    const report = await runBehaviorSpecAssertions(calloutSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const callout = document.createElement('mth-callout') as MthCallout;
    callout.variant = 'tip';
    callout.collapsible = true;
    callout.textContent = 'Use logical CSS properties.';
    document.body.appendChild(callout);
    await callout.updateComplete;

    let toggledState: boolean | null = null;
    callout.addEventListener('mth-toggle', (e: Event) => {
      toggledState = (e as CustomEvent<{ open: boolean }>).detail.open;
    });

    callout.shadowRoot?.querySelector<HTMLButtonElement>('[part="toggle-button"]')?.click();
    await callout.updateComplete;
    expect(callout.open).toBe(false);
    expect(toggledState).toBe(false);
    expect(callout.hasCustomState('collapsed')).toBe(true);
    expect(scanSameRootAria(callout).valid).toBe(true);
  });

  it('hydrates DSD cleanly with zero node replacements', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-callout variant="warning" heading="Caution">Check permissions.</mth-callout>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('<mth-callout', '<hyd-callout')
      .replaceAll('</mth-callout>', '</hyd-callout>');
    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCallout('hyd');
        customElements.upgrade(host);
        await (host as MthCallout).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
