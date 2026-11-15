import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthSpreadsheet, registerMthSpreadsheet, spreadsheetSpec } from './index.js';

describe('<mth-spreadsheet>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes BehaviorSpec, SatelliteEngineSuite, Formula AST evaluation, R1C1, cycles, and TSV', async () => {
    const compiled = compileSpec(spreadsheetSpec);
    expect(compiled.tests).toContain('<mth-spreadsheet>');

    const specReport = await runBehaviorSpecAssertions(spreadsheetSpec, {
      satellite: {
        createElement: () => {
          const el = document.createElement('mth-spreadsheet') as MthSpreadsheet;
          el.rows = 5;
          el.cols = 4;
          return el;
        },
        readAppliedToken: (el, tokenName) =>
          (el as MthSpreadsheet).engine?.getAppliedToken(tokenName) ?? '',
      },
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run({
      createElement: () => {
        const el = document.createElement('mth-spreadsheet') as MthSpreadsheet;
        el.rows = 4;
        el.cols = 4;
        return el;
      },
      readAppliedToken: (el, tokenName) =>
        (el as MthSpreadsheet).engine?.getAppliedToken(tokenName) ?? '',
    });
    expect(satReport.failures).toEqual([]);
    expect(satReport.passed).toBe(true);

    const el = document.createElement('mth-spreadsheet') as MthSpreadsheet;
    el.rows = 6;
    el.cols = 4;
    el.cells = {
      A1: '10',
      A2: '20',
      A3: '30',
      B1: '=SUM(A1:A3)',
      B2: '=AVERAGE(A1:A3)',
      B3: '=IF(B1>50, MAX(A1:A3), MIN(A1:A3))',
      B4: '=COUNT(A1:A3)',
      C1: '=R1C1+R2C1',
      C2: '=A1/0',
      D1: '=D2',
      D2: '=D1',
    };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(scanSameRootAria(el).issues).toEqual([]);
    expect(el.engine!.getCell('B1').value).toBe(60);
    expect(el.engine!.getCell('B2').value).toBe(20);
    expect(el.engine!.getCell('B3').value).toBe(30);
    expect(el.engine!.getCell('B4').value).toBe(3);
    expect(el.engine!.getCell('C1').value).toBe(30);
    expect(el.engine!.getCell('C2').error).toBe('#DIV/0!');
    expect(el.engine!.getCell('D1').error).toBe('#CYCLE!');

    el.addressMode = 'R1C1';
    await el.updateComplete;
    expect(el.engine!.getActiveAddress()).toBe('R1C1');

    const tsv = el.engine!.copyRangeTsv('A1', 'B2');
    expect(tsv).toBe('10\t60\n20\t20');
    el.engine!.pasteTsv('A5', '100\t200');
    await el.updateComplete;
    expect(el.engine!.getCell('A5').value).toBe(100);
    expect(el.engine!.getCell('B5').value).toBe(200);

    el.setAttribute('dir', 'rtl');
    await el.updateComplete;
    const firstBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="B1"]')!;
    firstBtn.focus();
    firstBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.activeCell).toBe('A1');
    expect((el.shadowRoot!.activeElement as HTMLElement | null)?.dataset.address).toBe('A1');

    el.rows = 60;
    await el.updateComplete;
    const renderedRows = el.shadowRoot!.querySelectorAll('.row:not(.header-row)').length;
    expect(renderedRows).toBeLessThan(60);
    expect(renderedRows).toBeGreaterThan(0);
  });

  it('passes HydrationPuritySuite on SSR Declarative Shadow DOM markup', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-spreadsheet rows="3" cols="3" label="Budget"><span slot="fallback">Sheet fallback</span></mth-spreadsheet>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-spreadsheet>', 'hyd-spreadsheet>')
      .replaceAll('<mth-spreadsheet', '<hyd-spreadsheet');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSpreadsheet('hyd');
        customElements.upgrade(host);
        await (host as MthSpreadsheet).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
