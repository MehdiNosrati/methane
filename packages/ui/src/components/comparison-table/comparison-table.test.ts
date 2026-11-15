import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthComparisonTable,
  comparisonTableSpec,
  registerMthComparisonTable,
} from './index.js';

describe('<mth-comparison-table>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, renders semantic col/row scope headers, and emits mth-select-plan', async () => {
    const compiled = compileSpec(comparisonTableSpec);
    expect(compiled.docs).toContain('`<mth-comparison-table>`');

    const report = await runBehaviorSpecAssertions(comparisonTableSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const tableEl = document.createElement('mth-comparison-table') as MthComparisonTable;
    tableEl.caption = 'Plan Comparison';
    tableEl.stickyHeader = true;
    tableEl.compact = true;
    tableEl.plans = [
      { id: 'free', name: 'Starter', price: '$0/mo', actionLabel: 'Choose Starter' },
      { id: 'pro', name: 'Pro', price: '$19/mo', highlighted: true, actionLabel: 'Choose Pro' },
    ];
    tableEl.rows = [
      { feature: 'SSO Login', description: 'SAML 2.0 support', values: [false, true] },
      { feature: 'Seats', values: ['3', 'Unlimited'] },
    ];
    document.body.appendChild(tableEl);
    await tableEl.updateComplete;

    expect(scanSameRootAria(tableEl).valid).toBe(true);

    const colHeaders = Array.from(tableEl.shadowRoot!.querySelectorAll('thead th[scope="col"]'));
    expect(colHeaders).toHaveLength(3);
    const rowHeaders = Array.from(tableEl.shadowRoot!.querySelectorAll('tbody th[scope="row"]'));
    expect(rowHeaders).toHaveLength(2);
    expect(rowHeaders[0]!.textContent).toContain('SSO Login');

    const cells = Array.from(tableEl.shadowRoot!.querySelectorAll('tbody td'));
    expect(cells[0]!.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('Not included');
    expect(cells[1]!.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('Included');
    expect(cells[3]!.textContent?.trim()).toBe('Unlimited');

    const selected: Array<{ id: string; name: string }> = [];
    tableEl.addEventListener('mth-select-plan', (e) => {
      selected.push((e as CustomEvent<{ id: string; name: string }>).detail);
    });
    tableEl.shadowRoot!.querySelectorAll<HTMLButtonElement>('.plan-action')[1]!.click();
    expect(selected).toEqual([{ id: 'pro', name: 'Pro' }]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-comparison-table caption="Plans" sticky-header></mth-comparison-table>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-comparison-table>', 'hyd-comparison-table>')
      .replaceAll('<mth-comparison-table', '<hyd-comparison-table');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthComparisonTable('hyd');
        customElements.upgrade(host);
        await (host as MthComparisonTable).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
