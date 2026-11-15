import { html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { UIElement } from '@methane-ui/core';
import { LiveAnnouncer } from '@methane-ui/primitives';
import { errorSummaryMessages } from './error-summary.messages.js';
import { EMPTY_ERROR_SUMMARY_ITEMS, type ErrorSummaryItem } from './error-summary.spec.js';
import { errorSummaryStyles } from './error-summary.styles.js';

export type { ErrorSummaryItem };

/**
 * Focusable `role="alert"` validation error summary with `LiveAnnouncer` integration,
 * pluralized headings, and focus navigation to invalid controls.
 */
export class MthErrorSummary extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override styles = [errorSummaryStyles];
  static override messages = errorSummaryMessages;

  @property({ type: String })
  heading = '';

  @property({ type: Boolean })
  override autofocus = false;

  @property({ attribute: false })
  errors: ReadonlyArray<ErrorSummaryItem> = EMPTY_ERROR_SUMMARY_ITEMS;

  @state()
  private hasDefaultSlot = false;

  @query('[part="summary"]')
  private summaryEl!: HTMLElement | null;

  private lastAnnouncedSignature = '';

  override focus(options?: FocusOptions): void {
    this.summaryEl?.focus(options);
  }

  protected override onFirstConnect(): void {
    this.syncEmptyState();
    this.announceIfNeeded();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('errors') || changedProperties.has('hasDefaultSlot')) {
      this.syncEmptyState();
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('errors') || changedProperties.has('heading')) {
      this.announceIfNeeded();
      if (changedProperties.has('errors') && this.autofocus && this.errors.length > 0) {
        this.focus();
      }
    }
  }

  private syncEmptyState(): void {
    const isEmpty = this.errors.length === 0 && !this.hasDefaultSlot;
    this.setCustomState('empty', isEmpty);
  }

  private resolveTitleText(): string {
    if (this.heading) return this.heading;
    if (this.errors.length === 0) return this.t('emptyTitle');
    return this.t('title', { count: this.errors.length });
  }

  private announceIfNeeded(): void {
    if (this.errors.length === 0) {
      this.lastAnnouncedSignature = '';
      return;
    }
    const signature = this.errors.map((e) => `${e.id ?? e.name ?? ''}:${e.message}`).join('|');
    if (signature === this.lastAnnouncedSignature) return;
    this.lastAnnouncedSignature = signature;

    const title = this.resolveTitleText();
    const first = this.errors[0]?.message ?? '';
    LiveAnnouncer.announce(this.t('announcement', { title, first }), 'assertive');
  }

  private resolveTargetId(item: ErrorSummaryItem): string {
    if (item.fieldId) return item.fieldId;
    if (item.id) return item.id;
    if (item.href && item.href.startsWith('#') && item.href.length > 1) {
      return item.href.slice(1);
    }
    return '';
  }

  private resolveSafeHref(item: ErrorSummaryItem): string {
    if (item.href && item.href.startsWith('#')) {
      return item.href;
    }
    const targetId = this.resolveTargetId(item);
    return targetId ? `#${targetId}` : '#';
  }

  private handleErrorClick(event: Event, item: ErrorSummaryItem): void {
    event.preventDefault();
    const targetId = this.resolveTargetId(item);
    const name = item.name ?? '';
    const href = this.resolveSafeHref(item);

    const root = this.getRootNode();
    const scope: Document | ShadowRoot =
      root instanceof Document || root instanceof ShadowRoot ? root : document;

    let targetEl: HTMLElement | null = null;
    if (targetId) {
      targetEl = scope.getElementById(targetId);
    }
    if (!targetEl && name) {
      targetEl = scope.querySelector<HTMLElement>(`[name="${name.replaceAll('"', '\\"')}"]`);
    }

    if (targetEl) {
      targetEl.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      targetEl.focus();
    }

    this.emitEvent('mth-focus-field', {
      detail: {
        id: targetId,
        name,
        message: item.message,
        href,
      },
    });
  }

  private handleDefaultSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement | null;
    if (!slot || typeof slot.assignedNodes !== 'function') return;
    this.hasDefaultSlot = slot
      .assignedNodes({ flatten: true })
      .some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE && (node.textContent?.trim().length ?? 0) > 0),
      );
  }

  protected override render() {
    const hasContent = this.errors.length > 0 || this.hasDefaultSlot;
    const titleText = this.resolveTitleText();

    return html`
      <div
        part="summary"
        role="alert"
        tabindex="-1"
        aria-labelledby="mth-error-summary-title"
        ?hidden=${!hasContent}
      >
        <h2 id="mth-error-summary-title" part="title">
          <slot name="heading">${titleText}</slot>
        </h2>

        ${this.errors.length > 0
          ? html`
              <ul part="list">
                ${this.errors.map((item) => {
                  const href = this.resolveSafeHref(item);
                  const display = item.label ? `${item.label}: ${item.message}` : item.message;
                  return html`
                    <li part="item">
                      <a
                        part="link"
                        href=${href}
                        @click=${(event: Event) => this.handleErrorClick(event, item)}
                      >
                        ${display}
                      </a>
                    </li>
                  `;
                })}
              </ul>
            `
          : nothing}

        <slot @slotchange=${this.handleDefaultSlotChange}></slot>
      </div>
    `;
  }
}
