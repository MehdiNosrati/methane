import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormContextProviderController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { schemaFormMessages } from './schema-form.messages.js';
import { schemaFormStyles } from './schema-form.styles.js';

export type SchemaPropertyType = 'string' | 'number' | 'integer' | 'boolean';
export type SchemaStringFormat = 'text' | 'email' | 'url' | 'password' | 'tel';

export interface SchemaPropertyDefinition {
  readonly type: SchemaPropertyType;
  readonly title?: string;
  readonly description?: string;
  readonly format?: SchemaStringFormat;
  readonly enum?: ReadonlyArray<string>;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly default?: unknown;
  readonly placeholder?: string;
}

export interface JsonSchemaSubset {
  readonly title?: string;
  readonly description?: string;
  readonly type?: 'object';
  readonly required?: ReadonlyArray<string>;
  readonly properties: Readonly<Record<string, SchemaPropertyDefinition>>;
}

function parseSchemaJson(raw: string): JsonSchemaSubset | null {
  if (!raw || raw.trim().length === 0) return null;
  try {
    const parsed = JSON.parse(raw) as JsonSchemaSubset;
    if (parsed && typeof parsed === 'object' && parsed.properties && typeof parsed.properties === 'object') {
      return parsed;
    }
  } catch {
    // Ignore malformed declarative JSON until valid.
  }
  return null;
}

/**
 * `<mth-schema-form>`: declarative JSON-Schema-subset form renderer emitting public
 * `<mth-field>` and `<mth-input>` markup with constraint validation and `FORM_CONTEXT`.
 */
export class MthSchemaForm extends UIElement {
  static override messages = schemaFormMessages;
  static override styles = schemaFormStyles;

  @property({ attribute: false })
  schema: JsonSchemaSubset | null = null;

  @property({ type: String, attribute: 'schema-json' })
  schemaJson = '';

  @property({ attribute: false })
  value: Record<string, unknown> = {};

  @property({ type: String, attribute: 'submit-label' })
  submitLabel = '';

  @property({ type: Boolean, attribute: 'show-reset', reflect: true })
  showReset = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @state()
  private fieldErrors: Record<string, string> = {};

  @state()
  private submitAttempted = false;

  private readonly formContextProvider: FormContextProviderController;

  constructor() {
    super();
    this.formContextProvider = new FormContextProviderController(this, {
      disabled: false,
      readonly: false,
      submitAttempted: false,
    });
  }

  get values(): Record<string, unknown> {
    return { ...this.value };
  }

  get errors(): Record<string, string> {
    return { ...this.fieldErrors };
  }

  get valid(): boolean {
    return Object.keys(this.validateValues(this.value)).length === 0;
  }

  validate(): boolean {
    this.submitAttempted = true;
    const errors = this.validateValues(this.value);
    this.fieldErrors = errors;
    this.setCustomState('invalid', Object.keys(errors).length > 0);
    return Object.keys(errors).length === 0;
  }

  submit(): boolean {
    if (this.disabled) return false;
    const isValid = this.validate();
    this.formContextProvider.update({
      disabled: this.disabled,
      readonly: this.readonly,
      submitAttempted: true,
    });
    if (!isValid) {
      this.emitEvent('mth-invalid', { detail: { errors: { ...this.fieldErrors } } });
      return false;
    }
    this.setCustomState('submitted', true);
    this.emitEvent('mth-submit', {
      cancelable: true,
      detail: { values: this.values, valid: true },
    });
    return true;
  }

  reset(): void {
    const resolved = this.getResolvedSchema();
    const next: Record<string, unknown> = {};
    if (resolved) {
      for (const [key, prop] of Object.entries(resolved.properties)) {
        if (prop.default !== undefined) {
          next[key] = prop.default;
        } else if (prop.type === 'boolean') {
          next[key] = false;
        } else {
          next[key] = '';
        }
      }
    }
    this.value = next;
    this.fieldErrors = {};
    this.submitAttempted = false;
    this.setCustomState('invalid', false);
    this.setCustomState('submitted', false);
    this.emitEvent('mth-change', { detail: { values: this.values, valid: this.valid } });
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('schema') || changedProperties.has('schemaJson')) {
      this.applyDefaultsIfUnset();
    }
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('readonly') ||
      changedProperties.has('submitAttempted')
    ) {
      if (
        this.formContextProvider.current.disabled !== this.disabled ||
        this.formContextProvider.current.readonly !== this.readonly ||
        this.formContextProvider.current.submitAttempted !== this.submitAttempted
      ) {
        this.formContextProvider.update({
          disabled: this.disabled,
          readonly: this.readonly,
          submitAttempted: this.submitAttempted,
        });
      }
    }
  }

  private getResolvedSchema(): JsonSchemaSubset | null {
    return this.schema ?? parseSchemaJson(this.schemaJson);
  }

  private applyDefaultsIfUnset(): void {
    const resolved = this.getResolvedSchema();
    if (!resolved) return;
    let mutated = false;
    const next = { ...this.value };
    for (const [key, prop] of Object.entries(resolved.properties)) {
      if (!(key in next) && prop.default !== undefined) {
        next[key] = prop.default;
        mutated = true;
      }
    }
    if (mutated) {
      this.value = next;
    }
  }

  private validateValues(vals: Record<string, unknown>): Record<string, string> {
    const resolved = this.getResolvedSchema();
    if (!resolved) return {};
    const requiredSet = new Set(resolved.required ?? []);
    const errors: Record<string, string> = {};

    for (const [key, def] of Object.entries(resolved.properties)) {
      const label = def.title ?? key;
      const raw = vals[key];
      const str = raw === undefined || raw === null ? '' : String(raw).trim();
      const isRequired = requiredSet.has(key);

      if (def.type === 'boolean') {
        if (isRequired && raw !== true) {
          errors[key] = this.t('requiredField', { field: label });
        }
        continue;
      }

      if (str.length === 0) {
        if (isRequired) {
          errors[key] = this.t('requiredField', { field: label });
        }
        continue;
      }

      if (def.type === 'number' || def.type === 'integer') {
        const num = Number(str);
        if (!Number.isFinite(num) || (def.type === 'integer' && !Number.isInteger(num))) {
          errors[key] = this.t('invalidNumber');
          continue;
        }
        if (def.minimum !== undefined && num < def.minimum) {
          errors[key] = this.t('minimumError', { field: label, min: def.minimum });
          continue;
        }
        if (def.maximum !== undefined && num > def.maximum) {
          errors[key] = this.t('maximumError', { field: label, max: def.maximum });
          continue;
        }
      } else {
        if (def.minLength !== undefined && str.length < def.minLength) {
          errors[key] = this.t('minLengthError', { field: label, min: def.minLength });
          continue;
        }
        if (def.maxLength !== undefined && str.length > def.maxLength) {
          errors[key] = this.t('maxLengthError', { field: label, max: def.maxLength });
          continue;
        }
        if (def.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
          errors[key] = this.t('invalidEmail');
          continue;
        }
        if (def.format === 'url') {
          try {
            new URL(str);
          } catch {
            errors[key] = this.t('invalidUrl');
            continue;
          }
        }
      }
    }

    return errors;
  }

  private updateFieldValue(key: string, nextVal: unknown, isCommit: boolean): void {
    const nextValues = { ...this.value, [key]: nextVal };
    this.value = nextValues;
    if (this.submitAttempted) {
      this.fieldErrors = this.validateValues(nextValues);
    }
    const detail = { values: { ...nextValues }, valid: Object.keys(this.validateValues(nextValues)).length === 0 };
    this.emitEvent('mth-input', { detail });
    if (isCommit) {
      this.emitEvent('mth-change', { detail });
    }
  }

  private readonly handleFormSubmit = (event: Event): void => {
    event.preventDefault();
    this.submit();
  };

  private renderField(key: string, def: SchemaPropertyDefinition, isRequired: boolean) {
    const label = def.title ?? key;
    const err = this.fieldErrors[key] ?? '';
    const current = this.value[key];

    if (def.type === 'boolean') {
      const checked = Boolean(current);
      const id = `mth-sf-${key}`;
      return html`
        <mth-field label=${label} hint=${def.description ?? ''} error=${err} ?required=${isRequired}>
          <label class="checkbox-row" for=${id}>
            <input
              id=${id}
              type="checkbox"
              name=${key}
              .checked=${checked}
              aria-readonly=${this.readonly ? 'true' : 'false'}
              ?disabled=${this.disabled || this.readonly}
              @change=${(ev: Event) => {
                const target = ev.target as HTMLInputElement;
                if (this.readonly) {
                  target.checked = checked;
                  return;
                }
                this.updateFieldValue(key, target.checked, true);
              }}
            />
            <span>${def.description ?? label}</span>
          </label>
        </mth-field>
      `;
    }

    if (def.enum && def.enum.length > 0) {
      const strVal = current === undefined || current === null ? '' : String(current);
      return html`
        <mth-field label=${label} hint=${def.description ?? ''} error=${err} ?required=${isRequired}>
          <select
            class="select-control"
            name=${key}
            aria-label=${label}
            aria-readonly=${this.readonly ? 'true' : 'false'}
            .value=${strVal}
            ?disabled=${this.disabled || this.readonly}
            @change=${(ev: Event) => {
              const target = ev.target as HTMLSelectElement;
              if (this.readonly) {
                target.value = strVal;
                return;
              }
              this.updateFieldValue(key, target.value, true);
            }}
          >
            ${def.enum.map(
              (option) => html`<option value=${option} ?selected=${option === strVal}>${option}</option>`,
            )}
          </select>
        </mth-field>
      `;
    }

    const strVal = current === undefined || current === null ? '' : String(current);
    const inputType = def.format ?? 'text';
    const isNumeric = def.type === 'number' || def.type === 'integer';

    return html`
      <mth-field label=${label} hint=${def.description ?? ''} error=${err} ?required=${isRequired}>
        <mth-input
          name=${key}
          label=${label}
          type=${inputType}
          inputmode=${isNumeric ? 'decimal' : nothing}
          placeholder=${ifDefined(def.placeholder || undefined)}
          .value=${strVal}
          ?required=${isRequired}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          @mth-input=${(ev: CustomEvent<{ value: string }>) => {
            const raw = ev.detail.value;
            const parsed = isNumeric && raw.trim().length > 0 && Number.isFinite(Number(raw)) ? Number(raw) : raw;
            this.updateFieldValue(key, parsed, false);
          }}
          @mth-change=${(ev: CustomEvent<{ value: string }>) => {
            const raw = ev.detail.value;
            const parsed = isNumeric && raw.trim().length > 0 && Number.isFinite(Number(raw)) ? Number(raw) : raw;
            this.updateFieldValue(key, parsed, true);
          }}
        ></mth-input>
      </mth-field>
    `;
  }

  override render() {
    const resolved = this.getResolvedSchema();
    const requiredSet = new Set(resolved?.required ?? []);
    const entries = resolved ? Object.entries(resolved.properties) : [];

    return html`
      <form part="base" class="form" novalidate @submit=${this.handleFormSubmit}>
        <slot name="header"></slot>
        ${resolved?.title ? html`<h2 part="title" class="title">${resolved.title}</h2>` : nothing}
        ${resolved?.description
          ? html`<p part="description" class="description">${resolved.description}</p>`
          : nothing}
        <div part="fields" class="fields">
          ${entries.map(([key, def]) => this.renderField(key, def, requiredSet.has(key)))}
        </div>
        <div part="actions" class="actions">
          <slot name="actions"></slot>
          ${this.showReset
            ? html`
                <button
                  type="button"
                  part="reset"
                  class="btn"
                  ?disabled=${this.disabled}
                  @click=${() => this.reset()}
                >
                  ${this.t('resetLabel')}
                </button>
              `
            : nothing}
          <button
            type="submit"
            part="submit"
            class="btn btn-primary"
            ?disabled=${this.disabled}
          >
            ${this.submitLabel || this.t('submitLabel')}
          </button>
        </div>
      </form>
    `;
  }
}
