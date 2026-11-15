import { compileSpec, runBehaviorSpecAssertions } from '@methane-ui/spec-compiler';
import {
  HydrationPuritySuite,
  RovingFocusSuite,
  SatelliteEngineSuite,
  scanSameRootAria,
} from '@methane-ui/test-conformance';
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

  it('generates orthogonal vs bezier edge paths and adapts auto direction in RTL', async () => {
    const editor = document.createElement('mth-flow-editor') as MthFlowEditor;
    editor.nodes = SAMPLE_NODES;
    editor.edges = SAMPLE_EDGES;
    editor.edgeStyle = 'orthogonal';
    editor.direction = 'TB';
    document.body.appendChild(editor);
    await editor.updateComplete;

    const orthoPaths = editor.engine!.getRoutedEdges().map((e) => e.pathData);
    expect(orthoPaths[0]).toContain(' L ');
    expect(orthoPaths[0]).not.toContain(' C ');

    editor.edgeStyle = 'bezier';
    editor.direction = 'auto';
    editor.setAttribute('dir', 'rtl');
    await editor.updateComplete;

    const bezierPaths = editor.engine!.getRoutedEdges().map((e) => e.pathData);
    expect(bezierPaths[0]).toContain(' C ');
    const positioned = editor.engine!.getPositionedNodes();
    expect(positioned[0]!.x).toBeGreaterThan(positioned[1]!.x);
  });

  it('selects nodes, highlights connected edges, and emits mth-node-select', async () => {
    const editor = document.createElement('mth-flow-editor') as MthFlowEditor;
    editor.nodes = SAMPLE_NODES;
    editor.edges = SAMPLE_EDGES;
    document.body.appendChild(editor);
    await editor.updateComplete;

    const selected: string[] = [];
    editor.addEventListener('mth-node-select', (ev) => {
      selected.push((ev as CustomEvent<{ nodeId: string }>).detail.nodeId);
    });

    const nodeBtns = editor.shadowRoot!.querySelectorAll<HTMLButtonElement>('.flow-node');
    nodeBtns[0]!.click();
    await editor.updateComplete;

    expect(selected).toEqual(['trigger']);
    expect(nodeBtns[0]!.getAttribute('aria-pressed')).toBe('true');
    const edge1 = editor.shadowRoot!.querySelector('[data-edge-id="e1"]')!;
    const edge2 = editor.shadowRoot!.querySelector('[data-edge-id="e2"]')!;
    expect(edge1.getAttribute('data-highlighted')).toBe('true');
    expect(edge2.getAttribute('data-highlighted')).toBe('false');
  });

  it('handles toolbar zoom/reset/auto-layout buttons and keyboard viewport shortcuts', async () => {
    const editor = document.createElement('mth-flow-editor') as MthFlowEditor;
    editor.nodes = SAMPLE_NODES;
    editor.edges = SAMPLE_EDGES;
    document.body.appendChild(editor);
    await editor.updateComplete;

    const viewportEvents: unknown[] = [];
    const layoutEvents: unknown[] = [];
    editor.addEventListener('mth-viewport-change', (ev) => viewportEvents.push((ev as CustomEvent).detail));
    editor.addEventListener('mth-layout-complete', (ev) => layoutEvents.push((ev as CustomEvent).detail));

    const tools = editor.shadowRoot!.querySelectorAll<HTMLButtonElement>('.tool-btn');
    tools[0]!.click(); // zoom in +0.1
    expect(editor.zoom).toBe(1.1);
    tools[1]!.click(); // zoom out -0.1
    expect(editor.zoom).toBe(1);

    const region = editor.shadowRoot!.querySelector<HTMLElement>('[part="base"]')!;
    region.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }));
    expect(editor.zoom).toBe(1.1);
    region.dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }));
    expect(editor.zoom).toBe(1);

    tools[3]!.click(); // auto-layout
    expect(layoutEvents).toEqual([{ nodeCount: 3, edgeCount: 2 }]);
    expect(viewportEvents.length).toBe(4);
  });

  it('sets :state(empty) and renders fallback slot when nodes array is empty', async () => {
    const editor = document.createElement('mth-flow-editor') as MthFlowEditor;
    editor.nodes = [];
    document.body.appendChild(editor);
    await editor.updateComplete;

    expect(editor.hasCustomState('empty')).toBe(true);
    expect(editor.shadowRoot!.querySelector('.empty')).not.toBeNull();
  });
});
