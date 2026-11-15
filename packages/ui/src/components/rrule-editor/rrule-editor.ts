import { UIElement, type PropertyValues } from '@methane/core';
import {
  FormControlController,
  addCalendarMonths,
  expandRRule,
  formatIsoDate,
  type CalendarDate,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { rruleEditorMessages } from './rrule-editor.messages.js';
import { rruleEditorStyles } from './rrule-editor.styles.js';

export type RRuleFrequency = '' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RRuleEndMode = 'never' | 'count' | 'until';
export type RRuleWeekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

const WEEKDAYS: ReadonlyArray<RRuleWeekday> = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const VALID_FREQS = new Set<string>(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);

interface ParsedRRule {
  freq: RRuleFrequency;
  interval: number;
  byDay: RRuleWeekday[];
  endMode: RRuleEndMode;
  count: number;
  until: string;
}

function parseRRuleString(raw: string): ParsedRRule | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      freq: '',
      interval: 1,
      byDay: [],
      endMode: 'never',
      count: 5,
      until: '',
    };
  }
  const tokens = trimmed.replace(/^RRULE:/i, '').split(';').filter(Boolean);
  const map = new Map<string, string>();
  for (const token of tokens) {
    const eq = token.indexOf('=');
    if (eq <= 0) return null;
    map.set(token.slice(0, eq).toUpperCase(), token.slice(eq + 1).toUpperCase());
  }
  const freqRaw = map.get('FREQ') ?? '';
  if (!VALID_FREQS.has(freqRaw)) return null;

  const intervalRaw = map.get('INTERVAL');
  const interval = intervalRaw ? Number(intervalRaw) : 1;
  if (!Number.isInteger(interval) || interval < 1) return null;

  const byDayRaw = map.get('BYDAY');
  const byDay = byDayRaw
    ? byDayRaw
        .split(',')
        .map((d) => d.trim() as RRuleWeekday)
        .filter((d) => WEEKDAYS.includes(d))
    : [];

  let endMode: RRuleEndMode = 'never';
  let count = 5;
  let until = '';
  if (map.has('COUNT')) {
    const parsedCount = Number(map.get('COUNT'));
    if (!Number.isInteger(parsedCount) || parsedCount < 1) return null;
    endMode = 'count';
    count = parsedCount;
  } else if (map.has('UNTIL')) {
    const rawUntil = map.get('UNTIL') ?? '';
    const dateMatch = /^(\d{4})(\d{2})(\d{2})/.exec(rawUntil);
    if (!dateMatch) return null;
    endMode = 'until';
    until = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }

  return {
    freq: freqRaw as RRuleFrequency,
    interval,
    byDay,
    endMode,
    count,
    until,
  };
}

function serializeRRule(state: ParsedRRule): string {
  if (!state.freq) return '';
  const parts = [`FREQ=${state.freq}`];
  if (state.interval > 1) {
    parts.push(`INTERVAL=${state.interval}`);
  } else {
    parts.push('INTERVAL=1');
  }
  if (state.freq === 'WEEKLY' && state.byDay.length > 0) {
    parts.push(`BYDAY=${state.byDay.join(',')}`);
  }
  if (state.endMode === 'count' && state.count >= 1) {
    parts.push(`COUNT=${state.count}`);
  } else if (state.endMode === 'until' && /^\d{4}-\d{2}-\d{2}$/.test(state.until)) {
    parts.push(`UNTIL=${state.until.replaceAll('-', '')}T235959Z`);
  }
  return parts.join(';');
}

function parseIsoDate(iso: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/**
 * `<mth-rrule-editor>`: Form-associated RFC 5545 recurrence rule builder
 * backed by `FormControlController` and `expandRRule` occurrence preview.
 */
export class MthRruleEditor extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { ...UIElement.shadowRootOptions, delegatesFocus: true };
  static override messages = rruleEditorMessages;
  static override styles = rruleEditorStyles;

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  label = 'Recurrence rule';

  @property({ type: String })
  hint = '';

  @property({ type: String })
  error = '';

  @property({ type: String })
  dtstart = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private ruleState: ParsedRRule = {
    freq: '',
    interval: 1,
    byDay: [],
    endMode: 'never',
    count: 5,
    until: '',
  };

  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: '',
      messages: rruleEditorMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue;
        const parsed = parseRRuleString(nextValue);
        if (parsed) {
          this.ruleState = parsed;
        }
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: ({ value }) => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        const str = typeof value === 'string' ? value : '';
        if (str.length > 0 && !parseRRuleString(str)) {
          return { flags: { patternMismatch: true }, message: this.t('invalidRule') };
        }
        return null;
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

  get dirty(): boolean {
    return this.formCtrl.dirty;
  }

  get touched(): boolean {
    return this.formCtrl.touched;
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

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
  }

  protected override onFormStateRestore(
    stateValue: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(stateValue, mode);
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
      if (this.formCtrl.value !== this.value) {
        this.formCtrl.setValue(this.value, { markDirty: false });
      }
      const parsed = parseRRuleString(this.value);
      if (parsed) {
        this.ruleState = parsed;
      }
    }
    if (changed.has('error')) {
      this.formCtrl.validate();
    }
    this.setCustomState('required', this.formCtrl.required);
    this.setCustomState('readonly', this.formCtrl.readOnly);
  }

  private commitRuleState(next: ParsedRRule, emitChange = true): void {
    if (this.formCtrl.disabled || this.formCtrl.readOnly) return;
    this.ruleState = next;
    const serialized = serializeRRule(next);
    this.value = serialized;
    this.formCtrl.setValue(serialized, { markDirty: true });
    this.formCtrl.markTouched();
    this.dispatchEvent(
      new CustomEvent('mth-input', {
        bubbles: true,
        composed: true,
        detail: { value: serialized },
      }),
    );
    if (emitChange) {
      this.dispatchEvent(
        new CustomEvent('mth-change', {
          bubbles: true,
          composed: true,
          detail: { value: serialized },
        }),
      );
    }
  }

  private getPreviewDates(): string[] {
    if (!this.value || !this.dtstart) return [];
    const start = parseIsoDate(this.dtstart);
    if (!start || !parseRRuleString(this.value)) return [];
    const rangeEnd = addCalendarMonths(start, 6);
    try {
      return expandRRule(this.value, start, rangeEnd).slice(0, 4).map(formatIsoDate);
    } catch {
      return [];
    }
  }

  override render() {
    const isDisabled = this.formCtrl.disabled;
    const isReadonly = this.formCtrl.readOnly;
    const showError = this.error || (!this.checkValidity() && this.touched ? this.validationMessage : '');
    const hintId = this.hint ? 'mth-rrule-hint' : undefined;
    const errId = showError ? 'mth-rrule-error' : undefined;
    const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
    const previews = this.getPreviewDates();

    return html`
      <div part="base" class="base" role="group" aria-labelledby="mth-rrule-label">
        <label id="mth-rrule-label" part="label" class="label" for="mth-rrule-freq">
          <slot name="label">${this.label || this.t('label')}</slot>
        </label>

        <div class="row">
          <span class="field-label">${this.t('frequencyLabel')}</span>
          <select
            id="mth-rrule-freq"
            part="frequency"
            class="control"
            .value=${this.ruleState.freq}
            ?disabled=${isDisabled || isReadonly}
            aria-describedby=${ifDefined(describedBy)}
            aria-invalid=${showError ? 'true' : 'false'}
            @change=${(e: Event) => {
              const freq = (e.target as HTMLSelectElement).value as RRuleFrequency;
              this.commitRuleState({ ...this.ruleState, freq });
            }}
          >
            <option value="">${this.t('none')}</option>
            <option value="DAILY">${this.t('daily')}</option>
            <option value="WEEKLY">${this.t('weekly')}</option>
            <option value="MONTHLY">${this.t('monthly')}</option>
            <option value="YEARLY">${this.t('yearly')}</option>
          </select>

          ${this.ruleState.freq
            ? html`
                <label class="field-label" for="mth-rrule-interval">${this.t('intervalLabel')}</label>
                <input
                  id="mth-rrule-interval"
                  part="interval"
                  class="control interval-input"
                  type="number"
                  min="1"
                  .value=${String(this.ruleState.interval)}
                  ?disabled=${isDisabled}
                  ?readonly=${isReadonly}
                  @input=${(e: Event) => {
                    const num = Math.max(1, Math.floor(Number((e.target as HTMLInputElement).value) || 1));
                    this.commitRuleState({ ...this.ruleState, interval: num }, false);
                  }}
                  @change=${(e: Event) => {
                    const num = Math.max(1, Math.floor(Number((e.target as HTMLInputElement).value) || 1));
                    this.commitRuleState({ ...this.ruleState, interval: num }, true);
                  }}
                />
              `
            : nothing}
        </div>

        ${this.ruleState.freq === 'WEEKLY'
          ? html`
              <div part="weekdays" class="weekdays" role="group" aria-label=${this.t('weekdaysLabel')}>
                ${WEEKDAYS.map((day) => {
                  const pressed = this.ruleState.byDay.includes(day);
                  return html`
                    <button
                      type="button"
                      part="weekday"
                      class="weekday-btn"
                      aria-pressed=${pressed ? 'true' : 'false'}
                      ?disabled=${isDisabled || isReadonly}
                      @click=${() => {
                        const nextDays = pressed
                          ? this.ruleState.byDay.filter((d) => d !== day)
                          : WEEKDAYS.filter((d) => d === day || this.ruleState.byDay.includes(d));
                        this.commitRuleState({ ...this.ruleState, byDay: nextDays });
                      }}
                    >
                      ${this.t(`day${day}`)}
                    </button>
                  `;
                })}
              </div>
            `
          : nothing}

        ${this.ruleState.freq
          ? html`
              <div class="row">
                <label class="field-label" for="mth-rrule-end">${this.t('endLabel')}</label>
                <select
                  id="mth-rrule-end"
                  part="end-mode"
                  class="control"
                  .value=${this.ruleState.endMode}
                  ?disabled=${isDisabled || isReadonly}
                  @change=${(e: Event) => {
                    const endMode = (e.target as HTMLSelectElement).value as RRuleEndMode;
                    this.commitRuleState({ ...this.ruleState, endMode });
                  }}
                >
                  <option value="never">${this.t('endNever')}</option>
                  <option value="count">${this.t('endCount')}</option>
                  <option value="until">${this.t('endUntil')}</option>
                </select>

                ${this.ruleState.endMode === 'count'
                  ? html`
                      <input
                        id="mth-rrule-count"
                        part="count"
                        class="control count-input"
                        type="number"
                        min="1"
                        aria-label=${this.t('countLabel')}
                        .value=${String(this.ruleState.count)}
                        ?disabled=${isDisabled}
                        ?readonly=${isReadonly}
                        @change=${(e: Event) => {
                          const count = Math.max(1, Math.floor(Number((e.target as HTMLInputElement).value) || 1));
                          this.commitRuleState({ ...this.ruleState, count });
                        }}
                      />
                    `
                  : nothing}
                ${this.ruleState.endMode === 'until'
                  ? html`
                      <input
                        id="mth-rrule-until"
                        part="until"
                        class="control"
                        type="date"
                        aria-label=${this.t('untilLabel')}
                        .value=${this.ruleState.until}
                        ?disabled=${isDisabled}
                        ?readonly=${isReadonly}
                        @change=${(e: Event) => {
                          const until = (e.target as HTMLInputElement).value;
                          this.commitRuleState({ ...this.ruleState, until });
                        }}
                      />
                    `
                  : nothing}
              </div>
            `
          : nothing}

        ${this.value ? html`<p part="rule" class="rule-readout">${this.value}</p>` : nothing}

        ${previews.length > 0
          ? html`
              <ul part="preview" class="preview" aria-label=${this.t('previewLabel')}>
                ${previews.map((iso) => html`<li>${iso}</li>`)}
              </ul>
            `
          : nothing}

        ${this.hint
          ? html`<p id="mth-rrule-hint" part="hint" class="hint"><slot name="hint">${this.hint}</slot></p>`
          : nothing}
        ${showError
          ? html`<p id="mth-rrule-error" part="error" class="error" role="alert"><slot name="error">${showError}</slot></p>`
          : nothing}
      </div>
    `;
  }
}
