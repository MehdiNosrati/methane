import { css } from 'lit';

export const iconButtonStyles = css`
  :host {
    display: inline-flex;
    box-sizing: border-box;
    vertical-align: middle;
    --_ib-size: 2.375rem;
    --_ib-bg: transparent;
    --_ib-bg-hover: var(--mth-color-bg-muted, light-dark(oklch(0.925 0.01 262), oklch(0.24 0.016 262)));
    --_ib-bg-active: var(--mth-color-border, oklch(0.89 0.01 262));
    --_ib-fg: var(--mth-color-fg, CanvasText);
    --_ib-border: transparent;
    --_ib-border-hover: transparent;
    --_ib-shadow: none;
    --_ib-shadow-hover: none;
  }

  :host([size='sm']) {
    --_ib-size: 1.875rem;
  }

  :host([size='lg']) {
    --_ib-size: 2.75rem;
  }

  :host([variant='solid']) {
    --_ib-bg: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_ib-bg-hover: var(--mth-color-accent-hover, oklch(0.49 0.24 264));
    --_ib-bg-active: var(--mth-color-accent-active, oklch(0.42 0.22 264));
    --_ib-fg: var(--mth-color-accent-fg, oklch(0.99 0 0));
    --_ib-border: oklch(from var(--_ib-bg) calc(l - 0.06) c h / 0.5);
    --_ib-border-hover: oklch(from var(--_ib-bg-hover) calc(l - 0.06) c h / 0.6);
    --_ib-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.22),
      var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_ib-shadow-hover:
      inset 0 1px 0 oklch(1 0 0 / 0.25),
      var(--mth-shadow-sm, 0 1px 3px oklch(0.14 0.014 262 / 0.08));
  }

  :host([variant='soft']) {
    --_ib-bg: var(--mth-color-accent-subtle, oklch(0.94 0.04 264));
    --_ib-bg-hover: color-mix(in oklch, var(--_ib-bg) 86%, var(--_ib-fg));
    --_ib-bg-active: color-mix(in oklch, var(--_ib-bg) 76%, var(--_ib-fg));
    --_ib-fg: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_ib-border: transparent;
    --_ib-border-hover: oklch(from var(--_ib-fg) l c h / 0.28);
    --_ib-shadow-hover: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
  }

  :host([variant='outline']),
  :host([variant='outlined']) {
    --_ib-bg: var(--mth-color-surface, Canvas);
    --_ib-bg-hover: var(--mth-color-bg-subtle, oklch(0.95 0.008 262));
    --_ib-bg-active: var(--mth-color-bg-muted, light-dark(oklch(0.925 0.01 262), oklch(0.24 0.016 262)));
    --_ib-border: var(--mth-color-border-strong, oklch(0.76 0.016 262));
    --_ib-border-hover: var(--mth-color-accent, oklch(0.55 0.23 264));
    --_ib-shadow: var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
    --_ib-shadow-hover: var(--mth-shadow-sm, 0 1px 3px oklch(0.14 0.014 262 / 0.08));
  }

  :host([variant='danger']) {
    --_ib-bg: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_ib-bg-hover: oklch(from var(--_ib-bg) calc(l - 0.05) c h);
    --_ib-bg-active: oklch(from var(--_ib-bg) calc(l - 0.1) c h);
    --_ib-fg: var(--mth-color-danger-fg, light-dark(oklch(0.99 0 0), oklch(0.14 0.02 25)));
    --_ib-border: oklch(from var(--_ib-bg) calc(l - 0.06) c h / 0.5);
    --_ib-border-hover: oklch(from var(--_ib-bg-hover) calc(l - 0.06) c h / 0.6);
    --_ib-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.22),
      var(--mth-shadow-xs, 0 1px 2px oklch(0.14 0.014 262 / 0.06));
  }

  :host(:state(pressed)) [part='control'] {
    background-color: var(--mth-color-accent-subtle, oklch(0.94 0.04 264));
    border-color: var(--mth-color-accent, oklch(0.55 0.23 264));
    color: var(--mth-color-accent, oklch(0.55 0.23 264));
  }

  [part='base'] {
    display: inline-flex;
  }

  [part='control'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--_ib-size);
    block-size: var(--_ib-size);
    padding: 0;
    border: 1px solid var(--_ib-border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background-color: var(--_ib-bg);
    color: var(--_ib-fg);
    box-shadow: var(--_ib-shadow);
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
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
    background-color: var(--_ib-bg-hover);
    border-color: var(--_ib-border-hover);
    box-shadow: var(--_ib-shadow-hover);
  }

  [part='control']:active:not(:disabled, [aria-disabled='true']) {
    background-color: var(--_ib-bg-active);
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
    animation: mth-ib-spin 700ms linear infinite;
  }

  @keyframes mth-ib-spin {
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

    :host(:state(pressed)) [part='control'] {
      background-color: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }

    :host(:state(disabled)) [part='control'],
    :host([disabled]) [part='control'] {
      color: GrayText;
      border-color: GrayText;
      opacity: 1;
    }
  }
`;
