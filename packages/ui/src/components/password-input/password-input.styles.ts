import { css } from 'lit';

export const passwordInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_pw-bg: var(--mth-color-surface, Canvas);
    --_pw-fg: var(--mth-color-fg, CanvasText);
    --_pw-muted: var(--mth-color-fg-muted, GrayText);
    --_pw-subtle: var(--mth-color-bg-subtle, Field);
    --_pw-border: var(--mth-color-border, ButtonBorder);
    --_pw-focus: var(--mth-color-border-focus, Highlight);
    --_pw-danger: var(--mth-color-danger, oklch(0.6 0.2 25));
    --_pw-warning: var(--mth-color-warning, oklch(0.75 0.16 70));
    --_pw-info: var(--mth-color-info, oklch(0.62 0.17 250));
    --_pw-success: var(--mth-color-success, oklch(0.62 0.17 150));
    --_pw-radius: var(--mth-radius-md, 0.375rem);
    --_pw-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_pw-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_pw-fg);
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
    padding-inline: var(--_pw-pad-inline);
    padding-block: var(--_pw-pad-block);
    background: var(--_pw-bg);
    color: var(--_pw-fg);
    border: 1px solid var(--_pw-border);
    border-radius: var(--_pw-radius);
  }

  .wrapper:focus-within {
    border-color: var(--_pw-focus);
    outline: 2px solid var(--_pw-focus);
    outline-offset: 1px;
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_pw-danger);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .control {
    flex: 1 1 auto;
    min-inline-size: 0;
    inline-size: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
    padding-block: 0;
    padding-inline: 0;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-1, 0.25rem);
    border: none;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_pw-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .toggle:hover:not(:disabled) {
    color: var(--_pw-fg);
    background: var(--_pw-subtle);
  }

  .toggle:focus-visible {
    outline: 2px solid var(--_pw-focus);
    outline-offset: 1px;
  }

  .toggle:disabled {
    cursor: not-allowed;
  }

  .toggle svg {
    inline-size: 1.125rem;
    block-size: 1.125rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .strength {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .strength-track {
    inline-size: 100%;
    block-size: 0.25rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_pw-subtle);
    overflow: hidden;
  }

  .strength-bar {
    block-size: 100%;
    inline-size: 0%;
    border-radius: var(--mth-radius-full, 9999px);
    transition: inline-size var(--mth-motion-duration-fast, 150ms) var(--mth-motion-easing-standard, ease);
  }

  .strength-bar[data-strength='1'] {
    inline-size: 25%;
    background: var(--_pw-danger);
  }

  .strength-bar[data-strength='2'] {
    inline-size: 50%;
    background: var(--_pw-warning);
  }

  .strength-bar[data-strength='3'] {
    inline-size: 75%;
    background: var(--_pw-info);
  }

  .strength-bar[data-strength='4'] {
    inline-size: 100%;
    background: var(--_pw-success);
  }

  .strength-text {
    margin-block: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_pw-muted);
  }

  .hint {
    margin-block: 0;
    color: var(--_pw-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_pw-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .strength-bar {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .wrapper,
    .strength-track {
      border: 1px solid ButtonBorder;
    }

    .strength-bar {
      background: Highlight;
    }

    .wrapper:focus-within,
    .toggle:focus-visible {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
