import type { DataControllerStatus } from '@methane/primitives';
import { html, nothing, type TemplateResult } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  renderComboboxOptionsList,
  type ResolvedComboboxOption,
} from './combobox-options.js';

export interface ComboboxControlTemplateParams {
  readonly hasLabel: boolean;
  readonly hasFieldContext: boolean;
  readonly effectiveLabel: string;
  readonly placeholder: string;
  readonly fallbackAriaLabel: string;
  readonly displayText: string;
  readonly open: boolean;
  readonly activeOptionId: string;
  readonly hasHint: boolean;
  readonly hasError: boolean;
  readonly isInvalid: boolean;
  readonly isRequired: boolean;
  readonly isDisabled: boolean;
  readonly isReadonly: boolean;
  readonly showClear: boolean;
  readonly clearLabel: string;
  readonly toggleLabel: string;
  readonly onInputFocus: () => void;
  readonly onInputKeyDown: (event: KeyboardEvent) => void;
  readonly onClearClick: () => void;
  readonly onToggleClick: () => void;
}

export interface ComboboxPopupTemplateParams {
  readonly open: boolean;
  readonly multiple: boolean;
  readonly optionsContent: TemplateResult;
}

/**
 * Manages visualViewport-aware popup max-height via an adopted CSSStyleSheet (zero inline styles).
 */
export class ComboboxViewportController {
  private viewportMaxHeightPx: number | null = null;
  private viewportSheet: CSSStyleSheet | null = null;
  private cleanup: (() => void) | null = null;

  attach(getShadowRoot: () => ShadowRoot | null): void {
    if (typeof window === 'undefined' || !window.visualViewport || this.cleanup) return;
    const vv = window.visualViewport;
    const updateViewport = () => {
      this.viewportMaxHeightPx = Math.max(140, Math.floor(vv.height * 0.45));
      this.applySheet(getShadowRoot());
    };
    vv.addEventListener('resize', updateViewport);
    this.cleanup = () => {
      vv.removeEventListener('resize', updateViewport);
    };
  }

  detach(): void {
    this.cleanup?.();
    this.cleanup = null;
  }

  private applySheet(root: ShadowRoot | null): void {
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (this.viewportMaxHeightPx === null) {
      if (this.viewportSheet) {
        root.adoptedStyleSheets = root.adoptedStyleSheets.filter((s) => s !== this.viewportSheet);
      }
      return;
    }
    if (!this.viewportSheet) {
      this.viewportSheet = new CSSStyleSheet();
    }
    if (typeof this.viewportSheet.replaceSync === 'function') {
      this.viewportSheet.replaceSync(
        `:host { --mth-combobox-max-height: ${this.viewportMaxHeightPx}px; }`,
      );
      if (!root.adoptedStyleSheets.includes(this.viewportSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.viewportSheet];
      }
    }
  }
}

/**
 * Renders the combobox label and interactive input/clear/toggle control wrapper.
 */
export function renderComboboxControl(params: ComboboxControlTemplateParams): TemplateResult {
  return html`
    ${params.hasLabel
      ? html`<label
          id="mth-cb-label"
          part="label"
          class=${params.hasFieldContext ? 'label sr-only' : 'label'}
          for="mth-cb-input"
          >${params.effectiveLabel}</label
        >`
      : nothing}

    <div id="mth-cb-control" part="control">
      <slot name="prefix"></slot>
      <input
        id="mth-cb-input"
        part="input"
        role="combobox"
        type="text"
        autocomplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded=${params.open ? 'true' : 'false'}
        aria-controls="mth-cb-listbox"
        aria-activedescendant=${ifDefined(params.open && params.activeOptionId ? params.activeOptionId : undefined)}
        aria-labelledby=${params.hasLabel ? 'mth-cb-label' : nothing}
        aria-label=${!params.hasLabel ? (params.placeholder || params.fallbackAriaLabel) : nothing}
        aria-describedby=${params.hasHint && !params.hasError ? 'mth-cb-hint' : nothing}
        aria-errormessage=${params.isInvalid && params.hasError ? 'mth-cb-error' : nothing}
        aria-required=${params.isRequired ? 'true' : nothing}
        aria-invalid=${params.isInvalid ? 'true' : nothing}
        placeholder=${params.placeholder}
        .value=${params.displayText}
        ?disabled=${params.isDisabled}
        ?readonly=${params.isReadonly}
        ?required=${params.isRequired}
        @focus=${params.onInputFocus}
        @keydown=${params.onInputKeyDown}
      />
      ${params.showClear
        ? html`
            <button
              part="clear-button"
              type="button"
              aria-label=${params.clearLabel}
              @click=${params.onClearClick}
            >
              ×
            </button>
          `
        : nothing}
      <button
        part="toggle-button"
        type="button"
        tabindex="-1"
        aria-label=${params.toggleLabel}
        aria-expanded=${params.open ? 'true' : 'false'}
        ?disabled=${params.isDisabled}
        @click=${params.onToggleClick}
      >
        ▾
      </button>
    </div>
  `;
}

/**
 * Renders the floating popup surface and listbox container.
 */
export function renderComboboxPopup(params: ComboboxPopupTemplateParams): TemplateResult {
  return html`
    <div id="mth-cb-popup" part="popup" ?hidden=${!params.open}>
      <div
        id="mth-cb-listbox"
        part="listbox"
        role="listbox"
        tabindex="-1"
        aria-multiselectable=${params.multiple ? 'true' : nothing}
      >
        ${params.optionsContent}
      </div>
    </div>
  `;
}

export interface ComboboxViewHost {
  readonly label: string;
  readonly hint: string;
  readonly error: string;
  readonly placeholder: string;
  readonly value: string;
  readonly open: boolean;
  readonly multiple: boolean;
  readonly clearable: boolean;
  readonly required: boolean;
  readonly readonly: boolean;
  readonly isEffectivelyDisabled: boolean;
  readonly hasCustomState: (name: string) => boolean;
}

export interface ComboboxViewState {
  readonly displayText: string;
  readonly activeOptionId: string;
  readonly dataStatus: DataControllerStatus;
  readonly resolvedOptions: ReadonlyArray<ResolvedComboboxOption>;
  readonly selectedValues: ReadonlyArray<string>;
  readonly fieldContext: { label?: string; hint?: string; error?: string } | null | undefined;
  readonly userInvalid: boolean;
  readonly validationMessage: string;
  readonly formRequired: boolean;
  readonly formReadOnly: boolean;
  readonly t: (key: 'loadingLabel' | 'errorLabel' | 'emptyLabel' | 'comboboxLabel' | 'clearLabel' | 'toggleLabel') => string;
  readonly onInputFocus: () => void;
  readonly onInputKeyDown: (event: KeyboardEvent) => void;
  readonly onClearClick: () => void;
  readonly onToggleClick: () => void;
  readonly onOptionClick: (opt: ResolvedComboboxOption, index: number) => void;
}

/**
 * Renders the complete `<mth-combobox>` shadow DOM (control, popup listbox, hint, error, slot collector).
 */
export function renderComboboxView(
  host: ComboboxViewHost,
  state: ComboboxViewState,
): TemplateResult {
  const ctx = state.fieldContext;
  const hasFieldContext = Boolean(ctx);
  const effectiveLabel = host.label || ctx?.label || '';
  const effectiveHint = host.hint || ctx?.hint || '';
  const explicitError = host.error || ctx?.error || '';
  const validityError = state.userInvalid ? state.validationMessage : '';
  const effectiveError = explicitError || validityError;
  const hasHint = effectiveHint.length > 0;
  const hasError = effectiveError.length > 0;
  const isDisabled = host.isEffectivelyDisabled;
  const isReadonly = state.formReadOnly || host.readonly;
  const isInvalid =
    state.userInvalid || explicitError.length > 0 || host.hasCustomState('invalid');

  const optionsContent = renderComboboxOptionsList({
    dataStatus: state.dataStatus,
    resolvedOptions: state.resolvedOptions,
    selectedValues: state.selectedValues,
    activeOptionId: state.activeOptionId,
    loadingLabel: state.t('loadingLabel'),
    errorLabel: state.t('errorLabel'),
    emptyLabel: state.t('emptyLabel'),
    onOptionClick: state.onOptionClick,
  });

  return html`
    ${renderComboboxControl({
      hasLabel: effectiveLabel.length > 0,
      hasFieldContext,
      effectiveLabel,
      placeholder: host.placeholder,
      fallbackAriaLabel: state.t('comboboxLabel'),
      displayText: state.displayText,
      open: host.open,
      activeOptionId: state.activeOptionId,
      hasHint,
      hasError,
      isInvalid,
      isRequired: state.formRequired || host.required,
      isDisabled,
      isReadonly,
      showClear:
        host.clearable &&
        !isDisabled &&
        !isReadonly &&
        (host.value.length > 0 || state.displayText.length > 0),
      clearLabel: state.t('clearLabel'),
      toggleLabel: state.t('toggleLabel'),
      onInputFocus: state.onInputFocus,
      onInputKeyDown: state.onInputKeyDown,
      onClearClick: state.onClearClick,
      onToggleClick: state.onToggleClick,
    })}
    ${renderComboboxPopup({ open: host.open, multiple: host.multiple, optionsContent })}
    <p
      id="mth-cb-hint"
      part="hint"
      class=${hasFieldContext ? 'hint sr-only' : 'hint'}
      ?hidden=${!hasHint || hasError}
    >${effectiveHint}</p>
    <p
      id="mth-cb-error"
      part="error"
      class=${hasFieldContext ? 'error sr-only' : 'error'}
      role=${hasError ? 'alert' : nothing}
      ?hidden=${!hasError}
    >${effectiveError}</p>
    <div class="mth-slot-collector" aria-hidden="true"><slot></slot></div>
  `;
}
