import { css } from 'lit';

export const cardStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_card-bg: var(--mth-color-surface-raised, Canvas);
    --_card-fg: var(--mth-color-fg, CanvasText);
    --_card-border: var(--mth-color-border, ButtonBorder);
    --_card-radius: var(--mth-radius-lg, 0.5rem);
    --_card-shadow: var(--mth-shadow-sm, 0 1px 3px oklch(0.15 0.01 255 / 0.1));
    --_card-pad-block: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
    --_card-pad-inline: calc(var(--mth-space-4, 1rem) * var(--mth-density, 1));
  }

  .base {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--_card-border);
    border-radius: var(--_card-radius);
    background-color: var(--_card-bg);
    color: var(--_card-fg);
    box-shadow: var(--_card-shadow);
    transition:
      box-shadow var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      border-color var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--mth-motion-duration-fast, 120ms)
        var(--mth-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }

  .base[data-variant='outlined'] {
    --_card-bg: var(--mth-color-surface, Canvas);
    --_card-shadow: var(--mth-shadow-none, none);
  }

  .base[data-variant='subtle'] {
    --_card-bg: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
    --_card-border: transparent;
    --_card-shadow: var(--mth-shadow-none, none);
  }

  .base[data-interactive='true'] {
    cursor: pointer;
  }

  .base[data-interactive='true']:hover {
    border-color: var(--mth-color-border-strong, ButtonBorder);
    box-shadow: var(--mth-shadow-md, 0 4px 8px -2px oklch(0.15 0.01 255 / 0.12));
  }

  .base[data-interactive='true']:focus-within {
    outline: 2px solid var(--mth-color-border-focus, Highlight);
    outline-offset: 2px;
  }

  .media[hidden],
  .header[hidden],
  .footer[hidden] {
    display: none;
  }

  .media ::slotted(*) {
    display: block;
    inline-size: 100%;
  }

  .header {
    padding-block: var(--_card-pad-block);
    padding-inline: var(--_card-pad-inline);
    border-block-end: 1px solid var(--_card-border);
  }

  .body {
    padding-block: var(--_card-pad-block);
    padding-inline: var(--_card-pad-inline);
    flex: 1 1 auto;
  }

  .footer {
    padding-block: var(--_card-pad-block);
    padding-inline: var(--_card-pad-inline);
    border-block-start: 1px solid var(--_card-border);
  }

  @media (prefers-reduced-motion: reduce) {
    .base {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base {
      background-color: Canvas;
      color: CanvasText;
      border: 1px solid ButtonBorder;
      box-shadow: none;
    }

    .base[data-interactive='true']:hover,
    .base[data-interactive='true']:focus-within {
      border-color: Highlight;
      outline: 2px solid Highlight;
    }
  }
`;
