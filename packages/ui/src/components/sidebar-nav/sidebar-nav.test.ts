import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { sidebarNavSpec } from './sidebar-nav.spec.js';
import { MthSidebarNav, registerMthSidebarNav } from './index.js';

describe('<mth-sidebar-nav>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(sidebarNavSpec);
    expect(compiled.docs).toContain('`<mth-sidebar-nav>`');

    const report = await runBehaviorSpecAssertions(sidebarNavSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const roving = await RovingFocusSuite.run({
      orientation: 'vertical',
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const nav = document.createElement('mth-sidebar-nav') as MthSidebarNav;
        nav.setAttribute('dir', dir);
        nav.label = 'Primary Navigation';
        nav.items = [
          { value: 'home', label: 'Home', href: '/home' },
          { value: 'docs', label: 'Docs', href: '/docs' },
          { value: 'billing', label: 'Billing', href: '/billing', disabled: true },
          { value: 'settings', label: 'Settings', href: '/settings' },
        ];
        document.body.appendChild(nav);
        await nav.updateComplete;
        return nav;
      },
      getItems: (el: HTMLElement) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')),
    });
    expect(roving.failures).toEqual([]);
    expect(roving.passed).toBe(true);
  });

  it('sanitizes unsafe URLs, tracks aria-current, and toggles collapse state', async () => {
    const nav = document.createElement('mth-sidebar-nav') as MthSidebarNav;
    nav.collapsible = true;
    nav.activeValue = 'dash';
    nav.items = [
      { value: 'dash', label: 'Dashboard', href: '/dashboard', group: 'Core', badge: 'New' },
      { value: 'evil', label: 'Unsafe', href: 'javascript:alert(1)', group: 'Core' },
    ];
    document.body.appendChild(nav);
    await nav.updateComplete;

    const items = Array.from(nav.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]'));
    expect(items[0]?.tagName).toBe('A');
    expect(items[0]?.getAttribute('aria-current')).toBe('page');
    expect(items[1]?.tagName).toBe('BUTTON');

    const onSelect = vi.fn();
    const onCollapse = vi.fn();
    nav.addEventListener('mth-select', onSelect);
    nav.addEventListener('mth-collapse-change', onCollapse);

    items[1]?.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]?.detail?.href).toBeUndefined();

    const toggle = nav.shadowRoot!.querySelector<HTMLButtonElement>('[part="toggle"]')!;
    toggle.click();
    await nav.updateComplete;
    expect(nav.collapsed).toBe(true);
    expect(onCollapse).toHaveBeenCalledWith(expect.objectContaining({ detail: { collapsed: true } }));

    const aria = scanSameRootAria(nav.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-sidebar-nav label="Docs"></mth-sidebar-nav>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-sidebar-nav>', 'hyd-sidebar-nav>')
      .replaceAll('<mth-sidebar-nav', '<hyd-sidebar-nav');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSidebarNav('hyd');
        customElements.upgrade(host);
        await (host as MthSidebarNav).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
