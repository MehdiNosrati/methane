import { UIElement, type PropertyValues, html, nothing, property, query } from '@methane/core';
import {
  FormControlController,
  FormattingUtils,
  OverlayController,
  PositioningController,
} from '@methane/primitives';
import { timePickerMessages } from './time-picker.messages.js';
import { timePickerStyles } from './time-picker.styles.js';

function isValidTime(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(val.trim());
}

/**
 * Form-associated accessible time picker with 12h/24h formatting and step slots.
 */
export class MthTimePicker extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = timePickerStyles;
  static override messages = timePickerMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = 'HH:MM';

  @property({ type: Number, attribute: 'step-minutes' })
  stepMinutes = 30;

  @property({ type: Boolean, attribute: 'use-12-hour' })
  use12Hour = false;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @query('[part="control"]')
  private controlEl!: HTMLElement | null;

  @query('[part="input"]')
  private inputEl!: HTMLInputElement | null;

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('[part="popover"]')
  private popoverEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private positionSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: timePickerMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
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
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
    if (changed.has('open') && this.open) {
      this.positioningCtrl.reposition();
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

  private buildOptions(): Array<{ value: string; label: string }> {
    const step = Math.max(5, Math.min(180, Math.floor(this.stepMinutes || 30)));
    const list: Array<{ value: string; label: string }> = [];
    for (let total = 0; total < 24 * 60; total += step) {
      const h = Math.floor(total / 60);
      const m = total % 60;
      const iso = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const label = this.use12Hour
        ? FormattingUtils.formatDate(new Date(Date.UTC(2026, 0, 1, h, m)), this.resolvedLocale, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC',
          })
        : iso;
      list.push({ value: iso, label });
    }
    return list;
  }

  private commitValue(next: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.value = next;
    this.formCtrl.setValue(next, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: next } });
  }

  private readonly handleInputChange = (): void => {
    const next = this.inputEl?.value.trim() ?? '';
    if (!next || isValidTime(next)) {
      this.commitValue(next);
    }
  };

  private readonly handleTriggerClick = (): void => {
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  };

  private readonly handleOptionClick = (optValue: string): void => {
    this.commitValue(optValue);
    void this.hide('programmatic');
  };

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const options = this.buildOptions();

    return html`
      <div part="base">
        ${this.label
          ? html`<label part="label" for="mth-tp-input">${this.label}</label>`
          : nothing}
        <div part="control">
          <input
            id="mth-tp-input"
            part="input"
            type="text"
            .value=${this.value}
            placeholder=${this.placeholder}
            aria-label=${this.label || this.t('chooseTime')}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @change=${this.handleInputChange}
          />
          <button
            part="trigger"
            type="button"
            aria-label=${this.t('chooseTime')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="listbox"
            aria-controls="mth-tp-popover"
            ?disabled=${isDisabled || this.readonly}
            @click=${this.handleTriggerClick}
          >
            &#128338;
          </button>
        </div>
        <div
          id="mth-tp-popover"
          part="popover"
          role="listbox"
          aria-label=${this.t('timeOptions')}
          ?hidden=${!this.open}
        >
          ${options.map(
            (opt) => html`
              <button
                part="option"
                type="button"
                role="option"
                data-value=${opt.value}
                aria-selected=${opt.value === this.value ? 'true' : 'false'}
                @click=${() => this.handleOptionClick(opt.value)}
              >
                ${opt.label}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }
}
