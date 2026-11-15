import { css } from 'lit';

export const phoneInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_phone-bg: var(--mth-color-surface, Canvas);
    --_phone-fg: var(--mth-color-fg, CanvasText);
    --_phone-muted: var(--mth-color-fg-muted, GrayText);
    --_phone-subtle: var(--mth-color-bg-subtle, Field);
    --_phone-border: var(--mth-color-border, ButtonBorder);
    --_phone-focus: var(--mth-color-border-focus, Highlight);
    --_phone-danger: var(--mth-color-danger, crimson);
    --_phone-radius: var(--mth-radius-md, 0.375rem);
    --_phone-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_phone-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_phone-fg);
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
    align-items: stretch;
    background: var(--_phone-bg);
    color: var(--_phone-fg);
    border: 1px solid var(--_phone-border);
    border-radius: var(--_phone-radius);
    overflow: hidden;
  }

  .wrapper:focus-within {
    border-color: var(--_phone-focus);
    outline: 2px solid var(--_phone-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_phone-danger);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .country {
    border: none;
    border-inline-end: 1px solid var(--_phone-border);
    background: var(--_phone-subtle);
    color: var(--_phone-fg);
    font: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    padding-block: var(--_phone-pad-block);
    outline: none;
    cursor: pointer;
    flex-shrink: 0;
  }

  .country:focus-visible {
    outline: 2px solid var(--_phone-focus);
    outline-offset: -2px;
  }

  .control {
    flex: 1 1 auto;
    min-inline-size: 0;
    inline-size: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    outline: none;
    padding-inline: var(--_phone-pad-inline);
    padding-block: var(--_phone-pad-block);
  }

  .hint {
    margin-block: 0;
    color: var(--_phone-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_phone-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .wrapper {
      border-color: ButtonBorder;
    }

    .country {
      border-inline-end-color: ButtonBorder;
    }

    .wrapper:focus-within,
    .country:focus-visible {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
