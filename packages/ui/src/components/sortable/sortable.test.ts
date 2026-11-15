import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { sortableSpec } from './sortable.spec.js';
import { MthSortable, registerMthSortable } from './index.js';

describe('<mth-sortable>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('passes RovingFocusSuite and reorders items via keyboard and reorder()', async () => {
    const compiled = compileSpec(sortableSpec);
    expect(compiled.docs).toContain('`<mth-sortable>`');

    const rovingFocusAdapter = {
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-sortable') as MthSortable;
        el.dir = dir;
        el.orientation = 'vertical';
        el.items = [
          { id: '1', label: 'Alpha' },
          { id: '2', label: 'Beta' },
          { id: '3', label: 'Gamma' },
        ];
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) =>
        Array.from(container.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')),
      orientation: 'vertical' as const,
      loop: true,
    };

    const specReport = await runBehaviorSpecAssertions(sortableSpec, {
      rovingFocus: rovingFocusAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingFocusAdapter);
    expect(rovingReport.failures).toEqual([]);

    const el = document.createElement('mth-sortable') as MthSortable;
    el.items = [
      { id: 'a', label: 'First' },
      { id: 'b', label: 'Second' },
      { id: 'c', label: 'Third' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    let reordered: { fromIndex: number; toIndex: number } | null = null;
    el.addEventListener('mth-reorder', (ev) => {
      const d = (ev as CustomEvent<{ fromIndex: number; toIndex: number }>).detail;
      reordered = { fromIndex: d.fromIndex, toIndex: d.toIndex };
    });

    el.reorder(0, 2);
    await el.updateComplete;
    expect(reordered).toEqual({ fromIndex: 0, toIndex: 2 });
    expect(el.items.map((item) => item.id)).toEqual(['b', 'c', 'a']);

    // Keyboard Space -> ArrowDown -> Space reorder
    const firstItem = el.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')[0]!;
    firstItem.focus();
    firstItem.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
    firstItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    const movedItem = el.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')[1]!;
    movedItem.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.items.map((item) => item.id)).toEqual(['c', 'b', 'a']);

    // Keyboard Space -> ArrowDown -> Escape cancels reorder
    const item0 = el.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')[0]!;
    item0.focus();
    item0.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
    item0.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    const item1 = el.shadowRoot!.querySelectorAll<HTMLElement>('[part="item"]')[1]!;
    item1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.items.map((item) => item.id)).toEqual(['c', 'b', 'a']);

    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-sortable label="Priority"><div>Task 1</div><div>Task 2</div></mth-sortable>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-sortable>', 'hyd-sortable>')
      .replaceAll('<mth-sortable', '<hyd-sortable');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthSortable('hyd');
        customElements.upgrade(host);
        await (host as MthSortable).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
