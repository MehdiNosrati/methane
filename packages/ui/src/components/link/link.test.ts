import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { linkSpec } from './link.spec.js';
import { MthLink, registerMthLink } from './index.js';

describe('<mth-link>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, hardens _blank rel, handles disabled state, and blocks unsafe URLs', async () => {
    const compiled = compileSpec(linkSpec);
    expect(compiled.docs).toContain('`<mth-link>`');

    const report = await runBehaviorSpecAssertions(linkSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-link') as MthLink;
    el.href = 'https://example.com';
    el.external = true;
    el.textContent = 'External Guide';
    document.body.appendChild(el);
    await el.updateComplete;

    const anchor = el.shadowRoot?.querySelector('a[part="control"]') as HTMLAnchorElement;
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toContain('noopener');
    expect(anchor.getAttribute('rel')).toContain('noreferrer');
    expect(el.shadowRoot?.textContent).toContain('Opens in a new tab');

    let presses = 0;
    el.addEventListener('mth-press', (ev) => {
      ev.preventDefault();
      presses += 1;
    });
    anchor.click();
    expect(presses).toBe(1);

    el.disabled = true;
    await el.updateComplete;
    expect(anchor.hasAttribute('href')).toBe(false);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    anchor.click();
    expect(presses).toBe(1);

    el.disabled = false;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    el.href = 'javascript:alert(1)';
    await el.updateComplete;
    expect(anchor.hasAttribute('href')).toBe(false);
    warnSpy.mockRestore();

    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-link href="/docs">Documentation</mth-link>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-link>', 'hyd-link>').replaceAll('<mth-link', '<hyd-link');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthLink('hyd');
        customElements.upgrade(host);
        await (host as MthLink).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
