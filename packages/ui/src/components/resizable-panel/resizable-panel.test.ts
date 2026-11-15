import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { resizablePanelSpec } from './resizable-panel.spec.js';
import { MthResizablePanel, registerMthResizablePanel } from './index.js';

describe('<mth-resizable-panel>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('supports collapse/expand and mth-collapse events', async () => {
    const compiled = compileSpec(resizablePanelSpec);
    expect(compiled.docs).toContain('`<mth-resizable-panel>`');
    const specReport = await runBehaviorSpecAssertions(resizablePanelSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-resizable-panel') as MthResizablePanel;
    el.collapsible = true;
    el.defaultSize = 30;
    el.size = 30;
    document.body.appendChild(el);
    await el.updateComplete;

    const events: boolean[] = [];
    el.addEventListener('mth-collapse', (ev) => {
      events.push((ev as CustomEvent<{ collapsed: boolean }>).detail.collapsed);
    });

    el.collapse();
    await el.updateComplete;
    expect(el.collapsed).toBe(true);
    el.expand();
    await el.updateComplete;
    expect(el.collapsed).toBe(false);
    expect(events).toEqual([true, false]);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-resizable-panel default-size="40">Content</mth-resizable-panel>`,
    );
    const ssrHtml = rawSsr
      .replaceAll('mth-resizable-panel>', 'hyd-resizable-panel>')
      .replaceAll('<mth-resizable-panel', '<hyd-resizable-panel');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthResizablePanel('hyd');
        customElements.upgrade(host);
        await (host as MthResizablePanel).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
