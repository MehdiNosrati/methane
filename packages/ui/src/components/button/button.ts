import { devWarn, UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { buttonMessages } from './button.messages.js';
import { buttonStyles } from './button.styles.js';

export type MthButtonVariant = 'solid' | 'soft' | 'outline' | 'outlined' | 'ghost' | 'danger';
export type MthButtonSize = 'sm' | 'md' | 'lg';
export type MthButtonType = 'button' | 'submit' | 'reset';

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

function resolveAnchorRel(rel: string, target: string): string | undefined {
  const tokens = new Set(rel.split(/\s+/).filter(Boolean));
  if (target === '_blank') {
    tokens.add('noopener');
    tokens.add('noreferrer');
  }
  return tokens.size > 0 ? Array.from(tokens).join(' ') : undefined;
}

/**
 * `<mth-button>`: form-associated action button and optional anchor navigation trigger.
 */
export class MthButton extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = buttonMessages;
  static override styles = buttonStyles;

  private _variant: MthButtonVariant = 'solid';

  @property({ type: String, reflect: true })
  get variant(): MthButtonVariant {
    return this._variant === 'outlined' ? 'outline' : this._variant;
  }

  set variant(value: MthButtonVariant) {
    const normalized = value === 'outlined' ? 'outline' : value;
    const old = this._variant;
    this._variant = normalized;
    this.requestUpdate('variant', old);
  }

  @property({ type: String, reflect: true })
  size: MthButtonSize = 'md';

  @property({ type: String, reflect: true })
  type: MthButtonType = 'button';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: String })
  href = '';

  @property({ type: String })
  target = '';

  @property({ type: String })
  rel = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  private get isEffectiveDisabled(): boolean {
    return this.disabled || this._formDisabled;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncCustomStates();
  }

  private syncCustomStates(): void {
    this.setCustomState('disabled', this.isEffectiveDisabled);
    this.setCustomState('loading', this.loading);
  }

  private resolveSafeHref(): string | undefined {
    const raw = this.href.trim();
    if (!raw) return undefined;
    if (!isSafeHref(raw)) {
      devWarn(`<mth-button> rejected unsafe href "${raw}". Only https:, http:, mailto:, tel:, and relative paths are permitted.`);
      return undefined;
    }
    return raw;
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.isEffectiveDisabled || this.loading) {
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

    if (this.href.trim().length > 0) return;

    const form = this.internals?.form ?? this.closest('form');
    if (!form) return;

    if (this.type === 'submit') {
      if (this.name && typeof this.internals?.setFormValue === 'function') {
        this.internals.setFormValue(this.value || '');
      }
      if (typeof form.requestSubmit === 'function') {
        try {
          form.requestSubmit();
          return;
        } catch {
          // Fall back to dispatching submit when JSDOM does not implement requestSubmit().
        }
      }
      const ev = new Event('submit', { bubbles: true, cancelable: true });
      if (form.dispatchEvent(ev)) {
        form.submit();
      }
    } else if (this.type === 'reset') {
      form.reset();
    }
  };

  override render() {
    const inert = this.isEffectiveDisabled || this.loading;
    const safeHref = this.resolveSafeHref();
    const spinner = this.loading
      ? html`<span part="spinner" aria-hidden="true"></span>`
      : nothing;

    if (safeHref !== undefined) {
      const effectiveTarget = this.target.trim() || undefined;
      const effectiveRel = resolveAnchorRel(this.rel, effectiveTarget ?? '');
      return html`
        <span part="base">
          <a
            part="control"
            href=${ifDefined(inert ? undefined : safeHref)}
            target=${ifDefined(effectiveTarget)}
            rel=${ifDefined(effectiveRel)}
            aria-disabled=${inert ? 'true' : nothing}
            aria-busy=${this.loading ? 'true' : nothing}
            aria-label=${this.loading ? this.t('loadingLabel') : nothing}
            tabindex=${inert ? '-1' : nothing}
            @click=${this.handleClick}
          >
            ${spinner}
            <slot name="prefix"></slot>
            <slot></slot>
            <slot name="suffix"></slot>
          </a>
        </span>
      `;
    }

    return html`
      <span part="base">
        <button
          part="control"
          type=${this.type}
          ?disabled=${this.isEffectiveDisabled}
          aria-disabled=${this.loading ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          @click=${this.handleClick}
        >
          ${spinner}
          <slot name="prefix"></slot>
          <slot></slot>
          <slot name="suffix"></slot>
        </button>
      </span>
    `;
  }
}
