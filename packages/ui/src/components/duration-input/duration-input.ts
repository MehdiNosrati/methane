import { UIElement, type PropertyValues, html, nothing, property, state } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { durationInputMessages } from './duration-input.messages.js';
import { durationInputStyles } from './duration-input.styles.js';

function parseDuration(raw: string): { hours: number; minutes: number; seconds: number } {
  const s = raw.trim();
  if (!s) return { hours: 0, minutes: 0, seconds: 0 };

  const iso = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(s);
  if (iso) {
    return {
      hours: Number(iso[1] ?? 0),
      minutes: Number(iso[2] ?? 0),
      seconds: Number(iso[3] ?? 0),
    };
  }

  const colon = /^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/.exec(s);
  if (colon) {
    return {
      hours: Number(colon[1] ?? 0),
      minutes: Number(colon[2] ?? 0),
      seconds: Number(colon[3] ?? 0),
    };
  }

  return { hours: 0, minutes: 0, seconds: 0 };
}

function formatIsoDuration(h: number, m: number, s: number, showSeconds: boolean): string {
  const safeH = Math.max(0, Math.floor(h));
  const safeM = Math.max(0, Math.min(59, Math.floor(m)));
  const safeS = Math.max(0, Math.min(59, Math.floor(s)));
  return showSeconds ? `PT${safeH}H${safeM}M${safeS}S` : `PT${safeH}H${safeM}M`;
}

/**
 * Form-associated segmented hours/minutes/seconds duration input (`PT#H#M#S`).
 */
export class MthDurationInput extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = durationInputStyles;
  static override messages = durationInputMessages;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, attribute: 'show-seconds' })
  showSeconds = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @state()
  private hours = 0;

  @state()
  private minutes = 0;

  @state()
  private seconds = 0;

  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: durationInputMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        this.syncSegmentsFromValue(nextValue);
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
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

  get totalSeconds(): number {
    return this.hours * 3600 + this.minutes * 60 + (this.showSeconds ? this.seconds : 0);
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
    this.syncSegmentsFromValue(this.value);
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
      this.syncSegmentsFromValue(this.value);
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
  }

  private syncSegmentsFromValue(val: string): void {
    const parsed = parseDuration(val);
    this.hours = parsed.hours;
    this.minutes = parsed.minutes;
    this.seconds = parsed.seconds;
  }

  private commitSegments(nextH: number, nextM: number, nextS: number): void {
    if (this.effectivelyDisabled || this.readonly) return;
    this.hours = Math.max(0, Math.floor(nextH));
    this.minutes = Math.max(0, Math.min(59, Math.floor(nextM)));
    this.seconds = Math.max(0, Math.min(59, Math.floor(nextS)));
    const nextIso = formatIsoDuration(this.hours, this.minutes, this.seconds, this.showSeconds);
    this.value = nextIso;
    this.formCtrl.setValue(nextIso, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', {
      detail: { value: nextIso, totalSeconds: this.totalSeconds },
    });
  }

  private readonly handleSegmentInput = (
    part: 'hours' | 'minutes' | 'seconds',
    event: Event,
  ): void => {
    const raw = Number((event.target as HTMLInputElement).value);
    const num = Number.isFinite(raw) ? raw : 0;
    if (part === 'hours') this.commitSegments(num, this.minutes, this.seconds);
    else if (part === 'minutes') this.commitSegments(this.hours, num, this.seconds);
    else this.commitSegments(this.hours, this.minutes, num);
  };

  override render() {
    const isDisabled = this.effectivelyDisabled;
    const groupLabel = this.label || this.t('durationLabel');

    return html`
      <div part="base">
        ${this.label ? html`<span part="label" id="mth-dur-label">${this.label}</span>` : nothing}
        <div
          part="group"
          role="group"
          aria-labelledby=${this.label ? 'mth-dur-label' : nothing}
          aria-label=${this.label ? nothing : groupLabel}
        >
          <label class="segment">
            <input
              part="hours"
              class="seg-input"
              type="number"
              min="0"
              aria-label=${this.t('hours')}
              .value=${String(this.hours)}
              ?disabled=${isDisabled}
              ?readonly=${this.readonly}
              @change=${(e: Event) => this.handleSegmentInput('hours', e)}
            />
            <span class="unit">h</span>
          </label>
          <label class="segment">
            <input
              part="minutes"
              class="seg-input"
              type="number"
              min="0"
              max="59"
              aria-label=${this.t('minutes')}
              .value=${String(this.minutes)}
              ?disabled=${isDisabled}
              ?readonly=${this.readonly}
              @change=${(e: Event) => this.handleSegmentInput('minutes', e)}
            />
            <span class="unit">m</span>
          </label>
          ${this.showSeconds
            ? html`
                <label class="segment">
                  <input
                    part="seconds"
                    class="seg-input"
                    type="number"
                    min="0"
                    max="59"
                    aria-label=${this.t('seconds')}
                    .value=${String(this.seconds)}
                    ?disabled=${isDisabled}
                    ?readonly=${this.readonly}
                    @change=${(e: Event) => this.handleSegmentInput('seconds', e)}
                  />
                  <span class="unit">s</span>
                </label>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
