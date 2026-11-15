import { compileSpec, runBehaviorSpecAssertions } from '@methane/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { renderLitDsdHtml } from '../../shared/ssr-hydrate-test.js';
import {
  flowEditorSpec,
  MthFlowEditor,
  registerMthFlowEditor,
  type FlowEdge,
  type FlowNode,
} from './index.js';

const SAMPLE_NODES: FlowNode[] = [
  { id: 'trigger', label: 'Webhook' },
  { id: 'transform', label: 'Transform' },
  { id: 'sink', label: 'Persist' },
];

const SAMPLE_EDGES: FlowEdge[] = [
  { id: 'e1', source: 'trigger', target: 'transform' },
  { id: 'e2', source: 'transform', target: 'sink' },
];

describe('<mth-flow-editor>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('compiles spec and passes SatelliteEngineSuite + RovingFocusSuite + same-root ARIA', async () => {
    const compiled = compileSpec(flowEditorSpec);
    expect(compiled.docs).toContain('`<mth-flow-editor>`');

    const satelliteAdapter = {
      createElement: () => {
        const el = document.createElement('mth-flow-editor') as MthFlowEditor;
        el.nodes = SAMPLE_NODES;
        el.edges = SAMPLE_EDGES;
        return el;
      },
      readAppliedToken: (el: HTMLElement, tokenName: string) =>
        (el as MthFlowEditor).engine?.getThemeToken(tokenName) ?? '',
    };

    const rovingAdapter = {
      orientation: 'horizontal' as const,
      loop: true,
      mount: async (dir: 'ltr' | 'rtl' = 'ltr') => {
        const el = document.createElement('mth-flow-editor') as MthFlowEditor;
        el.setAttribute('dir', dir);
        el.nodes = SAMPLE_NODES;
        el.edges = SAMPLE_EDGES;
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
      },
      getItems: (container: HTMLElement) => (container as MthFlowEditor).getFocusableNodes(),
    };

    const report = await runBehaviorSpecAssertions(flowEditorSpec, {
      satellite: satelliteAdapter,
      rovingFocus: rovingAdapter,
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);

    const satReport = await SatelliteEngineSuite.run(satelliteAdapter);
    expect(satReport.passed).toBe(true);

    const rovReport = await RovingFocusSuite.run(rovingAdapter);
    expect(rovReport.passed).toBe(true);
  });

  it('computes Dagre DAG coordinates, prevents CSS selector injection, and supports zoom/selection', async () => {
    const editor = document.createElement('mth-flow-editor') as MthFlowEditor;
    editor.nodes = [
      { id: 'bad"] { color: red; } [', label: 'Start' },
      { id: 'end', label: 'Finish' },
    ];
    editor.edges = [{ id: 'e1', source: 'bad"] { color: red; } [', target: 'end' }];
    document.body.appendChild(editor);
    await editor.updateComplete;

    const positioned = editor.engine!.getPositionedNodes();
    expect(positioned.length).toBe(2);
    expect(positioned[1]!.x).toBeGreaterThan(positioned[0]!.x);

    const sheets = editor.shadowRoot!.adoptedStyleSheets;
    const layoutSheet = sheets[sheets.length - 1]!;
    expect(layoutSheet.cssRules.length).toBe(3);
    expect(
      Array.from(layoutSheet.cssRules).every((r) => (r as CSSStyleRule).style.color === ''),
    ).toBe(true);

    editor.zoomBy(0.25);
    await editor.updateComplete;
    expect(editor.zoom).toBe(1.25);
    expect(scanSameRootAria(editor.shadowRoot!).valid).toBe(true);

    const sheetCountBefore = editor.shadowRoot!.adoptedStyleSheets.length;
    editor.remove();
    document.body.appendChild(editor);
    await editor.updateComplete;
    expect(editor.shadowRoot!.adoptedStyleSheets.length).toBe(sheetCountBefore);
    expect(editor.engine?.getPositionedNodes().length).toBe(2);
  });

  it('passes HydrationPuritySuite on Declarative Shadow DOM with fallback slot', async () => {
    const rawSsr = await renderLitDsdHtml(
      litHtml`<mth-flow-editor label="Pipeline"><ul slot="fallback"><li>Webhook -> Sink</li></ul></mth-flow-editor>`,
    );
    expect(rawSsr).toContain('shadowrootmode="open"');

    const ssrHtml = rawSsr
      .replaceAll('mth-flow-editor>', 'hyd-flow-editor>')
      .replaceAll('<mth-flow-editor', '<hyd-flow-editor');

    const report = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthFlowEditor('hyd');
        customElements.upgrade(host);
        await (host as MthFlowEditor).updateComplete;
      },
    });
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
