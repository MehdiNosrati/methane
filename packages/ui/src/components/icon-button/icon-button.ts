import { devWarn, isDevMode, UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { iconButtonMessages } from './icon-button.messages.js';
import { iconButtonStyles } from './icon-button.styles.js';

export type MthIconButtonVariant = 'solid' | 'soft' | 'outline' | 'outlined' | 'ghost' | 'danger';
export type MthIconButtonSize = 'sm' | 'md' | 'lg';

const optionalBooleanConverter = {
  fromAttribute(value: string | null): boolean | undefined {
    if (value === null) return undefined;
    return value !== 'false';
  },
  toAttribute(value: boolean | undefined): string | null {
    if (value === undefined) return null;
    return value ? '' : 'false';
  },
};

/**
 * `<mth-icon-button>`: accessible icon-only action or optional toggle button.
 */
export class MthIconButton extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = iconButtonMessages;
  static override styles = iconButtonStyles;

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  variant: MthIconButtonVariant = 'ghost';

  @property({ type: String, reflect: true })
  size: MthIconButtonSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ converter: optionalBooleanConverter, reflect: true })
  pressed: boolean | undefined = undefined;

  private warnedMissingLabel = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncCustomStates();
    if (this.label.trim().length > 0) {
      this.warnedMissingLabel = false;
    } else if (isDevMode() && !this.warnedMissingLabel) {
      this.warnedMissingLabel = true;
      devWarn('<mth-icon-button> requires a non-empty `label` prop/attribute for accessible naming.');
    }
  }

  private syncCustomStates(): void {
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('loading', this.loading);
    this.setCustomState('pressed', this.pressed === true);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    const notCanceled = this.emitEvent('mth-press', {
      detail: { originalEvent: event },
      cancelable: true,
    });
    if (!notCanceled) {
      event.preventDefault();
      return;
    }

    if (this.pressed !== undefined) {
      this.pressed = !this.pressed;
      this.emitEvent('mth-change', { detail: { pressed: this.pressed } });
    }
  };

  override render() {
    const ariaLabel = this.label.trim() || this.t('fallbackLabel');
    const ariaPressed = this.pressed === undefined ? nothing : this.pressed ? 'true' : 'false';

    return html`
      <span part="base">
        <button
          part="control"
          type="button"
          aria-label=${ariaLabel}
          aria-pressed=${ariaPressed}
          aria-disabled=${this.loading ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          ?disabled=${this.disabled}
          @click=${this.handleClick}
        >
          ${this.loading
            ? html`<span part="spinner" aria-hidden="true"></span>`
            : html`<slot></slot>`}
        </button>
      </span>
    `;
  }
}
