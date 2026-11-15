import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { columnSpec } from './column.spec.js';
import { MthColumn, registerMthColumn } from './index.js';

describe('<mth-column>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, passes BehaviorSpec assertions, and passes same-root ARIA', async () => {
    const compiled = compileSpec(columnSpec);
    expect(compiled.docs).toContain('`<mth-column>`');

    const report = await runBehaviorSpecAssertions(columnSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const col = document.createElement('mth-column') as MthColumn;
    col.field = 'name';
    col.header = 'Name';
    col.sortable = true;
    document.body.appendChild(col);
    await col.updateComplete;

    expect(col.field).toBe('name');
    expect(col.sortable).toBe(true);
    expect(scanSameRootAria(col).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-column field="email" header="Email" sortable></mth-column>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-column>', 'hyd-column>')
      .replaceAll('<mth-column', '<hyd-column');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthColumn('hyd');
        customElements.upgrade(host);
        await (host as MthColumn).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
