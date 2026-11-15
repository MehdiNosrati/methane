import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, RovingFocusSuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/list-item';
import type { MthListItem } from '@methane-ui/ui/list-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { listSpec } from './list.spec.js';
import { MthList, registerMthList } from './index.js';

function createListFixture(): MthList {
  const list = document.createElement('mth-list') as MthList;
  list.label = 'Navigation items';
  list.selectionMode = 'single';

  for (const [val, text, disabled] of [
    ['one', 'One', false],
    ['two', 'Two', false],
    ['three', 'Three', false],
  ] as const) {
    const item = document.createElement('mth-list-item') as MthListItem;
    item.value = val;
    item.textContent = text;
    if (disabled) item.disabled = true;
    list.appendChild(item);
  }
  return list;
}

describe('<mth-list>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite (vertical) + same-root ARIA', async () => {
    const compiled = compileSpec(listSpec);
    expect(compiled.docs).toContain('`<mth-list>`');

    const rovingAdapter = {
      orientation: 'vertical' as const,
      loop: true,
      mount: async () => {
        const list = createListFixture();
        document.body.appendChild(list);
        await list.updateComplete;
        return list;
      },
      getItems: (container: HTMLElement) => (container as MthList).getItems(),
    };

    const specReport = await runBehaviorSpecAssertions(listSpec, {
      rovingFocus: rovingAdapter,
    });
    expect(specReport.failures).toEqual([]);
    expect(specReport.passed).toBe(true);

    const rovingReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovingReport.failures).toEqual([]);
    expect(rovingReport.passed).toBe(true);
  });

  it('supports single & multiple selection, disabled skipping, and imperative .items', async () => {
    const list = createListFixture();
    list.selectionMode = 'multiple';
    const items = Array.from(list.querySelectorAll('mth-list-item')) as MthListItem[];
    items[1]!.disabled = true;
    document.body.appendChild(list);
    await list.updateComplete;

    const changes: Array<ReadonlyArray<string>> = [];
    list.addEventListener('mth-change', (e) => {
      changes.push((e as CustomEvent<{ values: ReadonlyArray<string> }>).detail.values);
    });

    items[0]!.click();
    await list.updateComplete;
    items[1]!.click();
    await list.updateComplete;
    items[2]!.click();
    await list.updateComplete;

    expect(list.values).toEqual(['one', 'three']);
    expect(items[0]!.selected).toBe(true);
    expect(items[1]!.selected).toBe(false);
    expect(items[2]!.selected).toBe(true);
    expect(items[0]!.getAttribute('role')).toBe('option');
    expect(items[0]!.getAttribute('aria-selected')).toBe('true');
    expect(items[1]!.getAttribute('role')).toBe('option');
    expect(items[1]!.getAttribute('aria-selected')).toBe('false');
    expect(changes.length).toBe(2);
    expect(scanSameRootAria(list).valid).toBe(true);

    // Switching back to selectionMode = 'none' restores role="listitem" and clears aria-selected
    list.selectionMode = 'none';
    await list.updateComplete;
    expect(list.shadowRoot!.querySelector('[part="base"]')?.getAttribute('role')).toBe('list');
    expect(items[0]!.getAttribute('role')).toBe('listitem');
    expect(items[0]!.hasAttribute('aria-selected')).toBe(false);

    const dataList = document.createElement('mth-list') as MthList;
    dataList.selectionMode = 'single';
    dataList.items = [
      { value: 'a', label: 'Alpha', description: 'First' },
      { value: 'b', label: 'Beta' },
    ];
    document.body.appendChild(dataList);
    await dataList.updateComplete;
    const rows = dataList.getItems();
    expect(rows.length).toBe(2);
    rows[1]!.click();
    await dataList.updateComplete;
    expect(dataList.value).toBe('b');
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-list dividers><mth-list-item value="a">Alpha</mth-list-item></mth-list>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-list>', 'hyd-list>').replaceAll('<mth-list', '<hyd-list');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthList('hyd');
        customElements.upgrade(host);
        await (host as MthList).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
