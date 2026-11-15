import { css } from 'lit';

export const currencyInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_cur-bg: var(--mth-color-surface, Canvas);
    --_cur-fg: var(--mth-color-fg, CanvasText);
    --_cur-muted: var(--mth-color-fg-muted, GrayText);
    --_cur-subtle: var(--mth-color-bg-subtle, Field);
    --_cur-border: var(--mth-color-border, ButtonBorder);
    --_cur-focus: var(--mth-color-border-focus, Highlight);
    --_cur-danger: var(--mth-color-danger, crimson);
    --_cur-radius: var(--mth-radius-md, 0.375rem);
    --_cur-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_cur-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_cur-fg);
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
    padding-inline: var(--_cur-pad-inline);
    padding-block: var(--_cur-pad-block);
    background: var(--_cur-bg);
    color: var(--_cur-fg);
    border: 1px solid var(--_cur-border);
    border-radius: var(--_cur-radius);
  }

  .wrapper:focus-within {
    border-color: var(--_cur-focus);
    outline: 2px solid var(--_cur-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_cur-danger);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .currency {
    color: var(--_cur-muted);
    font-weight: var(--mth-font-weight-medium, 500);
    user-select: none;
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
    font-variant-numeric: tabular-nums;
    text-align: end;
    outline: none;
    padding-block: 0;
    padding-inline: 0;
  }

  .hint {
    margin-block: 0;
    color: var(--_cur-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_cur-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .wrapper {
      border-color: ButtonBorder;
    }

    .wrapper:focus-within {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
