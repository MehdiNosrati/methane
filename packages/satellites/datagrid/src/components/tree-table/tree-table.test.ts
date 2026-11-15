import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { treeTableSpec } from './tree-table.spec.js';
import { MthTreeTable, registerMthTreeTable } from './index.js';

describe('<mth-tree-table>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, hierarchical expand/collapse, and keyboard nav', async () => {
    const compiled = compileSpec(treeTableSpec);
    expect(compiled.tests).toContain('<mth-tree-table>');

    const specReport = await runBehaviorSpecAssertions(treeTableSpec, {
      satellite: {
        createElement: () => document.createElement('mth-tree-table') as MthTreeTable,
        readAppliedToken: (el, tokenName) =>
          (el as MthTreeTable).engine?.getAppliedToken(tokenName) ?? '',
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => document.createElement('mth-tree-table') as MthTreeTable,
      readAppliedToken: (el, tokenName) =>
        (el as MthTreeTable).engine?.getAppliedToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const el = document.createElement('mth-tree-table') as MthTreeTable;
    el.selectable = true;
    el.columns = [
      { id: 'name', header: 'Name' },
      { id: 'size', header: 'Size' },
    ];
    el.rows = [
      {
        id: 'src',
        name: 'src',
        size: '4 KB',
        children: [{ id: 'index', name: 'index.ts', size: '1 KB' }],
      },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.engine!.getVisibleRows().length).toBe(1);

    const firstRow = el.shadowRoot!.querySelector<HTMLElement>('.body-row')!;
    firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.engine!.getVisibleRows().length).toBe(2);

    firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await el.updateComplete;
    expect(el.engine!.getVisibleRows().length).toBe(1);

    el.expandedIds = ['src'];
    await el.updateComplete;
    expect(el.engine!.getVisibleRows().length).toBe(2);

    el.expandedIds = [];
    await el.updateComplete;
    expect(el.engine!.getVisibleRows().length).toBe(1);

    const sheetCount = el.shadowRoot!.adoptedStyleSheets.length;
    el.remove();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.adoptedStyleSheets.length).toBe(sheetCount);
    expect(el.engine!.getVisibleRows().length).toBe(1);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tree-table label="Files"><span slot="fallback">Tree fallback</span></mth-tree-table>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-tree-table>', 'hyd-tree-table>')
      .replaceAll('<mth-tree-table', '<hyd-tree-table');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTreeTable('hyd');
        customElements.upgrade(host);
        await (host as MthTreeTable).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
