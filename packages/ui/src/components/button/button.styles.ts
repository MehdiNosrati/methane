import { css } from 'lit';

export const buttonStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    vertical-align: middle;
    --_btn-bg: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_btn-bg-hover: var(--mth-color-accent-hover, oklch(0.49 0.24 264));
    --_btn-bg-active: var(--mth-color-accent-active, oklch(0.42 0.22 264));
    --_btn-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_btn-border: oklch(from var(--_btn-bg) calc(l - 0.06) c h / 0.5);
    --_btn-border-hover: oklch(from var(--_btn-bg-hover) calc(l - 0.06) c h / 0.6);
    --_btn-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.22),
      var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_btn-shadow-hover:
      inset 0 1px 0 oklch(1 0 0 / 0.25),
      var(--mth-shadow-sm, 0 1px 3px oklch(0.14 0.014 262 / 0.08));
    --_btn-shadow-active: inset 0 1px 2px oklch(0 0 0 / 0.16);
    --_btn-radius: var(--mth-radius-md, 0.5rem);
    --_btn-font-size: var(--mth-font-size-sm, 0.875rem);
    --_btn-pad-block: var(--mth-space-control-block, 0.5rem);
    --_btn-pad-inline: var(--mth-space-4, 1rem);
    --_btn-min-block: 2.375rem;
  }

  :host([size='sm']) {
    --_btn-font-size: var(--mth-font-size-xs, 0.75rem);
    --_btn-pad-block: var(--mth-space-1, 0.25rem);
    --_btn-pad-inline: var(--mth-space-3, 0.75rem);
    --_btn-min-block: 1.875rem;
  }

  :host([size='lg']) {
    --_btn-font-size: var(--mth-font-size-md, 1rem);
    --_btn-pad-block: var(--mth-space-3, 0.75rem);
    --_btn-pad-inline: var(--mth-space-5, 1.25rem);
    --_btn-min-block: 2.75rem;
  }

  :host([variant='soft']) {
    --_btn-bg: var(--mth-color-accent-subtle, oklch(0.94 0.04 264));
    --_btn-bg-hover: oklch(from var(--_btn-bg) calc(l - 0.03) c h);
    --_btn-bg-active: oklch(from var(--_btn-bg) calc(l - 0.06) c h);
    --_btn-fg: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_btn-border: transparent;
    --_btn-border-hover: oklch(from var(--mth-color-accent, oklch(0.55 0.23 264)) l c h / 0.28);
    --_btn-shadow: none;
    --_btn-shadow-hover: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_btn-shadow-active: inset 0 1px 2px oklch(0 0 0 / 0.08);
  }

  :host([variant='outline']),
  :host([variant='outlined']) {
    --_btn-bg: var(--mth-color-surface, Canvas);
    --_btn-bg-hover: var(--mth-color-bg-subtle, oklch(0.95 0.008 262));
    --_btn-bg-active: var(--mth-color-bg-muted, oklch(0.92 0.01 262));
    --_btn-fg: var(--mth-color-fg, CanvasText);
    --_btn-border: var(--mth-color-border-strong, oklch(0.76 0.016 262));
    --_btn-border-hover: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_btn-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_btn-shadow-hover: var(--mth-shadow-sm, 0 1px 3px oklch(0.14 0.014 262 / 0.08));
    --_btn-shadow-active: inset 0 1px 2px oklch(0 0 0 / 0.08);
  }

  :host([variant='ghost']) {
    --_btn-bg: transparent;
    --_btn-bg-hover: var(--mth-color-bg-muted, oklch(0.92 0.01 262));
    --_btn-bg-active: var(--mth-color-border, oklch(0.89 0.01 262));
    --_btn-fg: var(--mth-color-fg, CanvasText);
    --_btn-border: transparent;
    --_btn-border-hover: transparent;
    --_btn-shadow: none;
    --_btn-shadow-hover: none;
    --_btn-shadow-active: none;
  }

  :host([variant='danger']) {
    --_btn-bg: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_btn-bg-hover: oklch(0.51 0.22 25);
    --_btn-bg-active: oklch(0.45 0.2 25);
    --_btn-fg: var(--mth-color-danger-fg, oklch(0.99 0 0));
    --_btn-border: oklch(from var(--_btn-bg) calc(l - 0.06) c h / 0.5);
    --_btn-border-hover: oklch(from var(--_btn-bg-hover) calc(l - 0.06) c h / 0.6);
  }

  [part='base'] {
    display: inline-flex;
    inline-size: 100%;
  }

  [part='control'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-2, 0.5rem);
    inline-size: 100%;
    min-block-size: var(--_btn-min-block);
    padding-block: var(--_btn-pad-block);
    padding-inline: var(--_btn-pad-inline);
    border: 1px solid var(--_btn-border);
    border-radius: var(--_btn-radius);
    background-color: var(--_btn-bg);
    color: var(--_btn-fg);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--_btn-font-size);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
    letter-spacing: -0.01em;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
    box-shadow: var(--_btn-shadow);
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

  [part='control']:focus-visible {
    outline: var(--mth-focus-ring-width, 2px) solid var(--mth-color-border-focus, Highlight);
    outline-offset: var(--mth-focus-ring-offset, 2px);
  }

  [part='control']:hover:not(:disabled, [aria-disabled='true']) {
    background-color: var(--_btn-bg-hover);
    border-color: var(--_btn-border-hover);
    box-shadow: var(--_btn-shadow-hover);
  }

  [part='control']:active:not(:disabled, [aria-disabled='true']) {
    background-color: var(--_btn-bg-active);
    box-shadow: var(--_btn-shadow-active);
    transform: translateY(1px);
  }

  :host(:state(disabled)) [part='control'],
  :host([disabled]) [part='control'] {
    opacity: 0.52;
    cursor: not-allowed;
    box-shadow: none;
  }

  :host(:state(loading)) [part='control'],
  :host([loading]) [part='control'] {
    cursor: progress;
  }

  [part='spinner'] {
    inline-size: 1em;
    block-size: 1em;
    border: 2px solid currentColor;
    border-inline-end-color: transparent;
    border-radius: var(--mth-radius-full, 9999px);
    animation: mth-btn-spin 700ms linear infinite;
    flex-shrink: 0;
  }

  @keyframes mth-btn-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part='control'] {
      transition: none;
    }

    [part='control']:active:not(:disabled, [aria-disabled='true']) {
      transform: none;
    }

    [part='spinner'] {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    [part='control'] {
      background-color: ButtonFace;
      color: ButtonText;
      border-color: ButtonBorder;
      box-shadow: none;
    }

    :host(:state(disabled)) [part='control'],
    :host([disabled]) [part='control'] {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }

    [part='control']:focus-visible {
      outline: 2px solid Highlight;
    }
  }
`;
