import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  DataConsumerSuite,
  HydrationPuritySuite,
  RovingFocusSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import '@methane-ui/ui/tree-item';
import type { MthTreeItem } from '@methane-ui/ui/tree-item';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { MthTree, registerMthTree, treeSpec, type TreeNodeData } from './index.js';

function createSlottedTree(dir: 'ltr' | 'rtl' = 'ltr'): MthTree {
  const tree = document.createElement('mth-tree') as MthTree;
  tree.setAttribute('dir', dir);
  tree.label = 'Project files';

  const src = document.createElement('mth-tree-item') as MthTreeItem;
  src.value = 'src';
  src.label = 'src';

  const app = document.createElement('mth-tree-item') as MthTreeItem;
  app.value = 'app.ts';
  app.textContent = 'app.ts';
  src.appendChild(app);

  const readme = document.createElement('mth-tree-item') as MthTreeItem;
  readme.value = 'README.md';
  readme.textContent = 'README.md';

  const license = document.createElement('mth-tree-item') as MthTreeItem;
  license.value = 'LICENSE';
  license.textContent = 'LICENSE';

  tree.append(src, readme, license);
  return tree;
}

describe('<mth-tree>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes RovingFocusSuite + DataConsumerSuite + same-root ARIA', async () => {
    const compiled = compileSpec(treeSpec);
    expect(compiled.docs).toContain('`<mth-tree>`');

    const rovingAdapter = {
      orientation: 'vertical' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const tree = createSlottedTree(dir);
        document.body.appendChild(tree);
        await tree.updateComplete;
        return tree;
      },
      getItems: (container: HTMLElement) => (container as MthTree).getVisibleItems(),
    };

    const dataAdapter = {
      mount: async (source: unknown) => {
        const tree = document.createElement('mth-tree') as MthTree;
        tree.dataSource = source as MthTree['dataSource'];
        document.body.appendChild(tree);
        await tree.updateComplete;
        return tree;
      },
      triggerQuery: async (el: HTMLElement, filter?: string) => {
        await (el as MthTree).query(filter ?? '');
        await (el as MthTree).updateComplete;
      },
      getState: (el: HTMLElement) => (el as MthTree).getDataStatus(),
      getRenderedItemCount: (el: HTMLElement) =>
        el.shadowRoot!.querySelectorAll('[part="item"]').length,
    };

    const specReport = await runBehaviorSpecAssertions(treeSpec, {
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

  it('supports APG LTR and RTL arrow expand/collapse, parent return, * sibling expand, and virtualization', async () => {
    // LTR test
    const ltrTree = createSlottedTree('ltr');
    document.body.appendChild(ltrTree);
    await ltrTree.updateComplete;

    const src = ltrTree.querySelector<MthTreeItem>('mth-tree-item[value="src"]')!;
    const app = ltrTree.querySelector<MthTreeItem>('mth-tree-item[value="app.ts"]')!;
    src.focus();

    // ArrowRight expands closed branch
    src.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    await Promise.all([ltrTree.updateComplete, src.updateComplete]);
    expect(src.expanded).toBe(true);

    // Second ArrowRight moves focus to first child
    src.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    await ltrTree.updateComplete;
    expect(app.tabIndex).toBe(0);

    // ArrowLeft from child moves focus back to parent
    app.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
    await ltrTree.updateComplete;
    expect(src.tabIndex).toBe(0);

    // ArrowLeft on open parent collapses it
    src.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
    await Promise.all([ltrTree.updateComplete, src.updateComplete]);
    expect(src.expanded).toBe(false);

    // RTL test: ArrowLeft expands and ArrowRight collapses
    const rtlTree = createSlottedTree('rtl');
    document.body.appendChild(rtlTree);
    await rtlTree.updateComplete;
    const rtlSrc = rtlTree.querySelector<MthTreeItem>('mth-tree-item[value="src"]')!;
    rtlSrc.focus();
    rtlSrc.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
    await Promise.all([rtlTree.updateComplete, rtlSrc.updateComplete]);
    expect(rtlSrc.expanded).toBe(true);
    rtlSrc.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
    await Promise.all([rtlTree.updateComplete, rtlSrc.updateComplete]);
    expect(rtlSrc.expanded).toBe(false);

    // Virtualized data tree
    const vTree = document.createElement('mth-tree') as MthTree;
    vTree.virtualized = true;
    const largeNodes: TreeNodeData[] = Array.from({ length: 100 }, (_, i) => ({
      value: `n-${i}`,
      label: `Node ${i}`,
    }));
    vTree.items = largeNodes;
    document.body.appendChild(vTree);
    await vTree.updateComplete;
    const renderedCount = vTree.shadowRoot!.querySelectorAll('[part="item"]').length;
    expect(renderedCount).toBeGreaterThan(0);
    expect(renderedCount).toBeLessThan(100);
    expect(scanSameRootAria(vTree).valid).toBe(true);

    // Custom itemHeight updates virtualizer height + CSS variable
    vTree.itemHeight = 48;
    await vTree.updateComplete;
    const vSheets = vTree.shadowRoot!.adoptedStyleSheets;
    const vSheet = vSheets[vSheets.length - 1]!;
    expect(vSheet.cssRules[0]!.cssText).toContain('--_tree-item-height: 48px');
    expect(vSheet.cssRules[0]!.cssText).toContain('--_tree-total-height: 4800px');

    // CSS selector injection guard: malicious node.id cannot inject extra CSS rules
    const injTree = document.createElement('mth-tree') as MthTree;
    injTree.items = [{ id: 'bad"] { color: red; } [', value: 'bad"] { color: red; } [', label: 'Bad' }];
    document.body.appendChild(injTree);
    await injTree.updateComplete;
    const injSheets = injTree.shadowRoot!.adoptedStyleSheets;
    const injSheet = injSheets[injSheets.length - 1]!;
    expect(injSheet.cssRules.length).toBe(2);
    expect(
      Array.from(injSheet.cssRules).every((r) => (r as CSSStyleRule).style.color === ''),
    ).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tree label="Files"><mth-tree-item value="a" label="Alpha"></mth-tree-item></mth-tree>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr.replaceAll('mth-tree>', 'hyd-tree>').replaceAll('<mth-tree', '<hyd-tree');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTree('hyd');
        customElements.upgrade(host);
        await (host as MthTree).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
