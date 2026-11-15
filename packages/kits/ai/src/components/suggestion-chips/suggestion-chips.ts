import { UIElement, html, property, type PropertyValues } from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import { suggestionChipsMessages } from './suggestion-chips.messages.js';
import { suggestionChipsStyles } from './suggestion-chips.styles.js';

export interface SuggestionChipItem {
  readonly id?: string;
  readonly label: string;
  readonly value?: string;
  readonly prompt?: string;
  readonly disabled?: boolean;
}

export type MthSuggestionOrientation = 'horizontal' | 'vertical';

/**
 * `<mth-suggestion-chips>`: starter prompt chip bar powered by RTL-aware `RovingFocusController`.
 */
export class MthSuggestionChips extends UIElement {
  static override messages = suggestionChipsMessages;
  static override styles = suggestionChipsStyles;

  @property({ attribute: false })
  items: ReadonlyArray<SuggestionChipItem> = [];

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  orientation: MthSuggestionOrientation = 'horizontal';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();
    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getItemElements(),
      orientation: this.orientation,
      loop: true,
      dir: this.resolvedDir,
    });
  }

  getItemElements(): HTMLElement[] {
    if (!this.shadowRoot) return [];
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('[part="chip"]'));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('disabled', this.disabled);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    this.rovingCtrl.updateOptions({
      orientation: this.orientation,
      dir: this.resolvedDir,
    });
  }

  private handleChipClick(item: SuggestionChipItem, index: number): void {
    if (this.disabled || item.disabled) return;
    const value = item.value ?? item.prompt ?? item.label;
    this.emitEvent('mth-select', {
      detail: { label: item.label, value, index },
    });
  }

  override render() {
    const groupLabel = this.label || this.t('label');

    return html`
      <div class="list" part="base" role="group" aria-label=${groupLabel}>
        ${this.items.map(
          (item, index) => html`
            <button
              type="button"
              class="chip"
              part="chip"
              ?disabled=${this.disabled || Boolean(item.disabled)}
              @click=${() => this.handleChipClick(item, index)}
            >
              ${item.label}
            </button>
          `,
        )}
        <slot></slot>
      </div>
    `;
  }
}
