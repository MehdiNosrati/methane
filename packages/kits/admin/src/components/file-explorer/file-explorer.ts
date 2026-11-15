import { UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController, SelectionController } from '@methane-ui/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import {
  attachDynamicSheet,
  resolveEffectiveDir,
  sanitizeCssNumber,
  stopRovingKeys,
} from '../shared/style-sheet.js';
import { fileExplorerMessages } from './file-explorer.messages.js';
import { fileExplorerStyles } from './file-explorer.styles.js';

export type FileExplorerItemKind = 'folder' | 'file';

export interface FileExplorerItem {
  readonly id: string;
  readonly name: string;
  readonly kind: FileExplorerItemKind;
  readonly parentId?: string | null;
  readonly size?: number;
  readonly updatedAt?: string;
}

/**
 * `<mth-file-explorer>`: Folder tree + list/grid file browser with breadcrumbs,
 * multi-select, and RTL-aware 2D keyboard navigation.
 */
export class MthFileExplorer extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = fileExplorerMessages;
  static override styles = fileExplorerStyles;

  @property({ attribute: false })
  items: ReadonlyArray<FileExplorerItem> = [];

  @property({ type: String, attribute: 'current-folder-id' })
  currentFolderId: string | null = null;

  @property({ type: String, attribute: 'view-mode', reflect: true })
  viewMode: 'list' | 'grid' = 'list';

  @property({ type: Number })
  columns = 3;

  private readonly selection: SelectionController<string>;
  private readonly rovingFocus: RovingFocusController;
  private dynamicSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.selection = new SelectionController<string>(this, {
      mode: 'multiple',
      allowEmpty: true,
      onChange: (selectedIds) => {
        this.emitEvent('mth-selection-change', { detail: { selectedIds } });
      },
    });
    this.rovingFocus = new RovingFocusController(this, {
      getItems: () => this._getEntryElements(),
      orientation: 'both',
      columns: 1,
      loop: true,
      dir: 'auto',
    });
  }

  get selectedIds(): ReadonlyArray<string> {
    return this.selection.selectedValues;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.shadowRoot) {
      this.dynamicSheet = attachDynamicSheet(this.shadowRoot, this.dynamicSheet);
    }
  }

  protected override firstUpdated(): void {
    if (this.shadowRoot) {
      this.dynamicSheet = attachDynamicSheet(this.shadowRoot, this.dynamicSheet);
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    const visible = this._visibleEntries();
    this.selection.setItems(visible.map((item) => item.id));
    const colCount = this.viewMode === 'grid' ? Math.max(1, Math.round(this.columns)) : 1;
    this.rovingFocus.updateOptions({
      columns: colCount,
      dir: resolveEffectiveDir(this, this.resolvedDir),
    });
  }

  protected override updated(): void {
    if (!this.dynamicSheet) return;
    const cols = sanitizeCssNumber(Math.max(1, Math.round(this.columns)), 3);
    this.dynamicSheet.replaceSync(`.entries[data-mode='grid'] { --_grid-columns: ${cols}; }`);
  }

  navigateTo(folderId: string | null): void {
    this.currentFolderId = folderId;
    this.emitEvent('mth-navigate', { detail: { folderId } });
  }

  private _getEntryElements(): HTMLElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('.entry'));
  }

  private _visibleEntries(): ReadonlyArray<FileExplorerItem> {
    const targetParent = this.currentFolderId ?? null;
    return this.items.filter((item) => (item.parentId ?? null) === targetParent);
  }

  private _breadcrumbs(): ReadonlyArray<FileExplorerItem> {
    const chain: FileExplorerItem[] = [];
    const byId = new Map(this.items.map((i) => [i.id, i]));
    let cursor = this.currentFolderId;
    const visited = new Set<string>();
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const node = byId.get(cursor);
      if (!node) break;
      chain.unshift(node);
      cursor = node.parentId ?? null;
    }
    return chain;
  }

  private _activateEntry(item: FileExplorerItem, event: MouseEvent | KeyboardEvent): void {
    if (event instanceof MouseEvent) {
      this.selection.select(item.id, {
        range: event.shiftKey,
        additive: event.metaKey || event.ctrlKey,
        toggle: event.metaKey || event.ctrlKey,
      });
    } else {
      this.selection.select(item.id);
    }

    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      if (item.kind === 'folder') {
        this.navigateTo(item.id);
      } else {
        this.emitEvent('mth-file-open', { detail: { item } });
      }
    }
  }

  override render() {
    const folders = this.items.filter((i) => i.kind === 'folder');
    const visible = this._visibleEntries();
    const crumbs = this._breadcrumbs();
    const activeIndex = this.rovingFocus.currentIndex >= 0 ? this.rovingFocus.currentIndex : 0;

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('explorerLabel')}
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
      >
        <div part="toolbar" class="toolbar" @keydown=${stopRovingKeys}>
          <nav aria-label=${this.t('breadcrumbLabel')}>
            <ol class="breadcrumbs">
              <li>
                <button
                  type="button"
                  class="crumb-btn"
                  @click=${() => this.navigateTo(null)}
                >
                  ${this.t('rootLabel')}
                </button>
              </li>
              ${crumbs.map(
                (crumb) => html`
                  <li aria-hidden="true">/</li>
                  <li>
                    <button
                      type="button"
                      class="crumb-btn"
                      @click=${() => this.navigateTo(crumb.id)}
                    >
                      ${crumb.name}
                    </button>
                  </li>
                `,
              )}
            </ol>
          </nav>

          <div class="view-switch">
            <slot></slot>
            <button
              type="button"
              class="view-btn"
              aria-pressed=${this.viewMode === 'list' ? 'true' : 'false'}
              @click=${() => {
                this.viewMode = 'list';
              }}
            >
              ${this.t('viewList')}
            </button>
            <button
              type="button"
              class="view-btn"
              aria-pressed=${this.viewMode === 'grid' ? 'true' : 'false'}
              @click=${() => {
                this.viewMode = 'grid';
              }}
            >
              ${this.t('viewGrid')}
            </button>
          </div>
        </div>

        <div class="panes">
          <aside
            part="tree"
            class="tree"
            aria-label=${this.t('folderTreeLabel')}
            @keydown=${stopRovingKeys}
          >
            <button
              type="button"
              class="tree-btn"
              aria-current=${this.currentFolderId === null ? 'location' : 'false'}
              @click=${() => this.navigateTo(null)}
            >
              ${this.t('rootLabel')}
            </button>
            ${folders.map(
              (folder) => html`
                <button
                  type="button"
                  class="tree-btn"
                  aria-current=${this.currentFolderId === folder.id ? 'location' : 'false'}
                  @click=${() => this.navigateTo(folder.id)}
                >
                  ${folder.name}
                </button>
              `,
            )}
          </aside>

          <div
            part="entries"
            class="entries"
            role="listbox"
            aria-label=${this.t('explorerLabel')}
            aria-multiselectable="true"
            data-mode=${this.viewMode}
          >
            ${visible.length === 0
              ? html`<p class="empty">${this.t('emptyFolder')}</p>`
              : visible.map((item, idx) => {
                  const selected = this.selection.isSelected(item.id);
                  return html`
                    <button
                      type="button"
                      part="entry"
                      class="entry"
                      role="option"
                      aria-selected=${selected ? 'true' : 'false'}
                      data-kind=${item.kind}
                      data-entry-id=${item.id}
                      tabindex=${activeIndex === idx ? '0' : '-1'}
                      @click=${(e: MouseEvent) => this._activateEntry(item, e)}
                      @dblclick=${() => {
                        if (item.kind === 'folder') {
                          this.navigateTo(item.id);
                        } else {
                          this.emitEvent('mth-file-open', { detail: { item } });
                        }
                      }}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          this._activateEntry(item, e);
                        }
                      }}
                    >
                      <span>${item.name}</span>
                      <span class="entry-meta">
                        ${item.kind === 'folder'
                          ? this.t('folderKind')
                          : item.size !== undefined
                            ? `${item.size} B`
                            : this.t('fileKind')}
                      </span>
                    </button>
                  `;
                })}
          </div>
        </div>

        <div class="footer-status" aria-live="polite">
          ${this.selection.selectedValues.length === 1
            ? this.t('selectedOne')
            : this.t('selectedOther', { count: this.selection.selectedValues.length })}
        </div>
      </div>
    `;
  }
}
