import { afterEach, describe, expect, it } from 'vitest';
import { html as litHtml } from 'lit';
import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { resizableHandleSpec } from './resizable-handle.spec.js';
import {
  MthResizableHandle,
  type MthResizeDeltaDetail,
  registerMthResizableHandle,
} from './index.js';

describe('<mth-resizable-handle>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('emits mth-resize-delta on Arrow and Home/End key presses', async () => {
    const compiled = compileSpec(resizableHandleSpec);
    expect(compiled.docs).toContain('`<mth-resizable-handle>`');
    const specReport = await runBehaviorSpecAssertions(resizableHandleSpec, {});
    expect(specReport.passed).toBe(true);

    const el = document.createElement('mth-resizable-handle') as MthResizableHandle;
    document.body.appendChild(el);
    await el.updateComplete;

    const deltas: MthResizeDeltaDetail[] = [];
    el.addEventListener('mth-resize-delta', (ev) => {
      deltas.push((ev as CustomEvent<MthResizeDeltaDetail>).detail);
    });

    const sep = el.shadowRoot!.querySelector('[role="separator"]')!;
    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    sep.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));

    expect(deltas).toEqual([
      { deltaPercent: 5, source: 'keyboard' },
      { edge: 'min', source: 'keyboard' },
    ]);
    expect(scanSameRootAria(el).issues).toEqual([]);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM payload', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-resizable-handle></mth-resizable-handle>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-resizable-handle>', 'hyd-resizable-handle>')
      .replaceAll('<mth-resizable-handle', '<hyd-resizable-handle');
    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthResizableHandle('hyd');
        customElements.upgrade(host);
        await (host as MthResizableHandle).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
