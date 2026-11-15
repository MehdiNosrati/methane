import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { columnChooserSpec } from './column-chooser.spec.js';
import { MthColumnChooser, registerMthColumnChooser } from './index.js';

describe('<mth-column-chooser>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite', async () => {
    registerMthColumnChooser();
    const compiled = compileSpec(columnChooserSpec);
    expect(compiled.docs).toContain('`<mth-column-chooser>`');

    const rovingAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-column-chooser') as MthColumnChooser;
        el.dir = dir;
        el.columns = [
          { id: 'name', label: 'Name', visible: true, locked: true },
          { id: 'email', label: 'Email', visible: true },
          { id: 'role', label: 'Role', visible: false },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (el: HTMLElement) =>
        Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('[data-col-row]')),
      orientation: 'vertical' as const,
      loop: true,
    };

    const report = await RovingFocusSuite.run(rovingAdapter);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const specReport = await runBehaviorSpecAssertions(columnChooserSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
  });

  it('toggles visibility, reorders columns, resets defaults, and passes ARIA scan', async () => {
    registerMthColumnChooser();
    const el = document.createElement('mth-column-chooser') as MthColumnChooser;
    el.columns = [
      { id: 'a', label: 'A', visible: true },
      { id: 'b', label: 'B', visible: true },
      { id: 'c', label: 'C', visible: false },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    el.toggleColumn('c');
    expect(el.columns[2]?.visible).toBe(true);

    el.moveColumn(0, 2);
    expect(el.columns.map((c) => c.id)).toEqual(['b', 'c', 'a']);

    el.resetDefaults();
    expect(el.columns.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(el.columns[2]?.visible).toBe(false);

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-column-chooser></mth-column-chooser>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-column-chooser>', 'hyd-column-chooser>')
      .replaceAll('<mth-column-chooser', '<hyd-column-chooser');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthColumnChooser('hyd');
        customElements.upgrade(host);
        await (host as MthColumnChooser).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
