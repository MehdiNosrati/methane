import { UIElement, type PropertyValues } from '@methane/core';
import { FormControlController } from '@methane/primitives';
import { html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { queryBuilderMessages } from './query-builder.messages.js';
import { queryBuilderStyles } from './query-builder.styles.js';

export interface QueryFieldDef {
  readonly id: string;
  readonly label: string;
}

export interface QueryLeafRule {
  readonly kind: 'rule';
  readonly id: string;
  readonly field: string;
  readonly operator: string;
  readonly value: string;
}

export interface QueryGroup {
  readonly kind?: 'group';
  readonly id?: string;
  readonly combinator: 'and' | 'or';
  readonly items: ReadonlyArray<QueryLeafRule | QueryGroup>;
}

const DEFAULT_VALUE = '{"combinator":"and","items":[]}';

let qbSeq = 0;

function isQueryGroup(item: QueryLeafRule | QueryGroup): item is QueryGroup {
  return 'items' in item && Array.isArray(item.items);
}

function countRules(group: QueryGroup): number {
  let total = 0;
  for (const item of group.items) {
    if (isQueryGroup(item)) {
      total += countRules(item);
    } else {
      total += 1;
    }
  }
  return total;
}

function parseQueryJson(raw: string): QueryGroup {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'combinator' in parsed &&
      'items' in parsed &&
      Array.isArray((parsed as QueryGroup).items)
    ) {
      const g = parsed as QueryGroup;
      return {
        kind: 'group',
        id: g.id ?? 'root',
        combinator: g.combinator === 'or' ? 'or' : 'and',
        items: g.items,
      };
    }
  } catch {
    // Fallback to empty root group
  }
  return { kind: 'group', id: 'root', combinator: 'and', items: [] };
}

/**
 * `<mth-query-builder>`: Form-associated nested boolean query builder with JSON preview.
 */
export class MthQueryBuilder extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = queryBuilderMessages;
  static override styles = queryBuilderStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = DEFAULT_VALUE;

  @property({ attribute: false })
  fields: ReadonlyArray<QueryFieldDef> = [];

  @property({ type: Boolean, attribute: 'show-preview' })
  showPreview = true;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: String })
  error = '';

  private readonly formCtrl: FormControlController;

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      defaultValue: DEFAULT_VALUE,
      messages: queryBuilderMessages,
      onValueSync: (nextValue) => {
        this.value = nextValue || DEFAULT_VALUE;
      },
      onDisabledChange: () => this.requestUpdate(),
      onSetCustomState: (stateName, active) => this.setCustomState(stateName, active),
      validator: () => {
        if (this.error.length > 0) {
          return { flags: { customError: true }, message: this.error };
        }
        const parsed = this.getQueryAst();
        if (this.required && countRules(parsed) === 0) {
          return { flags: { valueMissing: true }, message: this.t('requiredError') };
        }
        return null;
      },
    });
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  get effectivelyDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  checkValidity(): boolean {
    return this.formCtrl.checkValidity();
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

  override connectedCallback(): void {
    super.connectedCallback();
    this.formCtrl.setValue(this.value, { markDirty: false });
    this.formCtrl.validate();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('disabled')) this.formCtrl.hostDisabled = this.disabled;
    if (changed.has('required')) this.formCtrl.required = this.required;
    if (changed.has('readonly')) this.formCtrl.hostReadOnly = this.readonly;
    if (changed.has('value')) {
      this.formCtrl.setValue(this.value, { markDirty: changed.get('value') !== undefined });
    }
    this.formCtrl.validate();
    this.setCustomState('disabled', this.formCtrl.disabled);
    this.setCustomState('readonly', this.readonly);
  }

  getQueryAst(): QueryGroup {
    return parseQueryJson(this.value);
  }

  setQueryAst(group: QueryGroup): void {
    if (this.formCtrl.disabled || this.readonly) return;
    const serialized = JSON.stringify({
      combinator: group.combinator === 'or' ? 'or' : 'and',
      items: group.items,
    });
    this.value = serialized;
    this.formCtrl.setValue(serialized, { markDirty: true });
    this.formCtrl.validate();
    this.emitEvent('mth-change', {
      detail: { value: serialized, query: this.getQueryAst() },
    });
  }

  private _updateGroup(
    targetId: string,
    updater: (group: QueryGroup) => QueryGroup,
  ): void {
    const visit = (node: QueryGroup): QueryGroup => {
      if ((node.id ?? 'root') === targetId) {
        return updater(node);
      }
      return {
        ...node,
        items: node.items.map((item) => (isQueryGroup(item) ? visit(item) : item)),
      };
    };
    this.setQueryAst(visit(this.getQueryAst()));
  }

  private _renderGroup(group: QueryGroup, isRoot: boolean): TemplateResult {
    const groupId = group.id ?? 'root';
    const fieldOptions =
      this.fields.length > 0 ? this.fields : [{ id: 'field', label: 'field' }];
    const isBlocked = this.formCtrl.disabled || this.readonly;

    return html`
      <div part="group" class="group" data-group-id=${groupId}>
        <div class="group-header">
          <select
            aria-label=${this.t('groupCombinator')}
            .value=${group.combinator}
            ?disabled=${isBlocked}
            @change=${(e: Event) => {
              const combinator =
                (e.target as HTMLSelectElement).value === 'or' ? 'or' : 'and';
              this._updateGroup(groupId, (g) => ({ ...g, combinator }));
            }}
          >
            <option value="and">${this.t('combinatorAnd')}</option>
            <option value="or">${this.t('combinatorOr')}</option>
          </select>

          <button
            type="button"
            ?disabled=${isBlocked}
            @click=${() => {
              qbSeq += 1;
              const newRule: QueryLeafRule = {
                kind: 'rule',
                id: `qb-rule-${qbSeq}`,
                field: fieldOptions[0]?.id ?? 'field',
                operator: 'equals',
                value: '',
              };
              this._updateGroup(groupId, (g) => ({
                ...g,
                items: [...g.items, newRule],
              }));
            }}
          >
            ${this.t('addRule')}
          </button>

          <button
            type="button"
            ?disabled=${isBlocked}
            @click=${() => {
              qbSeq += 1;
              const nested: QueryGroup = {
                kind: 'group',
                id: `qb-group-${qbSeq}`,
                combinator: 'and',
                items: [],
              };
              this._updateGroup(groupId, (g) => ({
                ...g,
                items: [...g.items, nested],
              }));
            }}
          >
            ${this.t('addGroup')}
          </button>

          ${isRoot
            ? ''
            : html`
                <button
                  type="button"
                  ?disabled=${isBlocked}
                  @click=${() => {
                    const removeNested = (node: QueryGroup): QueryGroup => ({
                      ...node,
                      items: node.items
                        .filter((item) => !(isQueryGroup(item) && item.id === groupId))
                        .map((item) => (isQueryGroup(item) ? removeNested(item) : item)),
                    });
                    this.setQueryAst(removeNested(this.getQueryAst()));
                  }}
                >
                  ${this.t('removeGroup')}
                </button>
              `}
        </div>

        ${group.items.map((item) =>
          isQueryGroup(item)
            ? this._renderGroup(item, false)
            : html`
                <div class="rule-row">
                  <select
                    aria-label=${this.t('fieldLabel')}
                    .value=${item.field}
                    ?disabled=${isBlocked}
                    @change=${(e: Event) => {
                      const field = (e.target as HTMLSelectElement).value;
                      this._updateGroup(groupId, (g) => ({
                        ...g,
                        items: g.items.map((x) =>
                          !isQueryGroup(x) && x.id === item.id ? { ...x, field } : x,
                        ),
                      }));
                    }}
                  >
                    ${fieldOptions.map(
                      (f) => html`<option value=${f.id}>${f.label}</option>`,
                    )}
                  </select>

                  <select
                    aria-label=${this.t('operatorLabel')}
                    .value=${item.operator}
                    ?disabled=${isBlocked}
                    @change=${(e: Event) => {
                      const operator = (e.target as HTMLSelectElement).value;
                      this._updateGroup(groupId, (g) => ({
                        ...g,
                        items: g.items.map((x) =>
                          !isQueryGroup(x) && x.id === item.id ? { ...x, operator } : x,
                        ),
                      }));
                    }}
                  >
                    <option value="equals">equals</option>
                    <option value="contains">contains</option>
                    <option value="gt">gt</option>
                    <option value="lt">lt</option>
                  </select>

                  <input
                    type="text"
                    aria-label=${this.t('valueLabel')}
                    .value=${item.value}
                    ?disabled=${this.formCtrl.disabled}
                    ?readonly=${this.readonly}
                    @input=${(e: Event) => {
                      const val = (e.target as HTMLInputElement).value;
                      this._updateGroup(groupId, (g) => ({
                        ...g,
                        items: g.items.map((x) =>
                          !isQueryGroup(x) && x.id === item.id ? { ...x, value: val } : x,
                        ),
                      }));
                    }}
                  />

                  <button
                    type="button"
                    aria-label=${this.t('removeRule')}
                    ?disabled=${isBlocked}
                    @click=${() => {
                      this._updateGroup(groupId, (g) => ({
                        ...g,
                        items: g.items.filter(
                          (x) => !(!isQueryGroup(x) && x.id === item.id),
                        ),
                      }));
                    }}
                  >
                    ×
                  </button>
                </div>
              `,
        )}
      </div>
    `;
  }

  override render() {
    const ast = this.getQueryAst();
    const errorMsg = this.error || (this.formCtrl.userInvalid ? this.formCtrl.validationMessage : '');

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('regionLabel')}
        aria-invalid=${this.formCtrl.userInvalid || this.error.length > 0 ? 'true' : 'false'}
        dir=${this.resolvedDir}
      >
        ${this._renderGroup(ast, true)}

        <pre
          part="preview"
          class="preview"
          aria-label=${this.t('previewLabel')}
          ?hidden=${!this.showPreview}
        >${this.value}</pre>

        <p part="error" class="error" role="alert" ?hidden=${errorMsg.length === 0}>
          ${errorMsg}
        </p>
      </div>
    `;
  }
}
