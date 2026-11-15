import { css } from 'lit';

export const otpInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_otp-bg: var(--mth-color-surface, Canvas);
    --_otp-fg: var(--mth-color-fg, CanvasText);
    --_otp-muted: var(--mth-color-fg-muted, GrayText);
    --_otp-border: var(--mth-color-border, ButtonBorder);
    --_otp-focus: var(--mth-color-border-focus, Highlight);
    --_otp-danger: var(--mth-color-danger, crimson);
    --_otp-radius: var(--mth-radius-md, 0.375rem);
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
    color: var(--_otp-fg);
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

  .cells {
    display: flex;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
  }

  .cell {
    inline-size: 2.5rem;
    block-size: 2.75rem;
    border: 1px solid var(--_otp-border);
    border-radius: var(--_otp-radius);
    background: var(--_otp-bg);
    color: var(--_otp-fg);
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-lg, 1.125rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    text-align: center;
    padding-block: 0;
    padding-inline: 0;
    outline: none;
  }

  .cell:focus-visible {
    border-color: var(--_otp-focus);
    outline: 2px solid var(--_otp-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .cell,
  .cells[data-invalid='true'] .cell {
    border-color: var(--_otp-danger);
  }

  :host(:state(disabled)) .cell {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hint {
    margin-block: 0;
    color: var(--_otp-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_otp-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .cell {
      border-color: ButtonBorder;
    }

    .cell:focus-visible {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
