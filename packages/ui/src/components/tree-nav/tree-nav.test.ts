import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { treeNavSpec } from './tree-nav.spec.js';
import { MthTreeNav, registerMthTreeNav } from './index.js';

describe('<mth-tree-nav>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, RovingFocusSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(treeNavSpec);
    expect(compiled.docs).toContain('`<mth-tree-nav>`');

    const report = await runBehaviorSpecAssertions(treeNavSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const roving = await RovingFocusSuite.run({
      orientation: 'vertical',
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const nav = document.createElement('mth-tree-nav') as MthTreeNav;
        nav.setAttribute('dir', dir);
        nav.items = [
          { value: 'intro', label: 'Introduction' },
          { value: 'guides', label: 'Guides' },
          { value: 'disabled', label: 'Deprecated', disabled: true },
          { value: 'api', label: 'API Reference' },
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

  it('expands/collapses branches via ArrowRight/ArrowLeft (LTR) and sanitizes hrefs', async () => {
    const nav = document.createElement('mth-tree-nav') as MthTreeNav;
    nav.items = [
      {
        value: 'components',
        label: 'Components',
        children: [
          { value: 'button', label: 'Button', href: '/docs/button' },
          { value: 'evil', label: 'Unsafe', href: 'javascript:alert(1)' },
        ],
      },
    ];
    document.body.appendChild(nav);
    await nav.updateComplete;

    const rootItem = nav.shadowRoot!.querySelector<HTMLElement>('[data-value="components"]')!;
    expect(rootItem.getAttribute('aria-expanded')).toBe('false');

    const toggles = vi.fn();
    nav.addEventListener('mth-toggle', toggles);

    rootItem.focus();
    rootItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await nav.updateComplete;

    expect(nav.isExpanded('components')).toBe(true);
    expect(toggles).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: 'components', expanded: true } }),
    );

    const evilLink = nav.shadowRoot!.querySelector<HTMLAnchorElement>('[data-value="evil"]')!;
    expect(evilLink.getAttribute('href')).toBe('#');
    expect(scanSameRootAria(nav.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-tree-nav label="Docs Tree"></mth-tree-nav>`);
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-tree-nav>', 'hyd-tree-nav>')
      .replaceAll('<mth-tree-nav', '<hyd-tree-nav');
    const purity = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTreeNav('hyd');
        customElements.upgrade(host);
        await (host as MthTreeNav).updateComplete;
      },
    });
    expect(purity.failures).toEqual([]);
    expect(purity.passed).toBe(true);
  });
});
