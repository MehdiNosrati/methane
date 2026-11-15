import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { progressBarMessages } from './progress-bar.messages.js';
import { progressBarStyles } from './progress-bar.styles.js';

/**
 * `<mth-progress-bar>`: accessible progress bar supporting determinate `value`/`max`
 * and `indeterminate` states via adopted `CSSStyleSheet` `--_progress` custom property.
 */
export class MthProgressBar extends UIElement {
  static override messages = progressBarMessages;
  static override styles = progressBarStyles;

  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Boolean, reflect: true })
  indeterminate = false;

  @property({ type: String })
  label = '';

  @state()
  private slottedLabelText = '';

  private progressSheet: CSSStyleSheet | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('indeterminate', this.indeterminate);
    this.syncProgressSheet();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('indeterminate')) {
      this.setCustomState('indeterminate', this.indeterminate);
    }
    if (
      changedProperties.has('value') ||
      changedProperties.has('max') ||
      changedProperties.has('indeterminate')
    ) {
      this.syncProgressSheet();
    }
  }

  private getClampedRange(): { readonly value: number; readonly max: number; readonly percent: number } {
    const safeMax = Number.isFinite(this.max) && this.max > 0 ? this.max : 100;
    const safeValue = Number.isFinite(this.value) ? Math.min(Math.max(this.value, 0), safeMax) : 0;
    const percent = Math.round(((safeValue / safeMax) * 100) * 100) / 100;
    return { value: safeValue, max: safeMax, percent };
  }

  private syncProgressSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.progressSheet) {
      this.progressSheet = new CSSStyleSheet();
    }
    if (typeof this.progressSheet.replaceSync === 'function') {
      const { percent } = this.getClampedRange();
      const rule = this.indeterminate ? ':host { --_progress: 40%; }' : `:host { --_progress: ${percent}%; }`;
      this.progressSheet.replaceSync(rule);
      if (!root.adoptedStyleSheets.includes(this.progressSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.progressSheet];
      }
    }
  }

  private readonly handleLabelSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.slottedLabelText = slot
      .assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  override render() {
    const { value, max } = this.getClampedRange();
    const visibleLabel = this.slottedLabelText || this.label;
    const accessibleLabel = visibleLabel.length > 0 ? visibleLabel : this.t('progressLabel');

    return html`
      <div part="base" class="base">
        <div part="label" class="label" ?hidden=${visibleLabel.length === 0}>
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${this.label}</slot>
        </div>
        <div
          part="track"
          class="track"
          role="progressbar"
          aria-label=${accessibleLabel}
          aria-valuemin="0"
          aria-valuemax=${String(max)}
          aria-valuenow=${this.indeterminate ? nothing : String(value)}
          data-indeterminate=${this.indeterminate ? 'true' : 'false'}
        >
          <div part="fill" class="fill"></div>
        </div>
      </div>
    `;
  }
}
