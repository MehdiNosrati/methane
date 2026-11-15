import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  OverlayController,
  PositioningController,
  RovingFocusController,
  type OverlayCloseReason,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { megaMenuMessages } from './mega-menu.messages.js';
import {
  EMPTY_MEGA_MENU_SECTIONS,
  type MegaMenuColumn,
  type MegaMenuLink,
  type MegaMenuSection,
} from './mega-menu.spec.js';
import { megaMenuStyles } from './mega-menu.styles.js';

export type { MegaMenuColumn, MegaMenuLink, MegaMenuSection };

function isSafeHref(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^(\/|\.\/|\.\.\/|\?|#)/.test(trimmed)) return !trimmed.startsWith('//');
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) return !trimmed.startsWith('//');
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http' || scheme === 'mailto' || scheme === 'tel';
}

/**
 * `<mth-mega-menu>`: Multi-column expandable navigation menu combining horizontal
 * `RovingFocusController` triggers with `OverlayController` + `PositioningController`.
 */
export class MthMegaMenu extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = megaMenuMessages;
  static override styles = [megaMenuStyles];

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, attribute: 'open-section', reflect: true })
  openSection = '';

  @property({ type: Number, attribute: 'hover-delay' })
  hoverDelay = 120;

  @property({ type: Boolean, attribute: 'force-fallback' })
  forceFallback = false;

  @property({ attribute: false })
  sections: ReadonlyArray<MegaMenuSection> = EMPTY_MEGA_MENU_SECTIONS;

  @query('#mth-mm-nav')
  private navEl!: HTMLElement | null;

  @query('#mth-mm-panel')
  private panelEl!: HTMLElement | null;

  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly rovingCtrl: RovingFocusController;

  private syncingOpen = false;
  private isHydratingSync = false;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'horizontal',
      loop: true,
      getItems: () =>
        Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="trigger"]') ?? []),
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      surface: () => this.panelEl,
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      forceFallback: this.forceFallback,
      onSetCustomState: (name, active) => {
        this.setCustomState(name, active);
      },
      onOpenChange: (nextOpen) => {
        this.syncingOpen = true;
        this.open = nextOpen;
        if (!nextOpen) {
          this.openSection = '';
          this.positioningCtrl.stop();
        }
        this.syncingOpen = false;
        this.setCustomState('open', nextOpen);
        this.requestUpdate();
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.navEl ?? this,
      floating: () => this.panelEl,
      placement: 'bottom-start',
      offset: 4,
      flip: true,
      shift: true,
      forceFallback: this.forceFallback,
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearHoverTimer();
  }

  protected override onFirstConnect(): void {
    this.isHydratingSync = true;
    this.setCustomState('open', this.open);
    this.isHydratingSync = false;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.rovingCtrl.updateOptions({
      dir: this.closest('[dir]') ? 'auto' : this.resolvedDir,
    });
    if (changed.has('forceFallback')) {
      this.overlayCtrl.updateOptions({ forceFallback: this.forceFallback });
      this.positioningCtrl.updateOptions({ forceFallback: this.forceFallback });
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('sections')) {
      this.rovingCtrl.syncTabIndices();
    }
    if (changed.has('open') && !this.syncingOpen && !this.isHydratingSync) {
      if (this.open) {
        void this.show(this.openSection || undefined);
      } else {
        void this.hide('programmatic');
      }
    }
  }

  async show(sectionId?: string): Promise<boolean> {
    await this.updateComplete;
    const targetSection =
      sectionId ??
      (this.openSection ||
        this.sections.find((s) => !s.disabled && Boolean(s.columns?.length))?.id ||
        this.sections[0]?.id ||
        '');

    this.openSection = targetSection;
    const opened = await this.overlayCtrl.show();
    if (opened) {
      this.syncingOpen = true;
      this.open = true;
      this.syncingOpen = false;
      this.positioningCtrl.updateOptions({ forceFallback: this.forceFallback });
      await this.positioningCtrl.start();
    }
    return opened;
  }

  async hide(reason: OverlayCloseReason = 'programmatic'): Promise<boolean> {
    this.clearHoverTimer();
    const closed = await this.overlayCtrl.hide(reason);
    if (closed) {
      this.syncingOpen = true;
      this.open = false;
      this.openSection = '';
      this.syncingOpen = false;
      this.positioningCtrl.stop();
    }
    return closed;
  }

  private clearHoverTimer(): void {
    if (this.hoverTimer !== null) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  private handleTriggerClick(section: MegaMenuSection): void {
    if (section.disabled) return;
    if (!section.columns?.length && section.href && isSafeHref(section.href)) {
      this.emitEvent('mth-select', {
        detail: { sectionId: section.id, href: section.href.trim(), label: section.label },
      });
      void this.hide('programmatic');
      return;
    }
    if (this.open && this.openSection === section.id) {
      void this.hide('invoker');
    } else {
      void this.show(section.id);
    }
  }

  private handleTriggerEnter(section: MegaMenuSection): void {
    if (section.disabled || !section.columns?.length || this.hoverDelay <= 0) return;
    this.clearHoverTimer();
    this.hoverTimer = setTimeout(() => {
      void this.show(section.id);
    }, this.hoverDelay);
  }

  private handleTriggerKeyDown(event: KeyboardEvent, section: MegaMenuSection): void {
    if (section.disabled) return;
    if (event.key === 'ArrowDown' && section.columns?.length) {
      event.preventDefault();
      void this.show(section.id).then(() => {
        const firstLink = this.panelEl?.querySelector<HTMLElement>('[part="link"]');
        firstLink?.focus();
      });
    } else if (event.key === 'Escape' && this.open) {
      event.preventDefault();
      void this.hide('escape');
    }
  }

  private handleLinkClick(event: Event, sectionId: string, link: MegaMenuLink): void {
    if (!isSafeHref(link.href)) {
      event.preventDefault();
    }
    this.emitEvent('mth-select', {
      detail: {
        sectionId,
        href: isSafeHref(link.href) ? link.href.trim() : '#',
        label: link.label,
      },
    });
    void this.hide('programmatic');
  }

  protected override render() {
    const navLabel = this.label.trim() || this.t('navLabel');
    const activeSection =
      this.sections.find((s) => s.id === this.openSection) ??
      this.sections.find((s) => Boolean(s.columns?.length));

    return html`
      <nav id="mth-mm-nav" part="nav" aria-label=${navLabel}>
        <slot name="brand"></slot>

        <ul id="mth-mm-triggers" part="triggers">
          ${this.sections.map((section) => {
            const hasPanel = Boolean(section.columns && section.columns.length > 0);
            const isExpanded = this.open && this.openSection === section.id;
            return html`
              <li>
                <button
                  part="trigger"
                  type="button"
                  ?disabled=${Boolean(section.disabled)}
                  aria-disabled=${section.disabled ? 'true' : nothing}
                  aria-expanded=${hasPanel ? (isExpanded ? 'true' : 'false') : nothing}
                  aria-controls=${hasPanel ? 'mth-mm-panel' : nothing}
                  @click=${() => this.handleTriggerClick(section)}
                  @pointerenter=${() => this.handleTriggerEnter(section)}
                  @pointerleave=${() => this.clearHoverTimer()}
                  @keydown=${(e: KeyboardEvent) => this.handleTriggerKeyDown(e, section)}
                >
                  <span>${section.label}</span>
                  ${hasPanel ? html`<span aria-hidden="true">▾</span>` : nothing}
                </button>
              </li>
            `;
          })}
        </ul>
      </nav>

      <div
        id="mth-mm-panel"
        part="panel"
        popover="manual"
        aria-label=${activeSection?.label || this.t('panelLabel')}
        ?hidden=${!this.open}
      >
        ${activeSection?.columns?.length
          ? html`
              <div part="columns">
                ${activeSection.columns.map(
                  (col) => html`
                    <section>
                      <h3 part="column-title">${col.title}</h3>
                      <ul class="mm-links">
                        ${col.links.map((link) => {
                          const href = isSafeHref(link.href) ? link.href.trim() : '#';
                          return html`
                            <li>
                              <a
                                part="link"
                                href=${href}
                                @click=${(e: Event) =>
                                  this.handleLinkClick(e, activeSection.id, link)}
                              >
                                <span>${link.label}</span>
                                ${link.description
                                  ? html`<span part="description">${link.description}</span>`
                                  : nothing}
                              </a>
                            </li>
                          `;
                        })}
                      </ul>
                    </section>
                  `,
                )}
              </div>
            `
          : html`<slot></slot>`}
      </div>
    `;
  }
}
