import { css } from 'lit';

export const captchaSlotStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_cap-bg: var(--mth-color-surface, Canvas);
    --_cap-fg: var(--mth-color-fg, CanvasText);
    --_cap-muted: var(--mth-color-fg-muted, GrayText);
    --_cap-subtle: var(--mth-color-bg-subtle, Field);
    --_cap-border: var(--mth-color-border, ButtonBorder);
    --_cap-focus: var(--mth-color-border-focus, Highlight);
    --_cap-danger: var(--mth-color-danger, crimson);
    --_cap-success: var(--mth-color-success, oklch(0.62 0.17 150));
    --_cap-radius: var(--mth-radius-md, 0.375rem);
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
    color: var(--_cap-fg);
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

  .container {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background: var(--_cap-bg);
    color: var(--_cap-fg);
    border: 1px solid var(--_cap-border);
    border-radius: var(--_cap-radius);
  }

  .container[data-invalid='true'],
  :host(:state(user-invalid)) .container {
    border-color: var(--_cap-danger);
  }

  :host(:state(disabled)) .container {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_cap-muted);
  }

  .status[data-verified='true'] {
    color: var(--_cap-success);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .reset {
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_cap-border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: var(--_cap-subtle);
    color: var(--_cap-fg);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .reset:focus-visible {
    outline: 2px solid var(--_cap-focus);
    outline-offset: 1px;
  }

  .hint {
    margin-block: 0;
    color: var(--_cap-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_cap-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (forced-colors: active) {
    .container,
    .reset {
      border-color: ButtonBorder;
    }

    .reset:focus-visible {
      outline-color: Highlight;
    }
  }
`;
