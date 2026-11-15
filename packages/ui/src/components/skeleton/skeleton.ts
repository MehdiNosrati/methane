import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { skeletonMessages } from './skeleton.messages.js';
import { skeletonStyles } from './skeleton.styles.js';

export type MthSkeletonVariant = 'text' | 'circular' | 'rectangular';

/**
 * `<mth-skeleton>`: decorative loading placeholder (`aria-hidden="true"`) with
 * `text`, `circular`, and `rectangular` variants and CSS-custom-property sizing.
 */
export class MthSkeleton extends UIElement {
  static override messages = skeletonMessages;
  static override styles = skeletonStyles;

  @property({ type: String, reflect: true })
  variant: MthSkeletonVariant = 'text';

  @property({ type: Number })
  lines = 1;

  @property({ type: Boolean, reflect: true })
  animated = true;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('animated', this.animated);
    if (this.internals && 'ariaHidden' in this.internals) {
      try {
        this.internals.ariaHidden = 'true';
      } catch {
        // Ignore engines without writable ElementInternals.ariaHidden.
      }
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('animated')) {
      this.setCustomState('animated', this.animated);
    }
  }

  override render() {
    const lineCount =
      this.variant === 'text' ? Math.max(1, Math.floor(Number.isFinite(this.lines) ? this.lines : 1)) : 1;

    return html`
      <div
        part="base"
        class="base"
        aria-hidden="true"
        data-variant=${this.variant}
        data-multiline=${lineCount > 1 ? 'true' : 'false'}
        data-animated=${this.animated ? 'true' : 'false'}
      >
        ${Array.from({ length: lineCount }, () => html`<span part="line" class="line"></span>`)}
      </div>
    `;
  }
}
