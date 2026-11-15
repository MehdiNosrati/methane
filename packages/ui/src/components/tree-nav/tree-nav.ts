import { UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController } from '@methane-ui/primitives';
import { html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { treeNavMessages } from './tree-nav.messages.js';
import type { TreeNavItem } from './tree-nav.spec.js';
import { treeNavStyles } from './tree-nav.styles.js';

export type { TreeNavItem };

const EMPTY_TREE_NAV_ITEMS: ReadonlyArray<TreeNavItem> = Object.freeze([]);
const EMPTY_TREE_EXPANDED: ReadonlyArray<string> = Object.freeze([]);

function isSafeHref(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\/|\.\.\/|\?|#)/.test(trimmed)) return !trimmed.startsWith('//');
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) return !trimmed.startsWith('//');
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http' || scheme === 'mailto' || scheme === 'tel';
}

/**
 * `<mth-tree-nav>`: Hierarchical collapsible navigation tree with WAI-ARIA `tree`/`treeitem`
 * semantics, LTR/RTL branch expand/collapse keyboard handling, and safe link validation.
 */
export class MthTreeNav extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = treeNavMessages;
  static override styles = [treeNavStyles];

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'active-value' })
  activeValue = '';

  @property({ type: String, attribute: 'active-href' })
  activeHref = '';

  @property({ attribute: false })
  expandedValues: ReadonlyArray<string> = EMPTY_TREE_EXPANDED;

  @property({ attribute: false })
  items: ReadonlyArray<TreeNavItem> = EMPTY_TREE_NAV_ITEMS;

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []),
    });
  }

  isExpanded(value: string): boolean {
    return this.expandedValues.includes(value);
  }

  toggleBranch(value: string, force?: boolean): boolean {
    const currently = this.isExpanded(value);
    const next = force ?? !currently;
    if (next === currently) return currently;
    this.expandedValues = next
      ? [...this.expandedValues, value]
      : this.expandedValues.filter((v) => v !== value);
    this.emitEvent('mth-toggle', {
      detail: { value, expanded: next },
    });
    return next;
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('items') ||
      changed.has('expandedValues') ||
      changed.has('activeValue') ||
      changed.has('activeHref')
    ) {
      this.rovingCtrl.syncTabIndices();
    }
  }

  private isRtl(): boolean {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl';
  }

  private isItemActive(item: TreeNavItem): boolean {
    if (this.activeValue && item.value === this.activeValue) return true;
    if (this.activeHref && item.href && item.href === this.activeHref) return true;
    return false;
  }

  private findNodeByValue(
    nodes: ReadonlyArray<TreeNavItem>,
    target: string,
    parentValue: string | null = null,
  ): { item: TreeNavItem; parentValue: string | null } | null {
    for (const node of nodes) {
      if (node.value === target) {
        return { item: node, parentValue };
      }
      if (node.children?.length) {
        const nested = this.findNodeByValue(node.children, target, node.value);
        if (nested) return nested;
      }
    }
    return null;
  }

  private focusItemByValue(value: string): void {
    void this.updateComplete.then(() => {
      const visible = Array.from(
        this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? [],
      );
      const idx = visible.findIndex((el) => el.dataset['value'] === value);
      if (idx !== -1) {
        this.rovingCtrl.setActiveIndex(idx, true);
      }
    });
  }

  private handleItemActivate(event: Event, item: TreeNavItem): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    const safeHref = item.href && isSafeHref(item.href) ? item.href.trim() : undefined;
    if (item.href && !safeHref) {
      event.preventDefault();
    }
    if (item.children?.length) {
      this.toggleBranch(item.value);
    }
    this.activeValue = item.value;
    if (safeHref) {
      this.activeHref = safeHref;
    }
    this.emitEvent('mth-select', {
      detail: {
        value: item.value,
        label: item.label,
        ...(safeHref ? { href: safeHref } : {}),
      },
    });
  }

  private handleTreeKeyDown(event: KeyboardEvent): void {
    const target =
      event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[part="item"]') : null;
    const activeEl = target ?? (this.shadowRoot?.activeElement as HTMLElement | null);
    const val = activeEl?.dataset['value'];
    if (!val) return;

    const found = this.findNodeByValue(this.items, val);
    if (!found || found.item.disabled) return;

    const rtl = this.isRtl();
    const expandKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const collapseKey = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === expandKey && found.item.children?.length) {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isExpanded(found.item.value)) {
        this.toggleBranch(found.item.value, true);
      } else {
        const firstChild = found.item.children.find((c) => !c.disabled);
        if (firstChild) {
          this.focusItemByValue(firstChild.value);
        }
      }
    } else if (event.key === collapseKey) {
      if (found.item.children?.length && this.isExpanded(found.item.value)) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleBranch(found.item.value, false);
      } else if (found.parentValue) {
        event.preventDefault();
        event.stopPropagation();
        this.focusItemByValue(found.parentValue);
      }
    }
  }

  private renderNodes(nodes: ReadonlyArray<TreeNavItem>, depth: number): Array<TemplateResult> {
    return nodes.map((item) => {
      const hasChildren = Boolean(item.children && item.children.length > 0);
      const expanded = hasChildren && this.isExpanded(item.value);
      const safeHref = item.href && isSafeHref(item.href) ? item.href.trim() : null;
      const current = this.isItemActive(item);
      const clampedDepth = Math.min(3, depth);

      return html`
        <li role="none">
          ${item.href
            ? html`
                <a
                  part="item"
                  role="treeitem"
                  href=${item.disabled || !safeHref ? '#' : safeHref}
                  data-value=${item.value}
                  data-depth=${String(clampedDepth)}
                  aria-expanded=${hasChildren ? (expanded ? 'true' : 'false') : nothing}
                  aria-current=${current ? 'page' : nothing}
                  aria-disabled=${item.disabled ? 'true' : nothing}
                  @click=${(e: Event) => this.handleItemActivate(e, item)}
                >
                  ${hasChildren ? html`<span part="chevron" aria-hidden="true">▸</span>` : nothing}
                  <span>${item.label}</span>
                  ${item.badge ? html`<span part="badge">${item.badge}</span>` : nothing}
                </a>
              `
            : html`
                <button
                  part="item"
                  role="treeitem"
                  type="button"
                  data-value=${item.value}
                  data-depth=${String(clampedDepth)}
                  ?disabled=${Boolean(item.disabled)}
                  aria-expanded=${hasChildren ? (expanded ? 'true' : 'false') : nothing}
                  aria-current=${current ? 'page' : nothing}
                  aria-disabled=${item.disabled ? 'true' : nothing}
                  @click=${(e: Event) => this.handleItemActivate(e, item)}
                >
                  ${hasChildren ? html`<span part="chevron" aria-hidden="true">▸</span>` : nothing}
                  <span>${item.label}</span>
                  ${item.badge ? html`<span part="badge">${item.badge}</span>` : nothing}
                </button>
              `}
          ${hasChildren && expanded
            ? html`
                <ul part="group" role="group">
                  ${this.renderNodes(item.children!, depth + 1)}
                </ul>
              `
            : nothing}
        </li>
      `;
    });
  }

  protected override render() {
    const navLabel = this.label.trim() || this.t('navLabel');
    const treeLabel = this.label.trim() || this.t('treeLabel');

    return html`
      <nav part="nav" aria-label=${navLabel}>
        <slot name="header"></slot>
        <ul part="tree" role="tree" aria-label=${treeLabel} @keydown=${this.handleTreeKeyDown}>
          ${this.renderNodes(this.items, 0)}
        </ul>
      </nav>
    `;
  }
}
