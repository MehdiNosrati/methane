import { css } from 'lit';

export const uploadProgressStyles = css`
  :host {
    --_bg: var(--mth-color-surface, oklch(99% 0 0));
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    --_muted: var(--mth-color-fg-muted, oklch(48% 0.01 260));
    --_border: var(--mth-color-border, oklch(86% 0.01 260));
    --_focus: var(--mth-color-border-focus, oklch(55% 0.18 255));
    --_fill: var(--mth-color-accent, oklch(52% 0.2 255));
    --_upload-pct: 0%;

    display: block;
    color: var(--_fg);
  }

  :host([status='complete']) {
    --_fill: var(--mth-color-success, oklch(50% 0.16 145));
  }

  :host([status='error']) {
    --_fill: var(--mth-color-danger, oklch(52% 0.2 25));
  }

  .base {
    padding-block: var(--mth-space-3, 0.75rem);
    padding-inline: var(--mth-space-4, 1rem);
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-md, 0.5rem);
    background: var(--_bg);
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-2, 0.5rem);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-inline-size: 0;
  }

  .filename {
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-text {
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--_muted);
  }

  :host([status='error']) .status-text {
    color: var(--mth-color-danger, oklch(52% 0.2 25));
  }

  .controls {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
    flex-shrink: 0;
  }

  .ctrl-btn {
    border: 1px solid var(--_border);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background: transparent;
    color: var(--_fg);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    font: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    cursor: pointer;
  }

  .ctrl-btn:focus-visible {
    outline: 2px solid var(--_focus);
    outline-offset: 2px;
  }

  .track {
    inline-size: 100%;
    block-size: 0.375rem;
    border-radius: var(--mth-radius-full, 9999px);
    background: var(--_border);
    overflow: hidden;
  }

  .fill {
    inline-size: var(--_upload-pct);
    block-size: 100%;
    background: var(--_fill);
    transition: inline-size var(--mth-motion-duration-fast, 120ms) linear;
  }

  @media (prefers-reduced-motion: reduce) {
    .fill {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .base,
    .track {
      border: 1px solid CanvasText;
      background: Canvas;
    }

    .fill {
      background: Highlight;
    }

    .ctrl-btn {
      border-color: ButtonBorder;
      color: ButtonText;
    }
  }
`;
