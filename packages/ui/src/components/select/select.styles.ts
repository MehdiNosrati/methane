import { css } from 'lit';

export const selectStyles = css`
  :host {
    --_sel-surface: var(--mth-color-surface, Canvas);
    --_sel-surface-raised: var(--mth-color-surface-raised, Canvas);
    --_sel-bg-subtle: var(--mth-color-bg-subtle, oklch(0.95 0.008 262));
    --_sel-fg: var(--mth-color-fg, CanvasText);
    --_sel-fg-muted: var(--mth-color-fg-muted, GrayText);
    --_sel-border: var(--mth-color-border-strong, ButtonBorder);
    --_sel-border-popup: var(--mth-color-border, ButtonBorder);
    --_sel-border-focus: var(--mth-color-border-focus, Highlight);
    --_sel-accent: var(--mth-color-accent, Highlight);
    --_sel-accent-subtle: var(--mth-color-accent-subtle, oklch(0.94 0.04 264));
    --_sel-danger: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_sel-radius-sm: var(--mth-radius-sm, 0.375rem);
    --_sel-radius-md: var(--mth-radius-md, 0.5rem);
    --_sel-space-1: var(--mth-space-1, 0.25rem);
    --_sel-space-2: var(--mth-space-2, 0.5rem);
    --_sel-space-3: var(--mth-space-3, 0.75rem);
    --_sel-font: var(--mth-font-sans, system-ui, sans-serif);
    --_sel-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_sel-weight-medium: var(--mth-font-weight-medium, 500);
    --_sel-shadow-xs: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_sel-shadow: var(--mth-shadow-lg, 0 12px 24px -4px oklch(0.14 0.014 262 / 0.14));
    --_sel-z-popover: var(--mth-z-index-popover, 500);
    --_sel-duration: var(--mth-motion-duration-fast, 120ms);
    --_sel-ease: var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    --_sel-max-height: 16rem;

    display: block;
    position: relative;
    box-sizing: border-box;
    font-family: var(--_sel-font);
    color: var(--_sel-fg);
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  [part='label'] {
    display: block;
    font-size: var(--_sel-font-sm);
    font-weight: var(--_sel-weight-medium);
    margin-block-end: var(--_sel-space-1);
    color: var(--_sel-fg);
  }

  [part='control'] {
    display: flex;
    align-items: center;
    gap: var(--_sel-space-2);
    min-block-size: 2.375rem;
    border: 1px solid var(--_sel-border);
    border-radius: var(--_sel-radius-md);
    background-color: var(--_sel-surface);
    padding-inline: var(--_sel-space-3);
    box-shadow: var(--_sel-shadow-xs);
    transition:
      border-color var(--_sel-duration) var(--_sel-ease),
      box-shadow var(--_sel-duration) var(--_sel-ease);
  }

  [part='control']:hover:not(:has(:disabled)) {
    border-color: var(--_sel-accent);
  }

  :host(:focus-within) [part='control'] {
    border-color: var(--_sel-border-focus);
    box-shadow:
      0 0 0 3px oklch(from var(--_sel-border-focus) l c h / 0.22),
      var(--_sel-shadow-xs);
  }

  :host(:state(invalid)) [part='control'],
  :host(:state(user-invalid)) [part='control'] {
    border-color: var(--_sel-danger);
  }

  :host(:state(invalid):focus-within) [part='control'],
  :host(:state(user-invalid):focus-within) [part='control'] {
    box-shadow:
      0 0 0 3px oklch(from var(--_sel-danger) l c h / 0.22),
      var(--_sel-shadow-xs);
  }

  [part='trigger'] {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--_sel-space-2);
    min-inline-size: 0;
    min-block-size: 2.375rem;
    padding-block: var(--_sel-space-2);
    padding-inline: 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  [part='trigger']:focus {
    outline: none;
  }

  [part='trigger']:disabled {
    cursor: not-allowed;
  }

  [part='value'] {
    flex: 1 1 auto;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part='value'][data-placeholder='true'] {
    color: var(--_sel-fg-muted);
  }

  [part='clear-button'],
  [part='caret'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: none;
    background: transparent;
    color: var(--_sel-fg-muted);
    font: inherit;
    padding: var(--_sel-space-1);
    border-radius: var(--_sel-radius-sm);
  }

  [part='caret'] svg {
    flex-shrink: 0;
    transition: transform var(--_sel-duration) var(--_sel-ease);
  }

  :host([open]) [part='caret'] svg,
  [part='trigger'][aria-expanded='true'] [part='caret'] svg {
    transform: rotate(180deg);
  }

  [part='clear-button'] {
    cursor: pointer;
  }

  [part='clear-button']:hover {
    color: var(--_sel-fg);
    background-color: var(--_sel-bg-subtle);
  }

  [part='native-select'] {
    appearance: none;
    flex: 1 1 auto;
    inline-size: 100%;
    min-block-size: 2.375rem;
    padding-block: var(--_sel-space-2);
    padding-inline: 0 2rem;
    border: none;
    background-color: transparent;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='oklch(0.54 0.014 262)' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: 1rem 1rem;
    background-position: right 0 center;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  :host(:dir(rtl)) [part='native-select'] {
    background-position: left 0 center;
  }

  [part='native-select']:focus {
    outline: none;
  }

  @supports (appearance: base-select) {
    [part='native-select'] {
      appearance: base-select;
      align-items: center;
      justify-content: space-between;
      background-image: none;
      padding-inline: 0;
    }

    /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
    [part='native-select']::picker-icon {
      content: "";
      display: inline-block;
      inline-size: 1rem;
      block-size: 1rem;
      flex-shrink: 0;
      color: var(--_sel-fg-muted);
      margin-inline-start: auto;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='oklch(0.54 0.014 262)' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 1rem 1rem;
      transition: transform var(--_sel-duration) var(--_sel-ease);
    }

    /* stylelint-disable-next-line selector-pseudo-element-no-unknown, selector-pseudo-class-no-unknown */
    [part='native-select']:open::picker-icon {
      transform: rotate(180deg);
    }

    /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
    [part='native-select']::picker(select) {
      appearance: base-select;
      border: 1px solid var(--_sel-border-popup);
      border-radius: var(--_sel-radius-md);
      background-color: var(--_sel-surface-raised);
      box-shadow: var(--_sel-shadow);
      padding: var(--_sel-space-1);
    }
  }

  [part='popup'] {
    z-index: var(--_sel-z-popover);
    min-inline-size: 12rem;
    margin: 0;
    padding: var(--_sel-space-1);
    border: 1px solid var(--_sel-border-popup);
    border-radius: var(--_sel-radius-md);
    background-color: var(--_sel-surface-raised);
    box-shadow: var(--_sel-shadow);
  }

  [part='popup'][hidden] {
    display: none;
  }

  [part='popup'][data-mth-top-layer-fallback] {
    position: fixed;
  }

  [part='popup'][data-mth-top-layer-fallback]:not([hidden]) {
    display: block;
  }

  [part='listbox'] {
    max-block-size: var(--_sel-max-height);
    overflow-block: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  [part='group-label'] {
    padding-block: var(--_sel-space-1);
    padding-inline: var(--_sel-space-2);
    font-size: var(--_sel-font-sm);
    font-weight: var(--_sel-weight-medium);
    color: var(--_sel-fg-muted);
  }

  [part='option'] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--_sel-space-2);
    padding-block: var(--_sel-space-2);
    padding-inline: var(--_sel-space-2);
    border-radius: var(--_sel-radius-sm);
    cursor: pointer;
    transition: background-color var(--_sel-duration) var(--_sel-ease);
  }

  [part='option']:hover:not([aria-disabled='true']) {
    background-color: var(--_sel-bg-subtle);
  }

  [part='option'][data-active='true'] {
    outline: 2px solid var(--_sel-border-focus);
    outline-offset: -2px;
    background-color: var(--_sel-accent-subtle);
  }

  [part='option'][aria-selected='true'] {
    font-weight: var(--_sel-weight-medium);
    background-color: var(--_sel-accent-subtle);
    color: var(--_sel-accent);
  }

  [part='option'][aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [part='empty'],
  [part='hint'] {
    font-size: var(--_sel-font-sm);
    color: var(--_sel-fg-muted);
    margin-block-start: var(--_sel-space-1);
  }

  [part='error'] {
    font-size: var(--_sel-font-sm);
    color: var(--_sel-danger);
    margin-block-start: var(--_sel-space-1);
  }

  .slot-source {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='control'],
    [part='caret'] svg,
    /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
    [part='native-select']::picker-icon,
    [part='option'] {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    [part='control'],
    [part='popup'] {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
      box-shadow: none;
    }

    [part='native-select'] {
      appearance: auto;
      background-image: none;
      padding-inline: 0;
    }

    /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
    [part='native-select']::picker-icon {
      content: normal;
      background-image: none;
    }

    :host(:focus-within) [part='control'] {
      outline: 2px solid Highlight;
      outline-offset: 1px;
      box-shadow: none;
    }

    [part='option'][data-active='true'],
    [part='option'][aria-selected='true'] {
      background-color: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
