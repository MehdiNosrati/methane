import { css } from 'lit';

export const pdfViewerStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-md, 0.5rem);
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_pdf-min-height: 28rem;
  }

  .base {
    display: flex;
    flex-direction: column;
    inline-size: 100%;
    min-block-size: var(--mth-pdf-height, var(--_pdf-min-height));
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    background-color: var(--mth-color-surface-raised, oklch(0.96 0.01 260));
    border-block-end: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
  }

  .group {
    display: flex;
    align-items: center;
    gap: var(--mth-space-1, 0.25rem);
  }

  button,
  select,
  input,
  .download-link {
    font-family: inherit;
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg, oklch(0.2 0.02 260));
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    border-radius: var(--mth-radius-sm, 0.375rem);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-2, 0.5rem);
    text-decoration: none;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:focus-visible,
  select:focus-visible,
  input:focus-visible,
  .download-link:focus-visible,
  .viewport:focus-visible {
    outline: 2px solid var(--mth-color-border-focus, oklch(0.55 0.2 250));
    outline-offset: 2px;
  }

  .page-input {
    inline-size: 3.5rem;
    text-align: center;
  }

  .search-input {
    inline-size: 10rem;
  }

  .body {
    display: flex;
    flex: 1;
    min-block-size: 0;
  }

  .outline {
    inline-size: 14rem;
    flex-shrink: 0;
    padding: var(--mth-space-3, 0.75rem);
    border-inline-end: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    overflow-block: auto;
    background-color: var(--mth-color-bg-subtle, oklch(0.97 0.005 260));
  }

  .outline[hidden],
  .toolbar[hidden] {
    display: none;
  }

  .outline-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--mth-space-1, 0.25rem);
  }

  .outline-btn {
    inline-size: 100%;
    text-align: start;
  }

  .viewport {
    position: relative;
    flex: 1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: var(--mth-space-4, 1rem);
    overflow-inline: auto;
    overflow-block: auto;
    background-color: var(--mth-color-bg-subtle, oklch(0.95 0.01 260));
  }

  .canvas {
    display: block;
    max-inline-size: 100%;
    background-color: var(--mth-color-surface, oklch(1 0 0));
    border: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
  }

  .status {
    position: absolute;
    inset: var(--mth-space-4, 1rem);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--mth-space-3, 0.75rem);
    background-color: var(--mth-color-surface, oklch(0.99 0 0));
    color: var(--mth-color-fg-muted, oklch(0.45 0.02 260));
    font-size: var(--mth-font-size-sm, 0.875rem);
  }

  .status[hidden] {
    display: none;
  }

  .fallback {
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-block-start: 1px solid var(--mth-color-border, oklch(0.88 0.01 260));
    font-size: var(--mth-font-size-xs, 0.75rem);
    color: var(--mth-color-fg-muted, oklch(0.45 0.02 260));
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    button,
    select,
    input,
    .download-link {
      border-color: ButtonText;
      background-color: ButtonFace;
      color: ButtonText;
    }
  }
`;
