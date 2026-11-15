import { UIElement, type PropertyValues } from '@methane/core';
import { OverlayController, type OverlayCloseReason } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { cookieBannerMessages } from './cookie-banner.messages.js';
import { cookieBannerStyles } from './cookie-banner.styles.js';

export type CookieBannerPosition = 'bottom' | 'top' | 'floating';

export interface CookieConsentDetail {
  readonly essential: true;
  readonly analytics: boolean;
  readonly marketing: boolean;
}

/**
 * `<mth-cookie-banner>`: accessible cookie consent banner with one-click accept/reject
 * and expandable category toggles.
 */
export class MthCookieBanner extends UIElement {
  static override messages = cookieBannerMessages;
  static override styles = cookieBannerStyles;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  position: CookieBannerPosition = 'bottom';

  @property({ type: String })
  heading = '';

  @property({ type: Boolean, reflect: true })
  analytics = false;

  @property({ type: Boolean, reflect: true })
  marketing = false;

  @property({ type: Boolean, attribute: 'show-preferences', reflect: true })
  showPreferences = false;

  @query('.banner')
  private surfaceEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private triggerEl: HTMLElement | null = null;
  private syncingFromController = false;

  constructor() {
    super();
    this.overlayCtrl = new OverlayController(this, {
      mode: 'non-modal',
      surface: () => this.surfaceEl,
      trigger: () => this.triggerEl,
      closeOnEscape: true,
      lightDismiss: false,
      restoreFocus: true,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingFromController = true;
        this.open = nextOpen;
        this.syncingFromController = false;
        this.setCustomState('open', nextOpen);
      },
    });
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('showPreferences')) {
      this.setCustomState('preferences-open', this.showPreferences);
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('open') && !this.syncingFromController) {
      if (this.open && !this.overlayCtrl.open) {
        void this.overlayCtrl.show();
      } else if (!this.open && this.overlayCtrl.open) {
        void this.overlayCtrl.hide('programmatic');
      }
    }
  }

  public show(trigger?: HTMLElement | null): Promise<boolean> {
    if (trigger !== undefined) {
      this.triggerEl = trigger;
    }
    return this.overlayCtrl.show();
  }

  public hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    return this.overlayCtrl.hide(reason);
  }

  public acceptAll(): void {
    this.analytics = true;
    this.marketing = true;
    this.emitConsent();
    void this.hide('invoker');
  }

  public rejectOptional(): void {
    this.analytics = false;
    this.marketing = false;
    this.emitConsent();
    void this.hide('invoker');
  }

  public savePreferences(): void {
    this.emitConsent();
    void this.hide('invoker');
  }

  private emitConsent(): void {
    const detail: CookieConsentDetail = {
      essential: true,
      analytics: this.analytics,
      marketing: this.marketing,
    };
    this.emitEvent('mth-consent', { detail });
  }

  protected override render() {
    const headingText = this.heading || this.t('defaultHeading');

    return html`
      <section
        class="banner"
        part="base"
        role="region"
        aria-label=${this.t('regionLabel')}
        ?hidden=${!this.open}
      >
        <div class="content" part="content">
          <h2 class="heading" part="heading">${headingText}</h2>
          <p class="copy">
            <slot>${this.t('defaultBody')}</slot>
          </p>
        </div>

        <div class="preferences" part="preferences" ?hidden=${!this.showPreferences}>
          <label class="pref-item">
            <input type="checkbox" checked disabled />
            <span>${this.t('essentialLabel')}</span>
          </label>
          <label class="pref-item">
            <input
              type="checkbox"
              .checked=${this.analytics}
              @change=${(e: Event) => {
                this.analytics = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>${this.t('analyticsLabel')}</span>
          </label>
          <label class="pref-item">
            <input
              type="checkbox"
              .checked=${this.marketing}
              @change=${(e: Event) => {
                this.marketing = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>${this.t('marketingLabel')}</span>
          </label>
        </div>

        <div class="actions" part="actions">
          <slot name="actions"></slot>
          <button
            type="button"
            class="btn"
            part="customize-button"
            aria-expanded=${String(this.showPreferences)}
            @click=${() => {
              this.showPreferences = !this.showPreferences;
            }}
          >
            ${this.t('customizeLabel')}
          </button>
          <button
            type="button"
            class="btn"
            part="reject-button"
            @click=${() => this.rejectOptional()}
          >
            ${this.t('rejectOptionalLabel')}
          </button>
          ${this.showPreferences
            ? html`
                <button
                  type="button"
                  class="btn btn-primary"
                  part="save-button"
                  @click=${() => this.savePreferences()}
                >
                  ${this.t('savePreferencesLabel')}
                </button>
              `
            : nothing}
          <button
            type="button"
            class="btn btn-primary"
            part="accept-button"
            @click=${() => this.acceptAll()}
          >
            ${this.t('acceptAllLabel')}
          </button>
        </div>
      </section>
    `;
  }
}
