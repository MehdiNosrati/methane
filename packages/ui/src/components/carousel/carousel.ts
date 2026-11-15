import { UIElement, type PropertyValues } from '@methane/core';
import {
  MotionController,
  ObserverPoolController,
  RovingFocusController,
  SlotCollectionController,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { carouselMessages } from './carousel.messages.js';
import { carouselStyles } from './carousel.styles.js';

type CarouselSlideElement = HTMLElement & {
  label?: string;
  value?: string;
  active?: boolean;
};

function isCarouselSlide(el: Element): el is CarouselSlideElement {
  return (
    el instanceof HTMLElement &&
    (el.tagName.toLowerCase() === 'mth-carousel-item' || el.getAttribute('role') === 'group')
  );
}

/**
 * `<mth-carousel>`: scroll-snap slide carousel with progressive CSS scroll-button
 * enhancement, prev/next controls, RTL-aware roving indicator tabs, and autoplay.
 */
export class MthCarousel extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = carouselMessages;
  static override styles = carouselStyles;

  @property({ type: String })
  label = '';

  @property({ type: Number, attribute: 'current-index', reflect: true })
  currentIndex = 0;

  @property({ type: Number, attribute: 'slides-per-view' })
  slidesPerView = 1;

  @property({ type: Boolean, reflect: true })
  loop = false;

  @property({ type: Boolean, reflect: true })
  autoplay = false;

  @property({ type: Number })
  interval = 5000;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = true;

  @property({ type: Boolean, attribute: 'show-indicators' })
  showIndicators = true;

  @state()
  private slides: ReadonlyArray<CarouselSlideElement> = [];

  @query('.track')
  private trackEl!: HTMLElement;

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private isPaused = false;
  private layoutSheet: CSSStyleSheet | null = null;
  private observedTrack: HTMLElement | null = null;
  private readonly slotCtrl: SlotCollectionController<CarouselSlideElement>;
  private readonly rovingCtrl: RovingFocusController;
  private readonly observerCtrl: ObserverPoolController;
  private readonly motionCtrl: MotionController;

  constructor() {
    super();

    this.slotCtrl = new SlotCollectionController<CarouselSlideElement>(this, {
      filter: isCarouselSlide,
      attributeFilter: ['label', 'value'],
      onItemsChange: (items) => {
        this.slides = items;
        this.syncSlideAttributes();
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="indicator"]') ?? []),
      orientation: 'horizontal',
      loop: true,
      onActiveChange: (_item, index) => {
        if (index >= 0 && index !== this.currentIndex) {
          this.goTo(index);
        }
      },
    });

    this.observerCtrl = new ObserverPoolController(this);
    this.motionCtrl = new MotionController(this);
  }

  get slideCount(): number {
    return this.slides.length;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const existing = Array.from(this.children ?? []).filter(isCarouselSlide);
    if (existing.length > 0 && this.slides.length === 0) {
      this.slides = existing;
      this.syncSlideAttributes();
    }
    this.syncLayoutSheet();
    this.setCustomState('autoplay', this.autoplay);
    if (this.autoplay) {
      this.startAutoplay();
    }
  }

  override disconnectedCallback(): void {
    this.observedTrack = null;
    this.stopAutoplay();
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (this.trackEl && this.observedTrack !== this.trackEl) {
      this.observedTrack = this.trackEl;
      this.observerCtrl.observeResize(this.trackEl, () => {
        this.scrollToActiveSlide(false);
      });
    }
    if (changed.has('slidesPerView')) {
      this.syncLayoutSheet();
    }
    if (changed.has('currentIndex')) {
      this.syncSlideAttributes();
      this.scrollToActiveSlide(true);
    }
    if (changed.has('autoplay') || changed.has('interval')) {
      this.setCustomState('autoplay', this.autoplay);
      this.stopAutoplay();
      if (this.autoplay) {
        this.startAutoplay();
      }
    }
    this.rovingCtrl.syncTabIndices();
  }

  next(): void {
    if (this.slides.length === 0) return;
    if (this.currentIndex < this.slides.length - 1) {
      this.goTo(this.currentIndex + 1);
    } else if (this.loop) {
      this.goTo(0);
    }
  }

  previous(): void {
    if (this.slides.length === 0) return;
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    } else if (this.loop) {
      this.goTo(this.slides.length - 1);
    }
  }

  goTo(index: number): void {
    const total = this.slides.length;
    if (total === 0) return;
    const clamped = this.loop
      ? ((index % total) + total) % total
      : Math.max(0, Math.min(total - 1, index));
    if (clamped === this.currentIndex) return;
    this.currentIndex = clamped;
    this.rovingCtrl.setActiveIndex(clamped, false);
    this.dispatchEvent(
      new CustomEvent<{ index: number; total: number }>('mth-change', {
        bubbles: true,
        composed: true,
        detail: { index: clamped, total },
      }),
    );
  }

  private syncLayoutSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.layoutSheet) {
      this.layoutSheet = new CSSStyleSheet();
    }
    if (typeof this.layoutSheet.replaceSync === 'function') {
      const spv = Math.max(1, Math.trunc(this.slidesPerView || 1));
      this.layoutSheet.replaceSync(`:host { --_mth-carousel-slides-per-view: ${spv}; }`);
      if (!root.adoptedStyleSheets.includes(this.layoutSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.layoutSheet];
      }
    }
  }

  private syncSlideAttributes(): void {
    const total = this.slides.length;
    if (total === 0) return;
    const safeIdx = Math.max(0, Math.min(total - 1, this.currentIndex));
    this.slides.forEach((slide, idx) => {
      const isActive = idx === safeIdx;
      slide.active = isActive;
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  private scrollToActiveSlide(smooth: boolean): void {
    const track = this.trackEl;
    if (!track || typeof track.scrollTo !== 'function') return;
    const width = track.clientWidth || 0;
    if (width <= 0) return;
    const spv = Math.max(1, Math.trunc(this.slidesPerView || 1));
    const slideWidth = width / spv;
    const dirSign = this.resolvedDir === 'rtl' ? -1 : 1;
    const useSmooth = smooth && !this.motionCtrl.isReducedMotion;
    track.scrollTo({
      left: dirSign * slideWidth * this.currentIndex,
      behavior: useSmooth ? 'smooth' : 'auto',
    });
  }

  private startAutoplay(): void {
    if (typeof window === 'undefined' || this.motionCtrl.isReducedMotion) return;
    const delay = Math.max(500, this.interval || 5000);
    this.autoplayTimer = setInterval(() => {
      if (this.isPaused || this.slides.length <= 1 || this.motionCtrl.isReducedMotion) return;
      if (this.currentIndex >= this.slides.length - 1) {
        this.goTo(0);
      } else {
        this.next();
      }
    }, delay);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer !== null) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  protected override render() {
    const total = this.slides.length;
    const isRtl = this.resolvedDir === 'rtl';
    const prevDisabled = total <= 1 || (!this.loop && this.currentIndex <= 0);
    const nextDisabled = total <= 1 || (!this.loop && this.currentIndex >= total - 1);

    return html`
      <div
        class="base"
        part="base"
        role="region"
        aria-roledescription="carousel"
        aria-label=${this.label || this.t('carouselLabel')}
        @mouseenter=${() => {
          this.isPaused = true;
        }}
        @mouseleave=${() => {
          this.isPaused = false;
        }}
        @focusin=${() => {
          this.isPaused = true;
        }}
        @focusout=${() => {
          this.isPaused = false;
        }}
      >
        <div class="viewport">
          <div class="track" part="track">
            <slot @slotchange=${() => this.slotCtrl.refresh()}></slot>
          </div>

          ${this.showControls && total > 1
            ? html`
                <div class="controls" part="controls">
                  <button
                    type="button"
                    class="nav-btn"
                    part="prev-button"
                    aria-label=${this.t('previousSlide')}
                    ?disabled=${prevDisabled}
                    @click=${() => this.previous()}
                  >
                    ${isRtl ? '›' : '‹'}
                  </button>
                  <button
                    type="button"
                    class="nav-btn"
                    part="next-button"
                    aria-label=${this.t('nextSlide')}
                    ?disabled=${nextDisabled}
                    @click=${() => this.next()}
                  >
                    ${isRtl ? '‹' : '›'}
                  </button>
                </div>
              `
            : nothing}
        </div>

        ${this.showIndicators && total > 1
          ? html`
              <div
                class="indicators"
                part="indicators"
                role="group"
                aria-label=${this.t('slidePaginationLabel')}
              >
                ${this.slides.map((slide, idx) => {
                  const slideName = slide.label || `${this.t('goToSlide')} ${idx + 1}`;
                  return html`
                    <button
                      type="button"
                      class="indicator"
                      part="indicator"
                      aria-label=${slideName}
                      aria-pressed=${this.currentIndex === idx ? 'true' : 'false'}
                      @click=${() => this.goTo(idx)}
                    ></button>
                  `;
                })}
              </div>
            `
          : nothing}
      </div>
    `;
  }
}
