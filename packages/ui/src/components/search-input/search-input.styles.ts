import { css } from 'lit';

export const searchInputStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_search-bg: var(--mth-color-surface, Canvas);
    --_search-fg: var(--mth-color-fg, CanvasText);
    --_search-muted: var(--mth-color-fg-muted, GrayText);
    --_search-subtle-bg: var(--mth-color-bg-subtle, Field);
    --_search-border: var(--mth-color-border-strong, ButtonBorder);
    --_search-accent: var(--mth-color-accent, Highlight);
    --_search-focus: var(--mth-color-border-focus, Highlight);
    --_search-danger: var(--mth-color-danger, crimson);
    --_search-radius: var(--mth-radius-md, 0.5rem);
    --_search-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_search-pad-inline: calc(var(--mth-space-control-inline, 0.75rem) * var(--mth-density, 1));
    --_search-pad-block: calc(var(--mth-space-control-block, 0.5rem) * var(--mth-density, 1));
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
    color: var(--_search-fg);
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
    padding-inline: var(--_search-pad-inline);
    padding-block: var(--_search-pad-block);
    background: var(--_search-bg);
    color: var(--_search-fg);
    border: 1px solid var(--_search-border);
    border-radius: var(--_search-radius);
    box-shadow: var(--_search-shadow);
    transition:
      border-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      box-shadow var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .wrapper:focus-within {
    border-color: var(--_search-focus);
    box-shadow:
      0 0 0 3px oklch(from var(--_search-focus) l c h / 0.22),
      var(--_search-shadow);
  }

  :host(:not(:state(disabled))) .wrapper:hover {
    border-color: var(--_search-accent);
  }

  :host(:state(user-invalid)) .wrapper,
  .wrapper[data-invalid='true'] {
    border-color: var(--_search-danger);
  }

  :host(:state(user-invalid)) .wrapper:focus-within,
  .wrapper[data-invalid='true']:focus-within {
    box-shadow:
      0 0 0 3px oklch(from var(--_search-danger) l c h / 0.22),
      var(--_search-shadow);
  }

  :host(:state(disabled)) .wrapper {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    color: var(--_search-muted);
    flex-shrink: 0;
  }

  .icon svg,
  .clear svg {
    inline-size: 1rem;
    block-size: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
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
    appearance: none;
  }

  .control::-webkit-search-cancel-button,
  .control::-webkit-search-decoration {
    appearance: none;
  }

  .clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-1, 0.25rem);
    border: none;
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_search-muted);
    cursor: pointer;
    flex-shrink: 0;
  }

  .clear:hover {
    color: var(--_search-fg);
    background: var(--_search-subtle-bg);
  }

  .clear:focus-visible {
    outline: 2px solid var(--_search-focus);
    outline-offset: 1px;
  }

  .shortcut {
    display: inline-flex;
    align-items: center;
    padding-block: 0.125rem;
    padding-inline: var(--mth-space-1, 0.25rem);
    border: 1px solid var(--_search-border);
    border-radius: var(--mth-radius-xs, 0.125rem);
    background: var(--_search-subtle-bg);
    color: var(--_search-muted);
    font-family: var(--mth-font-mono, ui-monospace, monospace);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: 1;
    flex-shrink: 0;
  }

  .hint {
    margin-block: 0;
    color: var(--_search-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
  }

  .error {
    margin-block: 0;
    color: var(--_search-danger);
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

    .wrapper:focus-within,
    .clear:focus-visible {
      outline-color: Highlight;
      border-color: Highlight;
      box-shadow: none;
    }

    .shortcut {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
