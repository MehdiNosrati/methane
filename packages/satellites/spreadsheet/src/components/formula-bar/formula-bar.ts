import { UIElement, type PropertyValues } from '@methane-ui/core';
import { FormControlController, InputController } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { captureThemeSnapshot, readCssToken, type BaseSatelliteEngine } from '../../shared/engine.js';
import { collectAstDependencies, parseFormula } from '../../shared/formula-ast.js';
import { formulaBarMessages } from './formula-bar.messages.js';
import { formulaBarStyles } from './formula-bar.styles.js';

export interface MthFormulaBarEngine extends BaseSatelliteEngine {
  getDependencies(): ReadonlyArray<string>;
  isFormulaSyntaxValid(): boolean;
}

/**
 * `<mth-formula-bar>`: form-associated formula editing bar synced with AST dependency inspection.
 */
export class MthFormulaBar extends UIElement {
  static formAssociated = true;
  static override shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };
  static override messages = formulaBarMessages;
  static override styles = formulaBarStyles;

  @property({ type: String, reflect: true })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String, attribute: 'cell-address', reflect: true })
  cellAddress = 'A1';

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: String })
  label = '';

  @query('.formula-input')
  private inputEl!: HTMLInputElement | null;

  private readonly formCtrl: FormControlController;
  private readonly inputCtrl: InputController;

  private _engine: MthFormulaBarEngine | null = null;
  private hasDefaulted = false;
  private committedValue = '';

  constructor() {
    super();
    this.formCtrl = new FormControlController(this, {
      internals: this.internals,
      messages: formulaBarMessages,
      onValueSync: (nextVal, source) => {
        if (source === 'reset' || source === 'restore') {
          this.value = nextVal;
          this.committedValue = nextVal;
          this.requestUpdate();
        }
      },
      onDisabledChange: () => {
        this.requestUpdate();
      },
      onSetCustomState: (stateName, active) => {
        this.setCustomState(stateName, active);
      },
      validator: (ctx) => {
        const raw = typeof ctx.value === 'string' ? ctx.value : '';
        if (ctx.required && raw.trim().length === 0) {
          return { flags: { valueMissing: true }, message: this.t('valueMissingError') };
        }
        if (raw.startsWith('=')) {
          try {
            parseFormula(raw);
          } catch {
            return { flags: { customError: true }, message: this.t('invalidFormulaError') };
          }
        }
        return null;
      },
    });
    this.inputCtrl = new InputController(this, {
      onCommitValue: (nextVal) => {
        this.updateValueFromInput(nextVal);
      },
    });
  }

  get engine(): MthFormulaBarEngine | null {
    return this._engine;
  }

  get form(): HTMLFormElement | null {
    return this.internals?.form ?? null;
  }

  get isEffectiveDisabled(): boolean {
    return this.formCtrl.disabled;
  }

  get validity(): ValidityState | undefined {
    return this.internals?.validity;
  }

  get validationMessage(): string {
    return this.formCtrl.validationMessage;
  }

  checkValidity(): boolean {
    const valid = this.formCtrl.checkValidity(this.inputEl ?? undefined);
    this.setCustomState('invalid', this.formCtrl.invalid);
    this.requestUpdate();
    return valid;
  }

  reportValidity(): boolean {
    const valid = this.formCtrl.reportValidity(this.inputEl ?? undefined);
    this.setCustomState('invalid', this.formCtrl.invalid);
    this.requestUpdate();
    return valid;
  }

  override focus(options?: FocusOptions): void {
    if (this.inputEl) {
      this.inputEl.focus(options);
      return;
    }
    super.focus(options);
  }

  private getDependenciesFor(raw: string): ReadonlyArray<string> {
    if (!raw.startsWith('=')) return [];
    try {
      return collectAstDependencies(parseFormula(raw));
    } catch {
      return [];
    }
  }

  private isSyntaxValidFor(raw: string): boolean {
    if (!raw.startsWith('=')) return true;
    try {
      parseFormula(raw);
      return true;
    } catch {
      return false;
    }
  }

  private createEngine(): MthFormulaBarEngine {
    let theme = captureThemeSnapshot(this);
    return {
      get theme() {
        return theme;
      },
      getAppliedToken: (tokenName: string) => {
        theme = captureThemeSnapshot(this);
        return readCssToken(this, tokenName);
      },
      syncTokens: (host: HTMLElement) => {
        theme = captureThemeSnapshot(host);
      },
      getDependencies: () => this.getDependenciesFor(this.value),
      isFormulaSyntaxValid: () => this.isSyntaxValidFor(this.value),
      dispose: () => {},
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this._engine) {
      this._engine = this.createEngine();
    }
    if (!this.hasDefaulted) {
      this.hasDefaulted = true;
      this.committedValue = this.value;
      this.formCtrl.setDefaultValue(this.value);
    }
    this.syncFormState();
  }

  override disconnectedCallback(): void {
    this._engine?.dispose();
    this._engine = null;
    super.disconnectedCallback();
  }

  protected override onFormDisabled(disabled: boolean): void {
    this.formCtrl.handleFormDisabled(disabled);
    this.setCustomState('disabled', this.formCtrl.disabled);
    this.requestUpdate();
  }

  protected override onFormReset(): void {
    this.formCtrl.handleFormReset();
    this.requestUpdate();
  }

  protected override onFormStateRestore(
    stateValue: File | string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.formCtrl.handleFormStateRestore(stateValue, mode);
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (
      changed.has('value') ||
      changed.has('disabled') ||
      changed.has('required') ||
      changed.has('readonly')
    ) {
      this.syncFormState();
    }
    this.setCustomState('formula', this.value.startsWith('='));
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.inputCtrl.bind(this.inputEl);
  }

  private syncFormState(): void {
    this.formCtrl.hostDisabled = this.disabled;
    this.formCtrl.required = this.required;
    this.formCtrl.hostReadOnly = this.readonly;
    this.formCtrl.setValue(this.value);
    this.setCustomState('disabled', this.formCtrl.disabled);
    this.setCustomState('readonly', this.readonly);
    this.setCustomState('invalid', this.formCtrl.invalid);
    this._engine?.syncTokens(this);
  }

  private updateValueFromInput(nextVal: string): void {
    if (this.disabled || this._formDisabled || this.readonly) return;
    this.value = nextVal;
    this.formCtrl.setValue(nextVal, { markDirty: true });
    this.emitEvent('input');
    this.emitEvent('mth-formula-input', {
      detail: {
        cellAddress: this.cellAddress,
        value: nextVal,
        dependencies: this.getDependenciesFor(nextVal),
      },
    });
  }

  private commitFormula(): void {
    if (this.disabled || this._formDisabled || this.readonly) return;
    this.committedValue = this.value;
    const valid = this.checkValidity();
    this.emitEvent('change');
    this.emitEvent('mth-formula-commit', {
      detail: {
        cellAddress: this.cellAddress,
        value: this.value,
        valid,
      },
    });
  }

  override render() {
    const isDisabled = this.formCtrl.disabled;
    const isInvalid = this.formCtrl.invalid;
    const errorMsg = this.formCtrl.validationMessage;
    const effectiveLabel =
      this.label || this.formCtrl.fieldContext?.label || this.t('toolbarLabel');
    const resolvedPlaceholder = this.placeholder || this.t('formulaPlaceholder');

    return html`
      <div part="base" class="base" role="group" aria-label=${effectiveLabel}>
        <span
          part="address"
          class="address"
          aria-label=${this.t('addressBoxLabel')}
        >
          ${this.cellAddress}
        </span>
        <span part="fx" class="fx" aria-hidden="true">fx</span>
        <input
          part="input"
          type="text"
          class="formula-input"
          aria-label=${this.t('formulaInputLabel')}
          aria-invalid=${isInvalid ? 'true' : 'false'}
          aria-errormessage=${isInvalid ? 'mth-fb-error' : nothing}
          placeholder=${resolvedPlaceholder}
          .value=${this.value}
          ?disabled=${isDisabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          @keydown=${(ev: KeyboardEvent) => {
            if (ev.key === 'Enter' && !this.inputCtrl.isComposing) {
              ev.preventDefault();
              this.commitFormula();
            } else if (ev.key === 'Escape') {
              ev.preventDefault();
              this.value = this.committedValue;
              this.formCtrl.setValue(this.committedValue);
            }
          }}
          @blur=${() => {
            this.formCtrl.markTouched();
            this.checkValidity();
          }}
        />
        <button
          part="commit"
          type="button"
          class="commit-btn"
          ?disabled=${isDisabled || this.readonly}
          aria-label=${this.t('commitButtonLabel')}
          @click=${() => this.commitFormula()}
        >
          ✓
        </button>
      </div>
      ${isInvalid
        ? html`
            <div id="mth-fb-error" part="error" class="error-message" role="alert">
              ${errorMsg}
            </div>
          `
        : nothing}
      <div class="fallback-slot"><slot name="fallback"></slot></div>
    `;
  }
}
