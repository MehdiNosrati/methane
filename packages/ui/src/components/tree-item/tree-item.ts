import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { treeItemMessages } from './tree-item.messages.js';
import { treeItemStyles } from './tree-item.styles.js';

function isTreeItemNode(el: Element): el is MthTreeItem {
  return el instanceof HTMLElement && el.localName.endsWith('tree-item');
}

/**
 * `<mth-tree-item>`: hierarchical treeview node (`role="treeitem"`) for `<mth-tree>`.
 */
export class MthTreeItem extends UIElement {
  static override messages = treeItemMessages;
  static override styles = treeItemStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  expanded = false;

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  lazy = false;

  @state()
  private hasChildItems = false;

  @state()
  private directText = '';

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'treeitem';
    }
    const reflectedRole = (this as HTMLElement & { role?: string | null }).role;
    if (reflectedRole !== 'treeitem' && !this.hasAttribute('role')) {
      this.setAttribute('role', 'treeitem');
    }
    this.syncChildDiscovery();
    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('expanded') ||
      changedProperties.has('selected') ||
      changedProperties.has('disabled') ||
      changedProperties.has('lazy')
    ) {
      this.syncStates();
    }
  }

  getChildItems(): MthTreeItem[] {
    return Array.from(this.children ?? []).filter(isTreeItemNode);
  }

  getDisplayLabel(): string {
    return this.label.trim() || this.directText;
  }

  isExpandable(): boolean {
    return this.hasChildItems || this.getChildItems().length > 0 || this.lazy;
  }

  private syncChildDiscovery(): void {
    const childNodes = Array.from(this.childNodes ?? []);
    const textParts: string[] = [];
    let foundItem = false;
    for (const node of childNodes) {
      if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const trimmed = (node.textContent ?? '').trim();
        if (trimmed) textParts.push(trimmed);
      } else if (node.nodeType === 1 /* Node.ELEMENT_NODE */ && isTreeItemNode(node as Element)) {
        foundItem = true;
      }
    }
    this.directText = textParts.join(' ');
    this.hasChildItems = foundItem;
  }

  private syncStates(): void {
    const branch = this.isExpandable();
    this.setCustomState('expanded', this.expanded);
    this.setCustomState('selected', this.selected);
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('branch', branch);
    if (this.internals) {
      this.internals.ariaExpanded = branch ? (this.expanded ? 'true' : 'false') : null;
      this.internals.ariaSelected = this.selected ? 'true' : 'false';
      this.internals.ariaDisabled = this.disabled ? 'true' : null;
    }
    if (branch) {
      this.setAttribute('aria-expanded', this.expanded ? 'true' : 'false');
    } else {
      this.removeAttribute('aria-expanded');
    }
    this.setAttribute('aria-selected', this.selected ? 'true' : 'false');
  }

  private readonly handleSlotChange = (): void => {
    this.syncChildDiscovery();
    this.syncStates();
  };

  private readonly handleToggleClick = (event: MouseEvent): void => {
    event.stopPropagation();
    if (this.disabled || !this.isExpandable()) return;
    this.expanded = !this.expanded;
    this.emitEvent('mth-toggle', {
      detail: { value: this.value, expanded: this.expanded },
    });
  };

  override render() {
    const isBranch = this.hasChildItems || this.lazy;
    const labelText = this.getDisplayLabel();

    return html`
      <div part="base" class="base">
        <div part="row" class="row">
          <button
            part="toggle"
            class="toggle"
            type="button"
            tabindex="-1"
            data-leaf=${isBranch ? 'false' : 'true'}
            aria-hidden="true"
            @click=${this.handleToggleClick}
          >
            ${svg`<svg class="chevron" viewBox="0 0 16 16">
              <path d="M6 4l4 4-4 4"></path>
            </svg>`}
          </button>
          <span part="icon" class="icon">
            <slot name="icon"></slot>
          </span>
          <span part="label" class="label">
            <slot name="label">${labelText}</slot>
          </span>
          <span part="suffix" class="suffix">
            <slot name="suffix"></slot>
          </span>
        </div>
        <div
          part="children"
          class="children"
          role="group"
          ?hidden=${!this.hasChildItems || !this.expanded}
        >
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}
