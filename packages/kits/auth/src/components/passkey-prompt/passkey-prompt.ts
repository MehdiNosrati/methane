import { UIElement, html, nothing, property, state } from '@methane/core';
import { passkeyPromptMessages } from './passkey-prompt.messages.js';
import { passkeyPromptStyles } from './passkey-prompt.styles.js';

export type MthPasskeyMode = 'signin' | 'register';
export type MthPasskeyStatus = 'idle' | 'pending' | 'success' | 'error' | 'unsupported';

interface PublicKeyCredentialLike {
  isConditionalMediationAvailable?: () => Promise<boolean>;
}

/**
 * `<mth-passkey-prompt>`: WebAuthn passkey prompt with `PublicKeyCredential` feature detection,
 * conditional mediation awareness, status live region, and fallback method action.
 */
export class MthPasskeyPrompt extends UIElement {
  static override messages = passkeyPromptMessages;
  static override styles = passkeyPromptStyles;

  @property({ type: String, reflect: true })
  mode: MthPasskeyMode = 'signin';

  @property({ type: String, reflect: true })
  status: MthPasskeyStatus = 'idle';

  @property({ type: String })
  username = '';

  @property({ type: String })
  error = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  conditional = true;

  @property({ type: Boolean, reflect: true, attribute: 'allow-fallback' })
  allowFallback = true;

  @state()
  private conditionalSupported = false;

  get isWebAuthnSupported(): boolean {
    return (
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential === 'function'
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();
    void this.detectWebAuthnCapabilities();
  }

  async detectWebAuthnCapabilities(): Promise<boolean> {
    if (!this.isWebAuthnSupported) {
      this.conditionalSupported = false;
      return false;
    }

    if (this.conditional) {
      const pkc = (globalThis as { PublicKeyCredential?: PublicKeyCredentialLike }).PublicKeyCredential;
      if (typeof pkc?.isConditionalMediationAvailable === 'function') {
        try {
          this.conditionalSupported = Boolean(await pkc.isConditionalMediationAvailable());
        } catch {
          this.conditionalSupported = false;
        }
      }
    }

    return true;
  }

  private handlePrimaryAction(): void {
    if (this.disabled || this.status === 'pending' || !this.isWebAuthnSupported) return;
    this.emitEvent('mth-passkey-auth', {
      detail: {
        mode: this.mode,
        username: this.username,
        conditionalSupported: this.conditionalSupported,
      },
    });
  }

  private handleFallback(): void {
    if (this.disabled) return;
    this.emitEvent('mth-fallback', {
      detail: {
        mode: this.mode,
        reason: this.isWebAuthnSupported ? 'user-choice' : 'unsupported',
      },
    });
  }

  private resolveStatusBanner(): { tone: string; text: string } | null {
    if (this.error.trim()) {
      return { tone: 'danger', text: this.error };
    }
    if (!this.isWebAuthnSupported || this.status === 'unsupported') {
      return { tone: 'warning', text: this.t('unsupportedLabel') };
    }
    if (this.status === 'pending') {
      return { tone: 'neutral', text: this.t('pendingLabel') };
    }
    if (this.status === 'success') {
      return { tone: 'success', text: this.t('successLabel') };
    }
    return null;
  }

  private resolveEffectiveDir(): 'ltr' | 'rtl' {
    return (this.closest('[dir]')?.getAttribute('dir')?.toLowerCase() ?? this.resolvedDir) === 'rtl'
      ? 'rtl'
      : 'ltr';
  }

  override render() {
    const supported = this.isWebAuthnSupported;
    const effectiveStatus: MthPasskeyStatus = !supported && this.status === 'idle' ? 'unsupported' : this.status;
    const banner = this.resolveStatusBanner();
    const ctaDisabled = this.disabled || effectiveStatus === 'pending' || !supported;

    return html`
      <section part="base" class="card" dir=${this.resolveEffectiveDir()} aria-labelledby="mth-pk-title">
        <div class="header-row">
          <div class="title-group">
            <span class="icon-box" aria-hidden="true">
              <mth-icon name="user"></mth-icon>
            </span>
            <h2 class="title" id="mth-pk-title">
              ${this.mode === 'register' ? this.t('registerTitle') : this.t('signinTitle')}
            </h2>
          </div>
          ${this.conditionalSupported && supported
            ? html`<mth-badge variant="info">${this.t('conditionalBadge')}</mth-badge>`
            : nothing}
        </div>

        <p class="description">
          ${this.mode === 'register' ? this.t('registerDescription') : this.t('signinDescription')}
        </p>

        ${this.username
          ? html`<p class="account-text">${this.t('accountLabel', { username: this.username })}</p>`
          : nothing}

        <div
          class="status-banner"
          role="status"
          aria-live="polite"
          data-tone=${banner?.tone ?? 'neutral'}
          ?hidden=${banner === null}
        >
          ${effectiveStatus === 'pending' ? html`<mth-spinner size="sm"></mth-spinner>` : nothing}
          ${banner?.tone === 'success' ? html`<mth-icon name="success"></mth-icon>` : nothing}
          ${banner?.tone === 'warning' ? html`<mth-icon name="warning"></mth-icon>` : nothing}
          ${banner?.tone === 'danger' ? html`<mth-icon name="error"></mth-icon>` : nothing}
          <span>${banner?.text ?? ''}</span>
        </div>

        <div class="actions">
          <button
            type="button"
            part="action"
            class="primary-btn"
            ?disabled=${ctaDisabled}
            @click=${this.handlePrimaryAction}
          >
            ${this.mode === 'register' ? this.t('registerButton') : this.t('signinButton')}
          </button>

          ${this.allowFallback
            ? html`
                <button
                  type="button"
                  part="fallback"
                  class="fallback-btn"
                  ?disabled=${this.disabled}
                  @click=${this.handleFallback}
                >
                  ${this.t('fallbackButton')}
                </button>
              `
            : nothing}
        </div>

        <slot></slot>
      </section>
    `;
  }
}
