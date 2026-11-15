import { css } from 'lit';

export const numberInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_num-bg: var(--mth-color-surface, Canvas);
    --_num-fg: var(--mth-color-fg, CanvasText);
    --_num-muted: var(--mth-color-fg-muted, GrayText);
    --_num-subtle: var(--mth-color-bg-subtle, Field);
    --_num-border: var(--mth-color-border-strong, ButtonBorder);
    --_num-accent: var(--mth-color-accent, Highlight);
    --_num-focus: var(--mth-color-border-focus, Highlight);
    --_num-danger: var(--mth-color-danger, crimson);
    --_num-radius: var(--mth-radius-md, 0.5rem);
    --_num-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_num-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_num-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_num-fg);
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
    background: var(--_num-bg);
    color: var(--_num-fg);
    border: 1px solid var(--_num-border);
    border-radius: var(--_num-radius);
    box-shadow: var(--_num-shadow);
    overflow: hidden;
    transition:
      border-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      box-shadow var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .wrapper:focus-within {
    border-color: var(--_num-focus);
    box-shadow:
      0 0 0 3px oklch(from var(--_num-focus) l c h / 0.22),
      var(--_num-shadow);
  }

  :host(:not(:state(disabled))) .wrapper:hover {
    border-color: var(--_num-accent);
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_num-danger);
  }

  :host(:state(user-invalid)) .wrapper:focus-within,
  .wrapper[data-invalid='true']:focus-within {
    box-shadow:
      0 0 0 3px oklch(from var(--_num-danger) l c h / 0.22),
      var(--_num-shadow);
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
    font-variant-numeric: tabular-nums;
    text-align: center;
    outline: none;
    padding-inline: var(--_num-pad-inline);
    padding-block: var(--_num-pad-block);
  }

  .stepper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: none;
    background: transparent;
    color: var(--_num-fg);
    font: inherit;
    font-weight: var(--mth-font-weight-semibold, 600);
    cursor: pointer;
    flex-shrink: 0;
  }

  .stepper-decrement {
    border-inline-end: 1px solid var(--_num-border);
  }

  .stepper-increment {
    border-inline-start: 1px solid var(--_num-border);
  }

  .stepper:hover:not(:disabled) {
    background: var(--_num-subtle);
  }

  .stepper:focus-visible {
    outline: 2px solid var(--_num-focus);
    outline-offset: -2px;
  }

  .stepper:disabled {
    color: var(--_num-muted);
    cursor: not-allowed;
  }

  .hint {
    margin-block: 0;
    color: var(--_num-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_num-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .wrapper {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .wrapper {
      border-color: ButtonBorder;
      box-shadow: none;
    }

    .stepper-decrement {
      border-inline-end-color: ButtonBorder;
    }

    .stepper-increment {
      border-inline-start-color: ButtonBorder;
    }

    .wrapper:focus-within,
    .stepper:focus-visible {
      outline-color: Highlight;
      border-color: Highlight;
    }
  }
`;
