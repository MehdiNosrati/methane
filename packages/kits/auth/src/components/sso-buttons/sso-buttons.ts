import { UIElement, html, nothing, property, type PropertyValues } from '@methane/core';
import { RovingFocusController } from '@methane/primitives';
import { ssoButtonsMessages } from './sso-buttons.messages.js';
import { ssoButtonsStyles } from './sso-buttons.styles.js';

export interface SsoProviderItem {
  readonly id: string;
  readonly label?: string;
  readonly disabled?: boolean;
}

export type MthSsoOrientation = 'horizontal' | 'vertical';

/**
 * `<mth-sso-buttons>`: SSO provider button list with `RovingFocusController`
 * navigation, per-provider loading spinner, and `mth-sso-select` event.
 */
export class MthSsoButtons extends UIElement {
  static override messages = ssoButtonsMessages;
  static override styles = ssoButtonsStyles;

  @property({ attribute: false })
  providers: ReadonlyArray<SsoProviderItem> = [];

  @property({ type: String, attribute: 'loading-provider' })
  loadingProvider = '';

  @property({ type: String, reflect: true })
  orientation: MthSsoOrientation = 'vertical';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

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
    return Array.from(this.shadowRoot.querySelectorAll<HTMLElement>('[part="provider-button"]'));
  }

  private resolveEffectiveDir(): 'ltr' | 'rtl' {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
      ? 'rtl'
      : 'ltr';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.rovingCtrl.updateOptions({
      orientation: this.orientation,
      dir: this.resolveEffectiveDir(),
    });
    this.syncStates();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    this.rovingCtrl.updateOptions({
      orientation: this.orientation,
      dir: this.resolveEffectiveDir(),
    });
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('loading', this.loadingProvider.length > 0);
  }

  private handleSelect(provider: SsoProviderItem, resolvedLabel: string): void {
    if (this.disabled || provider.disabled || this.loadingProvider === provider.id) {
      return;
    }
    this.emitEvent('mth-sso-select', {
      detail: { provider: provider.id, label: resolvedLabel },
    });
  }

  override render() {
    const groupLabel = this.label || this.t('label');

    return html`
      <div class="list" part="base" role="group" aria-label=${groupLabel}>
        ${this.providers.map((provider) => {
          const displayName = provider.label ?? provider.id;
          const buttonText = this.t('continueWith', { provider: displayName });
          const isLoading = this.loadingProvider === provider.id;
          const isDisabled = this.disabled || Boolean(provider.disabled) || isLoading;

          return html`
            <button
              type="button"
              class="provider-btn"
              part="provider-button"
              ?disabled=${isDisabled}
              aria-busy=${isLoading ? 'true' : 'false'}
              @click=${() => this.handleSelect(provider, displayName)}
            >
              ${isLoading ? html`<mth-spinner size="xs"></mth-spinner>` : nothing}
              <span>${buttonText}</span>
            </button>
          `;
        })}
        <slot></slot>
      </div>
    `;
  }
}
