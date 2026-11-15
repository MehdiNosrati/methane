import { UIElement, type PropertyValues } from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { bulkActionBarMessages } from './bulk-action-bar.messages.js';
import { bulkActionBarStyles } from './bulk-action-bar.styles.js';

export interface BulkActionItem {
  readonly id: string;
  readonly label: string;
  readonly tone?: 'default' | 'danger';
  readonly disabled?: boolean;
}

/**
 * `<mth-bulk-action-bar>`: Contextual multi-select action toolbar with localized plural count.
 */
export class MthBulkActionBar extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = bulkActionBarMessages;
  static override styles = bulkActionBarStyles;

  @property({ type: Number, reflect: true, attribute: 'selected-count' })
  selectedCount = 0;

  @property({ type: Number, attribute: 'total-count' })
  totalCount = 0;

  @property({ attribute: false })
  actions: ReadonlyArray<BulkActionItem> = [];

  @property({ type: Boolean, attribute: 'show-when-empty' })
  showWhenEmpty = false;

  private readonly rovingFocus: RovingFocusController;

  constructor() {
    super();
    this.rovingFocus = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-roving-item]') ?? []),
    });
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingFocus.updateOptions({ dir: this.resolvedDir });
    this.setCustomState('active', this.selectedCount > 0);
  }

  private _formatSelectedLabel(): string {
    if (this.selectedCount <= 0) {
      return this.t('selectedZero');
    }
    const category = new Intl.PluralRules(this.resolvedLocale).select(this.selectedCount);
    return category === 'one'
      ? this.t('selectedOne', { count: this.selectedCount })
      : this.t('selectedOther', { count: this.selectedCount });
  }

  override render() {
    const visible = this.selectedCount > 0 || this.showWhenEmpty;

    return html`
      <div
        part="base"
        class="base"
        role="toolbar"
        aria-label=${this.t('toolbarLabel')}
        dir=${this.resolvedDir}
        ?hidden=${!visible}
      >
        <div class="summary">
          <span part="count" class="count" role="status">${this._formatSelectedLabel()}</span>
          <button
            type="button"
            data-roving-item
            ?disabled=${this.totalCount > 0 && this.selectedCount >= this.totalCount}
            @click=${() =>
              this.emitEvent('mth-select-all', {
                detail: { totalCount: this.totalCount },
              })}
          >
            ${this.t('selectAll')}
          </button>
          <button
            type="button"
            data-roving-item
            ?disabled=${this.selectedCount === 0}
            @click=${() => this.emitEvent('mth-clear-selection', { detail: {} })}
          >
            ${this.t('clearSelection')}
          </button>
        </div>

        <div part="actions" class="actions">
          ${this.actions.map(
            (action) => html`
              <button
                type="button"
                data-roving-item
                data-tone=${action.tone ?? 'default'}
                ?disabled=${Boolean(action.disabled) || this.selectedCount === 0}
                @click=${() =>
                  this.emitEvent('mth-action', {
                    detail: { id: action.id, selectedCount: this.selectedCount },
                  })}
              >
                ${action.label}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }
}
