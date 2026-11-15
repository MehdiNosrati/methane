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
});
