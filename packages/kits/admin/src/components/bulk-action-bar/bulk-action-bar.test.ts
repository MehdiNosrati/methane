import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthBulkActionBar,
  bulkActionBarSpec,
  registerMthBulkActionBar,
} from './index.js';

describe('<mth-bulk-action-bar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite (LTR + RTL)', async () => {
    registerMthBulkActionBar();
    const compiled = compileSpec(bulkActionBarSpec);
    expect(compiled.docs).toContain('`<mth-bulk-action-bar>`');

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-bulk-action-bar') as MthBulkActionBar;
        el.dir = dir;
        el.selectedCount = 3;
        el.totalCount = 10;
        el.actions = [
          { id: 'archive', label: 'Archive' },
          { id: 'delete', label: 'Delete', tone: 'danger' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[data-roving-item]')),
      orientation: 'horizontal' as const,
      loop: true,
    };

    const report = await RovingFocusSuite.run(rovingAdapter);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(bulkActionBarSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('formats singular/plural count and dispatches action events', async () => {
    registerMthBulkActionBar();
    const el = document.createElement('mth-bulk-action-bar') as MthBulkActionBar;
    el.selectedCount = 1;
    el.totalCount = 5;
    el.actions = [{ id: 'export', label: 'Export' }];
    document.body.appendChild(el);
    await el.updateComplete;

    const countText = (): string =>
      (el.shadowRoot!.querySelector('[part="count"]')?.textContent ?? '')
        .replace(/[\u2068\u2069]/g, '')
        .trim();

    expect(countText()).toBe('1 item selected');
    el.selectedCount = 4;
    await el.updateComplete;
    expect(countText()).toBe('4 items selected');

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-bulk-action-bar selected-count="2" total-count="5"></mth-bulk-action-bar>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-bulk-action-bar>', 'hyd-bulk-action-bar>')
      .replaceAll('<mth-bulk-action-bar', '<hyd-bulk-action-bar');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthBulkActionBar('hyd');
        customElements.upgrade(host);
        await (host as MthBulkActionBar).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
