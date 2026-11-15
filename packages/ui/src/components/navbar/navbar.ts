import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { navbarMessages } from './navbar.messages.js';
import { navbarStyles } from './navbar.styles.js';

/**
 * `<mth-navbar>`: semantic `<header>` + `<nav>` landmark with responsive mobile disclosure.
 */
export class MthNavbar extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = navbarMessages;
  static override styles = navbarStyles;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  sticky = false;

  @query('[part="toggle"]')
  private toggleEl!: HTMLButtonElement | null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncStates();
  }

  private syncStates(): void {
    this.setCustomState('open', this.open);
    this.setCustomState('sticky', this.sticky);
  }

  private setOpenState(nextOpen: boolean, reason: string, restoreFocus = false): void {
    if (nextOpen === this.open) return;

    if (nextOpen) {
      const ok = this.emitEvent('mth-open', { detail: { open: true as const }, cancelable: true });
      if (!ok) return;
      this.open = true;
      this.emitEvent('mth-change', { detail: { open: true } });
    } else {
      this.open = false;
      this.emitEvent('mth-close', { detail: { open: false as const, reason } });
      this.emitEvent('mth-change', { detail: { open: false } });
      if (restoreFocus) {
        this.toggleEl?.focus();
      }
    }
  }

  private readonly handleToggleClick = (): void => {
    this.setOpenState(!this.open, 'toggle');
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.open) {
      event.preventDefault();
      this.setOpenState(false, 'escape', true);
    }
  };

  override render() {
    const navLabel = this.label.trim() || this.t('navbarLabel');
    const toggleLabel = this.open ? this.t('closeMenu') : this.t('openMenu');

    return html`
      <header part="base" @keydown=${this.handleKeyDown}>
        <div part="inner">
          <div part="brand"><slot name="brand"></slot></div>
          <nav part="nav" aria-label=${navLabel}><slot></slot></nav>
          <div part="actions"><slot name="actions"></slot></div>
          <button
            part="toggle"
            type="button"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-navbar-drawer"
            aria-label=${toggleLabel}
            @click=${this.handleToggleClick}
          >
            ${this.open ? '✕' : '☰'}
          </button>
        </div>
        <div id="mth-navbar-drawer" part="drawer" ?hidden=${!this.open}>
          <slot name="mobile"></slot>
        </div>
      </header>
    `;
  }
}
