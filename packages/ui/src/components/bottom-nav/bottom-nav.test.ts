import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { bottomNavSpec } from './bottom-nav.spec.js';
import { MthBottomNav, registerMthBottomNav } from './index.js';

describe('<mth-bottom-nav>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, RovingFocusSuite (LTR + RTL), and same-root ARIA', async () => {
    const compiled = compileSpec(bottomNavSpec);
    expect(compiled.docs).toContain('`<mth-bottom-nav>`');

    const report = await runBehaviorSpecAssertions(bottomNavSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const roving = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const nav = document.createElement('mth-bottom-nav') as MthBottomNav;
        nav.setAttribute('dir', dir);
        nav.items = [
          { value: 'home', label: 'Home' },
          { value: 'search', label: 'Search' },
          { value: 'blocked', label: 'Blocked', disabled: true },
          { value: 'profile', label: 'Profile' },
        ];
        document.body.appendChild(nav);
        await nav.updateComplete;
        return nav;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')),
    });
    expect(roving.failures).toEqual([]);
    expect(roving.passed).toBe(true);
  });

  it('sanitizes unsafe URLs, sets aria-current, and emits mth-select', async () => {
    const nav = document.createElement('mth-bottom-nav') as MthBottomNav;
    nav.activeValue = 'home';
    nav.items = [
      { value: 'home', label: 'Home' },
      { value: 'evil', label: 'Unsafe', href: 'javascript:alert(1)' },
      { value: 'alerts', label: 'Alerts', badge: '4' },
    ];
    document.body.appendChild(nav);
    await nav.updateComplete;

    const items = nav.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]');
    expect(items[0]?.getAttribute('aria-current')).toBe('page');
    expect(items[1]?.getAttribute('href')).toBe('#');

    const onSelect = vi.fn();
    nav.addEventListener('mth-select', onSelect);
    items[2]?.click();
    await nav.updateComplete;

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: 'alerts', label: 'Alerts' } }),
    );
    expect(scanSameRootAria(nav.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-bottom-nav label="Mobile"></mth-bottom-nav>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-bottom-nav>', 'hyd-bottom-nav>')
      .replaceAll('<mth-bottom-nav', '<hyd-bottom-nav');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBottomNav('hyd');
        customElements.upgrade(host);
        await (host as MthBottomNav).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
