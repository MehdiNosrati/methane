import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { fabSpec } from './fab.spec.js';
import { MthFab, registerMthFab } from './index.js';

describe('<mth-fab>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, applies aria-label in compact mode, and emits mth-press', async () => {
    const compiled = compileSpec(fabSpec);
    expect(compiled.docs).toContain('`<mth-fab>`');
    const specReport = await runBehaviorSpecAssertions(fabSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-fab') as MthFab;
    el.label = 'Compose message';
    document.body.appendChild(el);
    await el.updateComplete;

    const btn = el.shadowRoot!.querySelector('button')!;
    expect(btn.getAttribute('aria-label')).toBe('Compose message');

    let presses = 0;
    el.addEventListener('mth-press', () => {
      presses += 1;
    });
    btn.click();
    expect(presses).toBe(1);

    el.extended = true;
    await el.updateComplete;
    expect(btn.hasAttribute('aria-label')).toBe(false);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-fab label="Add item"></mth-fab>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-fab>', 'hyd-fab>')
      .replaceAll('<mth-fab', '<hyd-fab');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFab('hyd');
        customElements.upgrade(host);
        await (host as MthFab).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
