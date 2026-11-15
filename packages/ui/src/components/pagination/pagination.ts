import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { paginationMessages } from './pagination.messages.js';
import { paginationStyles } from './pagination.styles.js';

export type PaginationToken = number | 'ellipsis-start' | 'ellipsis-end';

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) {
    out.push(i);
  }
  return out;
}

export function computePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationToken[] {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total);
  const siblings = Math.max(0, Math.floor(siblingCount));
  const boundary = Math.max(1, Math.floor(boundaryCount));

  const startPages = range(1, Math.min(boundary, total));
  const endPages = range(Math.max(total - boundary + 1, boundary + 1), total);

  const siblingsStart = Math.max(
    Math.min(current - siblings, total - boundary - siblings * 2 - 1),
    boundary + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(current + siblings, boundary + siblings * 2 + 2),
    endPages.length > 0 ? endPages[0]! - 2 : total - 1,
  );

  const tokens: PaginationToken[] = [...startPages];

  if (siblingsStart > boundary + 2) {
    tokens.push('ellipsis-start');
  } else if (boundary + 1 < total - boundary) {
    tokens.push(boundary + 1);
  }

  for (const p of range(siblingsStart, siblingsEnd)) {
    if (p > boundary && p <= total - boundary) {
      tokens.push(p);
    }
  }

  if (siblingsEnd < total - boundary - 1) {
    tokens.push('ellipsis-end');
  } else if (total - boundary > boundary) {
    const candidate = total - boundary;
    if (!tokens.includes(candidate)) {
      tokens.push(candidate);
    }
  }

  for (const p of endPages) {
    if (!tokens.includes(p)) {
      tokens.push(p);
    }
  }

  return tokens;
}

/**
 * `<mth-pagination>`: accessible pagination landmark with localized labels and ellipsis collapsing.
 */
export class MthPagination extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = paginationMessages;
  static override styles = paginationStyles;

  @property({ type: Number, reflect: true })
  page = 1;

  @property({ type: Number, reflect: true, attribute: 'total-pages' })
  totalPages = 1;

  @property({ type: Number, reflect: true, attribute: 'sibling-count' })
  siblingCount = 1;

  @property({ type: Number, reflect: true, attribute: 'boundary-count' })
  boundaryCount = 1;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('disabled', this.disabled);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.setCustomState('disabled', this.disabled);
  }

  private goToPage(nextPage: number): void {
    const total = Math.max(1, Math.floor(this.totalPages));
    const clamped = Math.min(Math.max(1, Math.floor(nextPage)), total);
    if (this.disabled || clamped === this.page) return;

    const ok = this.emitEvent('mth-change', {
      detail: { page: clamped },
      cancelable: true,
    });
    if (ok) {
      this.page = clamped;
    }
  }

  override render() {
    const total = Math.max(1, Math.floor(this.totalPages));
    const current = Math.min(Math.max(1, Math.floor(this.page)), total);
    const items = computePaginationRange(current, total, this.siblingCount, this.boundaryCount);
    const navLabel = this.label.trim() || this.t('paginationLabel');

    return html`
      <nav part="base" aria-label=${navLabel}>
        <ul part="list">
          <li>
            <button
              part="prev"
              type="button"
              ?disabled=${this.disabled || current <= 1}
              aria-label=${this.t('previousPage')}
              @click=${() => this.goToPage(current - 1)}
            >
              ‹
            </button>
          </li>
          ${items.map((item) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return html`<li><span part="ellipsis" aria-hidden="true">…</span></li>`;
            }
            const isCurrent = item === current;
            return html`
              <li>
                <button
                  part="page"
                  type="button"
                  ?disabled=${this.disabled}
                  aria-current=${isCurrent ? 'page' : nothing}
                  aria-label=${this.t('pageLabel', { page: item })}
                  @click=${() => this.goToPage(item)}
                >
                  ${item}
                </button>
              </li>
            `;
          })}
          <li>
            <button
              part="next"
              type="button"
              ?disabled=${this.disabled || current >= total}
              aria-label=${this.t('nextPage')}
              @click=${() => this.goToPage(current + 1)}
            >
              ›
            </button>
          </li>
        </ul>
      </nav>
    `;
  }
}
