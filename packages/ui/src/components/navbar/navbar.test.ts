import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { navbarSpec } from './navbar.spec.js';
import { MthNavbar, registerMthNavbar } from './index.js';

describe('<mth-navbar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders landmark nav, and toggles mobile disclosure with Escape restore', async () => {
    const compiled = compileSpec(navbarSpec);
    expect(compiled.docs).toContain('`<mth-navbar>`');

    const report = await runBehaviorSpecAssertions(navbarSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const el = document.createElement('mth-navbar') as MthNavbar;
    document.body.appendChild(el);
    await el.updateComplete;

    const nav = el.shadowRoot?.querySelector('nav[part="nav"]');
    expect(nav?.getAttribute('aria-label')).toBe('Primary navigation');

    const toggle = el.shadowRoot?.querySelector('button[part="toggle"]') as HTMLButtonElement;
    const drawer = el.shadowRoot?.querySelector('#mth-navbar-drawer') as HTMLDivElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.hidden).toBe(true);

    toggle.click();
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.hidden).toBe(false);

    el.shadowRoot?.querySelector('header')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(drawer.hidden).toBe(true);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-navbar sticky><span slot="brand">Methane</span></mth-navbar>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-navbar>', 'hyd-navbar>').replaceAll('<mth-navbar', '<hyd-navbar');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthNavbar('hyd');
        customElements.upgrade(host);
        await (host as MthNavbar).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
