import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane-ui/core';
import {
  FormControlController,
  ListboxController,
  OverlayController,
  PositioningController,
} from '@methane-ui/primitives';
import { timezonePickerMessages } from './timezone-picker.messages.js';
import { timezonePickerStyles } from './timezone-picker.styles.js';

const FALLBACK_ZONES: ReadonlyArray<string> = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function resolveZones(): string[] {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof supported === 'function') {
    try {
      const list = supported('timeZone');
      if (Array.isArray(list) && list.length > 0) {
        return ['UTC', ...list.filter((z) => z !== 'UTC')];
      }
    } catch {
      // Fallback below.
    }
  }
  return [...FALLBACK_ZONES];
}

function formatOffset(zone: string, locale: string): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

/**
 * Form-associated IANA timezone picker using Intl timezone data and `ListboxController`.
 */
export class MthTimezonePicker extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = timezonePickerStyles;
  static override messages = timezonePickerMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ attribute: false })
  zones: ReadonlyArray<string> = resolveZones();

  @state()
  private filterQuery = '';

  @query('[part="control"]')
  private controlEl!: HTMLElement | null;

  @query('[part="input"]')
  private inputEl!: HTMLInputElement | null;

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('[part="popover"]')
  private popoverEl!: HTMLElement | null;

  @query('[part="listbox"]')
  private listboxEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private readonly listboxCtrl: ListboxController;
  private positionSheet: CSSStyleSheet | null = null;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: timezonePickerMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.listboxCtrl.setSelectedValues(nextValue ? [nextValue] : []);
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

    this.listboxCtrl = new ListboxController(this, {
      focusMode: 'activedescendant',
      multiple: false,
      loop: true,
      getListboxElement: () => this.listboxEl,
      getOptionElements: () =>
        this.listboxEl
          ? Array.from(this.listboxEl.querySelectorAll<HTMLElement>('[role="option"]'))
          : [],
      onSelectionChange: (selected) => {
        const next = selected[0] ?? '';
        if (next !== this.value) {
          this.commitZone(next);
          void this.hide('programmatic');
        }
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
    this.syncListboxOptions();
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
      this.listboxCtrl.setSelectedValues(this.value ? [this.value] : []);
    }
    if (changed.has('zones') || changed.has('filterQuery')) {
      this.syncListboxOptions();
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

  private getFilteredZones(): string[] {
    const q = this.filterQuery.trim().toLowerCase();
    if (!q) return [...this.zones];
    return this.zones.filter((z) => z.toLowerCase().includes(q));
  }

  private syncListboxOptions(): void {
    const filtered = this.getFilteredZones();
    this.listboxCtrl.setOptions(
      filtered.map((zone, idx) => ({
        id: `mth-tz-opt-${idx}`,
        value: zone,
        label: zone,
      })),
    );
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
    const safeX = Number.isFinite(x) ? Math.round(x) : 0;
    const safeY = Number.isFinite(y) ? Math.round(y) : 0;
    this.positionSheet.replaceSync(
      `[part="popover"] { transform: translate3d(${safeX}px, ${safeY}px, 0); }`,
    );
  }

  private commitZone(zone: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.value = zone;
    this.filterQuery = '';
    this.listboxCtrl.setSelectedValues(zone ? [zone] : []);
    this.formCtrl.setValue(zone, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: zone } });
  }

  private readonly handleInput = (): void => {
    this.filterQuery = this.inputEl?.value ?? '';
    if (!this.open) {
      void this.show();
    }
  };

  private readonly handleInputChange = (): void => {
    const next = this.inputEl?.value.trim() ?? '';
    this.commitZone(next);
  };

  private readonly handleTriggerClick = (): void => {
    if (this.open) {
      void this.hide('invoker');
    } else {
      void this.show();
    }
  };

  private readonly handleOptionClick = (zone: string): void => {
    this.commitZone(zone);
    void this.hide('programmatic');
  };

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const filtered = this.getFilteredZones();
    const activeOpt = this.listboxCtrl.activeOption;
    const activeId = this.open && activeOpt ? activeOpt.id : nothing;

    return html`
      <div part="base">
        ${this.label
          ? html`<label part="label" for="mth-tz-input">${this.label}</label>`
          : nothing}
        <div part="control">
          <input
            id="mth-tz-input"
            part="input"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-tz-listbox"
            aria-activedescendant=${activeId}
            aria-label=${this.label || this.t('chooseTimezone')}
            .value=${this.filterQuery || this.value}
            placeholder=${this.placeholder || this.t('searchPlaceholder')}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @input=${this.handleInput}
            @change=${this.handleInputChange}
          />
          <button
            part="trigger"
            type="button"
            aria-label=${this.t('chooseTimezone')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="mth-tz-listbox"
            ?disabled=${isDisabled || this.readonly}
            @click=${this.handleTriggerClick}
          >
            &#127760;
          </button>
        </div>
        <div part="popover" ?hidden=${!this.open}>
          <div
            id="mth-tz-listbox"
            part="listbox"
            role="listbox"
            tabindex="0"
            aria-label=${this.label || this.t('chooseTimezone')}
            aria-activedescendant=${activeId}
          >
            ${filtered.map((zone, idx) => {
              const id = `mth-tz-opt-${idx}`;
              const isSelected = zone === this.value;
              const isActive = activeOpt?.id === id;
              return html`
                <div
                  id=${id}
                  part="option"
                  role="option"
                  data-value=${zone}
                  data-active=${isActive ? 'true' : 'false'}
                  aria-selected=${isSelected ? 'true' : 'false'}
                  @click=${() => this.handleOptionClick(zone)}
                >
                  <span>${zone}</span>
                  <span class="offset">${this.open ? formatOffset(zone, this.resolvedLocale) : ''}</span>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}
