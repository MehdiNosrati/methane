import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane/core';
import {
  FormControlController,
  OverlayController,
  PositioningController,
} from '@methane/primitives';
import { colorPickerMessages } from './color-picker.messages.js';
import { colorPickerStyles } from './color-picker.styles.js';

interface HslColor {
  h: number;
  s: number;
  l: number;
}

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperLike {
  open: (options?: { signal?: AbortSignal }) => Promise<EyeDropperResult>;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toByte = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return rgbToHex((rp + m) * 255, (gp + m) * 255, (bp + m) * 255);
}

function hexToHsl(hex: string): HslColor | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) {
    h = 60 * (((g - b) / d) % 6);
  } else if (max === g) {
    h = 60 * ((b - r) / d + 2);
  } else {
    h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function normalizeHexColor(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    const r = trimmed[1]!;
    const g = trimmed[2]!;
    const b = trimmed[3]!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

const DEFAULT_COLOR = rgbToHex(37, 99, 235);

const DEFAULT_SWATCHES: ReadonlyArray<string> = [
  rgbToHex(37, 99, 235),
  rgbToHex(220, 38, 38),
  rgbToHex(22, 163, 74),
  rgbToHex(217, 119, 6),
  rgbToHex(124, 58, 237),
  rgbToHex(15, 23, 42),
];

/**
 * Form-associated color picker with HSL sliders, preset swatches, and EyeDropper support.
 */
export class MthColorPicker extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = colorPickerStyles;
  static override messages = colorPickerMessages;

  @property({ type: String })
  value = DEFAULT_COLOR;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ attribute: false })
  swatches: ReadonlyArray<string> = DEFAULT_SWATCHES;

  @state()
  private hsl: HslColor = hexToHsl(DEFAULT_COLOR) ?? { h: 221, s: 83, l: 53 };

  @query('[part="control"]')
  private controlEl!: HTMLElement | null;

  @query('[part="trigger"]')
  private triggerEl!: HTMLButtonElement | null;

  @query('[part="popover"]')
  private popoverEl!: HTMLElement | null;

  private readonly formCtrl: FormControlController;
  private readonly overlayCtrl: OverlayController;
  private readonly positioningCtrl: PositioningController;
  private dynamicSheet: CSSStyleSheet | null = null;
  private popoverX = 0;
  private popoverY = 0;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: DEFAULT_COLOR,
      messages: colorPickerMessages,
      validator: (ctx) => {
        const current = typeof ctx.value === 'string' ? ctx.value : '';
        if (ctx.required && !current.trim()) {
          return { flags: { valueMissing: true }, message: this.t('invalidColor') };
        }
        if (current.trim() && !normalizeHexColor(current)) {
          return { flags: { patternMismatch: true }, message: this.t('invalidColor') };
        }
        return null;
      },
      onValueSync: (nextValue) => {
        this.value = nextValue;
        const parsed = hexToHsl(nextValue);
        if (parsed) {
          this.hsl = parsed;
        }
        this.syncDynamicStyles();
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
        this.popoverX = res.x;
        this.popoverY = res.y;
        this.syncDynamicStyles();
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

  get eyeDropperSupported(): boolean {
    const ctor = (globalThis as { EyeDropper?: unknown }).EyeDropper;
    return typeof ctor === 'function';
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
  }

  reportValidity(): boolean {
    return this.formCtrl.reportValidity();
  }

  protected override onFirstConnect(): void {
    const initialDefault = this.getAttribute('value') ?? this.value ?? DEFAULT_COLOR;
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
    const parsed = hexToHsl(this.value);
    if (parsed) {
      this.hsl = parsed;
    }
    this.syncDynamicStyles();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
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
      const parsed = hexToHsl(this.value);
      if (parsed) {
        this.hsl = parsed;
      }
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
    if (changed.has('open') && this.open) {
      this.positioningCtrl.reposition();
    }
    if (changed.has('value') || changed.has('swatches')) {
      this.syncDynamicStyles();
    }
  }

  async show(): Promise<void> {
    if (this.effectivelyDisabled || this.readonly) return;
    await this.overlayCtrl.show();
  }

  async hide(reason: 'escape' | 'outside' | 'programmatic' | 'invoker' = 'programmatic'): Promise<void> {
    await this.overlayCtrl.hide(reason);
  }

  async pickFromScreen(): Promise<void> {
    if (this.effectivelyDisabled || this.readonly || !this.eyeDropperSupported) return;
    const EyeDropperCtor = (globalThis as unknown as { EyeDropper: new () => EyeDropperLike }).EyeDropper;
    try {
      const dropper = new EyeDropperCtor();
      const result = await dropper.open();
      const normalized = normalizeHexColor(result.sRGBHex);
      if (normalized) {
        this.commitColor(normalized);
      }
    } catch {
      // User canceled or EyeDropper rejected.
    }
  }

  private syncDynamicStyles(): void {
    if (
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.dynamicSheet) {
      this.dynamicSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.dynamicSheet,
      ];
    }
    const previewColor = normalizeHexColor(this.value) ?? 'transparent';
    const swatchRules = this.swatches
      .map((swatch, index) => {
        const safe = normalizeHexColor(swatch);
        return safe
          ? `[part="swatch"][data-index="${index}"] { --_mth-swatch-color: ${safe}; }`
          : '';
      })
      .filter(Boolean)
      .join('\n');
    this.dynamicSheet.replaceSync(
      `[part="swatch-preview"] { --_mth-color-preview: ${previewColor}; }\n` +
        `[part="popover"] { transform: translate3d(${Math.round(this.popoverX)}px, ${Math.round(this.popoverY)}px, 0); }\n` +
        swatchRules,
    );
  }

  private commitColor(nextHex: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    const normalized = normalizeHexColor(nextHex);
    if (!normalized) {
      this.value = nextHex;
      this.formCtrl.setValue(nextHex, { markDirty: true });
      this.formCtrl.markTouched();
      return;
    }
    const parsed = hexToHsl(normalized);
    if (parsed) {
      this.hsl = parsed;
    }
    if (this.value === normalized) return;
    this.value = normalized;
    this.formCtrl.setValue(normalized, { markDirty: true });
    this.formCtrl.markTouched();
    this.syncDynamicStyles();
    this.emitEvent('mth-change', { detail: { value: normalized } });
  }

  private handleHexChange(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    this.commitColor(input.value);
  }

  private handleSliderInput(channel: keyof HslColor, event: Event): void {
    if (this.effectivelyDisabled || this.readonly) return;
    const input = event.currentTarget as HTMLInputElement;
    const nextNum = Number.parseInt(input.value, 10);
    if (Number.isNaN(nextNum)) return;
    const nextHsl: HslColor = { ...this.hsl, [channel]: nextNum };
    this.hsl = nextHsl;
    this.commitColor(hslToHex(nextHsl.h, nextHsl.s, nextHsl.l));
  }

  private async handleTriggerClick(): Promise<void> {
    if (this.open) {
      await this.hide('invoker');
    } else {
      await this.show();
    }
  }

  protected override render() {
    const isDisabled = this.effectivelyDisabled;
    const labelId = this.label ? 'color-label' : undefined;

    return html`
      <div part="base" class="base">
        ${this.label
          ? html`<label id="color-label" for="color-input" part="label" class="label">${this.label}</label>`
          : nothing}
        <div part="control" class="control">
          <span part="swatch-preview" class="swatch-preview" aria-hidden="true"></span>
          <input
            id="color-input"
            part="input"
            class="input"
            type="text"
            .value=${this.value}
            aria-labelledby=${labelId ?? nothing}
            ?disabled=${isDisabled}
            ?readonly=${this.readonly}
            @change=${this.handleHexChange}
          />
          <button
            type="button"
            part="trigger"
            class="trigger"
            aria-label=${this.t('openPicker')}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="color-popover"
            ?disabled=${isDisabled || this.readonly}
            @click=${() => void this.handleTriggerClick()}
          >
            ${this.t('pickButton')}
          </button>
          ${this.eyeDropperSupported
            ? html`
                <button
                  type="button"
                  part="eyedropper"
                  class="eyedropper"
                  aria-label=${this.t('eyedropper')}
                  ?disabled=${isDisabled || this.readonly}
                  @click=${() => void this.pickFromScreen()}
                >
                  ${this.t('dropperButton')}
                </button>
              `
            : nothing}
        </div>
        <div
          id="color-popover"
          part="popover"
          class="popover"
          role="dialog"
          aria-label=${this.label || this.t('openPicker')}
          ?hidden=${!this.open}
        >
          <div part="sliders" class="sliders">
            <label class="slider-row">
              <span>${this.t('hue')}</span>
              <input
                type="range"
                min="0"
                max="359"
                .value=${String(this.hsl.h)}
                aria-label=${this.t('hue')}
                ?disabled=${isDisabled || this.readonly}
                @input=${(e: Event) => this.handleSliderInput('h', e)}
              />
            </label>
            <label class="slider-row">
              <span>${this.t('saturation')}</span>
              <input
                type="range"
                min="0"
                max="100"
                .value=${String(this.hsl.s)}
                aria-label=${this.t('saturation')}
                ?disabled=${isDisabled || this.readonly}
                @input=${(e: Event) => this.handleSliderInput('s', e)}
              />
            </label>
            <label class="slider-row">
              <span>${this.t('lightness')}</span>
              <input
                type="range"
                min="0"
                max="100"
                .value=${String(this.hsl.l)}
                aria-label=${this.t('lightness')}
                ?disabled=${isDisabled || this.readonly}
                @input=${(e: Event) => this.handleSliderInput('l', e)}
              />
            </label>
          </div>
          <div part="swatches" class="swatches" role="group" aria-label=${this.t('swatchesLabel')}>
            ${this.swatches.map(
              (swatch, index) => html`
                <button
                  type="button"
                  part="swatch"
                  class="swatch"
                  data-index=${index}
                  aria-label=${swatch}
                  ?disabled=${isDisabled || this.readonly}
                  @click=${() => this.commitColor(swatch)}
                ></button>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }
}
