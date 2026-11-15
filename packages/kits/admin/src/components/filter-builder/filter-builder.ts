import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { resolveEffectiveDir } from '../shared/style-sheet.js';
import { filterBuilderMessages } from './filter-builder.messages.js';
import { filterBuilderStyles } from './filter-builder.styles.js';

export type FilterCombinator = 'and' | 'or';

export interface FilterFieldDef {
  readonly id: string;
  readonly label: string;
  readonly operators?: ReadonlyArray<string>;
}

export interface FilterRule {
  readonly id: string;
  readonly field: string;
  readonly operator: string;
  readonly value: string;
}

const DEFAULT_OPERATORS: ReadonlyArray<string> = [
  'equals',
  'not_equals',
  'contains',
  'starts_with',
  'gt',
  'lt',
];

let ruleSeq = 0;

/**
 * `<mth-filter-builder>`: Structured AND/OR filter rule editor.
 */
export class MthFilterBuilder extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = filterBuilderMessages;
  static override styles = filterBuilderStyles;

  @property({ type: String, reflect: true })
  combinator: FilterCombinator = 'and';

  @property({ attribute: false })
  fields: ReadonlyArray<FilterFieldDef> = [];

  @property({ attribute: false })
  rules: ReadonlyArray<FilterRule> = [];

  @property({ type: Boolean, reflect: true })
  disabled = false;

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.setCustomState('disabled', this.disabled);
    this.setCustomState('empty', this.rules.length === 0);
  }

  addRule(partial?: Partial<Omit<FilterRule, 'id'>>): void {
    if (this.disabled) return;
    const defaultField = partial?.field ?? this.fields[0]?.id ?? '';
    const fieldDef = this.fields.find((f) => f.id === defaultField);
    const defaultOp = partial?.operator ?? fieldDef?.operators?.[0] ?? DEFAULT_OPERATORS[0] ?? 'equals';
    ruleSeq += 1;
    const nextRule: FilterRule = {
      id: `rule-${ruleSeq}`,
      field: defaultField,
      operator: defaultOp,
      value: partial?.value ?? '',
    };
    this.rules = [...this.rules, nextRule];
    this._emitChange();
  }

  removeRule(id: string): void {
    if (this.disabled) return;
    const next = this.rules.filter((r) => r.id !== id);
    if (next.length === this.rules.length) return;
    this.rules = next;
    this._emitChange();
  }

  updateRule(id: string, patch: Partial<Omit<FilterRule, 'id'>>): void {
    if (this.disabled) return;
    this.rules = this.rules.map((r) => (r.id === id ? { ...r, ...patch } : r));
    this._emitChange();
  }

  clearRules(): void {
    if (this.disabled || this.rules.length === 0) return;
    this.rules = [];
    this._emitChange();
  }

  private _emitChange(): void {
    this.emitEvent('mth-change', {
      detail: { combinator: this.combinator, rules: this.rules },
    });
  }

  private _formatOperator(op: string): string {
    switch (op) {
      case 'equals':
        return this.t('opEquals');
      case 'not_equals':
        return this.t('opNotEquals');
      case 'contains':
        return this.t('opContains');
      case 'starts_with':
        return this.t('opStartsWith');
      case 'gt':
        return this.t('opGt');
      case 'lt':
        return this.t('opLt');
      default:
        return op;
    }
  }

  override render() {
    const fieldOptions =
      this.fields.length > 0 ? this.fields : [{ id: 'name', label: this.t('defaultFieldLabel') }];

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('regionLabel')}
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
      >
        <div part="header" class="header">
          <select
            aria-label=${this.t('combinatorLabel')}
            .value=${this.combinator}
            ?disabled=${this.disabled}
            @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value;
              this.combinator = val === 'or' ? 'or' : 'and';
              this._emitChange();
            }}
          >
            <option value="and">${this.t('combinatorAnd')}</option>
            <option value="or">${this.t('combinatorOr')}</option>
          </select>

          <div class="actions">
            <slot name="actions"></slot>
            <button
              type="button"
              part="add-btn"
              ?disabled=${this.disabled}
              @click=${() => this.addRule()}
            >
              ${this.t('addRule')}
            </button>
            <button
              type="button"
              part="clear-btn"
              ?disabled=${this.disabled || this.rules.length === 0}
              @click=${() => this.clearRules()}
            >
              ${this.t('clearRules')}
            </button>
          </div>
        </div>

        <div part="rules" class="rules">
          ${this.rules.length === 0
            ? html`<p class="empty">${this.t('emptyLabel')}</p>`
            : this.rules.map((rule) => {
                const activeField = fieldOptions.find((f) => f.id === rule.field);
                const operators = activeField?.operators ?? DEFAULT_OPERATORS;
                return html`
                  <div part="row" class="row" data-rule-id=${rule.id}>
                    <select
                      aria-label=${this.t('fieldLabel')}
                      .value=${rule.field}
                      ?disabled=${this.disabled}
                      @change=${(e: Event) => {
                        this.updateRule(rule.id, {
                          field: (e.target as HTMLSelectElement).value,
                        });
                      }}
                    >
                      ${fieldOptions.map(
                        (f) => html`<option value=${f.id}>${f.label}</option>`,
                      )}
                    </select>

                    <select
                      aria-label=${this.t('operatorLabel')}
                      .value=${rule.operator}
                      ?disabled=${this.disabled}
                      @change=${(e: Event) => {
                        this.updateRule(rule.id, {
                          operator: (e.target as HTMLSelectElement).value,
                        });
                      }}
                    >
                      ${operators.map(
                        (op) => html`<option value=${op}>${this._formatOperator(op)}</option>`,
                      )}
                    </select>

                    <input
                      type="text"
                      aria-label=${this.t('valueLabel')}
                      placeholder=${this.t('valuePlaceholder')}
                      .value=${rule.value}
                      ?disabled=${this.disabled}
                      @input=${(e: Event) => {
                        this.updateRule(rule.id, {
                          value: (e.target as HTMLInputElement).value,
                        });
                      }}
                    />

                    <button
                      type="button"
                      aria-label=${this.t('removeRule')}
                      ?disabled=${this.disabled}
                      @click=${() => this.removeRule(rule.id)}
                    >
                      ×
                    </button>
                  </div>
                `;
              })}
        </div>
      </div>
    `;
  }
}
