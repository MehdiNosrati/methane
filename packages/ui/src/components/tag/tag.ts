import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { tagMessages } from './tag.messages.js';
import { tagStyles } from './tag.styles.js';

export type MthTagVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type MthTagSize = 'sm' | 'md' | 'lg';

/**
 * `<mth-tag>`: compact categorization tag with semantic variants,
 * optional toggleable interaction, and accessible removal trigger.
 */
export class MthTag extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = tagMessages;
  static override styles = tagStyles;

  @property({ type: String, reflect: true })
  variant: MthTagVariant = 'neutral';

  @property({ type: String, reflect: true })
  size: MthTagSize = 'md';

  @property({ type: Boolean, reflect: true })
  pill = false;

  @property({ type: Boolean, reflect: true })
  removable = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  interactive = false;

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  label = '';

  @state()
  private slottedLabelText = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('removable') ||
      changedProperties.has('selected') ||
      changedProperties.has('interactive')
    ) {
      this.syncStates();
    }
  }

  private syncStates(): void {
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('removable', this.removable);
    this.setCustomState('selected', this.selected);
    this.setCustomState('interactive', this.interactive);
  }

  private resolveDisplayLabel(): string {
    return (
      this.slottedLabelText ||
      this.label.trim() ||
      (this.textContent ?? '').replace(/\s+/g, ' ').trim() ||
      this.value.trim()
    );
  }

  private readonly handleDefaultSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.slottedLabelText = slot
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  private readonly handleTriggerClick = (): void => {
    if (this.disabled || !this.interactive) return;
    this.selected = !this.selected;
    this.emitEvent('mth-click', {
      detail: {
        value: this.value || this.resolveDisplayLabel(),
        selected: this.selected,
      },
    });
  };

  private readonly handleRemoveClick = (event: MouseEvent): void => {
    event.stopPropagation();
    this.requestRemove();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled || !this.removable) return;
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.requestRemove();
    }
  };

  private requestRemove(): void {
    if (this.disabled || !this.removable) return;
    this.emitEvent('mth-remove', {
      cancelable: true,
      detail: {
        value: this.value || this.resolveDisplayLabel(),
      },
    });
  }

  private renderContent() {
    return html`
      <span part="prefix" class="prefix">
        <slot name="prefix"></slot>
      </span>
      <span part="label" class="label">
        <slot @slotchange=${this.handleDefaultSlotChange}>${this.label}</slot>
      </span>
      <span part="suffix" class="suffix">
        <slot name="suffix"></slot>
      </span>
    `;
  }

  override render() {
    const displayLabel = this.resolveDisplayLabel();
    const removeLabel =
      displayLabel.length > 0
        ? this.t('removeTagNamed', { label: displayLabel })
        : this.t('removeTag');

    return html`
      <span
        part="base"
        class="base"
        data-variant=${this.variant}
        data-size=${this.size}
        data-pill=${this.pill ? 'true' : 'false'}
        data-selected=${this.selected ? 'true' : 'false'}
        @keydown=${this.handleKeyDown}
      >
        ${this.interactive
          ? html`
              <button
                part="trigger"
                class="trigger"
                type="button"
                aria-pressed=${this.selected ? 'true' : 'false'}
                aria-disabled=${this.disabled ? 'true' : nothing}
                ?disabled=${this.disabled}
                @click=${this.handleTriggerClick}
              >
                ${this.renderContent()}
              </button>
            `
          : html`<span part="trigger" class="trigger">${this.renderContent()}</span>`}
        ${this.removable
          ? html`
              <button
                part="remove"
                class="remove"
                type="button"
                aria-label=${removeLabel}
                ?disabled=${this.disabled}
                @click=${this.handleRemoveClick}
              >
                ${svg`<svg class="remove-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8"></path>
                </svg>`}
              </button>
            `
          : nothing}
      </span>
    `;
  }
}
