import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
  VirtualizerController,
  type DataControllerStatus,
  type DataSource,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { treeMessages } from './tree.messages.js';
import { treeStyles } from './tree.styles.js';

export type MthTreeSelectionMode = 'none' | 'single' | 'multiple';

export interface TreeNodeData {
  readonly id?: string;
  readonly value?: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly children?: ReadonlyArray<TreeNodeData>;
}

interface FlatTreeNode {
  readonly id: string;
  readonly label: string;
  readonly depth: number;
  readonly level: number;
  readonly setsize: number;
  readonly posinset: number;
  readonly hasChildren: boolean;
  readonly expanded: boolean;
  readonly disabled: boolean;
  readonly parentId: string | null;
  readonly siblingExpandableIds: ReadonlyArray<string>;
}

type TreeItemLikeElement = HTMLElement & {
  value?: string;
  label?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  lazy?: boolean;
  getDisplayLabel?: () => string;
  getChildItems?: () => TreeItemLikeElement[];
  isExpandable?: () => boolean;
};

function isTreeItemElement(el: Element): el is TreeItemLikeElement {
  return el instanceof HTMLElement && el.localName.endsWith('tree-item');
}

function getTreeItemValue(el: TreeItemLikeElement, fallback: string): string {
  const val = el.value || el.getAttribute('value') || el.id;
  return val && val.length > 0 ? val : fallback;
}

function isTreeItemDisabled(el: HTMLElement): boolean {
  return (
    el.hasAttribute('disabled') ||
    el.getAttribute('aria-disabled') === 'true' ||
    (el as TreeItemLikeElement).disabled === true
  );
}

function getTreeItemLabel(el: TreeItemLikeElement): string {
  if (typeof el.getDisplayLabel === 'function') {
    return el.getDisplayLabel();
  }
  return el.label || el.getAttribute('label') || (el.textContent ?? '').trim();
}

function getChildTreeItems(el: TreeItemLikeElement): TreeItemLikeElement[] {
  if (typeof el.getChildItems === 'function') {
    return el.getChildItems();
  }
  return Array.from(el.children ?? []).filter(isTreeItemElement);
}

/**
 * `<mth-tree>`: WAI-ARIA APG hierarchical treeview (`role="tree"`) with LTR/RTL
 * arrow expand/collapse, typeahead, `SlotCollectionController`, `RovingFocusController`,
 * `SelectionController`, `DataController`, and `VirtualizerController`.
 */
export class MthTree extends UIElement {
  static override messages = treeMessages;
  static override styles = treeStyles;

  @property({ type: String, attribute: 'selection-mode', reflect: true })
  selectionMode: MthTreeSelectionMode = 'single';

  @property({ type: String, reflect: true })
  value = '';

  @property({ attribute: false })
  values: ReadonlyArray<string> = [];

  @property({ attribute: false })
  items: ReadonlyArray<TreeNodeData> | null = null;

  @property({ attribute: false })
  dataSource: DataSource<TreeNodeData, string> | null = null;

  @property({ attribute: false })
  expandedValues: ReadonlyArray<string> = [];

  @property({ type: Boolean, reflect: true })
  virtualized = false;

  @property({ type: Number, attribute: 'item-height' })
  itemHeight = 32;

  @property({ type: String })
  label = '';

  @query('[part="viewport"]')
  private viewportEl!: HTMLElement | null;

  private readonly slotCtrl: SlotCollectionController<TreeItemLikeElement>;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;
  private readonly dataCtrl: DataController<TreeNodeData, string>;
  private readonly virtualizer: VirtualizerController;

  private expandedSet = new Set<string>();
  private suppressingSync = false;
  private filterText = '';
  private virtualSheet: CSSStyleSheet | null = null;

  constructor() {
    super();

    this.slotCtrl = new SlotCollectionController<TreeItemLikeElement>(this, {
      filter: isTreeItemElement,
      observeSubtree: true,
      attributeFilter: ['value', 'label', 'disabled', 'lazy'],
      onItemsChange: () => {
        this.syncSelectionItems();
      },
    });

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
      onChange: (selected) => {
        if (this.suppressingSync) return;
        this.suppressingSync = true;
        this.values = [...selected];
        this.value = selected[0] ?? '';
        this.suppressingSync = false;
        this.syncSlottedSelection();
        this.emitEvent('mth-change', {
          detail: { value: this.value, values: this.values },
        });
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () => this.getVisibleItems(),
    });

    this.dataCtrl = new DataController<TreeNodeData, string>(this, {
      autoLoad: false,
      onStateChange: (status) => {
        this.syncStatusStates(status);
        this.syncSelectionItems();
        this.emitEvent('mth-data-state', {
          detail: { status, count: this.dataCtrl.items.length },
        });
      },
    });

    this.virtualizer = new VirtualizerController(this, {
      count: 0,
      estimateSize: () => this.resolveItemHeight(),
      overscan: 4,
      getScrollElement: () => this.viewportEl,
    });
  }

  private resolveItemHeight(): number {
    return typeof this.itemHeight === 'number' && Number.isFinite(this.itemHeight) && this.itemHeight > 0
      ? this.itemHeight
      : 32;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('virtualized', this.virtualized);
    this.syncStatusStates(this.dataCtrl.status);
    this.syncSelectionItems();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('virtualized')) {
      this.setCustomState('virtualized', this.virtualized);
    }
    if (changedProperties.has('selectionMode')) {
      this.selectionCtrl.mode = this.selectionMode === 'multiple' ? 'multiple' : 'single';
    }
    if (changedProperties.has('dataSource')) {
      this.dataCtrl.setDataSource(this.dataSource, { load: false });
      this.syncSelectionItems();
    }
    if (changedProperties.has('items')) {
      this.syncSelectionItems();
    }
    if (changedProperties.has('expandedValues')) {
      this.expandedSet = new Set(this.expandedValues);
    }
    if (changedProperties.has('values') && !this.suppressingSync) {
      this.suppressingSync = true;
      this.selectionCtrl.setSelection(this.values);
      this.value = this.values[0] ?? '';
      this.suppressingSync = false;
    } else if (changedProperties.has('value') && !this.suppressingSync) {
      this.suppressingSync = true;
      const next = this.value ? [this.value] : [];
      this.selectionCtrl.setSelection(next);
      this.values = next;
      this.suppressingSync = false;
    }
    if (this.isDataDriven()) {
      const flatCount = this.getFlatNodes().length;
      if (changedProperties.has('itemHeight')) {
        this.virtualizer.setCount(0);
      }
      this.virtualizer.setCount(flatCount);
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('value') ||
      changedProperties.has('values') ||
      changedProperties.has('selectionMode')
    ) {
      this.syncSlottedSelection();
    }
    this.syncVirtualSheet();
    this.rovingCtrl.syncTabIndices();
  }

  getDataStatus(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  async query(filter?: string): Promise<void> {
    if (filter !== undefined) {
      this.filterText = filter;
    }
    await this.dataCtrl.setFilter(this.filterText || undefined);
  }

  async refresh(): Promise<void> {
    await this.dataCtrl.refresh();
  }

  getVisibleItems(): HTMLElement[] {
    if (this.isDataDriven()) {
      return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []);
    }
    return this.collectVisibleSlottedItems(this.slotCtrl.slottedElements);
  }

  private isDataDriven(): boolean {
    return this.dataSource !== null || this.items !== null;
  }

  private getDataNodes(): ReadonlyArray<TreeNodeData> {
    return this.dataSource ? this.dataCtrl.items : (this.items ?? []);
  }

  private getFlatNodes(): FlatTreeNode[] {
    const roots = this.getDataNodes();
    const out: FlatTreeNode[] = [];

    const walk = (
      nodes: ReadonlyArray<TreeNodeData>,
      depth: number,
      parentId: string | null,
      prefix: string,
    ): void => {
      const siblingIds = nodes
        .map((n, i) => ({
          id: n.value ?? n.id ?? `${prefix}${i}`,
          hasKids: Boolean(n.children && n.children.length > 0),
        }))
        .filter((x) => x.hasKids)
        .map((x) => x.id);

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i]!;
        const id = node.value ?? node.id ?? `${prefix}${i}`;
        const children = node.children ?? [];
        const hasChildren = children.length > 0;
        const expanded = hasChildren && this.expandedSet.has(id);
        out.push({
          id,
          label: node.label,
          depth,
          level: depth + 1,
          setsize: nodes.length,
          posinset: i + 1,
          hasChildren,
          expanded,
          disabled: Boolean(node.disabled),
          parentId,
          siblingExpandableIds: siblingIds,
        });
        if (expanded) {
          walk(children, depth + 1, id, `${id}/`);
        }
      }
    };

    walk(roots, 0, null, 'node-');
    return out;
  }

  private collectVisibleSlottedItems(roots: ReadonlyArray<TreeItemLikeElement>): TreeItemLikeElement[] {
    const out: TreeItemLikeElement[] = [];
    const walk = (nodes: ReadonlyArray<TreeItemLikeElement>): void => {
      for (const node of nodes) {
        out.push(node);
        if (node.expanded || node.hasAttribute('expanded')) {
          walk(getChildTreeItems(node));
        }
      }
    };
    walk(roots);
    return out;
  }

  private syncStatusStates(status: DataControllerStatus): void {
    this.setCustomState('loading', status === 'loading' || status === 'refreshing');
    this.setCustomState('empty', status === 'empty');
    this.setCustomState('error', status === 'error');
  }

  private syncSelectionItems(): void {
    if (this.isDataDriven()) {
      const all: Array<{ value: string; disabled?: boolean }> = [];
      const walk = (nodes: ReadonlyArray<TreeNodeData>, prefix: string): void => {
        nodes.forEach((node, i) => {
          const id = node.value ?? node.id ?? `${prefix}${i}`;
          all.push({
            value: id,
            ...(node.disabled !== undefined ? { disabled: node.disabled } : {}),
          });
          if (node.children?.length) walk(node.children, `${id}/`);
        });
      };
      walk(this.getDataNodes(), 'node-');
      this.selectionCtrl.setItems(all);
      this.virtualizer.setCount(this.getFlatNodes().length);
      return;
    }

    const allSlotted: Array<{ value: string; disabled: boolean }> = [];
    const walkSlotted = (nodes: ReadonlyArray<TreeItemLikeElement>, prefix: string): void => {
      nodes.forEach((node, i) => {
        const val = getTreeItemValue(node, `${prefix}${i}`);
        allSlotted.push({ value: val, disabled: isTreeItemDisabled(node) });
        const kids = getChildTreeItems(node);
        if (kids.length > 0) walkSlotted(kids, `${val}/`);
      });
    };
    walkSlotted(this.slotCtrl.slottedElements, 'item-');
    this.selectionCtrl.setItems(allSlotted);
    this.syncSlottedSelection();
  }

  private syncSlottedSelection(): void {
    if (this.isDataDriven()) return;
    const isHydrating = Boolean(this.shadowRoot) && !this.hasUpdated;
    if (isHydrating) return;

    const walk = (nodes: ReadonlyArray<TreeItemLikeElement>, prefix: string): void => {
      nodes.forEach((node, i) => {
        const val = getTreeItemValue(node, `${prefix}${i}`);
        const isSel = this.selectionMode !== 'none' && this.selectionCtrl.isSelected(val);
        if (node.selected !== isSel) {
          node.selected = isSel;
        }
        const kids = getChildTreeItems(node);
        if (kids.length > 0) walk(kids, `${val}/`);
      });
    };
    walk(this.slotCtrl.slottedElements, 'item-');
  }

  private syncVirtualSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    const rules: string[] = [];
    if (this.isDataDriven()) {
      const flat = this.getFlatNodes();
      const resolvedHeight = this.resolveItemHeight();
      const totalSize = Number.isFinite(this.virtualizer.totalSize) ? this.virtualizer.totalSize : 0;
      const vItems = this.virtualizer.getVirtualItems();
      const rawOffsetY = vItems[0]?.start ?? 0;
      const offsetY = Number.isFinite(rawOffsetY) ? rawOffsetY : 0;
      if (this.virtualized) {
        rules.push(
          `:host { --_tree-item-height: ${resolvedHeight}px; --_tree-total-height: ${totalSize}px; --_tree-offset-y: ${offsetY}px; }`,
        );
      } else {
        rules.push(`:host { --_tree-item-height: ${resolvedHeight}px; }`);
      }
      for (const node of flat) {
        const safeNodeId = String(node.id)
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/[\r\n]/g, '');
        const safeDepth = Number.isFinite(node.depth) && node.depth >= 0 ? Math.floor(node.depth) : 0;
        rules.push(`[data-node-id="${safeNodeId}"] { --_item-depth: ${safeDepth}; }`);
      }
    }
    if (!this.virtualSheet) {
      this.virtualSheet = new CSSStyleSheet();
    }
    if (typeof this.virtualSheet.replaceSync === 'function') {
      this.virtualSheet.replaceSync(rules.join('\n'));
      if (!root.adoptedStyleSheets.includes(this.virtualSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.virtualSheet];
      }
    }
  }

  private isRtlDirection(): boolean {
    const closestDir = this.closest('[dir]')?.getAttribute('dir');
    if (closestDir === 'rtl') return true;
    if (closestDir === 'ltr') return false;
    return this.resolvedDir === 'rtl';
  }

  private selectNodeValue(val: string, disabled: boolean, shiftKey = false): void {
    if (disabled || this.selectionMode === 'none') return;
    if (this.selectionMode === 'single') {
      this.selectionCtrl.select(val, { toggle: false });
    } else {
      this.selectionCtrl.select(val, { toggle: true, range: shiftKey, additive: true });
    }
  }

  private setNodeExpanded(id: string, expanded: boolean): void {
    const next = new Set(this.expandedSet);
    if (expanded) next.add(id);
    else next.delete(id);
    this.expandedSet = next;
    this.expandedValues = Array.from(next);
    this.emitEvent(expanded ? 'mth-expand' : 'mth-collapse', { detail: { value: id } });
  }

  private findTargetItemIndex(visible: HTMLElement[], event: Event): number {
    const target = event.target as HTMLElement | null;
    if (target) {
      const exactIdx = visible.indexOf(target);
      if (exactIdx !== -1) return exactIdx;
    }
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    for (const node of path) {
      const idx = visible.indexOf(node as HTMLElement);
      if (idx !== -1) return idx;
    }
    let cur = target;
    while (cur && cur !== this) {
      const idx = visible.indexOf(cur);
      if (idx !== -1) return idx;
      cur = cur.parentElement;
    }
    return -1;
  }

  private readonly handleTreeKeyDown = (event: KeyboardEvent): void => {
    const visible = this.getVisibleItems();
    if (visible.length === 0) return;

    const focusedIdx = this.findTargetItemIndex(visible, event);
    if (focusedIdx === -1) return;

    const isRtl = this.isRtlDirection();
    const expandKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    if (this.isDataDriven()) {
      this.handleDataKeyDown(event, visible, focusedIdx, expandKey, collapseKey);
    } else {
      this.handleSlottedKeyDown(
        event,
        visible as TreeItemLikeElement[],
        focusedIdx,
        expandKey,
        collapseKey,
      );
    }
  };

  private handleDataKeyDown(
    event: KeyboardEvent,
    visible: HTMLElement[],
    focusedIdx: number,
    expandKey: string,
    collapseKey: string,
  ): void {
    const flat = this.getFlatNodes();
    const currentId = visible[focusedIdx]?.dataset.nodeId;
    const node = flat.find((n) => n.id === currentId);
    if (!node) return;

    if (event.key === expandKey) {
      event.preventDefault();
      if (node.hasChildren && !node.expanded) {
        this.setNodeExpanded(node.id, true);
      } else if (node.hasChildren && node.expanded) {
        const nextIdx = focusedIdx + 1;
        if (nextIdx < visible.length) {
          this.rovingCtrl.setActiveIndex(nextIdx, true);
        }
      }
      return;
    }

    if (event.key === collapseKey) {
      event.preventDefault();
      if (node.expanded) {
        this.setNodeExpanded(node.id, false);
      } else if (node.parentId) {
        const parentIdx = visible.findIndex((el) => el.dataset.nodeId === node.parentId);
        if (parentIdx !== -1) {
          this.rovingCtrl.setActiveIndex(parentIdx, true);
        }
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectNodeValue(node.id, node.disabled, event.shiftKey);
      return;
    }

    if (event.key === '*') {
      event.preventDefault();
      for (const sibId of node.siblingExpandableIds) {
        if (!this.expandedSet.has(sibId)) {
          this.setNodeExpanded(sibId, true);
        }
      }
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const char = event.key.toLowerCase();
      for (let offset = 1; offset <= visible.length; offset += 1) {
        const idx = (focusedIdx + offset) % visible.length;
        const candidate = visible[idx];
        const text = (candidate?.textContent ?? '').trim().toLowerCase();
        if (candidate && candidate.getAttribute('aria-disabled') !== 'true' && text.startsWith(char)) {
          this.rovingCtrl.setActiveIndex(idx, true);
          break;
        }
      }
    }
  }

  private handleSlottedKeyDown(
    event: KeyboardEvent,
    visible: TreeItemLikeElement[],
    focusedIdx: number,
    expandKey: string,
    collapseKey: string,
  ): void {
    const current = visible[focusedIdx]!;
    const currentVal = getTreeItemValue(current, `item-${focusedIdx}`);
    const children = getChildTreeItems(current);
    const expandable =
      typeof current.isExpandable === 'function' ? current.isExpandable() : children.length > 0;
    const isExpanded = Boolean(current.expanded || current.hasAttribute('expanded'));

    if (event.key === expandKey) {
      event.preventDefault();
      if (expandable && !isExpanded) {
        current.expanded = true;
        this.emitEvent('mth-expand', { detail: { value: currentVal } });
        this.requestUpdate();
      } else if (expandable && isExpanded && children.length > 0) {
        const childIdx = visible.indexOf(children[0]!);
        if (childIdx !== -1) {
          this.rovingCtrl.setActiveIndex(childIdx, true);
        }
      }
      return;
    }

    if (event.key === collapseKey) {
      event.preventDefault();
      if (isExpanded) {
        current.expanded = false;
        this.emitEvent('mth-collapse', { detail: { value: currentVal } });
        this.requestUpdate();
      } else {
        const parent = current.parentElement;
        if (parent && isTreeItemElement(parent)) {
          const parentIdx = visible.indexOf(parent);
          if (parentIdx !== -1) {
            this.rovingCtrl.setActiveIndex(parentIdx, true);
          }
        }
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectNodeValue(currentVal, isTreeItemDisabled(current), event.shiftKey);
      return;
    }

    if (event.key === '*') {
      event.preventDefault();
      const parentEl = current.parentElement;
      const siblings = parentEl
        ? Array.from(parentEl.children ?? []).filter(isTreeItemElement)
        : this.slotCtrl.slottedElements;
      for (const sib of siblings) {
        const sibExpandable =
          typeof sib.isExpandable === 'function'
            ? sib.isExpandable()
            : getChildTreeItems(sib).length > 0;
        if (sibExpandable && !sib.expanded) {
          sib.expanded = true;
          this.emitEvent('mth-expand', { detail: { value: getTreeItemValue(sib, '') } });
        }
      }
      this.requestUpdate();
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const char = event.key.toLowerCase();
      for (let offset = 1; offset <= visible.length; offset += 1) {
        const idx = (focusedIdx + offset) % visible.length;
        const candidate = visible[idx]!;
        if (!isTreeItemDisabled(candidate) && getTreeItemLabel(candidate).toLowerCase().startsWith(char)) {
          this.rovingCtrl.setActiveIndex(idx, true);
          break;
        }
      }
    }
  }

  private readonly handleSlotClick = (event: MouseEvent): void => {
    if (this.isDataDriven()) return;
    const visible = this.getVisibleItems() as TreeItemLikeElement[];
    const idx = this.findTargetItemIndex(visible, event);
    if (idx === -1) return;
    const target = visible[idx]!;
    if (isTreeItemDisabled(target)) return;
    this.rovingCtrl.setActiveIndex(idx, false);
    const val = getTreeItemValue(target, `item-${idx}`);
    this.selectNodeValue(val, false, event.shiftKey);
  };

  private readonly handleSlotToggle = (): void => {
    this.rovingCtrl.syncTabIndices();
    this.requestUpdate();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (this.isDataDriven()) return;
    const visible = this.getVisibleItems();
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const idx = visible.findIndex((item) => item === target);
    if (idx !== -1 && !isTreeItemDisabled(visible[idx]!)) {
      event.stopPropagation();
      if (idx !== this.rovingCtrl.currentIndex) {
        this.rovingCtrl.setActiveIndex(idx, false);
      }
    }
  };

  private renderDataNodes() {
    const flat = this.getFlatNodes();
    if (flat.length === 0) {
      return html`
        <div part="status" class="status" data-status="empty">
          <slot name="empty">${this.t('emptyText')}</slot>
        </div>
      `;
    }

    const renderNodeRow = (node: FlatTreeNode) => {
      const isSelected = this.selectionMode !== 'none' && this.selectionCtrl.isSelected(node.id);
      return html`
        <div
          part="item"
          class="data-item"
          role="treeitem"
          data-node-id=${node.id}
          aria-level=${String(node.level)}
          aria-setsize=${String(node.setsize)}
          aria-posinset=${String(node.posinset)}
          aria-expanded=${node.hasChildren ? (node.expanded ? 'true' : 'false') : nothing}
          aria-selected=${this.selectionMode === 'none' ? nothing : isSelected ? 'true' : 'false'}
          aria-disabled=${node.disabled ? 'true' : nothing}
          @click=${(e: MouseEvent) => {
            if (node.disabled) return;
            if (node.hasChildren) {
              this.setNodeExpanded(node.id, !node.expanded);
            }
            this.selectNodeValue(node.id, node.disabled, e.shiftKey);
          }}
        >
          <span class="toggle-glyph" data-leaf=${node.hasChildren ? 'false' : 'true'} aria-hidden="true">
            ${node.expanded ? '▾' : '▸'}
          </span>
          <span>${node.label}</span>
        </div>
      `;
    };

    if (!this.virtualized) {
      return flat.map(renderNodeRow);
    }

    const vItems = this.virtualizer.getVirtualItems();
    const visibleSlice = vItems
      .map((vi) => flat[vi.index])
      .filter((n): n is FlatTreeNode => Boolean(n));

    return html`
      <div
        part="viewport"
        class="viewport"
        @scroll=${(e: Event) => {
          const el = e.currentTarget as HTMLElement;
          this.virtualizer.setScrollPosition(el.scrollTop, el.scrollLeft);
        }}
      >
        <div part="spacer" class="spacer">
          <div part="window" class="window">
            ${visibleSlice.map(renderNodeRow)}
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    const ariaLabel = this.label.trim() || this.t('treeLabel');
    const status = this.dataCtrl.status;
    let body;

    if (this.dataSource && status === 'loading') {
      body = html`
        <div part="status" class="status" role="status" data-status="loading">
          <slot name="loading">${this.t('loadingText')}</slot>
        </div>
      `;
    } else if (this.dataSource && status === 'error') {
      body = html`
        <div part="status" class="status" role="alert" data-status="error">
          <slot name="error">${this.t('errorText')}</slot>
          <button part="retry" class="retry" type="button" @click=${() => void this.refresh()}>
            ${this.t('retryLabel')}
          </button>
        </div>
      `;
    } else if (this.dataSource && status === 'empty') {
      body = html`
        <div part="status" class="status" data-status="empty">
          <slot name="empty">${this.t('emptyText')}</slot>
        </div>
      `;
    } else if (this.isDataDriven()) {
      body = this.renderDataNodes();
    } else {
      body = html`<slot></slot>`;
    }

    return html`
      <div
        part="base"
        class="base"
        role="tree"
        aria-label=${ariaLabel}
        aria-multiselectable=${this.selectionMode === 'multiple' ? 'true' : nothing}
        @keydown=${this.handleTreeKeyDown}
        @click=${this.handleSlotClick}
        @focusin=${this.handleFocusIn}
        @mth-toggle=${this.handleSlotToggle}
      >
        ${body}
      </div>
    `;
  }
}
