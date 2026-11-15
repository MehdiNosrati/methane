import { UIElement, type PropertyValues, html, nothing, property } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { cronBuilderMessages } from './cron-builder.messages.js';
import { cronBuilderStyles } from './cron-builder.styles.js';

export interface CronPreset {
  label: string;
  value: string;
}

const DEFAULT_PRESETS: ReadonlyArray<CronPreset> = [
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily 00:00', value: '0 0 * * *' },
  { label: 'Weekdays 09:00', value: '0 9 * * 1-5' },
];

const DEFAULT_PRESET_KEYS: Readonly<Record<string, string>> = {
  '*/15 * * * *': 'presetEvery15Min',
  '0 * * * *': 'presetHourly',
  '0 0 * * *': 'presetDaily',
  '0 9 * * 1-5': 'presetWeekdays',
};

const SEGMENT_TOKEN_RE = /^(\*|\d+|\*\/\d+|\d+-\d+(?:\/\d+)?|\d+(?:,\d+)+)$/;

type CronParts = [string, string, string, string, string];

function parseCronParts(value: string): CronParts {
  if (!value.trim()) {
    return ['', '', '', '', ''];
  }
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  return [
    tokens[0] ?? '*',
    tokens[1] ?? '*',
    tokens[2] ?? '*',
    tokens[3] ?? '*',
    tokens[4] ?? '*',
  ];
}

function isValidCronExpression(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 5) return false;
  return tokens.every((token) => SEGMENT_TOKEN_RE.test(token));
}

/**
 * Form-associated 5-field cron expression builder with presets and summary output.
 */
export class MthCronBuilder extends UIElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = cronBuilderStyles;
  static override messages = cronBuilderMessages;

  @property({ type: String })
  value = '0 * * * *';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ attribute: false })
  presets: ReadonlyArray<CronPreset> = DEFAULT_PRESETS;

  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '0 * * * *',
      messages: cronBuilderMessages,
      validator: (ctx) => {
        const current = typeof ctx.value === 'string' ? ctx.value : '';
        if (ctx.required && !current.trim()) {
          return { flags: { valueMissing: true }, message: this.t('invalidExpression') };
        }
        if (current.trim() && !isValidCronExpression(current)) {
          return { flags: { patternMismatch: true }, message: this.t('invalidExpression') };
        }
        return null;
      },
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
    const initialDefault = this.getAttribute('value') ?? this.value ?? '0 * * * *';
    this.formCtrl.setDefaultValue(initialDefault);
    this.formCtrl.setValue(this.value, { markDirty: false });
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
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('readonly')) {
      this.setCustomState('readonly', this.readonly);
    }
  }

  private applyValue(next: string): void {
    if (this.effectivelyDisabled || this.readonly) return;
    if (this.value === next) return;
    this.value = next;
    this.formCtrl.setValue(next, { markDirty: true });
    this.formCtrl.markTouched();
    this.emitEvent('mth-change', { detail: { value: next } });
  }

  private handleSegmentInput(index: number, event: Event): void {
    const inputs = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLInputElement>('[part="field-input"]') ?? [],
    );
    if (inputs.length === 5 && inputs.every((inp) => !inp.value.trim())) {
      this.applyValue('');
      return;
    }
    const input = event.currentTarget as HTMLInputElement;
    const parts = parseCronParts(this.value);
    parts[index] = input.value.trim() || '*';
    this.applyValue(parts.map((p) => p || '*').join(' '));
  }

  private describeCurrentCron(value: string): string {
    const trimmed = value.trim();
    const prefix = this.t('summaryPrefix');
    if (trimmed === '*/15 * * * *') return this.t('summaryEvery15Min', { prefix });
    if (trimmed === '0 * * * *') return this.t('summaryHourly', { prefix });
    if (trimmed === '0 0 * * *') return this.t('summaryDaily', { prefix });
    if (trimmed === '0 9 * * 1-5') return this.t('summaryWeekdays', { prefix });
    const [minute, hour, day, month, weekday] = parseCronParts(trimmed);
    return this.t('summaryCustom', { prefix, minute, hour, day, month, weekday });
  }

  private handlePresetClick(presetValue: string): void {
    this.applyValue(presetValue);
  }

  protected override render() {
    const parts = parseCronParts(this.value);
    const segmentLabels = [
      this.t('minute'),
      this.t('hour'),
      this.t('dayOfMonth'),
      this.t('month'),
      this.t('dayOfWeek'),
    ];
    const isDisabled = this.effectivelyDisabled;
    const labelId = this.label ? 'cron-label' : undefined;

    return html`
      <div
        part="base"
        class="base"
        role="group"
        aria-labelledby=${labelId ?? nothing}
        aria-label=${labelId ? nothing : this.t('builderLabel')}
      >
        ${this.label
          ? html`<div id="cron-label" part="label" class="label">${this.label}</div>`
          : nothing}
        <div part="presets" class="presets" role="group" aria-label=${this.t('presetsLabel')}>
          ${this.presets.map((preset) => {
            const presetKey = this.presets === DEFAULT_PRESETS ? DEFAULT_PRESET_KEYS[preset.value] : undefined;
            const displayLabel = presetKey ? this.t(presetKey) : preset.label;
            return html`
              <button
                type="button"
                part="preset"
                class="preset"
                aria-pressed=${this.value.trim() === preset.value ? 'true' : 'false'}
                ?disabled=${isDisabled || this.readonly}
                @click=${() => this.handlePresetClick(preset.value)}
              >
                ${displayLabel}
              </button>
            `;
          })}
        </div>
        <div part="fields" class="fields">
          ${parts.map((segment, index) => {
            const segId = `cron-seg-${index}`;
            return html`
              <div part="field" class="field">
                <label for=${segId} part="field-label" class="field-label">
                  ${segmentLabels[index]}
                </label>
                <input
                  id=${segId}
                  part="field-input"
                  class="field-input"
                  type="text"
                  .value=${segment}
                  ?disabled=${isDisabled}
                  ?readonly=${this.readonly}
                  @change=${(e: Event) => this.handleSegmentInput(index, e)}
                />
              </div>
            `;
          })}
        </div>
        <div part="summary" class="summary" aria-live="polite">
          ${isValidCronExpression(this.value)
            ? this.describeCurrentCron(this.value)
            : this.t('invalidExpression')}
        </div>
      </div>
    `;
  }
}
