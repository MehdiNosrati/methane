import { UIElement, devWarn, html, nothing, property } from '@methane/core';
import { fabMessages } from './fab.messages.js';
import { fabStyles } from './fab.styles.js';

export type MthFabVariant = 'primary' | 'surface' | 'secondary';
export type MthFabSize = 'sm' | 'md' | 'lg';
export type MthFabPlacement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';

/**
 * Floating Action Button with logical corner placement and extended pill mode.
 */
export class MthFab extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = fabStyles;
  static override messages = fabMessages;

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  variant: MthFabVariant = 'primary';

  @property({ type: String, reflect: true })
  size: MthFabSize = 'md';

  @property({ type: Boolean, reflect: true })
  extended = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  fixed = false;

  @property({ type: String, reflect: true })
  placement: MthFabPlacement = 'bottom-end';

  private warnedMissingLabel = false;

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (changed.has('extended')) {
      this.setCustomState('extended', this.extended);
    }
    if (
      !this.warnedMissingLabel &&
      !this.extended &&
      !this.label.trim() &&
      !this.getAttribute('aria-label')
    ) {
      this.warnedMissingLabel = true;
      devWarn(
        'mth-fab',
        'Compact (non-extended) <mth-fab> requires a `label` (or `aria-label`) for accessibility.',
      );
    }
  }

  private handleClick = (event: MouseEvent): void => {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.emitEvent('mth-press', {
      cancelable: true,
      detail: { originalEvent: event },
    });
  };

  override render() {
    const ariaLabel = !this.extended ? this.label || this.getAttribute('aria-label') || nothing : nothing;
    return html`
      <button
        part="base"
        type="button"
        aria-label=${ariaLabel}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        <span part="icon"><slot name="icon"></slot></span>
        <span part="label"><slot>${this.extended ? this.label : nothing}</slot></span>
      </button>
    `;
  }
}
