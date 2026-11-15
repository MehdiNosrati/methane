import { css } from 'lit';

export const ibanInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_iban-bg: var(--mth-color-surface, Canvas);
    --_iban-fg: var(--mth-color-fg, CanvasText);
    --_iban-muted: var(--mth-color-fg-muted, GrayText);
    --_iban-subtle: var(--mth-color-bg-subtle, Field);
    --_iban-border: var(--mth-color-border, ButtonBorder);
    --_iban-focus: var(--mth-color-border-focus, Highlight);
    --_iban-danger: var(--mth-color-danger, crimson);
    --_iban-radius: var(--mth-radius-md, 0.375rem);
    --_iban-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_iban-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--mth-space-1, 0.25rem);
    color: var(--_iban-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding-block: 0;
    padding-inline: 0;
    margin-block: -1px;
    margin-inline: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }

  .wrapper {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-inline: var(--_iban-pad-inline);
    padding-block: var(--_iban-pad-block);
    background: var(--_iban-bg);
    color: var(--_iban-fg);
    border: 1px solid var(--_iban-border);
    border-radius: var(--_iban-radius);
  }

  .wrapper:focus-within {
    border-color: var(--_iban-focus);
    outline: 2px solid var(--_iban-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_iban-danger);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .country {
    display: inline-flex;
    align-items: center;
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_iban-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_iban-subtle);
    color: var(--_iban-muted);
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    flex-shrink: 0;
  }

  .control {
    flex: 1 1 auto;
    min-inline-size: 0;
    inline-size: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    text-transform: uppercase;
    outline: none;
    padding-block: 0;
    padding-inline: 0;
  }

  .hint {
    margin-block: 0;
    color: var(--_iban-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_iban-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .wrapper,
    .country {
      border-color: ButtonBorder;
    }

    .wrapper:focus-within {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
