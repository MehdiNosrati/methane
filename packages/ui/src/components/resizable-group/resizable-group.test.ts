import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import '@methane-ui/ui/resizable-panel';
import '@methane-ui/ui/resizable-handle';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { resizableGroupSpec } from './resizable-group.spec.js';
import { MthResizableGroup, registerMthResizableGroup } from './index.js';

describe('<mth-resizable-group>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('coordinates adjacent panel sizes from handle resize deltas and emits mth-layout', async () => {
    const compiled = compileSpec(resizableGroupSpec);
    expect(compiled.docs).toContain('`<mth-resizable-group>`');
    const specReport = await runBehaviorSpecAssertions(resizableGroupSpec, {});
    expect(specReport.passed).toBe(true);

    const group = document.createElement('mth-resizable-group') as MthResizableGroup;
    const p1 = document.createElement('mth-resizable-panel');
    p1.setAttribute('default-size', '40');
    const handle = document.createElement('mth-resizable-handle');
    const p2 = document.createElement('mth-resizable-panel');
    p2.setAttribute('default-size', '60');
    group.append(p1, handle, p2);
    document.body.appendChild(group);

    await group.updateComplete;
    await (p1 as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    await (handle as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    await (p2 as unknown as { updateComplete: Promise<boolean> }).updateComplete;

    let lastSizes: number[] = [];
    group.addEventListener('mth-layout', (ev) => {
      lastSizes = (ev as CustomEvent<{ sizes: number[] }>).detail.sizes;
    });

    const sep = handle.shadowRoot!.querySelector('[role="separator"]')!;
    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await group.updateComplete;

    expect(lastSizes).toEqual([45, 55]);
    expect(scanSameRootAria(group).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-resizable-group></mth-resizable-group>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-resizable-group>', 'hyd-resizable-group>')
      .replaceAll('<mth-resizable-group', '<hyd-resizable-group');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthResizableGroup('hyd');
        customElements.upgrade(host);
        await (host as MthResizableGroup).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
