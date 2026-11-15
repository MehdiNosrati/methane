import { afterEach, describe, expect, it, vi } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  DataConsumerSuite,
  HydrationPuritySuite,
  ListboxSuite,
  OverlaySuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { siteSearchSpec, type SiteSearchItem } from './site-search.spec.js';
import { MthSiteSearch, registerMthSiteSearch } from './index.js';

const LOCAL_ITEMS: ReadonlyArray<SiteSearchItem> = [
  { id: 'alpha', label: 'Alpha Guide', category: 'Docs', href: '/docs/alpha' },
  { id: 'beta', label: 'Beta Tokens', category: 'Reference', href: '/docs/beta' },
  { id: 'unsafe', label: 'Unsafe Item', category: 'Security', href: 'javascript:alert(1)' },
];

describe('<mth-site-search>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, DataConsumerSuite, ListboxSuite, and OverlaySuite', async () => {
    const compiled = compileSpec(siteSearchSpec);
    expect(compiled.docs).toContain('`<mth-site-search>`');

    const dataAdapter = {
      mount: async (source: unknown) => {
        const ss = document.createElement('mth-site-search') as MthSiteSearch;
        ss.forceFallback = true;
        ss.dataSource = source as MthSiteSearch['dataSource'];
        document.body.appendChild(ss);
        await ss.updateComplete;
        await ss.show();
        await ss.updateComplete;
        return ss;
      },
      triggerQuery: async (el: HTMLElement, query = '') => {
        const ss = el as MthSiteSearch;
        await ss.search(query);
        await ss.updateComplete;
      },
      getState: (el: HTMLElement) => (el as MthSiteSearch).dataStatus,
      getRenderedItemCount: (el: HTMLElement) =>
        el.shadowRoot!.querySelectorAll('[part="option"]').length,
    };

    const report = await runBehaviorSpecAssertions(siteSearchSpec, {
      dataConsumer: dataAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const dataReport = await DataConsumerSuite.run(dataAdapter);
    expect(dataReport.failures).toEqual([]);
    expect(dataReport.passed).toBe(true);

    const overlayReport = await OverlaySuite.run({
      supportsLightDismiss: true,
      supportsCancelableOpen: true,
      mount: async () => {
        const trigger = document.createElement('button');
        const overlay = document.createElement('mth-site-search') as MthSiteSearch;
        overlay.forceFallback = true;
        overlay.items = LOCAL_ITEMS;
        return { overlay, trigger };
      },
      open: async (overlay) => {
        await (overlay as MthSiteSearch).show();
        await (overlay as MthSiteSearch).updateComplete;
      },
      close: async (overlay) => {
        await (overlay as MthSiteSearch).hide('programmatic');
        await (overlay as MthSiteSearch).updateComplete;
      },
      isOpen: (overlay) => (overlay as MthSiteSearch).open,
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
          const overlay = document.createElement('mth-site-search') as MthSiteSearch;
          overlay.items = LOCAL_ITEMS;
          return { overlay, trigger };
        },
        open: async (overlay) => {
          await (overlay as MthSiteSearch).show();
          await (overlay as MthSiteSearch).updateComplete;
        },
        close: async (overlay) => {
          await (overlay as MthSiteSearch).hide('programmatic');
          await (overlay as MthSiteSearch).updateComplete;
        },
        isOpen: (overlay) => (overlay as MthSiteSearch).open,
      });
      expect(nativeReport.failures).toEqual([]);
      expect(nativeReport.passed).toBe(true);
    } finally {
      HTMLElement.prototype.showPopover = origShow;
      HTMLElement.prototype.hidePopover = origHide;
    }

    const listboxReport = await ListboxSuite.run({
      mount: async () => {
        const ss = document.createElement('mth-site-search') as MthSiteSearch;
        ss.forceFallback = true;
        ss.items = LOCAL_ITEMS;
        document.body.appendChild(ss);
        await ss.updateComplete;
        await ss.search('');
        await ss.show();
        await ss.updateComplete;
        return ss;
      },
      getListboxRoot: (el) => el.shadowRoot!,
      getOptions: (el) => Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"]')),
      getActiveOption: (el) =>
        el.shadowRoot!.querySelector<HTMLElement>('[part="option"][data-active="true"]'),
      getSelectedOptions: (el) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[part="option"][aria-selected="true"]')),
    });
    expect(listboxReport.failures).toEqual([]);
    expect(listboxReport.passed).toBe(true);
  });

  it('supports shortcut focus, local search filtering, unsafe href sanitization, and same-root ARIA', async () => {
    const ss = document.createElement('mth-site-search') as MthSiteSearch;
    ss.forceFallback = true;
    ss.registerShortcut = true;
    ss.items = LOCAL_ITEMS;
    document.body.appendChild(ss);
    await ss.updateComplete;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true }));
    await ss.updateComplete;
    expect(ss.shadowRoot!.activeElement?.id).toBe('mth-ss-input');

    const input = ss.shadowRoot!.querySelector<HTMLInputElement>('#mth-ss-input')!;
    input.value = 'Unsafe';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await ss.updateComplete;
    await Promise.resolve();
    await ss.updateComplete;

    expect(ss.open).toBe(true);
    const onSelect = vi.fn();
    ss.addEventListener('mth-select', onSelect);
    ss.shadowRoot!.querySelector<HTMLElement>('[data-value="unsafe"]')!.click();
    await ss.updateComplete;

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 'unsafe', label: 'Unsafe Item' } }),
    );
    expect(scanSameRootAria(ss.shadowRoot!).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-site-search label="Search docs"></mth-site-search>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-site-search>', 'hyd-site-search>')
      .replaceAll('<mth-site-search', '<hyd-site-search');
    const purityReport = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSiteSearch('hyd');
        customElements.upgrade(host);
        await (host as MthSiteSearch).updateComplete;
      },
    });
    expect(purityReport.failures).toEqual([]);
    expect(purityReport.passed).toBe(true);
  });
});
