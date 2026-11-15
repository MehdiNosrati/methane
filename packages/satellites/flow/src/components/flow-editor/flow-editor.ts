import { Graph, layout, type NodeLabel } from '@dagrejs/dagre';
import {
  html,
  nothing,
  property,
  registerLocaleMessages,
  svg,
  UIElement,
  type PropertyValues,
} from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import {
  collectHostThemeTokens,
  createAdoptedSheet,
  escapeCssAttrValue,
  readHostToken,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { flowEditorMessages } from './flow-editor.messages.js';
import { flowEditorStyles } from './flow-editor.styles.js';

registerLocaleMessages('en', 'mth-flow-editor', flowEditorMessages);

export interface FlowNode {
  readonly id: string;
  readonly label: string;
  readonly type?: string;
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly disabled?: boolean;
}

export interface FlowEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
}

export interface PositionedFlowNode extends FlowNode {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RoutedFlowEdge extends FlowEdge {
  readonly pathData: string;
}

export type FlowDirection = 'TB' | 'LR' | 'RL' | 'BT' | 'auto';
export type FlowEdgeStyle = 'bezier' | 'orthogonal';

export interface FlowEditorEngine extends ThemeTokenEngine {
  readonly graph: Graph;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  runLayout(rankDir: 'TB' | 'LR' | 'RL' | 'BT', edgeStyle: FlowEdgeStyle): void;
  setViewport(zoom: number, panX: number, panY: number): void;
  panBy(dx: number, dy: number): void;
  getPositionedNodes(): ReadonlyArray<PositionedFlowNode>;
  getRoutedEdges(): ReadonlyArray<RoutedFlowEdge>;
}

const DEFAULT_NODE_W = 144;
const DEFAULT_NODE_H = 48;

function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1;
  return Math.min(3, Math.max(0.25, Math.round(z * 100) / 100));
}

function buildEdgePath(
  src: PositionedFlowNode,
  dst: PositionedFlowNode,
  rankDir: 'TB' | 'LR' | 'RL' | 'BT',
  style: FlowEdgeStyle,
): string {
  const sx =
    rankDir === 'LR'
      ? src.x + src.width
      : rankDir === 'RL'
        ? src.x
        : src.x + src.width / 2;
  const sy =
    rankDir === 'TB'
      ? src.y + src.height
      : rankDir === 'BT'
        ? src.y
        : src.y + src.height / 2;
  const tx =
    rankDir === 'LR'
      ? dst.x
      : rankDir === 'RL'
        ? dst.x + dst.width
        : dst.x + dst.width / 2;
  const ty =
    rankDir === 'TB'
      ? dst.y
      : rankDir === 'BT'
        ? dst.y + dst.height
        : dst.y + dst.height / 2;

  if (style === 'orthogonal') {
    if (rankDir === 'TB' || rankDir === 'BT') {
      const midY = Math.round(((sy + ty) / 2) * 10) / 10;
      return `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
    }
    const midX = Math.round(((sx + tx) / 2) * 10) / 10;
    return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  }

  if (rankDir === 'TB' || rankDir === 'BT') {
    const midY = (sy + ty) / 2;
    return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
  }
  const midX = (sx + tx) / 2;
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
}

class DefaultFlowEditorEngine implements FlowEditorEngine {
  private readonly themeTokens = new Map<string, string>();
  private _graph: Graph = new Graph({ multigraph: true });
  private rawNodes: ReadonlyArray<FlowNode> = [];
  private rawEdges: ReadonlyArray<FlowEdge> = [];
  private positionedNodes: PositionedFlowNode[] = [];
  private routedEdges: RoutedFlowEdge[] = [];
  private _zoom = 1;
  private _panX = 0;
  private _panY = 0;
  private disposed = false;

  constructor(private readonly readToken: (name: string) => string) {}

  get graph(): Graph {
    return this._graph;
  }

  get zoom(): number {
    return this._zoom;
  }

  get panX(): number {
    return this._panX;
  }

  get panY(): number {
    return this._panY;
  }

  setData(nodes: ReadonlyArray<FlowNode>, edges: ReadonlyArray<FlowEdge>): void {
    if (this.disposed) return;
    this.rawNodes = nodes;
    this.rawEdges = edges;
  }

  runLayout(rankDir: 'TB' | 'LR' | 'RL' | 'BT', edgeStyle: FlowEdgeStyle, autoLayout = true): void {
    if (this.disposed) return;
    const g = new Graph({ multigraph: true });
    g.setGraph({ rankdir: rankDir, nodesep: 32, ranksep: 56, marginx: 16, marginy: 16 });
    g.setDefaultEdgeLabel(() => ({}));

    for (const node of this.rawNodes) {
      const w = typeof node.width === 'number' && Number.isFinite(node.width) && node.width > 0 ? node.width : DEFAULT_NODE_W;
      const h = typeof node.height === 'number' && Number.isFinite(node.height) && node.height > 0 ? node.height : DEFAULT_NODE_H;
      g.setNode(node.id, { label: node.label, width: w, height: h });
    }

    const nodeIds = new Set(this.rawNodes.map((n) => n.id));
    for (const edge of this.rawEdges) {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        g.setEdge(edge.source, edge.target, {}, edge.id);
      }
    }

    if (autoLayout && this.rawNodes.length > 0) {
      layout(g);
    }

    this._graph = g;
    const nodeMap = new Map<string, PositionedFlowNode>();
    this.positionedNodes = this.rawNodes.map((n, idx) => {
      const w = typeof n.width === 'number' && Number.isFinite(n.width) && n.width > 0 ? n.width : DEFAULT_NODE_W;
      const h = typeof n.height === 'number' && Number.isFinite(n.height) && n.height > 0 ? n.height : DEFAULT_NODE_H;
      const gNode = g.node(n.id) as NodeLabel | undefined;
      const cx = gNode && Number.isFinite(gNode.x) ? gNode.x - w / 2 : (n.x ?? idx * 180);
      const cy = gNode && Number.isFinite(gNode.y) ? gNode.y - h / 2 : (n.y ?? 20);
      const pos: PositionedFlowNode = {
        ...n,
        x: autoLayout ? Math.max(0, Math.round(cx)) : (n.x ?? Math.max(0, Math.round(cx))),
        y: autoLayout ? Math.max(0, Math.round(cy)) : (n.y ?? Math.max(0, Math.round(cy))),
        width: w,
        height: h,
      };
      nodeMap.set(pos.id, pos);
      return pos;
    });

    this.routedEdges = this.rawEdges
      .map((edge) => {
        const src = nodeMap.get(edge.source);
        const dst = nodeMap.get(edge.target);
        if (!src || !dst) return null;
        return {
          ...edge,
          pathData: buildEdgePath(src, dst, rankDir, edgeStyle),
        };
      })
      .filter((e): e is RoutedFlowEdge => e !== null);
  }

  setViewport(zoom: number, panX: number, panY: number): void {
    if (this.disposed) return;
    this._zoom = clampZoom(zoom);
    this._panX = Number.isFinite(panX) ? panX : 0;
    this._panY = Number.isFinite(panY) ? panY : 0;
  }

  panBy(dx: number, dy: number): void {
    if (this.disposed) return;
    this._panX += Number.isFinite(dx) ? dx : 0;
    this._panY += Number.isFinite(dy) ? dy : 0;
  }

  getPositionedNodes(): ReadonlyArray<PositionedFlowNode> {
    return this.positionedNodes;
  }

  getRoutedEdges(): ReadonlyArray<RoutedFlowEdge> {
    return this.routedEdges;
  }

  syncThemeTokens(tokens: Record<string, string>): void {
    if (this.disposed) return;
    for (const [k, v] of Object.entries(tokens)) {
      this.themeTokens.set(k, v);
    }
  }

  getThemeToken(name: string): string {
    const live = this.disposed ? '' : this.readToken(name);
    if (live) {
      this.themeTokens.set(name, live);
      return live;
    }
    return this.themeTokens.get(name) ?? '';
  }

  dispose(): void {
    this.disposed = true;
    this._graph = new Graph();
    this.rawNodes = [];
    this.rawEdges = [];
    this.positionedNodes = [];
    this.routedEdges = [];
    this.themeTokens.clear();
  }
}

export class MthFlowEditor extends UIElement {
  static override messages = flowEditorMessages;
  static override styles = [flowEditorStyles];
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  @property({ attribute: false })
  nodes: ReadonlyArray<FlowNode> = [];

  @property({ attribute: false })
  edges: ReadonlyArray<FlowEdge> = [];

  @property({ type: String })
  direction: FlowDirection = 'auto';

  @property({ type: String, attribute: 'edge-style' })
  edgeStyle: FlowEdgeStyle = 'bezier';

  @property({ type: Number })
  zoom = 1;

  @property({ type: Number, attribute: 'pan-x' })
  panX = 0;

  @property({ type: Number, attribute: 'pan-y' })
  panY = 0;

  @property({ type: String, attribute: 'selected-id' })
  selectedId = '';

  @property({ type: Boolean, attribute: 'auto-layout' })
  autoLayout = true;

  @property({ type: String })
  label = '';

  private _engine: DefaultFlowEditorEngine | null = null;
  private readonly rovingCtrl: RovingFocusController;
  private layoutSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () => this.getFocusableNodes(),
    });
  }

  get engine(): FlowEditorEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = new DefaultFlowEditorEngine((name) => readHostToken(this, name));
    }
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this.recomputeGraph(false);
    this.setCustomState('empty', this.nodes.length === 0);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._engine) {
      this._engine.dispose();
      this._engine = null;
    }
    this.layoutSheet = null;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('nodes')) {
      this.setCustomState('empty', this.nodes.length === 0);
    }
    if (this._engine) {
      this._engine.syncThemeTokens(collectHostThemeTokens(this));
      this._engine.setViewport(this.zoom, this.panX, this.panY);
      if (
        changedProperties.has('nodes') ||
        changedProperties.has('edges') ||
        changedProperties.has('direction') ||
        changedProperties.has('edgeStyle') ||
        changedProperties.has('autoLayout')
      ) {
        this.recomputeGraph(false);
      }
    }
  }

  protected override updated(): void {
    this.syncLayoutSheet();
    this.rovingCtrl.syncTabIndices();
  }

  getFocusableNodes(): HTMLElement[] {
    return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-roving-node="true"]') ?? []);
  }

  runAutoLayout(): void {
    this.recomputeGraph(true);
    this.requestUpdate();
  }

  zoomBy(delta: number): void {
    const nextZoom = clampZoom(this.zoom + delta);
    this.zoom = nextZoom;
    this._engine?.setViewport(nextZoom, this.panX, this.panY);
    this.emitViewport();
  }

  resetViewport(): void {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this._engine?.setViewport(1, 0, 0);
    this.emitViewport();
  }

  selectNode(nodeId: string): void {
    if (this.selectedId === nodeId) return;
    this.selectedId = nodeId;
    this.emitEvent('mth-node-select', { detail: { nodeId } });
  }

  private resolveRankDirection(): 'TB' | 'LR' | 'RL' | 'BT' {
    if (this.direction === 'auto') {
      return this.resolvedDir === 'rtl' ? 'RL' : 'LR';
    }
    return this.direction;
  }

  private recomputeGraph(emitCompletion: boolean): void {
    if (!this._engine) return;
    this._engine.setData(this.nodes, this.edges);
    this._engine.setViewport(this.zoom, this.panX, this.panY);
    this._engine.runLayout(this.resolveRankDirection(), this.edgeStyle, this.autoLayout);
    if (emitCompletion) {
      this.emitEvent('mth-layout-complete', {
        detail: { nodeCount: this.nodes.length, edgeCount: this.edges.length },
      });
    }
  }

  private emitViewport(): void {
    this.emitEvent('mth-viewport-change', {
      detail: { zoom: this.zoom, panX: this.panX, panY: this.panY },
    });
  }

  private syncLayoutSheet(): void {
    if (!this.shadowRoot) return;
    if (!this.layoutSheet) {
      this.layoutSheet = createAdoptedSheet(this);
    }
    if (!this.layoutSheet) return;
    const zoom = clampZoom(this.zoom);
    const px = Number.isFinite(this.panX) ? this.panX : 0;
    const py = Number.isFinite(this.panY) ? this.panY : 0;
    const rules = [`:host { --_pan-x: ${px}px; --_pan-y: ${py}px; --_zoom: ${zoom}; }`];
    for (const node of this._engine?.getPositionedNodes() ?? []) {
      const safeId = escapeCssAttrValue(node.id);
      const nx = Number.isFinite(node.x) ? node.x : 0;
      const ny = Number.isFinite(node.y) ? node.y : 0;
      const nw = Number.isFinite(node.width) && node.width > 0 ? node.width : DEFAULT_NODE_W;
      const nh = Number.isFinite(node.height) && node.height > 0 ? node.height : DEFAULT_NODE_H;
      rules.push(
        `[data-node-id="${safeId}"] { --_node-x: ${nx}px; --_node-y: ${ny}px; --_node-w: ${nw}px; --_node-h: ${nh}px; }`,
      );
    }
    this.layoutSheet.replaceSync(rules.join('\n'));
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.zoomBy(0.1);
    } else if (event.key === '-') {
      event.preventDefault();
      this.zoomBy(-0.1);
    } else if (event.key === '0') {
      event.preventDefault();
      this.resetViewport();
    }
  };

  override render() {
    const regionLabel = this.label || this.t('regionLabel');
    const positioned = this._engine?.getPositionedNodes() ?? [];
    const routedEdges = this._engine?.getRoutedEdges() ?? [];

    return html`
      <div part="base" class="base" role="region" aria-label=${regionLabel} @keydown=${this.handleKeyDown}>
        <div part="toolbar" class="toolbar">
          <button type="button" class="tool-btn" @click=${() => this.zoomBy(0.1)}>
            ${this.t('zoomInLabel')}
          </button>
          <button type="button" class="tool-btn" @click=${() => this.zoomBy(-0.1)}>
            ${this.t('zoomOutLabel')}
          </button>
          <button type="button" class="tool-btn" @click=${() => this.resetViewport()}>
            ${this.t('resetViewLabel')}
          </button>
          <button type="button" class="tool-btn" @click=${() => this.runAutoLayout()}>
            ${this.t('autoLayoutLabel')}
          </button>
        </div>

        ${positioned.length === 0
          ? html`
              <div class="empty">
                <slot name="fallback">${this.t('emptyText')}</slot>
              </div>
            `
          : html`
              <div part="canvas" class="canvas">
                <div class="plane">
                  <svg part="edges" class="edges-svg" aria-hidden="true">
                    ${routedEdges.map((edge) => {
                      const highlighted =
                        this.selectedId !== '' &&
                        (edge.source === this.selectedId || edge.target === this.selectedId);
                      return svg`<path class="edge-path" data-edge-id=${edge.id} data-highlighted=${highlighted ? 'true' : 'false'} d=${edge.pathData}></path>`;
                    })}
                  </svg>
                  ${positioned.map((node) => {
                    const isSelected = this.selectedId === node.id;
                    return html`
                      <button
                        type="button"
                        part="node"
                        class="flow-node"
                        data-node-id=${node.id}
                        data-roving-node="true"
                        aria-pressed=${isSelected ? 'true' : 'false'}
                        aria-label=${this.t('nodeRoleDescription', { label: node.label })}
                        ?disabled=${Boolean(node.disabled)}
                        @click=${() => this.selectNode(node.id)}
                      >
                        <span class="port" aria-hidden="true"></span>
                        <span>${node.label}</span>
                        <span class="port" aria-hidden="true"></span>
                      </button>
                    `;
                  })}
                </div>
              </div>
              <slot name="fallback"></slot>
            `}
        ${positioned.length === 0 ? nothing : nothing}
      </div>
    `;
  }
}
