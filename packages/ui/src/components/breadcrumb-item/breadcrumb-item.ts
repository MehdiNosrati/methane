import { devWarn, UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { breadcrumbItemMessages } from './breadcrumb-item.messages.js';
import { breadcrumbItemStyles } from './breadcrumb-item.styles.js';

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
 * `<mth-breadcrumb-item>`: single item in a `<mth-breadcrumbs>` navigation trail.
 */
export class MthBreadcrumbItem extends UIElement {
  static override messages = breadcrumbItemMessages;
  static override styles = breadcrumbItemStyles;

  @property({ type: String, reflect: true })
  href = '';

  @property({ type: String })
  target = '';

  @property({ type: String })
  rel = '';

  @property({ type: Boolean, reflect: true })
  current = false;

  @property({ type: String })
  separator = '/';

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'listitem';
    }
    this.setCustomState('current', this.current);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.setCustomState('current', this.current);
  }

  private resolveSafeHref(): string | undefined {
    const raw = this.href.trim();
    if (!raw || this.current) return undefined;
    if (!isSafeHref(raw)) {
      devWarn(`<mth-breadcrumb-item> rejected unsafe href "${raw}".`);
      return undefined;
    }
    return raw;
  }

  override render() {
    const safeHref = this.resolveSafeHref();
    const target = this.target.trim() || undefined;
    const rel = buildRel(this.rel, target ?? '');

    return html`
      <span part="base">
        ${safeHref !== undefined
          ? html`<a part="link" href=${safeHref} target=${ifDefined(target)} rel=${ifDefined(rel)}><slot></slot></a>`
          : html`<span part="label" aria-current=${this.current ? 'page' : nothing}><slot></slot></span>`}
        <span part="separator" aria-hidden="true">
          <slot name="separator">${this.separator}</slot>
        </span>
      </span>
    `;
  }
}
