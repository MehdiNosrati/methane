import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  DataConsumerSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane/ui/column';
import type { MthColumn } from '@methane/ui/column';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthTable, registerMthTable, tableSpec } from './index.js';

function createTableFixture(dir: 'ltr' | 'rtl' = 'ltr'): MthTable {
  const table = document.createElement('mth-table') as MthTable;
  table.setAttribute('dir', dir);
  table.label = 'Team members';
  table.selectable = 'multiple';

  const col1 = document.createElement('mth-column') as MthColumn;
  col1.field = 'name';
  col1.header = 'Name';
  col1.sortable = true;

  const col2 = document.createElement('mth-column') as MthColumn;
  col2.field = 'role';
  col2.header = 'Role';
  col2.sortable = true;

  const col3 = document.createElement('mth-column') as MthColumn;
  col3.field = 'score';
  col3.header = 'Score';
  col3.sortable = true;
  col3.align = 'end';

  table.append(col1, col2, col3);
  table.rows = [
    { id: 'u1', name: 'Zoe', role: 'Engineer', score: 92 },
    { id: 'u2', name: 'Ada', role: 'Architect', score: 99 },
    { id: 'u3', name: 'Mina', role: 'Designer', score: 88 },
  ];
  return table;
}

describe('<mth-table>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite + DataConsumerSuite + same-root ARIA', async () => {
    const compiled = compileSpec(tableSpec);
    expect(compiled.docs).toContain('`<mth-table>`');

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const table = createTableFixture(dir);
        document.body.appendChild(table);
        await table.updateComplete;
        return table;
      },
      getItems: (container: HTMLElement) => (container as MthTable).getHeaderControls(),
    };

    const dataAdapter = {
      mount: async (source: unknown) => {
        const table = document.createElement('mth-table') as MthTable;
        table.columns = [
          { field: 'id', header: 'ID' },
          { field: 'label', header: 'Label', sortable: true },
        ];
        table.dataSource = source as MthTable['dataSource'];
        document.body.appendChild(table);
        await table.updateComplete;
        return table;
      },
      triggerQuery: async (el: HTMLElement, filter?: string) => {
        await (el as MthTable).query(filter ?? '');
        await (el as MthTable).updateComplete;
      },
      getState: (el: HTMLElement) => (el as MthTable).getDataStatus(),
      getRenderedItemCount: (el: HTMLElement) =>
        el.shadowRoot!.querySelectorAll('tbody tr[part="row"]').length,
    };

    const specReport = await runBehaviorSpecAssertions(tableSpec, {
      rovingFocus: rovingAdapter,
      dataConsumer: dataAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovingReport.passed).toBe(true);

    const dataReport = await DataConsumerSuite.run(dataAdapter);
    expect(dataReport.passed).toBe(true);
  });

  it('supports sorting, tri-state multi-row selection, global filtering, and same-root ARIA', async () => {
    const table = createTableFixture('ltr');
    document.body.appendChild(table);
    await table.updateComplete;

    const sortButtons = table.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="sort-button"]');
    expect(sortButtons.length).toBe(3);

    // Sort ascending by Name
    sortButtons[0]!.click();
    await table.updateComplete;
    let firstRowName = table.shadowRoot!.querySelector('tbody tr[part="row"] td[data-col-id="name"]')?.textContent?.trim();
    expect(firstRowName).toBe('Ada');
    expect(table.shadowRoot!.querySelector('th[data-col-id="name"]')?.getAttribute('aria-sort')).toBe('ascending');

    // Sort descending by Name
    sortButtons[0]!.click();
    await table.updateComplete;
    firstRowName = table.shadowRoot!.querySelector('tbody tr[part="row"] td[data-col-id="name"]')?.textContent?.trim();
    expect(firstRowName).toBe('Zoe');
    expect(table.shadowRoot!.querySelector('th[data-col-id="name"]')?.getAttribute('aria-sort')).toBe('descending');

    // Tri-state row selection
    const rowChecks = table.shadowRoot!.querySelectorAll<HTMLInputElement>('[part="row-select"]');
    rowChecks[0]!.click();
    await table.updateComplete;
    const selectAll = table.shadowRoot!.querySelector<HTMLInputElement>('[part="select-all"]')!;
    expect(selectAll.indeterminate).toBe(true);
    expect(table.selectedIds).toEqual(['u1']);

    selectAll.click();
    await table.updateComplete;
    expect(table.selectedIds.length).toBe(3);
    expect(selectAll.indeterminate).toBe(false);
    expect(selectAll.checked).toBe(true);

    // Global filter
    table.filter = 'Architect';
    await table.updateComplete;
    expect(table.shadowRoot!.querySelectorAll('tbody tr[part="row"]').length).toBe(1);
    expect(scanSameRootAria(table.shadowRoot!).valid).toBe(true);

    // CSS selector injection guard: malicious col.id cannot inject extra CSS rules
    const injTable = document.createElement('mth-table') as MthTable;
    injTable.columns = [{ id: 'x"] { color: red; } [', field: 'x', header: 'X', width: 120 }];
    injTable.rows = [{ id: 'r1', x: 'val' }];
    document.body.appendChild(injTable);
    await injTable.updateComplete;
    const sheets = injTable.shadowRoot!.adoptedStyleSheets;
    const colSheet = sheets[sheets.length - 1]!;
    expect(colSheet.cssRules.length).toBe(1);
    const colRule = colSheet.cssRules[0] as CSSStyleRule;
    expect(colRule.style.color).toBe('');
    expect(colRule.style.inlineSize).toBe('120px');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-table label="Metrics"><mth-column field="id" header="ID"></mth-column></mth-table>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-table>', 'hyd-table>')
      .replaceAll('<mth-table', '<hyd-table');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTable('hyd');
        customElements.upgrade(host);
        await (host as MthTable).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
