import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { treeItemSpec } from './tree-item.spec.js';
import { MthTreeItem, registerMthTreeItem } from './index.js';

describe('<mth-tree-item>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec, manages nested branch expansion, and passes same-root ARIA', async () => {
    const compiled = compileSpec(treeItemSpec);
    expect(compiled.docs).toContain('`<mth-tree-item>`');

    const report = await runBehaviorSpecAssertions(treeItemSpec, {});
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const parent = document.createElement('mth-tree-item') as MthTreeItem;
    parent.value = 'src';
    parent.label = 'src';
    const child = document.createElement('mth-tree-item') as MthTreeItem;
    child.value = 'index.ts';
    child.textContent = 'index.ts';
    parent.appendChild(child);

    document.body.appendChild(parent);
    await Promise.all([parent.updateComplete, child.updateComplete]);

    expect(parent.getAttribute('aria-expanded')).toBe('false');
    parent.shadowRoot!.querySelector<HTMLButtonElement>('[part="toggle"]')!.click();
    await parent.updateComplete;
    expect(parent.expanded).toBe(true);
    expect(parent.getAttribute('aria-expanded')).toBe('true');
    expect(child.getDisplayLabel()).toBe('index.ts');
    expect(scanSameRootAria(parent).valid).toBe(true);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-tree-item value="docs" label="Docs"></mth-tree-item>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-tree-item>', 'hyd-tree-item>')
      .replaceAll('<mth-tree-item', '<hyd-tree-item');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthTreeItem('hyd');
        customElements.upgrade(host);
        await (host as MthTreeItem).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
