import { UIElement, html, nothing, property, type PropertyValues } from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import { isSafeUrl } from '@methane/sanitize';
import { citationListMessages } from './citation-list.messages.js';
import { citationListStyles } from './citation-list.styles.js';

export interface CitationItem {
  readonly id?: string;
  readonly index?: number;
  readonly title: string;
  readonly url: string;
  readonly snippet?: string;
  readonly domain?: string;
  readonly disabled?: boolean;
}

export type MthCitationOrientation = 'horizontal' | 'vertical';

export function isSafeHttpUrl(rawUrl: string): boolean {
  if (!isSafeUrl(rawUrl)) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * `<mth-citation-list>`: numbered AI source citations with strict `https:`/`http:` URL
 * validation (`ADR-012`), RTL-aware `RovingFocusController`, and `mth-select` events.
 */
export class MthCitationList extends UIElement {
  static override messages = citationListMessages;
  static override styles = citationListStyles;

  @property({ attribute: false })
  citations: ReadonlyArray<CitationItem> = [];

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  orientation: MthCitationOrientation = 'horizontal';

  @property({ type: String, attribute: 'selected-id' })
  selectedId = '';

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
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('[part="citation-item"]'));
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('orientation') || changedProperties.has('citations')) {
      this.rovingCtrl.updateOptions({
        orientation: this.orientation,
        dir: this.resolvedDir,
      });
    } else {
      this.rovingCtrl.updateOptions({ dir: this.resolvedDir });
    }
  }

  private resolveItemId(item: CitationItem, idx: number): string {
    return item.id ?? `citation-${item.index ?? idx + 1}`;
  }

  private resolveDomain(item: CitationItem): string {
    if (item.domain) return item.domain;
    if (!isSafeHttpUrl(item.url)) return '';
    try {
      return new URL(item.url.trim()).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  private handleSelect(item: CitationItem, idx: number, safeUrl: string, event: Event): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    const id = this.resolveItemId(item, idx);
    this.selectedId = id;
    this.emitEvent('mth-select', {
      detail: {
        id,
        index: item.index ?? idx + 1,
        title: item.title,
        url: safeUrl,
      },
    });
  }

  override render() {
    const navLabel = this.label || this.t('label');

    return html`
      <nav aria-label=${navLabel}>
        <ol class="list" part="base">
          ${this.citations.map((item, idx) => {
            const num = item.index ?? idx + 1;
            const id = this.resolveItemId(item, idx);
            const safe = isSafeHttpUrl(item.url);
            const safeHref = safe ? item.url.trim() : '';
            const domain = this.resolveDomain(item);
            const isSelected = this.selectedId === id;

            return html`
              <li class="item">
                ${safe
                  ? html`
                      <a
                        class="citation"
                        part="citation-item"
                        href=${safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        ?data-selected=${isSelected}
                        aria-disabled=${item.disabled ? 'true' : nothing}
                        title=${item.snippet ?? item.title}
                        @click=${(e: Event) => this.handleSelect(item, idx, safeHref, e)}
                      >
                        <mth-badge variant="accent" size="sm" pill>${num}</mth-badge>
                        <span class="title">${item.title}</span>
                        ${domain ? html`<span class="domain">${domain}</span>` : nothing}
                        <mth-icon name="external" size="xs"></mth-icon>
                      </a>
                    `
                  : html`
                      <button
                        type="button"
                        class="citation"
                        part="citation-item"
                        ?disabled=${Boolean(item.disabled)}
                        ?data-selected=${isSelected}
                        title=${this.t('unsafeUrlLabel')}
                        @click=${(e: Event) => this.handleSelect(item, idx, '', e)}
                      >
                        <mth-badge variant="neutral" size="sm" pill>${num}</mth-badge>
                        <span class="title">${item.title}</span>
                      </button>
                    `}
              </li>
            `;
          })}
        </ol>
        <slot></slot>
      </nav>
    `;
  }
}
