import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  OverlaySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { megaMenuSpec, type MegaMenuSection } from './mega-menu.spec.js';
import { MthMegaMenu, registerMthMegaMenu } from './index.js';

const SAMPLE_SECTIONS: ReadonlyArray<MegaMenuSection> = [
  {
    id: 'products',
    label: 'Products',
    columns: [
      {
        title: 'Platform',
        links: [
          { label: 'Primitives', href: '/primitives', description: 'Headless controllers' },
          { label: 'Tokens', href: '/tokens', description: 'OKLCH design tokens' },
        ],
      },
      {
        title: 'Security',
        links: [{ label: 'Sanitizer', href: 'javascript:alert(1)' }],
      },
    ],
  },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'docs', label: 'Docs', columns: [{ title: 'Guides', links: [{ label: 'SSR', href: '/ssr' }] }] },
];

describe('<mth-mega-menu>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec assertions, RovingFocusSuite, and OverlaySuite', async () => {
    const compiled = compileSpec(megaMenuSpec);
    expect(compiled.docs).toContain('`<mth-mega-menu>`');

    const report = await runBehaviorSpecAssertions(megaMenuSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const roving = await RovingFocusSuite.run({
      orientation: 'horizontal',
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const mm = document.createElement('mth-mega-menu') as MthMegaMenu;
        mm.setAttribute('dir', dir);
        mm.sections = SAMPLE_SECTIONS;
        document.body.appendChild(mm);
        await mm.updateComplete;
        return mm;
      },
      getItems: (el: HTMLElement) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="trigger"]')),
    });
    expect(roving.failures).toEqual([]);
    expect(roving.passed).toBe(true);

    const overlayReport = await OverlaySuite.run({
      supportsLightDismiss: true,
      supportsCancelableOpen: true,
      mount: async () => {
        const trigger = document.createElement('button');
        trigger.textContent = 'Toggle Mega Menu';
        const overlay = document.createElement('mth-mega-menu') as MthMegaMenu;
        overlay.forceFallback = true;
        overlay.sections = SAMPLE_SECTIONS;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthMegaMenu).show('products');
        await (overlay as MthMegaMenu).updateComplete;
      },
      close: async (overlay) => {
        await (overlay as MthMegaMenu).hide('programmatic');
        await (overlay as MthMegaMenu).updateComplete;
      },
      isOpen: (overlay) => (overlay as MthMegaMenu).open,
    });
    expect(overlayReport.failures).toEqual([]);
    expect(overlayReport.passed).toBe(true);

    const origShow = HTMLElement.prototype.showPopover;
    const origHide = HTMLElement.prototype.hidePopover;
    HTMLElement.prototype.showPopover = function () {
      this.setAttribute('data-popover-open', 'true');
    };
    HTMLElement.prototype.hidePopover = function () {
      this.removeAttribute('data-popover-open');
    };
    try {
      const nativeReport = await OverlaySuite.run({
        supportsLightDismiss: true,
        supportsCancelableOpen: true,
        mount: async () => {
          const trigger = document.createElement('button');
          trigger.textContent = 'Toggle Native Mega Menu';
          const overlay = document.createElement('mth-mega-menu') as MthMegaMenu;
          overlay.sections = SAMPLE_SECTIONS;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthMegaMenu).show('products');
          await (overlay as MthMegaMenu).updateComplete;
        },
        close: async (overlay) => {
          await (overlay as MthMegaMenu).hide('programmatic');
          await (overlay as MthMegaMenu).updateComplete;
        },
        isOpen: (overlay) => (overlay as MthMegaMenu).open,
      });
      expect(nativeReport.failures).toEqual([]);
      expect(nativeReport.passed).toBe(true);
    } finally {
      HTMLElement.prototype.showPopover = origShow;
      HTMLElement.prototype.hidePopover = origHide;
    }
  });

  it('renders multi-column sections, sanitizes links, and checks same-root ARIA', async () => {
    const mm = document.createElement('mth-mega-menu') as MthMegaMenu;
    mm.sections = SAMPLE_SECTIONS;
    document.body.appendChild(mm);
    await mm.updateComplete;

    await mm.show('products');
    await mm.updateComplete;

    const links = Array.from(mm.shadowRoot!.querySelectorAll<HTMLAnchorElement>('[part="link"]'));
    expect(links).toHaveLength(3);
    expect(links[2]?.getAttribute('href')).toBe('#');

    const onSelect = vi.fn();
    mm.addEventListener('mth-select', onSelect);
    links[0]?.click();
    await mm.updateComplete;
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { sectionId: 'products', href: '/primitives', label: 'Primitives' },
      }),
    );

    const aria = scanSameRootAria(mm.shadowRoot!);
    expect(aria.valid, JSON.stringify(aria.issues)).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-mega-menu label="Header nav"></mth-mega-menu>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-mega-menu>', 'hyd-mega-menu>')
      .replaceAll('<mth-mega-menu', '<hyd-mega-menu');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthMegaMenu('hyd');
        customElements.upgrade(host);
        await (host as MthMegaMenu).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
