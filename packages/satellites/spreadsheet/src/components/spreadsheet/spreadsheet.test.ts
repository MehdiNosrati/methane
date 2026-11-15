import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, SatelliteEngineSuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import { MthSpreadsheet, registerMthSpreadsheet, spreadsheetSpec } from './index.js';

async function mountSpreadsheet(
  props: Partial<
    Pick<
      MthSpreadsheet,
      'rows' | 'cols' | 'cells' | 'addressMode' | 'activeCell' | 'rowHeight' | 'readonly' | 'label' | 'dir'
    >
  > = {},
): Promise<MthSpreadsheet> {
  registerMthSpreadsheet();
  const el = document.createElement('mth-spreadsheet') as MthSpreadsheet;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('<mth-spreadsheet>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes BehaviorSpec assertions', async () => {
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
  });

  it('passes SatelliteEngineSuite 50x mount/unmount disposal and token sync checks', async () => {
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
  });

  it('renders configured rows, columns, headers, and initial cell values', async () => {
    const el = await mountSpreadsheet({
      rows: 4,
      cols: 3,
      label: 'Q1 Budget',
      cells: { A1: '100', B2: 'Hello', C4: 'TRUE' },
    });

    const grid = el.shadowRoot!.querySelector('[part="grid"]')!;
    expect(grid.getAttribute('aria-label')).toBe('Q1 Budget');

    const colHeaders = Array.from(el.shadowRoot!.querySelectorAll('.col-header')).map((n) =>
      n.textContent?.trim(),
    );
    expect(colHeaders).toEqual(['A', 'B', 'C']);

    const rowHeaders = Array.from(el.shadowRoot!.querySelectorAll('.row-header')).map((n) =>
      n.textContent?.trim(),
    );
    expect(rowHeaders).toEqual(['1', '2', '3', '4']);

    expect(el.shadowRoot!.querySelector('.cell-btn[data-address="A1"]')?.textContent?.trim()).toBe('100');
    expect(el.shadowRoot!.querySelector('.cell-btn[data-address="B2"]')?.textContent?.trim()).toBe('Hello');
    expect(el.shadowRoot!.querySelector('.cell-btn[data-address="C4"]')?.textContent?.trim()).toBe('true');
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('evaluates SUM, AVERAGE/AVG, MIN, MAX, COUNT, IF, ABS, ROUND, and CONCAT formulas', async () => {
    const el = await mountSpreadsheet({
      rows: 6,
      cols: 4,
      cells: {
        A1: '10',
        A2: '20',
        A3: '30',
        B1: '=SUM(A1:A3)',
        B2: '=AVERAGE(A1:A3)',
        B3: '=AVG(A1:A3)',
        B4: '=MIN(A1:A3)',
        B5: '=MAX(A1:A3)',
        B6: '=COUNT(A1:A3)',
        C1: '=IF(B1>50, ABS(-42), 0)',
        C2: '=ROUND(3.14159, 2)',
        C3: '=CONCAT("Total=", B1)',
      },
    });

    expect(el.engine!.getCell('B1').value).toBe(60);
    expect(el.engine!.getCell('B2').value).toBe(20);
    expect(el.engine!.getCell('B3').value).toBe(20);
    expect(el.engine!.getCell('B4').value).toBe(10);
    expect(el.engine!.getCell('B5').value).toBe(30);
    expect(el.engine!.getCell('B6').value).toBe(3);
    expect(el.engine!.getCell('C1').value).toBe(42);
    expect(el.engine!.getCell('C2').value).toBe(3.14);
    expect(el.engine!.getCell('C3').value).toBe('Total=60');
  });

  it('evaluates operator precedence, parentheses, unary signs, exponentiation, and lowercase formulas', async () => {
    const el = await mountSpreadsheet({
      rows: 4,
      cols: 3,
      cells: {
        A1: '5',
        B1: '3',
        C1: '=A1+B1*2',
        C2: '=(a1+b1)*2',
        C3: '=sum(a1:b1)+2^3',
        C4: '=-A1+10',
      },
    });

    expect(el.engine!.getCell('C1').value).toBe(11);
    expect(el.engine!.getCell('C2').value).toBe(16);
    expect(el.engine!.getCell('C3').value).toBe(16);
    expect(el.engine!.getCell('C4').value).toBe(5);
  });

  it('supports R1C1 absolute and relative addressing and switches display headers in R1C1 mode', async () => {
    const el = await mountSpreadsheet({
      rows: 3,
      cols: 3,
      addressMode: 'R1C1',
      activeCell: 'B2',
      cells: {
        A1: '7',
        A2: '13',
        C1: '=R1C1+R2C1',
        C2: '=R[0]C[-2]+R[-1]C[-2]',
      },
    });

    expect(el.engine!.getCell('C1').value).toBe(20);
    expect(el.engine!.getCell('C2').value).toBe(20);
    expect(el.engine!.getActiveAddress()).toBe('R2C2');

    const colHeaders = Array.from(el.shadowRoot!.querySelectorAll('.col-header')).map((n) =>
      n.textContent?.trim(),
    );
    expect(colHeaders).toEqual(['C1', 'C2', 'C3']);
  });

  it('reports #DIV/0!, #ERROR!, #VALUE!, and #CYCLE! errors and marks data-error="true"', async () => {
    const el = await mountSpreadsheet({
      rows: 4,
      cols: 3,
      cells: {
        A1: '10',
        A2: 'text',
        B1: '=A1/0',
        B2: '=SUM(',
        B3: '=UNKNOWNFUNC(1)',
        B4: '=A2+1',
        C1: '=C2',
        C2: '=C1',
      },
    });

    expect(el.engine!.getCell('B1').error).toBe('#DIV/0!');
    expect(el.engine!.getCell('B2').error).toBe('#ERROR!');
    expect(el.engine!.getCell('B3').error).toBe('#ERROR!');
    expect(el.engine!.getCell('B4').error).toBe('#VALUE!');
    expect(el.engine!.getCell('C1').error).toBe('#CYCLE!');
    expect(el.engine!.getCell('C2').error).toBe('#CYCLE!');

    const errBtn = el.shadowRoot!.querySelector('.cell-btn[data-address="C1"]')!;
    expect(errBtn.getAttribute('data-error')).toBe('true');
    expect(errBtn.textContent?.trim()).toBe('#CYCLE!');
  });

  it('clicks cells to select them and emits mth-cell-select with displayAddress and evaluated value', async () => {
    const el = await mountSpreadsheet({
      rows: 3,
      cols: 3,
      cells: { A1: '4', B2: '=A1*5' },
    });

    const selectEvents: unknown[] = [];
    el.addEventListener('mth-cell-select', (ev) => selectEvents.push((ev as CustomEvent).detail));

    const b2Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="B2"]')!;
    b2Btn.click();
    await el.updateComplete;

    expect(el.activeCell).toBe('B2');
    expect(b2Btn.getAttribute('data-active')).toBe('true');
    expect(b2Btn.getAttribute('tabindex')).toBe('0');
    expect(selectEvents).toEqual([
      { address: 'B2', displayAddress: 'B2', raw: '=A1*5', value: 20 },
    ]);
  });

  it('enters inline edit on double-click, commits on Enter, and emits mth-cell-change', async () => {
    const el = await mountSpreadsheet({
      rows: 3,
      cols: 3,
      cells: { A1: '10', B1: '=A1*2' },
    });

    const changeEvents: unknown[] = [];
    el.addEventListener('mth-cell-change', (ev) => changeEvents.push((ev as CustomEvent).detail));

    const a1Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="A1"]')!;
    a1Btn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await el.updateComplete;

    expect(el.hasCustomState('editing')).toBe(true);
    const editor = el.shadowRoot!.querySelector<HTMLInputElement>('.cell-editor')!;
    expect(editor).not.toBeNull();
    expect(editor.value).toBe('10');

    editor.value = '25';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(el.hasCustomState('editing')).toBe(false);
    expect(el.engine!.getCell('A1').value).toBe(25);
    expect(el.engine!.getCell('B1').value).toBe(50);
    expect(changeEvents).toEqual([{ address: 'A1', raw: '25', value: 25 }]);
  });

  it('cancels inline edit on Escape without mutating cell value or emitting mth-cell-change', async () => {
    const el = await mountSpreadsheet({
      rows: 3,
      cols: 3,
      cells: { A1: '99' },
    });

    const changeEvents: unknown[] = [];
    el.addEventListener('mth-cell-change', (ev) => changeEvents.push((ev as CustomEvent).detail));

    const a1Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="A1"]')!;
    a1Btn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await el.updateComplete;

    const editor = el.shadowRoot!.querySelector<HTMLInputElement>('.cell-editor')!;
    editor.value = '12345';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;

    expect(el.hasCustomState('editing')).toBe(false);
    expect(el.engine!.getCell('A1').value).toBe(99);
    expect(changeEvents).toEqual([]);
  });

  it('commits pending edit on editor blur', async () => {
    const el = await mountSpreadsheet({ rows: 2, cols: 2, cells: { A1: '1' } });
    const a1Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="A1"]')!;
    a1Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    await el.updateComplete;

    const editor = el.shadowRoot!.querySelector<HTMLInputElement>('.cell-editor')!;
    editor.value = '=2+3';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new FocusEvent('blur'));
    await el.updateComplete;

    expect(el.engine!.getCell('A1').value).toBe(5);
  });

  it('navigates grid with ArrowDown/ArrowUp/ArrowLeft/ArrowRight in LTR and RTL', async () => {
    const el = await mountSpreadsheet({ rows: 3, cols: 3 });
    const a1Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="A1"]')!;
    a1Btn.focus();

    a1Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.activeCell).toBe('B1');

    const b1Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="B1"]')!;
    b1Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    expect(el.activeCell).toBe('B2');

    const b2Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="B2"]')!;
    b2Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await el.updateComplete;
    expect(el.activeCell).toBe('B1');

    // Clamp at row 0
    b1Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await el.updateComplete;
    expect(el.activeCell).toBe('B1');

    // In RTL, ArrowRight moves inline-start (col - 1 -> A1)
    el.setAttribute('dir', 'rtl');
    await el.updateComplete;
    b1Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await el.updateComplete;
    expect(el.activeCell).toBe('A1');
  });

  it('enters edit mode via Enter key on focused cell button', async () => {
    const el = await mountSpreadsheet({ rows: 2, cols: 2, cells: { A1: '42' } });
    const a1Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="A1"]')!;
    a1Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(el.hasCustomState('editing')).toBe(true);
    expect(el.shadowRoot!.querySelector('.cell-editor')).not.toBeNull();
  });

  it('enforces readonly guard on double-click, Enter/F2, and pasteTsv', async () => {
    const el = await mountSpreadsheet({
      rows: 3,
      cols: 3,
      readonly: true,
      cells: { A1: 'locked' },
    });

    expect(el.hasCustomState('readonly')).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="grid"]')?.getAttribute('aria-readonly')).toBe('true');

    const a1Btn = el.shadowRoot!.querySelector<HTMLButtonElement>('.cell-btn[data-address="A1"]')!;
    a1Btn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.cell-editor')).toBeNull();

    a1Btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.cell-editor')).toBeNull();

    el.pasteTsv('A1', 'mutated\tvalue');
    expect(el.engine!.getCell('A1').value).toBe('locked');
  });

  it('supports copyRangeTsv and bounded pasteTsv across grid dimensions', async () => {
    const el = await mountSpreadsheet({
      rows: 3,
      cols: 3,
      cells: { A1: '10', B1: '20', A2: '30', B2: '=A1+A2' },
    });

    expect(el.engine!.copyRangeTsv('A1', 'B2')).toBe('10\t20\n30\t40');

    // Pasting starting at B2 clips values past col 3 / row 3
    el.engine!.pasteTsv('B2', '100\t200\t300\n400\t500\t600\n700\t800\t900');
    await el.updateComplete;

    expect(el.engine!.getCell('B2').value).toBe(100);
    expect(el.engine!.getCell('C2').value).toBe(200);
    expect(el.engine!.getCell('B3').value).toBe(400);
    expect(el.engine!.getCell('C3').value).toBe(500);
    expect(el.cells['D2']).toBeUndefined();
    expect(el.cells['B4']).toBeUndefined();
  });

  it('recalculates dependent cells when cells property is dynamically replaced', async () => {
    const el = await mountSpreadsheet({
      rows: 3,
      cols: 2,
      cells: { A1: '2', B1: '=A1*10' },
    });
    expect(el.engine!.getCell('B1').value).toBe(20);

    el.cells = { A1: '7', B1: '=A1*10' };
    await el.updateComplete;

    expect(el.engine!.getCell('B1').value).toBe(70);
    expect(el.shadowRoot!.querySelector('.cell-btn[data-address="B1"]')?.textContent?.trim()).toBe('70');
  });

  it('virtualizes large row counts (>25) so only visible slice renders in DOM', async () => {
    const el = await mountSpreadsheet({ rows: 60, cols: 4 });
    const renderedRows = el.shadowRoot!.querySelectorAll('.row:not(.header-row)').length;
    expect(renderedRows).toBeLessThan(60);
    expect(renderedRows).toBeGreaterThan(0);
  });

  it('updates dynamic row-height CSS custom property via adoptedStyleSheets', async () => {
    const el = await mountSpreadsheet({ rows: 2, cols: 2, rowHeight: 44 });
    const sheets = el.shadowRoot!.adoptedStyleSheets;
    const lastSheet = sheets[sheets.length - 1]!;
    expect(lastSheet.cssRules[0]?.cssText).toContain('44px');
  });

  it('disposes engine cleanly on disconnect and re-creates on reconnect', async () => {
    const el = await mountSpreadsheet({ rows: 2, cols: 2 });
    expect(el.engine).not.toBeNull();
    el.remove();
    expect(el.engine).toBeNull();

    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.engine).not.toBeNull();
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
