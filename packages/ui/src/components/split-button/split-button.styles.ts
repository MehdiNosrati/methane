import { css } from 'lit';

export const splitButtonStyles = css`
  :host {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    --_sb-bg: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_sb-bg-hover: var(--mth-color-accent-hover, oklch(0.49 0.24 264));
    --_sb-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_sb-border: oklch(from var(--_sb-bg) calc(l - 0.06) c h / 0.5);
    --_sb-divider: oklch(0.99 0 0 / 0.28);
    --_sb-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.22),
      var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_sb-min-block: 2.375rem;
    --_sb-pad-inline: var(--mth-space-3, 0.75rem);
  }

  :host([size='sm']) {
    --_sb-min-block: 1.875rem;
    --_sb-pad-inline: var(--mth-space-2, 0.5rem);
  }

  :host([size='lg']) {
    --_sb-min-block: 2.75rem;
    --_sb-pad-inline: var(--mth-space-4, 1rem);
  }

  :host([variant='soft']) {
    --_sb-bg: var(--mth-color-accent-subtle, oklch(0.94 0.04 264));
    --_sb-bg-hover: oklch(from var(--_sb-bg) calc(l - 0.03) c h);
    --_sb-fg: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_sb-border: transparent;
    --_sb-divider: oklch(from var(--_sb-fg) l c h / 0.22);
    --_sb-shadow: none;
  }

  :host([variant='outline']),
  :host([variant='outlined']) {
    --_sb-bg: var(--mth-color-surface, Canvas);
    --_sb-bg-hover: var(--mth-color-bg-subtle, oklch(0.95 0.008 262));
    --_sb-fg: var(--mth-color-fg, CanvasText);
    --_sb-border: var(--mth-color-border-strong, oklch(0.76 0.016 262));
    --_sb-divider: var(--mth-color-border-strong, oklch(0.76 0.016 262));
    --_sb-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
  }

  :host([variant='ghost']) {
    --_sb-bg: transparent;
    --_sb-bg-hover: var(--mth-color-bg-muted, oklch(0.92 0.01 262));
    --_sb-fg: var(--mth-color-fg, CanvasText);
    --_sb-border: transparent;
    --_sb-divider: var(--mth-color-border, oklch(0.89 0.01 262));
    --_sb-shadow: none;
  }

  [part='group'] {
    display: inline-flex;
    align-items: stretch;
    border-radius: var(--mth-radius-md, 0.5rem);
    box-shadow: var(--_sb-shadow);
  }

  [part='primary'],
  [part='trigger'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--_sb-min-block);
    border: 1px solid var(--_sb-border);
    background-color: var(--_sb-bg);
    color: var(--_sb-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    letter-spacing: -0.01em;
    cursor: pointer;
    box-sizing: border-box;
    transition:
      background-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  [part='primary'] {
    padding-inline: var(--_sb-pad-inline);
    border-start-start-radius: var(--mth-radius-md, 0.5rem);
    border-end-start-radius: var(--mth-radius-md, 0.5rem);
  }

  [part='trigger'] {
    min-inline-size: 2.125rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border-inline-start: 1px solid var(--_sb-divider);
    border-start-end-radius: var(--mth-radius-md, 0.5rem);
    border-end-end-radius: var(--mth-radius-md, 0.5rem);
  }

  [part='trigger'] svg {
    flex-shrink: 0;
    transition: transform var(--mth-motion-duration-fast, 120ms)
      var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  [part='trigger'][aria-expanded='true'] svg {
    transform: rotate(180deg);
  }

  [part='primary']:focus-visible,
  [part='trigger']:focus-visible,
  [part='item']:focus-visible {
    outline: var(--mth-focus-ring-width, 2px) solid var(--mth-color-border-focus, Highlight);
    outline-offset: var(--mth-focus-ring-offset, 2px);
  }

  [part='primary']:hover:not(:disabled),
  [part='trigger']:hover:not(:disabled) {
    background-color: var(--_sb-bg-hover);
  }

  [part='primary']:active:not(:disabled),
  [part='trigger']:active:not(:disabled) {
    transform: translateY(1px);
  }

  :host(:state(disabled)) [part='primary'],
  :host(:state(disabled)) [part='trigger'],
  [part='primary']:disabled,
  [part='trigger']:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  [part='menu'] {
    margin: 0;
    padding: var(--mth-space-1, 0.25rem);
    min-inline-size: 11rem;
    background-color: var(--mth-color-surface-raised, Canvas);
    color: var(--mth-color-fg, CanvasText);
    border: 1px solid var(--mth-color-border, oklch(0.89 0.01 262));
    border-radius: var(--mth-radius-md, 0.5rem);
    box-shadow: var(--mth-shadow-lg, 0 12px 24px -4px oklch(0.14 0.014 262 / 0.14));
    flex-direction: column;
    gap: 2px;
    z-index: var(--mth-z-index-popover, 500);
  }

  [part='menu'][hidden] {
    display: none;
  }

  [part='menu']:not([hidden]) {
    display: flex;
  }

  [part='item'] {
    display: flex;
    align-items: center;
    inline-size: 100%;
    text-align: start;
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border: 0;
    border-radius: var(--mth-radius-sm, 0.375rem);
    background-color: transparent;
    color: var(--mth-color-fg, CanvasText);
    font-family: inherit;
    font-size: var(--mth-font-size-sm, 0.875rem);
    cursor: pointer;
  }

  [part='item']:hover:not(:disabled) {
    background-color: var(--mth-color-bg-subtle, oklch(0.95 0.008 262));
  }

  [part='item']:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    [part='primary'],
    [part='trigger'],
    [part='trigger'] svg {
      transition: none;
    }

    [part='primary']:active:not(:disabled),
    [part='trigger']:active:not(:disabled) {
      transform: none;
    }
  }

  @media (forced-colors: active) {
    [part='group'] {
      box-shadow: none;
    }

    [part='primary'],
    [part='trigger'],
    [part='item'] {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
    }

    [part='menu'] {
      background-color: Canvas;
      color: CanvasText;
      border-color: CanvasText;
      box-shadow: none;
    }

    [part='primary']:disabled,
    [part='trigger']:disabled,
    [part='item']:disabled {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }
  }
`;
