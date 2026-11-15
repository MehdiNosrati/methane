import { UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController, SelectionController } from '@methane-ui/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { resolveEffectiveDir, stopRovingKeys } from '../shared/style-sheet.js';
import { savedViewsMessages } from './saved-views.messages.js';
import { savedViewsStyles } from './saved-views.styles.js';

export interface SavedViewItem {
  readonly id: string;
  readonly label: string;
  readonly pinned?: boolean;
  readonly disabled?: boolean;
}

let viewSeq = 0;

/**
 * `<mth-saved-views>`: Saved view tabs with create, duplicate, pin, and delete actions.
 */
export class MthSavedViews extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = savedViewsMessages;
  static override styles = savedViewsStyles;

  @property({ attribute: false })
  views: ReadonlyArray<SavedViewItem> = [];

  @property({ type: String, reflect: true, attribute: 'active-view-id' })
  activeViewId = '';

  @property({ type: Boolean, attribute: 'allow-create' })
  allowCreate = true;

  @property({ type: Boolean, attribute: 'allow-manage' })
  allowManage = true;

  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingFocus: RovingFocusController;

  constructor() {
    super();
    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: false,
      onChange: (selected) => {
        const nextId = selected[0] ?? '';
        if (nextId !== this.activeViewId) {
          this.activeViewId = nextId;
          this.emitEvent('mth-view-select', { detail: { id: nextId } });
        }
      },
    });
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(
          this.shadowRoot?.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])') ?? [],
        ),
    });
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingFocus.updateOptions({ dir: resolveEffectiveDir(this, this.resolvedDir) });
    if (changed.has('views')) {
      this.selectionCtrl.setItems(
        this.views.map((v) => ({ value: v.id, ...(v.disabled ? { disabled: true } : {}) })),
      );
      if (!this.activeViewId && this.views[0]) {
        this.activeViewId = this.views[0].id;
      }
    }
    if (changed.has('activeViewId') && this.activeViewId && !this.selectionCtrl.isSelected(this.activeViewId)) {
      this.selectionCtrl.select(this.activeViewId);
    }
    this.setCustomState('empty', this.views.length === 0);
  }

  selectView(id: string): void {
    this.selectionCtrl.select(id);
  }

  createView(label?: string): SavedViewItem {
    viewSeq += 1;
    const item: SavedViewItem = {
      id: `view-${viewSeq}`,
      label: label?.trim() || `${this.t('defaultViewName')} ${viewSeq}`,
      pinned: false,
    };
    this.views = [...this.views, item];
    this.activeViewId = item.id;
    this.selectionCtrl.select(item.id);
    this.emitEvent('mth-view-create', { detail: { view: item } });
    return item;
  }

  duplicateActiveView(): SavedViewItem | null {
    const active = this.views.find((v) => v.id === this.activeViewId);
    if (!active) return null;
    viewSeq += 1;
    const copy: SavedViewItem = {
      id: `view-${viewSeq}`,
      label: this.t('duplicateName', { name: active.label }),
      pinned: false,
    };
    this.views = [...this.views, copy];
    this.activeViewId = copy.id;
    this.selectionCtrl.select(copy.id);
    this.emitEvent('mth-view-duplicate', { detail: { id: active.id, copy } });
    return copy;
  }

  togglePinActiveView(): void {
    const active = this.views.find((v) => v.id === this.activeViewId);
    if (!active) return;
    const pinned = !active.pinned;
    this.views = this.views.map((v) => (v.id === active.id ? { ...v, pinned } : v));
    this.emitEvent('mth-view-pin', { detail: { id: active.id, pinned } });
  }

  deleteView(id: string): void {
    const next = this.views.filter((v) => v.id !== id);
    if (next.length === this.views.length) return;
    this.views = next;
    if (this.activeViewId === id) {
      this.activeViewId = next[0]?.id ?? '';
    }
    this.emitEvent('mth-view-delete', { detail: { id } });
  }

  override render() {
    const active = this.views.find((v) => v.id === this.activeViewId) ?? null;
    const ordered = [
      ...this.views.filter((v) => v.pinned),
      ...this.views.filter((v) => !v.pinned),
    ];
    const focusTabId =
      ordered.find((v) => !v.disabled && v.id === this.activeViewId)?.id ??
      ordered.find((v) => !v.disabled)?.id ??
      '';

    return html`
      <div part="base" class="base" dir=${resolveEffectiveDir(this, this.resolvedDir)}>
        <div part="tablist" class="tablist" role="tablist" aria-label=${this.t('tablistLabel')}>
          ${ordered.map((view) => {
            const selected = view.id === this.activeViewId;
            return html`
              <button
                type="button"
                part="tab"
                class="tab"
                role="tab"
                aria-selected=${selected ? 'true' : 'false'}
                tabindex=${focusTabId === view.id ? '0' : '-1'}
                ?disabled=${Boolean(view.disabled)}
                @click=${() => this.selectView(view.id)}
              >
                ${view.pinned ? '★ ' : ''}${view.label}
              </button>
            `;
          })}
        </div>

        <div part="actions" class="actions" @keydown=${stopRovingKeys}>
          <button
            type="button"
            class="action-btn"
            ?hidden=${!this.allowCreate}
            @click=${() => this.createView()}
          >
            ${this.t('createView')}
          </button>
          <button
            type="button"
            class="action-btn"
            ?hidden=${!this.allowManage || !active}
            @click=${() => this.duplicateActiveView()}
          >
            ${this.t('duplicateView')}
          </button>
          <button
            type="button"
            class="action-btn"
            ?hidden=${!this.allowManage || !active}
            @click=${() => this.togglePinActiveView()}
          >
            ${active?.pinned ? this.t('unpinView') : this.t('pinView')}
          </button>
          <button
            type="button"
            class="action-btn"
            ?hidden=${!this.allowManage || !active}
            @click=${() => {
              if (active) this.deleteView(active.id);
            }}
          >
            ${this.t('deleteView')}
          </button>
        </div>
      </div>
    `;
  }
}
