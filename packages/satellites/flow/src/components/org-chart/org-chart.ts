import { Graph, layout, type NodeLabel } from '@dagrejs/dagre';
import {
  html,
  nothing,
  property,
  registerLocaleMessages,
  state,
  svg,
  UIElement,
  type PropertyValues,
} from '@methane-ui/core';
import { RovingFocusController } from '@methane-ui/primitives';
import {
  collectHostThemeTokens,
  createAdoptedSheet,
  escapeCssAttrValue,
  readHostToken,
  removeAdoptedSheet,
  type ThemeTokenEngine,
} from '../../shared/satellite-helpers.js';
import { orgChartMessages } from './org-chart.messages.js';
import { orgChartStyles } from './org-chart.styles.js';

registerLocaleMessages('en', 'mth-org-chart', orgChartMessages);

export interface OrgChartNode {
  readonly id: string;
  readonly name: string;
  readonly title?: string;
  readonly department?: string;
  readonly parentId?: string | null;
  readonly children?: ReadonlyArray<OrgChartNode>;
}

export interface PositionedOrgCard {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly department: string;
  readonly parentId: string | null;
  readonly hasChildren: boolean;
  readonly collapsed: boolean;
  readonly matched: boolean;
  readonly x: number;
  readonly y: number;
}

export interface OrgConnector {
  readonly id: string;
  readonly pathData: string;
}

export type OrgChartDirection = 'TB' | 'LR' | 'RL' | 'auto';

export interface OrgChartEngine extends ThemeTokenEngine {
  readonly graph: Graph;
  readonly collapsedIds: ReadonlySet<string>;
  getVisibleCards(): ReadonlyArray<PositionedOrgCard>;
  getConnectors(): ReadonlyArray<OrgConnector>;
  toggleCollapse(id: string): boolean;
  setQuery(q: string): ReadonlyArray<PositionedOrgCard>;
}

const CARD_W = 176;
const CARD_H = 72;

interface NormalizedNode {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly department: string;
  readonly parentId: string | null;
}

function normalizeHierarchy(nodes: ReadonlyArray<OrgChartNode>): NormalizedNode[] {
  const result: NormalizedNode[] = [];
  const seen = new Set<string>();
  const visit = (node: OrgChartNode, fallbackParent: string | null): void => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    const parentId = node.parentId !== undefined ? (node.parentId ?? null) : fallbackParent;
    result.push({
      id: node.id,
      name: node.name,
      title: node.title ?? '',
      department: node.department ?? '',
      parentId,
    });
    for (const child of node.children ?? []) {
      visit(child, node.id);
    }
  };
  for (const n of nodes) {
    visit(n, null);
  }
  return result;
}

class DefaultOrgChartEngine implements OrgChartEngine {
  private readonly themeTokens = new Map<string, string>();
  private _graph: Graph = new Graph();
  private _collapsed = new Set<string>();
  private normalized: NormalizedNode[] = [];
  private visibleCards: PositionedOrgCard[] = [];
  private connectors: OrgConnector[] = [];
  private queryText = '';
  private rankDir: 'TB' | 'LR' | 'RL' = 'TB';
  private disposed = false;

  constructor(private readonly readToken: (name: string) => string) {}

  get graph(): Graph {
    return this._graph;
  }

  get collapsedIds(): ReadonlySet<string> {
    return this._collapsed;
  }

  setCollapsedIds(ids: ReadonlyArray<string>): void {
    if (this.disposed) return;
    this._collapsed = new Set(ids);
  }

  setQuery(q: string): ReadonlyArray<PositionedOrgCard> {
    if (this.disposed) return [];
    this.queryText = q.trim().toLowerCase();
    this.computeLayout(this.normalized, this.rankDir);
    return this.visibleCards;
  }

  toggleCollapse(id: string): boolean {
    if (this.disposed) return false;
    const nextCollapsed = !this._collapsed.has(id);
    if (nextCollapsed) {
      this._collapsed.add(id);
    } else {
      this._collapsed.delete(id);
    }
    this.computeLayout(this.normalized, this.rankDir);
    return nextCollapsed;
  }

  computeFromInput(
    nodes: ReadonlyArray<OrgChartNode>,
    rankDir: 'TB' | 'LR' | 'RL',
    query: string,
  ): void {
    if (this.disposed) return;
    this.normalized = normalizeHierarchy(nodes);
    this.rankDir = rankDir;
    this.queryText = query.trim().toLowerCase();
    this.computeLayout(this.normalized, rankDir);
  }

  getVisibleCards(): ReadonlyArray<PositionedOrgCard> {
    return this.visibleCards;
  }

  getConnectors(): ReadonlyArray<OrgConnector> {
    return this.connectors;
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
    this._collapsed.clear();
    this.normalized = [];
    this.visibleCards = [];
    this.connectors = [];
    this.themeTokens.clear();
  }

  private computeLayout(all: NormalizedNode[], rankDir: 'TB' | 'LR' | 'RL'): void {
    const childCounts = new Map<string, number>();
    const nodeById = new Map<string, NormalizedNode>();
    for (const n of all) {
      nodeById.set(n.id, n);
      if (n.parentId) {
        childCounts.set(n.parentId, (childCounts.get(n.parentId) ?? 0) + 1);
      }
    }

    const isHidden = (node: NormalizedNode): boolean => {
      let cur = node.parentId;
      const visited = new Set<string>([node.id]);
      while (cur && !visited.has(cur)) {
        visited.add(cur);
        if (this._collapsed.has(cur)) return true;
        cur = nodeById.get(cur)?.parentId ?? null;
      }
      return false;
    };

    const visible = all.filter((n) => !isHidden(n));
    const visibleIds = new Set(visible.map((n) => n.id));

    const g = new Graph();
    g.setGraph({ rankdir: rankDir, nodesep: 28, ranksep: 48, marginx: 16, marginy: 16 });
    g.setDefaultEdgeLabel(() => ({}));

    for (const n of visible) {
      g.setNode(n.id, { label: n.name, width: CARD_W, height: CARD_H });
    }
    for (const n of visible) {
      if (n.parentId && visibleIds.has(n.parentId)) {
        g.setEdge(n.parentId, n.id);
      }
    }

    if (visible.length > 0) {
      layout(g);
    }
    this._graph = g;

    const cardMap = new Map<string, PositionedOrgCard>();
    this.visibleCards = visible.map((n, idx) => {
      const gNode = g.node(n.id) as NodeLabel | undefined;
      const x = gNode && Number.isFinite(gNode.x) ? Math.max(0, Math.round(gNode.x - CARD_W / 2)) : idx * 200;
      const y = gNode && Number.isFinite(gNode.y) ? Math.max(0, Math.round(gNode.y - CARD_H / 2)) : 16;
      const hay = `${n.name} ${n.title} ${n.department}`.toLowerCase();
      const matched = this.queryText.length > 0 && hay.includes(this.queryText);
      const card: PositionedOrgCard = {
        id: n.id,
        name: n.name,
        title: n.title,
        department: n.department,
        parentId: n.parentId,
        hasChildren: (childCounts.get(n.id) ?? 0) > 0,
        collapsed: this._collapsed.has(n.id),
        matched,
        x,
        y,
      };
      cardMap.set(card.id, card);
      return card;
    });

    this.connectors = visible
      .filter((n) => n.parentId && cardMap.has(n.parentId) && cardMap.has(n.id))
      .map((n) => {
        const p = cardMap.get(n.parentId!)!;
        const c = cardMap.get(n.id)!;
        const sx = rankDir === 'LR' ? p.x + CARD_W : rankDir === 'RL' ? p.x : p.x + CARD_W / 2;
        const sy = rankDir === 'TB' ? p.y + CARD_H : p.y + CARD_H / 2;
        const tx = rankDir === 'LR' ? c.x : rankDir === 'RL' ? c.x + CARD_W : c.x + CARD_W / 2;
        const ty = rankDir === 'TB' ? c.y : c.y + CARD_H / 2;
        const midY = (sy + ty) / 2;
        const pathData =
          rankDir === 'TB'
            ? `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`
            : `M ${sx} ${sy} L ${tx} ${ty}`;
        return { id: `${p.id}->${c.id}`, pathData };
      });
  }
}

let orgSearchCounter = 0;

export class MthOrgChart extends UIElement {
  static override messages = orgChartMessages;
  static override styles = [orgChartStyles];
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  @property({ attribute: false })
  nodes: ReadonlyArray<OrgChartNode> = [];

  @property({ type: String })
  direction: OrgChartDirection = 'TB';

  @property({ type: String })
  query = '';

  @property({ type: String, attribute: 'selected-id' })
  selectedId = '';

  @property({ attribute: false })
  collapsedIds: ReadonlyArray<string> = [];

  @property({ type: String })
  label = '';

  @state()
  private layoutTick = 0;

  private _engine: DefaultOrgChartEngine | null = null;
  private readonly rovingCtrl: RovingFocusController;
  private chartSheet: CSSStyleSheet | null = null;
  private lastResolvedDir: 'ltr' | 'rtl' = 'ltr';
  private readonly searchId = `mth-org-search-${++orgSearchCounter}`;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () => this.getFocusableCards(),
    });
  }

  get engine(): OrgChartEngine | null {
    return this._engine;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = new DefaultOrgChartEngine((name) => readHostToken(this, name));
    }
    this.lastResolvedDir = this.resolvedDir;
    this._engine.syncThemeTokens(collectHostThemeTokens(this));
    this._engine.setCollapsedIds(this.collapsedIds);
    this._engine.computeFromInput(this.nodes, this.resolveDirection(), this.query);
    this.setCustomState('empty', this.nodes.length === 0);
    if (this.hasUpdated) {
      this.requestUpdate();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._engine) {
      this._engine.dispose();
      this._engine = null;
    }
    removeAdoptedSheet(this, this.chartSheet);
    this.chartSheet = null;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    const currentDir = this.resolvedDir;
    const dirChanged = currentDir !== this.lastResolvedDir;
    this.lastResolvedDir = currentDir;
    this.rovingCtrl.updateOptions({
      dir: this.closest('[dir]') ? 'auto' : currentDir,
    });
    if (changedProperties.has('nodes')) {
      this.setCustomState('empty', this.nodes.length === 0);
    }
    if (this._engine) {
      this._engine.syncThemeTokens(collectHostThemeTokens(this));
      if (changedProperties.has('collapsedIds')) {
        this._engine.setCollapsedIds(this.collapsedIds);
      }
      if (
        changedProperties.has('nodes') ||
        changedProperties.has('direction') ||
        changedProperties.has('query') ||
        changedProperties.has('collapsedIds') ||
        (this.direction === 'auto' && dirChanged)
      ) {
        this._engine.computeFromInput(this.nodes, this.resolveDirection(), this.query);
      }
    }
  }

  protected override updated(): void {
    this.syncChartSheet();
    this.rovingCtrl.syncTabIndices();
  }

  getFocusableCards(): HTMLElement[] {
    return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-roving-card="true"]') ?? []);
  }

  selectNode(nodeId: string): void {
    if (this.selectedId === nodeId) return;
    this.selectedId = nodeId;
    this.emitEvent('mth-node-select', { detail: { nodeId } });
  }

  toggleNode(nodeId: string): void {
    if (!this._engine) return;
    const collapsed = this._engine.toggleCollapse(nodeId);
    this.collapsedIds = Array.from(this._engine.collapsedIds);
    this.layoutTick += 1;
    this.emitEvent('mth-node-toggle', { detail: { nodeId, collapsed } });
  }

  private resolveDirection(): 'TB' | 'LR' | 'RL' {
    if (this.direction === 'auto') {
      return this.resolvedDir === 'rtl' ? 'RL' : 'LR';
    }
    return this.direction;
  }

  private handleSearchInput(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.query = input.value;
    this._engine?.setQuery(this.query);
  }

  private syncChartSheet(): void {
    if (!this.shadowRoot) return;
    if (!this.chartSheet) {
      this.chartSheet = createAdoptedSheet(this);
    }
    if (!this.chartSheet) return;
    const cards = this._engine?.getVisibleCards() ?? [];
    let maxX = 480;
    let maxY = 260;
    const rules: string[] = [];
    for (const card of cards) {
      const safeId = escapeCssAttrValue(card.id);
      const cx = Number.isFinite(card.x) ? card.x : 0;
      const cy = Number.isFinite(card.y) ? card.y : 0;
      maxX = Math.max(maxX, cx + CARD_W + 24);
      maxY = Math.max(maxY, cy + CARD_H + 24);
      rules.push(`[data-node-id="${safeId}"] { --_card-x: ${cx}px; --_card-y: ${cy}px; }`);
    }
    rules.unshift(`:host { --_chart-w: ${maxX}px; --_chart-h: ${maxY}px; }`);
    this.chartSheet.replaceSync(rules.join('\n'));
  }

  private readonly handleSearchKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      event.stopPropagation();
    }
  };

  override render() {
    void this.layoutTick;
    const regionLabel = this.label || this.t('regionLabel');
    const cards = this._engine?.getVisibleCards() ?? [];
    const connectors = this._engine?.getConnectors() ?? [];

    return html`
      <div part="base" class="base" role="region" aria-label=${regionLabel}>
        <div class="search-bar">
          <label class="search-label" for=${this.searchId}>${this.t('searchLabel')}</label>
          <input
            id=${this.searchId}
            part="search"
            class="search-input"
            type="search"
            .value=${this.query}
            placeholder=${this.t('searchPlaceholder')}
            @input=${this.handleSearchInput}
            @keydown=${this.handleSearchKeyDown}
          />
        </div>

        ${cards.length === 0
          ? html`
              <div class="empty">
                <slot name="fallback">${this.t('emptyText')}</slot>
              </div>
            `
          : html`
              <div part="canvas" class="canvas">
                <svg class="edges-svg" aria-hidden="true">
                  ${connectors.map((c) => svg`<path class="connector" d=${c.pathData}></path>`)}
                </svg>
                ${cards.map((card) => {
                  const toggleText = card.collapsed
                    ? this.t('expandLabel', { name: card.name })
                    : this.t('collapseLabel', { name: card.name });
                  return html`
                    <article
                      part="card"
                      class="card"
                      dir=${this.resolvedDir}
                      data-node-id=${card.id}
                      data-selected=${this.selectedId === card.id ? 'true' : 'false'}
                      data-match=${card.matched ? 'true' : 'false'}
                    >
                      <div class="card-top">
                        <button
                          type="button"
                          class="card-btn"
                          data-roving-card="true"
                          aria-label=${this.t('selectNodeLabel', { name: card.name })}
                          aria-pressed=${this.selectedId === card.id ? 'true' : 'false'}
                          @click=${() => this.selectNode(card.id)}
                        >
                          ${card.name}
                        </button>
                        ${card.hasChildren
                          ? html`
                              <button
                                type="button"
                                class="toggle-btn"
                                aria-expanded=${card.collapsed ? 'false' : 'true'}
                                aria-label=${toggleText}
                                @click=${() => this.toggleNode(card.id)}
                              >
                                ${card.collapsed ? '+' : '−'}
                              </button>
                            `
                          : nothing}
                      </div>
                      ${card.title ? html`<div class="card-meta">${card.title}</div>` : nothing}
                      ${card.department ? html`<div class="card-meta">${card.department}</div>` : nothing}
                    </article>
                  `;
                })}
              </div>
              <slot name="fallback"></slot>
            `}
      </div>
    `;
  }
}
