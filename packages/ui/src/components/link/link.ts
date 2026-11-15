import { devWarn, UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { linkMessages } from './link.messages.js';
import { linkStyles } from './link.styles.js';

export type MthLinkUnderline = 'always' | 'hover' | 'none';

function isSafeHref(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\/|\.\.\/|\?|#)/.test(trimmed)) return true;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) {
    return !trimmed.startsWith('//');
  }
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http' || scheme === 'mailto' || scheme === 'tel';
}

function buildRel(rel: string, target: string): string | undefined {
  const tokens = new Set(rel.split(/\s+/).filter(Boolean));
  if (target === '_blank') {
    tokens.add('noopener');
    tokens.add('noreferrer');
  }
  return tokens.size > 0 ? Array.from(tokens).join(' ') : undefined;
}

/**
 * `<mth-link>`: accessible navigation link with automatic `_blank` `noopener noreferrer`
 * hardening, `disabled` guard, and safe-URL allowlist validation.
 */
export class MthLink extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = linkMessages;
  static override styles = linkStyles;

  @property({ type: String, reflect: true })
  href = '';

  @property({ type: String, reflect: true })
  target = '';

  @property({ type: String, reflect: true })
  rel = '';

  @property({ type: Boolean, reflect: true })
  external = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  underline: MthLinkUnderline = 'always';

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('external', this.external);
  }

  private resolveSafeHref(): string | undefined {
    if (this.disabled) return undefined;
    const raw = this.href.trim();
    if (!raw) return undefined;
    if (!isSafeHref(raw)) {
      devWarn(`<mth-link> rejected unsafe href "${raw}".`);
      return undefined;
    }
    return raw;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disabled) {
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
    }
  };

  override render() {
    const safeHref = this.resolveSafeHref();
    const effectiveTarget = this.target.trim() || (this.external ? '_blank' : '');
    const effectiveRel = buildRel(this.rel, effectiveTarget);
    const opensNewTab = effectiveTarget === '_blank';

    return html`
      <a
        part="control"
        href=${ifDefined(safeHref)}
        target=${ifDefined(effectiveTarget || undefined)}
        rel=${ifDefined(effectiveRel)}
        aria-disabled=${this.disabled ? 'true' : nothing}
        tabindex=${this.disabled ? '-1' : nothing}
        @click=${this.handleClick}
      >
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
        ${this.external
          ? html`<span part="external-icon" aria-hidden="true">↗</span>`
          : nothing}
        ${opensNewTab
          ? html`<span class="sr-only">(${this.t('opensNewTab')})</span>`
          : nothing}
      </a>
    `;
  }
}
