import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { avatarMessages } from './avatar.messages.js';
import { avatarStyles } from './avatar.styles.js';

export type MthAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type MthAvatarShape = 'circle' | 'square';
export type MthAvatarStatus = '' | 'online' | 'busy' | 'away' | 'offline';

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]!;
  if (parts.length === 1) {
    return first.slice(0, 2).toUpperCase();
  }
  const last = parts[parts.length - 1]!;
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/**
 * `<mth-avatar>`: user or entity avatar with `<img>` error fallback to computed
 * initials or silhouette SVG, `shape`, `size`, and presence `status`.
 */
export class MthAvatar extends UIElement {
  static override messages = avatarMessages;
  static override styles = avatarStyles;

  @property({ type: String })
  src = '';

  @property({ type: String })
  alt = '';

  @property({ type: String })
  name = '';

  @property({ type: String, reflect: true })
  size: MthAvatarSize = 'md';

  @property({ type: String, reflect: true })
  shape: MthAvatarShape = 'circle';

  @property({ type: String, reflect: true })
  status: MthAvatarStatus = '';

  @state()
  private imgError = false;

  @state()
  private imgLoaded = false;

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('src')) {
      this.imgError = false;
      this.imgLoaded = false;
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.setCustomState('error', this.imgError);
    this.setCustomState('loaded', this.imgLoaded && !this.imgError);
  }

  private readonly handleImgLoad = (): void => {
    this.imgLoaded = true;
    this.imgError = false;
  };

  private readonly handleImgError = (): void => {
    this.imgError = true;
    this.imgLoaded = false;
  };

  private getStatusLabel(): string {
    switch (this.status) {
      case 'online':
        return this.t('statusOnline');
      case 'busy':
        return this.t('statusBusy');
      case 'away':
        return this.t('statusAway');
      case 'offline':
        return this.t('statusOffline');
      default:
        return '';
    }
  }

  private renderFallback() {
    const label = this.alt.trim() || this.name.trim() || this.t('avatarLabel');
    const initials = computeInitials(this.name);
    if (initials.length > 0) {
      return html`
        <span part="initials" class="initials" role="img" aria-label=${label}>
          ${initials}
        </span>
      `;
    }
    return html`
      <span part="fallback" class="fallback" role="img" aria-label=${label}>
        ${svg`<svg class="fallback-svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M5 20a7 7 0 0 1 14 0"></path>
        </svg>`}
      </span>
    `;
  }

  override render() {
    const showImage = this.src.trim().length > 0 && !this.imgError;
    const accessibleAlt = this.alt.trim() || this.name.trim() || this.t('avatarLabel');
    const statusLabel = this.getStatusLabel();

    return html`
      <div part="base" class="base" data-size=${this.size} data-shape=${this.shape}>
        <div class="frame">
          <slot>
            ${showImage
              ? html`
                  <img
                    part="image"
                    class="image"
                    src=${this.src}
                    alt=${accessibleAlt}
                    @load=${this.handleImgLoad}
                    @error=${this.handleImgError}
                  />
                `
              : this.renderFallback()}
          </slot>
        </div>
        ${this.status
          ? html`
              <span
                part="status"
                class="status"
                data-status=${this.status}
                role="img"
                aria-label=${statusLabel}
              ></span>
            `
          : nothing}
      </div>
    `;
  }
}
