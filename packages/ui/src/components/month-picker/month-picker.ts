import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane/core';
import {
  FormControlController,
  FormattingUtils,
  OverlayController,
  PositioningController,
  RovingFocusController,
} from '@methane/primitives';
import { monthPickerMessages } from './month-picker.messages.js';
import { monthPickerStyles } from './month-picker.styles.js';

function parseMonthIso(val: string): { year: number; month: number } | undefined {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(val.trim());
  if (!m) return undefined;
  return { year: Number(m[1]), month: Number(m[2]) };
}

/**
 * Form-associated `YYYY-MM` month picker with 3x4 roving-focus grid.
 */
export class MthMonthPicker extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = monthPickerStyles;
  static override messages = monthPickerMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = 'YYYY-MM';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private viewYear = 2026;

  @query('[part="control"]')
  private controlEl!: HTMLElement | null;

  @query('[part="input"]')
  private inputEl!: HTMLInputElement | null;

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('[part="popover"]')
  private popoverEl!: HTMLElement | null;

  @query('.grid')
  private gridEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly rovingCtrl: RovingFocusController;
  private positionSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: monthPickerMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        const parsed = parseMonthIso(nextValue);
        if (parsed) this.viewYear = parsed.year;
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
    });

    this.overlayCtrl = new OverlayController(this, {
      mode: 'popover',
      closeOnEscape: true,
      lightDismiss: true,
      restoreFocus: true,
      surface: () => this.popoverEl,
      trigger: () => (this.shadowRoot?.activeElement === this.triggerEl ? this.triggerEl : null),
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      onOpenChange: (open) => {
        this.open = open;
        if (open) {
          this.positioningCtrl.reposition();
          this.rovingCtrl.syncTabIndices();
        }
      },
    });

    this.positioningCtrl = new PositioningController(this, {
      anchor: () => this.controlEl,
      floating: () => this.popoverEl,
      placement: 'bottom-start',
      offset: 4,
      autoUpdate: true,
      onPosition: (res) => {
        this.applyPopoverPosition(res.x, res.y);
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () =>
        this.open && this.gridEl
          ? Array.from(this.gridEl.querySelectorAll<HTMLElement>('[part="month"]'))
          : [],
      orientation: 'both',
      columns: 3,
      loop: true,
      dir: this.resolvedDir,
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.rovingCtrl.updateOptions({ dir: this.resolvedDir });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage || this.internals?.validationMessage || '';
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.closest('form');
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? '';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
    const parsed = parseMonthIso(this.value);
    if (parsed) this.viewYear = parsed.year;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('disabled')) {
      this.formCtrl.hostDisabled = this.disabled;
    }
    if (changed.has('required')) {
      this.formCtrl.required = this.required;
    }
    if (changed.has('readonly')) {
      this.formCtrl.hostReadOnly = this.readonly;
    }
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: false });
      const parsed = parseMonthIso(this.value);
      if (parsed) this.viewYear = parsed.year;
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
    if (changed.has('dir')) {
      this.rovingCtrl.updateOptions({ dir: this.resolvedDir });
    }
    if (changed.has('open') && this.open) {
      this.positioningCtrl.reposition();
      this.rovingCtrl.syncTabIndices();
    }
  }

  async show(): Promise<void> {
    if (this.effectivelyDisabled || this.readonly) return;
    await this.overlayCtrl.show();
  }

  async hide(reason: 'escape' | 'outside' | 'programmatic' | 'invoker' = 'programmatic'): Promise<void> {
    await this.overlayCtrl.hide(reason);
  }

  private applyPopoverPosition(x: number, y: number): void {
    if (
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.positionSheet) {
      this.positionSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.positionSheet,
      ];
    }
    this.positionSheet.replaceSync(
      `[part="popover"] { transform: translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0); }`,
    );
  }

  private commitMonth(iso: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.value = iso;
    this.formCtrl.setValue(iso, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: iso } });
  }

  private readonly handleInputChange = (): void => {
    const next = this.inputEl?.value.trim() ?? '';
    if (!next || parseMonthIso(next)) {
      this.commitMonth(next);
    }
  };

  private readonly handleTriggerClick = (): void => {
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  };

  private readonly handleMonthClick = (monthNum: number): void => {
    const iso = `${String(this.viewYear).padStart(4, '0')}-${String(monthNum).padStart(2, '0')}`;
    this.commitMonth(iso);
    void this.hide('programmatic');
  };

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const months = Array.from({ length: 12 }, (_, idx) => {
      const monthNum = idx + 1;
      const iso = `${String(this.viewYear).padStart(4, '0')}-${String(monthNum).padStart(2, '0')}`;
      const label = FormattingUtils.formatDate(
        new Date(Date.UTC(this.viewYear, idx, 1)),
        this.resolvedLocale,
        { month: 'short', timeZone: 'UTC' },
      );
      return { monthNum, iso, label };
    });

    return html`
      <div part="base">
        ${this.label
          ? html`<label part="label" for="mth-mp-input">${this.label}</label>`
          : nothing}
        <div part="control">
          <input
            id="mth-mp-input"
            part="input"
            type="text"
            .value=${this.value}
            placeholder=${this.placeholder}
            aria-label=${this.label || this.t('chooseMonth')}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @change=${this.handleInputChange}
          />
          <button
            part="trigger"
            type="button"
            aria-label=${this.t('chooseMonth')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="dialog"
            aria-controls="mth-mp-popover"
            ?disabled=${isDisabled || this.readonly}
            @click=${this.handleTriggerClick}
          >
            &#128197;
          </button>
        </div>
        <div
          id="mth-mp-popover"
          part="popover"
          role="dialog"
          aria-label=${this.t('chooseMonth')}
          ?hidden=${!this.open}
        >
          <div class="header">
            <button
              class="nav-btn"
              type="button"
              aria-label=${this.t('previousYear')}
              @click=${() => {
                this.viewYear -= 1;
              }}
            >
              &lsaquo;
            </button>
            <span class="year-title">${this.viewYear}</span>
            <button
              class="nav-btn"
              type="button"
              aria-label=${this.t('nextYear')}
              @click=${() => {
                this.viewYear += 1;
              }}
            >
              &rsaquo;
            </button>
          </div>
          <div class="grid" role="grid">
            ${months.map(
              (m) => html`
                <button
                  part="month"
                  type="button"
                  role="gridcell"
                  data-iso=${m.iso}
                  aria-selected=${m.iso === this.value ? 'true' : 'false'}
                  @click=${() => this.handleMonthClick(m.monthNum)}
                >
                  ${m.label}
                </button>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }
}
