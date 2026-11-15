import { devWarn, UIElement, type PropertyValues } from '@methane-ui/core';
import { RovingFocusController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { galleryMessages } from './gallery.messages.js';
import { galleryStyles } from './gallery.styles.js';

export interface GalleryItem {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly thumbnail?: string;
}

function isSafeMediaUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return false;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\\\')) {
    return false;
  }
  if (/^(\/|\.\/|\.\.\/)/.test(trimmed)) return true;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) return !trimmed.startsWith('//');
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http';
}

/**
 * `<mth-gallery>`: composite media gallery pairing public `<mth-carousel>` and
 * `<mth-lightbox>` elements with a roving-focus thumbnail strip and zero internal imports.
 */
export class MthGallery extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = galleryMessages;
  static override styles = galleryStyles;

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  items: ReadonlyArray<GalleryItem> | null = null;

  @property({ type: Number, attribute: 'active-index', reflect: true })
  activeIndex = 0;

  @property({ type: Boolean, attribute: 'lightbox-open', reflect: true })
  lightboxOpen = false;

  @property({ type: Boolean, reflect: true })
  loop = true;

  @property({ type: Boolean, attribute: 'show-thumbnails' })
  showThumbnails = true;

  private readonly rovingCtrl: RovingFocusController;

  constructor() {
    super();

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="thumbnail"]') ?? []),
      orientation: 'horizontal',
      loop: true,
      onActiveChange: (_item, index) => {
        if (index >= 0 && index !== this.activeIndex) {
          this.selectIndex(index);
        }
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('lightbox-open', this.lightboxOpen);
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('lightboxOpen')) {
      this.setCustomState('lightbox-open', this.lightboxOpen);
    }
    this.rovingCtrl.syncTabIndices();
  }

  selectIndex(index: number): void {
    const safeItems = this.getSafeItems();
    if (safeItems.length === 0) return;
    const clamped = Math.max(0, Math.min(safeItems.length - 1, index));
    if (clamped === this.activeIndex) return;
    this.activeIndex = clamped;
    this.rovingCtrl.setActiveIndex(clamped, false);
    this.dispatchEvent(
      new CustomEvent<{ index: number; item: GalleryItem | null }>('mth-change', {
        bubbles: true,
        composed: true,
        detail: { index: clamped, item: safeItems[clamped] ?? null },
      }),
    );
  }

  openLightbox(index = this.activeIndex): void {
    const safeItems = this.getSafeItems();
    if (safeItems.length === 0) return;
    const clamped = Math.max(0, Math.min(safeItems.length - 1, index));
    this.activeIndex = clamped;
    this.lightboxOpen = true;
    this.dispatchEvent(
      new CustomEvent<{ index: number }>('mth-lightbox-open', {
        bubbles: true,
        composed: true,
        detail: { index: clamped },
      }),
    );
  }

  closeLightbox(): void {
    if (!this.lightboxOpen) return;
    this.lightboxOpen = false;
    this.dispatchEvent(
      new CustomEvent('mth-lightbox-close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private getSafeItems(): ReadonlyArray<GalleryItem> {
    const raw = this.items ?? [];
    const safe: GalleryItem[] = [];
    for (const item of raw) {
      if (!isSafeMediaUrl(item.src)) {
        devWarn(`<mth-gallery> rejected unsafe src "${item.src}".`);
        continue;
      }
      const thumb = item.thumbnail && isSafeMediaUrl(item.thumbnail) ? item.thumbnail.trim() : item.src.trim();
      safe.push({
        ...item,
        src: item.src.trim(),
        thumbnail: thumb,
      });
    }
    return safe;
  }

  private handleCarouselChange = (e: Event): void => {
    const detail = (e as CustomEvent<{ index?: number }>).detail;
    if (typeof detail?.index === 'number') {
      this.selectIndex(detail.index);
    }
  };

  private handleLightboxClose = (): void => {
    this.closeLightbox();
  };

  protected override render() {
    const safeItems = this.getSafeItems();
    const galleryLabel = this.label || this.t('galleryLabel');

    return html`
      <div class="base" part="base" role="region" aria-label=${galleryLabel}>
        <mth-carousel
          exportparts="track,controls,prev-button,next-button,indicators,indicator"
          label=${galleryLabel}
          current-index=${this.activeIndex}
          ?loop=${this.loop}
          show-controls
          ?show-indicators=${!this.showThumbnails}
          @mth-change=${this.handleCarouselChange}
        >
          ${safeItems.map(
            (item, idx) => {
              const itemLabel = item.alt || this.t('itemLabel', { index: idx + 1 });
              return html`
              <mth-carousel-item label=${itemLabel}>
                <button
                  type="button"
                  class="slide-button"
                  part="slide-button"
                  aria-label=${`${this.t('openLightboxLabel')} ${itemLabel}`}
                  @click=${() => this.openLightbox(idx)}
                >
                  <img class="slide-image" part="slide-image" src=${item.src} alt=${item.alt} />
                </button>
                ${item.caption ? html`<div class="caption" part="caption">${item.caption}</div>` : nothing}
              </mth-carousel-item>
            `;
            },
          )}
        </mth-carousel>

        ${this.showThumbnails && safeItems.length > 1
          ? html`
              <div
                class="thumbnails"
                part="thumbnails"
                role="group"
                aria-label=${this.t('thumbnailsLabel')}
              >
                ${safeItems.map(
                  (item, idx) => html`
                    <button
                      type="button"
                      class="thumbnail"
                      part="thumbnail"
                      aria-label=${item.alt || this.t('thumbnailLabel', { index: idx + 1 })}
                      aria-pressed=${this.activeIndex === idx ? 'true' : 'false'}
                      @click=${() => this.selectIndex(idx)}
                    >
                      <img src=${item.thumbnail ?? item.src} alt="" />
                    </button>
                  `,
                )}
              </div>
            `
          : nothing}

        <mth-lightbox
          ?open=${this.lightboxOpen}
          .items=${safeItems}
          index=${this.activeIndex}
          label=${galleryLabel}
          @mth-close=${this.handleLightboxClose}
          @mth-change=${this.handleCarouselChange}
        ></mth-lightbox>
      </div>
    `;
  }
}
