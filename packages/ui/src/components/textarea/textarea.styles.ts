import { css } from 'lit';

export const textareaStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_ta-bg: var(--mth-color-surface, Canvas);
    --_ta-fg: var(--mth-color-fg, CanvasText);
    --_ta-muted: var(--mth-color-fg-muted, GrayText);
    --_ta-border: var(--mth-color-border-strong, ButtonBorder);
    --_ta-accent: var(--mth-color-accent, Highlight);
    --_ta-focus: var(--mth-color-border-focus, Highlight);
    --_ta-danger: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_ta-radius: var(--mth-radius-md, 0.5rem);
    --_ta-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_ta-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_ta-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_ta-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
  }

  .required-mark {
    color: var(--_ta-danger);
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
    background: var(--_ta-bg);
    color: var(--_ta-fg);
    border: 1px solid var(--_ta-border);
    border-radius: var(--_ta-radius);
    box-shadow: var(--_ta-shadow);
    transition:
      border-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      box-shadow var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .wrapper:focus-within {
    border-color: var(--_ta-focus);
    box-shadow:
      0 0 0 3px oklch(from var(--_ta-focus) l c h / 0.22),
      var(--_ta-shadow);
  }

  :host(:not(:state(disabled))) .wrapper:hover {
    border-color: var(--_ta-accent);
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_ta-danger);
  }

  :host(:state(user-invalid)) .wrapper:focus-within,
  .wrapper[data-invalid='true']:focus-within {
    box-shadow:
      0 0 0 3px oklch(from var(--_ta-danger) l c h / 0.22),
      var(--_ta-shadow);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .control {
    flex: 1 1 auto;
    min-inline-size: 0;
    inline-size: 100%;
    block-size: var(--_ta-auto-height, auto);
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: var(--mth-line-height-normal, 1.5);
    outline: none;
    padding-block: var(--_ta-pad-block);
    padding-inline: var(--_ta-pad-inline);
    resize: vertical;
  }

  .control[data-resize='none'],
  :host([auto-resize]) .control {
    resize: none;
    overflow-block: hidden;
  }

  .control[data-resize='both'] {
    resize: both;
  }

  .footer {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--mth-space-2, 0.5rem);
  }

  .messages {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  .hint,
  .error,
  .count {
    margin-block: 0;
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .hint,
  .count {
    color: var(--_ta-muted);
  }

  .count {
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
  }

  .error {
    color: var(--_ta-danger);
  }

  @media (prefers-reduced-motion: reduce) {
    .wrapper {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .wrapper {
      background: Field;
      color: FieldText;
      border-color: ButtonBorder;
      box-shadow: none;
    }

    .wrapper:focus-within {
      outline: 2px solid Highlight;
      border-color: Highlight;
      box-shadow: none;
    }

    :host(:state(disabled)) .wrapper {
      opacity: 1;
      color: GrayText;
      border-color: GrayText;
    }
  }
`;
