import { css } from 'lit';

export const switchStyles = css`
  :host {
    display: inline-block;
    --_sw-track: var(--mth-color-border-strong, GrayText);
    --_sw-track-checked: var(--mth-color-accent, Highlight);
    --_sw-thumb: var(--mth-color-surface, Canvas);
    --_sw-fg: var(--mth-color-fg, CanvasText);
    --_sw-muted: var(--mth-color-fg-muted, GrayText);
    --_sw-focus: var(--mth-color-border-focus, Highlight);
    --_sw-danger: var(--mth-color-danger, oklch(0.57 0.22 25));
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
    position: relative;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    inline-size: 2.375rem;
    block-size: 1.375rem;
    padding-block: 0.125rem;
    padding-inline: 0.125rem;
    border: 1px solid oklch(0 0 0 / 0.08);
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_sw-track);
    box-shadow: inset 0 1px 2px oklch(0 0 0 / 0.14);
    cursor: pointer;
    box-sizing: border-box;
    transition:
      background-color var(--mth-motion-duration-fast, 150ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      border-color var(--mth-motion-duration-fast, 150ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      box-shadow var(--mth-motion-duration-fast, 150ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .control:focus-visible {
    outline: 2px solid var(--_sw-focus);
    outline-offset: 2px;
    box-shadow:
      inset 0 1px 2px oklch(0 0 0 / 0.14),
      0 0 0 4px oklch(from var(--_sw-focus) l c h / 0.18);
  }

  .thumb {
    display: block;
    inline-size: 1rem;
    block-size: 1rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_sw-thumb);
    box-shadow: var(--mth-shadow-sm, 0 1px 3px oklch(0.14 0.014 262 / 0.18));
    transform: translateX(0);
    transition: transform var(--mth-motion-duration-fast, 150ms)
      var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  :host(:state(checked)) .control {
    background: var(--_sw-track-checked);
    border-color: oklch(from var(--_sw-track-checked) calc(l - 0.06) c h / 0.4);
  }

  :host(:state(checked)) .thumb {
    transform: translateX(1rem);
  }

  :host(:dir(rtl)):state(checked) .thumb {
    transform: translateX(-1rem);
  }

  :host(:state(user-invalid)) .control,
  .row[data-invalid='true'] .control {
    border-color: var(--_sw-danger);
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
    color: var(--_sw-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  .required-mark {
    color: var(--_sw-danger);
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
    color: var(--_sw-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_sw-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .control,
    .thumb {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .control {
      background: Canvas;
      border-color: ButtonBorder;
      box-shadow: none;
    }

    .thumb {
      background: ButtonText;
      box-shadow: none;
    }

    :host(:state(checked)) .control {
      background: Highlight;
      border-color: Highlight;
    }

    :host(:state(checked)) .thumb {
      background: HighlightText;
    }

    .control:focus-visible {
      outline: 2px solid Highlight;
    }

    :host(:state(disabled)) .row {
      opacity: 1;
    }

    :host(:state(disabled)) .control {
      border-color: GrayText;
    }

    :host(:state(disabled)) .thumb {
      background: GrayText;
    }
  }
`;
