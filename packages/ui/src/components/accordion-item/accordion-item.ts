import { UIElement, type PropertyValues } from '@methane/core';
import { MotionController, type MotionPhase } from '@methane/primitives';
import { html, nothing, svg } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { accordionItemMessages } from './accordion-item.messages.js';
import { accordionItemStyles } from './accordion-item.styles.js';

/**
 * `<mth-accordion-item>`: individual disclosure item for `<mth-accordion>` with
 * same-root `button[aria-expanded][aria-controls]` and `role="region"` panel
 * animated via `MotionController`.
 */
export class MthAccordionItem extends UIElement {
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = accordionItemMessages;
  static override styles = accordionItemStyles;

  @property({ type: String, reflect: true })
  value = '';

  @property({ type: String })
  heading = '';

  @property({ type: Boolean, reflect: true })
  expanded = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  private _motionPhase: MotionPhase = 'closed';

  @query('#mth-acc-trigger')
  private triggerEl!: HTMLButtonElement | null;

  @query('#mth-acc-panel')
  private panelEl!: HTMLElement | null;

  private readonly motionCtrl: MotionController;
  private hasHydrated = false;

  constructor() {
    super();
    this.motionCtrl = new MotionController(this, {
      target: () => this.panelEl,
      enterKeyframes: [{ opacity: 0 }, { opacity: 1 }],
      exitKeyframes: [{ opacity: 1 }, { opacity: 0 }],
      durationMs: 140,
      respectReducedMotion: true,
      onPhaseChange: (phase) => {
        this._motionPhase = phase;
      },
    });
  }

  get motionPhase(): MotionPhase {
    return this._motionPhase;
  }

  get triggerElement(): HTMLButtonElement | null {
    return this.triggerEl;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('expanded', this.expanded);
    this.setCustomState('disabled', this.disabled);
    if (this.expanded) {
      this.motionCtrl.setImmediatePhase('open');
      this._motionPhase = 'open';
    }
  }

  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.hasHydrated = true;
    if (this.expanded && this.motionCtrl.phase !== 'open') {
      this.motionCtrl.setImmediatePhase('open');
      this._motionPhase = 'open';
    }
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (changedProperties.has('expanded')) {
      this.setCustomState('expanded', this.expanded);
      if (this.hasHydrated) {
        if (this.expanded) {
          void this.motionCtrl.open();
        } else {
          void this.motionCtrl.close();
        }
      } else {
        this.motionCtrl.setImmediatePhase(this.expanded ? 'open' : 'closed');
        this._motionPhase = this.expanded ? 'open' : 'closed';
      }
    }
  }

  private readonly handleTriggerClick = (): void => {
    if (this.disabled) return;
    const allowed = this.emitEvent('mth-toggle', {
      cancelable: true,
      detail: {
        value: this.value,
        expanded: !this.expanded,
      },
    });
    if (allowed) {
      this.expanded = !this.expanded;
    }
  };

  override render() {
    const panelHidden = !this.expanded && this._motionPhase === 'closed';

    return html`
      <div part="base" class="base">
        <h3 part="header" class="header">
          <button
            id="mth-acc-trigger"
            part="trigger"
            class="trigger"
            type="button"
            aria-expanded=${this.expanded ? 'true' : 'false'}
            aria-controls="mth-acc-panel"
            aria-disabled=${this.disabled ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${this.handleTriggerClick}
          >
            <span part="heading" class="heading">
              <slot name="header">${this.heading}</slot>
            </span>
            <span part="indicator" class="indicator" aria-hidden="true">
              ${svg`<svg class="chevron-svg" viewBox="0 0 20 20">
                <path d="M5 7.5l5 5 5-5"></path>
              </svg>`}
            </span>
          </button>
        </h3>
        <div
          id="mth-acc-panel"
          part="panel"
          class="panel"
          role="region"
          aria-labelledby="mth-acc-trigger"
          ?hidden=${panelHidden}
        >
          <div part="content" class="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
