import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { scrollAreaSpec } from './scroll-area.spec.js';
import { MthScrollArea, registerMthScrollArea } from './index.js';

describe('<mth-scroll-area>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, forwards scroll events, and keeps ARIA clean', async () => {
    const compiled = compileSpec(scrollAreaSpec);
    expect(compiled.docs).toContain('`<mth-scroll-area>`');
    const specReport = await runBehaviorSpecAssertions(scrollAreaSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-scroll-area') as MthScrollArea;
    el.label = 'Logs';
    const content = document.createElement('div');
    content.textContent = 'Line 1';
    el.appendChild(content);
    document.body.appendChild(el);
    await el.updateComplete;

    let scrolled = false;
    el.addEventListener('mth-scroll', () => {
      scrolled = true;
    });

    const viewport = el.shadowRoot!.querySelector('[part="viewport"]') as HTMLElement;
    expect(viewport.getAttribute('role')).toBe('region');
    expect(viewport.getAttribute('aria-label')).toBe('Logs');
    viewport.dispatchEvent(new Event('scroll'));
    await el.updateComplete;
    expect(scrolled).toBe(true);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-scroll-area type="always"><p>Scroll body</p></mth-scroll-area>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-scroll-area>', 'hyd-scroll-area>')
      .replaceAll('<mth-scroll-area', '<hyd-scroll-area');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthScrollArea('hyd');
        customElements.upgrade(host);
        await (host as MthScrollArea).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
