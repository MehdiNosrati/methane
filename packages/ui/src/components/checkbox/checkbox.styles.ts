import { css } from 'lit';

export const checkboxStyles = css`
  :host {
    display: inline-block;
    --_cb-bg: var(--mth-color-surface, Canvas);
    --_cb-fg: var(--mth-color-fg, CanvasText);
    --_cb-muted: var(--mth-color-fg-muted, GrayText);
    --_cb-border: var(--mth-color-border-strong, ButtonBorder);
    --_cb-accent: var(--mth-color-accent, Highlight);
    --_cb-accent-fg: var(--mth-color-accent-fg, HighlightText);
    --_cb-focus: var(--mth-color-border-focus, Highlight);
    --_cb-danger: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_cb-radius: var(--mth-radius-sm, 0.375rem);
    --_cb-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
  }

  .base {
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .row {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    inline-size: 1.125rem;
    block-size: 1.125rem;
    padding-block: 0;
    padding-inline: 0;
    border: 1.5px solid var(--_cb-border);
    border-radius: var(--_cb-radius);
    background: var(--_cb-bg);
    color: var(--_cb-accent-fg);
    box-shadow: var(--_cb-shadow);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: 1;
    cursor: pointer;
    transition:
      background-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      border-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      box-shadow var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  [part='indicator'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.75);
    opacity: 0;
    transition:
      transform var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      opacity var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .control:focus-visible {
    outline: 2px solid var(--_cb-focus);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px oklch(from var(--_cb-focus) l c h / 0.18);
  }

  :host(:not(:state(disabled))) .control:hover {
    border-color: var(--_cb-accent);
  }

  :host(:not(:state(disabled))) .control:active {
    transform: scale(0.95);
  }

  :host(:state(checked)) .control,
  :host(:state(indeterminate)) .control {
    background: var(--_cb-accent);
    border-color: var(--_cb-accent);
    box-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.2),
      var(--_cb-shadow);
  }

  :host(:state(checked)) [part='indicator'],
  :host(:state(indeterminate)) [part='indicator'] {
    transform: scale(1);
    opacity: 1;
  }

  :host(:state(user-invalid)) .control,
  .row[data-invalid='true'] .control {
    border-color: var(--_cb-danger);
  }

  :host(:state(disabled)) .row {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :host(:state(disabled)) .control,
  :host(:state(disabled)) .label {
    cursor: not-allowed;
  }

  .label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--mth-space-1, 0.25rem);
    color: var(--_cb-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  .required-mark {
    color: var(--_cb-danger);
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

  .hint {
    margin-block: 0;
    color: var(--_cb-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_cb-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .control,
    [part='indicator'] {
      transition: none;
    }

    :host(:not(:state(disabled))) .control:active {
      transform: none;
    }
  }

  @media (forced-colors: active) {
    .control {
      background: Canvas;
      color: CanvasText;
      border-color: ButtonBorder;
      box-shadow: none;
    }

    :host(:state(checked)) .control,
    :host(:state(indeterminate)) .control {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    .control:focus-visible {
      outline: 2px solid Highlight;
    }

    :host(:state(disabled)) .row {
      opacity: 1;
    }

    :host(:state(disabled)) .control,
    :host(:state(disabled)) .label {
      color: GrayText;
      border-color: GrayText;
    }
  }
`;
