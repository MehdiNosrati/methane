import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  DataConsumerSuite,
  HydrationPuritySuite,
  SatelliteEngineSuite,
  scanSameRootAria,
  type ConformanceDataSource,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthDatagrid, datagridSpec, registerMthDatagrid } from './index.js';

describe('<mth-datagrid>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, DataConsumerSuite, and same-root ARIA', async () => {
    const compiled = compileSpec(datagridSpec);
    expect(compiled.tests).toContain('<mth-datagrid>');

    const specReport = await runBehaviorSpecAssertions(datagridSpec, {
      dataConsumer: {
        mount: async (ds: ConformanceDataSource<{ id: string; label: string }>) => {
          const el = document.createElement('mth-datagrid') as MthDatagrid;
          el.columns = [
            { id: 'id', header: 'ID', accessorKey: 'id' },
            { id: 'label', header: 'Label', accessorKey: 'label' },
          ];
          el.dataSource = ds;
          document.body.appendChild(el);
          await el.updateComplete;
          return el;
        },
        triggerQuery: async (el, filter) => {
          await (el as MthDatagrid).load(filter);
          await (el as MthDatagrid).updateComplete;
        },
        getState: (el) => (el as MthDatagrid).engine!.dataController.status,
        getRenderedItemCount: (el) =>
          (el as MthDatagrid).shadowRoot!.querySelectorAll('.body-row').length,
      },
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-datagrid') as MthDatagrid;
          el.columns = [{ id: 'name', header: 'Name' }];
          el.rows = [{ id: '1', name: 'Alpha' }];
          return el;
        },
        readAppliedToken: (el, tokenName) =>
          (el as MthDatagrid).engine?.getAppliedToken(tokenName) ?? '',
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-datagrid') as MthDatagrid,
      readAppliedToken: (el, tokenName) =>
        (el as MthDatagrid).engine?.getAppliedToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const dcReport = await DataConsumerSuite.run({
      mount: async (ds) => {
        const el = document.createElement('mth-datagrid') as MthDatagrid;
        el.columns = [
          { id: 'id', header: 'ID', accessorKey: 'id' },
          { id: 'label', header: 'Label', accessorKey: 'label' },
        ];
        el.dataSource = ds;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      triggerQuery: async (el, filter) => {
        await (el as MthDatagrid).load(filter);
        await (el as MthDatagrid).updateComplete;
      },
      getState: (el) => (el as MthDatagrid).engine!.dataController.status,
      getRenderedItemCount: (el) =>
        (el as MthDatagrid).shadowRoot!.querySelectorAll('.body-row').length,
    });
    expect(dcReport.failures).toEqual([]);
    expect(dcReport.passed).toBe(true);
  });

  it('sorts, filters, resizes, selects rows, and guards CSSStyleSheet selectors', async () => {
    const el = document.createElement('mth-datagrid') as MthDatagrid;
    el.selectable = true;
    el.columns = [
      { id: 'name" ] { color: red; }', header: 'Name', accessorKey: 'name', pinned: 'left', width: 160 },
      { id: 'score', header: 'Score', accessorKey: 'score' },
    ];
    el.rows = [
      { id: 'a', name: 'Beta', score: 20 },
      { id: 'b', name: 'Alpha', score: 10 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);

    const sortEvents: unknown[] = [];
    el.addEventListener('mth-sort-change', (ev) => sortEvents.push((ev as CustomEvent).detail));

    const firstSortBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('.sort-btn')!;
    firstSortBtn.click();
    await el.updateComplete;

    const rowsAfterSort = el.engine!.getProcessedRows();
    expect(rowsAfterSort.map((r) => r.name)).toEqual(['Alpha', 'Beta']);
    expect(sortEvents.length).toBe(1);

    el.filter = 'Beta';
    await el.updateComplete;
    expect(el.engine!.getProcessedRows().map((r) => r.name)).toEqual(['Beta']);

    el.resizeColumn('name" ] { color: red; }', 220);
    await el.updateComplete;
    const sheets = el.shadowRoot!.adoptedStyleSheets;
    const dynamic = sheets[sheets.length - 1]!;
    expect(dynamic.cssRules.length).toBe(2);

    const sheetCount = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBe(sheetCount);
    expect(el.engine!.virtualizer.getVirtualItems().length).toBeGreaterThan(0);
    const viewport = el.shadowRoot!.querySelector<HTMLElement>('.viewport')!;
    viewport.scrollTop = 40;
    viewport.dispatchEvent(new Event('scroll'));
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-datagrid label="Users"><span slot="fallback">Static users</span></mth-datagrid>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-datagrid>', 'hyd-datagrid>')
      .replaceAll('<mth-datagrid', '<hyd-datagrid');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthDatagrid('hyd');
        customElements.upgrade(host);
        await (host as MthDatagrid).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });

  it('cycles single-column sort (asc -> desc -> none) and supports multiSort', async () => {
    registerMthDatagrid();
    const el = document.createElement('mth-datagrid') as MthDatagrid;
    el.multiSort = true;
    el.columns = [
      { id: 'dept', header: 'Dept', accessorKey: 'dept' },
      { id: 'score', header: 'Score', accessorKey: 'score' },
    ];
    el.rows = [
      { id: '1', dept: 'B', score: 10 },
      { id: '2', dept: 'A', score: 30 },
      { id: '3', dept: 'A', score: 20 },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const sortBtns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.sort-btn');
    sortBtns[0]!.click(); // dept asc
    await el.updateComplete;
    sortBtns[1]!.click(); // score asc (secondary)
    await el.updateComplete;

    expect(el.engine!.getProcessedRows().map((r) => r.id)).toEqual(['3', '2', '1']);

    sortBtns[1]!.click(); // score desc
    await el.updateComplete;
    expect(el.engine!.getProcessedRows().map((r) => r.id)).toEqual(['2', '3', '1']);

    sortBtns[1]!.click(); // clear score sort
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.header-cell')[1]!.getAttribute('aria-sort')).toBe('none');
  });

  it('supports select-all and per-row selection checkboxes emitting mth-selection-change', async () => {
    registerMthDatagrid();
    const el = document.createElement('mth-datagrid') as MthDatagrid;
    el.selectable = true;
    el.columns = [{ id: 'name', header: 'Name' }];
    el.rows = [
      { id: 'r1', name: 'One' },
      { id: 'r2', name: 'Two' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    const selections: Array<string[]> = [];
    el.addEventListener('mth-selection-change', (ev) => {
      selections.push((ev as CustomEvent<{ selectedIds: string[] }>).detail.selectedIds);
    });

    const selectAll = el.shadowRoot!.querySelector<HTMLInputElement>('.header-cell.select-cell input')!;
    selectAll.checked = true;
    selectAll.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;

    expect(selections[selections.length - 1]).toEqual(['r1', 'r2']);
    expect(el.shadowRoot!.querySelector('.body-row[data-row-id="r1"]')?.getAttribute('aria-selected')).toBe('true');

    selectAll.checked = false;
    selectAll.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    expect(selections[selections.length - 1]).toEqual([]);
  });

  it('emits mth-column-resize on resize button click and enforces 40px minimum width', async () => {
    registerMthDatagrid();
    const el = document.createElement('mth-datagrid') as MthDatagrid;
    el.columns = [{ id: 'name', header: 'Name', width: 120 }];
    el.rows = [{ id: '1', name: 'Row' }];
    document.body.appendChild(el);
    await el.updateComplete;

    const resizes: Array<{ columnId: string; width: number }> = [];
    el.addEventListener('mth-column-resize', (ev) => {
      resizes.push((ev as CustomEvent<{ columnId: string; width: number }>).detail);
    });

    el.shadowRoot!.querySelector<HTMLButtonElement>('.resize-btn')!.click();
    expect(resizes).toEqual([{ columnId: 'name', width: 144 }]);

    el.resizeColumn('name', 12); // below 40px guard -> ignored
    expect(resizes).toHaveLength(1);
  });

  it('sets :state(empty) and renders fallback slot when rows array is empty', async () => {
    registerMthDatagrid();
    const el = document.createElement('mth-datagrid') as MthDatagrid;
    el.columns = [{ id: 'name', header: 'Name' }];
    el.rows = [];
    const fallback = document.createElement('p');
    fallback.slot = 'fallback';
    fallback.textContent = 'No records found';
    el.appendChild(fallback);
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.hasCustomState('empty')).toBe(true);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="fallback"]')!;
    expect(slot.assignedElements()).toEqual([fallback]);
  });
});
