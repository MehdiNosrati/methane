import { css } from 'lit';

export const lightboxStyles = css`
  :host {
    display: contents;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    --_lb-backdrop: var(--mth-color-backdrop, oklch(0.15 0.01 255 / 0.72));
    --_lb-surface: var(--mth-color-surface, Canvas);
    --_lb-fg: var(--mth-color-fg, CanvasText);
    --_lb-muted: var(--mth-color-fg-muted, GrayText);
    --_lb-border: var(--mth-color-border, ButtonBorder);
    --_lb-focus: var(--mth-color-border-focus, Highlight);
    --_lb-radius: var(--mth-radius-lg, 0.5rem);
    --_lb-z: var(--mth-z-index-modal, 1400);
  }

  .base {
    margin: 0;
    padding: var(--mth-space-4, 1rem);
    border: none;
    inline-size: 100vw;
    block-size: 100vh;
    max-inline-size: 100vw;
    max-block-size: 100vh;
    background-color: var(--_lb-backdrop);
    color: var(--_lb-fg);
    display: none;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    box-sizing: border-box;
  }

  .base[open],
  .base[data-mth-fallback-open='true'] {
    display: flex;
    position: fixed;
    inset: 0;
    z-index: var(--_lb-z);
  }

  .base::backdrop {
    background-color: var(--_lb-backdrop);
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--mth-space-3, 0.75rem);
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-3, 0.75rem);
    border-radius: var(--_lb-radius);
    background-color: var(--_lb-surface);
    border: 1px solid var(--_lb-border);
  }

  .counter {
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--_lb-muted);
  }

  .toolbar-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
  }

  .stage {
    position: relative;
    flex: 1 1 auto;
    min-block-size: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--mth-space-3, 0.75rem);
  }

  .media-frame {
    max-inline-size: 85vw;
    max-block-size: 75vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    border-radius: var(--_lb-radius);
  }

  .image {
    display: block;
    max-inline-size: 100%;
    max-block-size: 72vh;
    object-fit: contain;
    border-radius: var(--_lb-radius);
    transition: transform var(--mth-motion-duration-fast, 120ms) var(--mth-motion-easing-standard, ease);
  }

  .image[data-zoomed='true'] {
    transform: scale(1.65);
    cursor: zoom-out;
  }

  .nav-btn,
  .tool-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    min-block-size: 2.25rem;
    padding-inline: var(--mth-space-2, 0.5rem);
    border: 1px solid var(--_lb-border);
    border-radius: var(--mth-radius-md, 0.375rem);
    background-color: var(--_lb-surface);
    color: var(--_lb-fg);
    font: inherit;
    cursor: pointer;
  }

  .nav-btn:focus-visible,
  .tool-btn:focus-visible {
    outline: 2px solid var(--_lb-focus);
    outline-offset: 2px;
  }

  .caption {
    align-self: center;
    padding-block: var(--mth-space-2, 0.5rem);
    padding-inline: var(--mth-space-4, 1rem);
    border-radius: var(--_lb-radius);
    background-color: var(--_lb-surface);
    border: 1px solid var(--_lb-border);
    font-size: var(--mth-font-size-sm, 0.875rem);
    text-align: center;
  }

  .caption[hidden] {
    display: none;
  }

  .blocked {
    padding: var(--mth-space-4, 1rem);
    border-radius: var(--_lb-radius);
    background-color: var(--_lb-surface);
    border: 1px solid var(--_lb-border);
    color: var(--_lb-fg);
  }

  @media (prefers-reduced-motion: reduce) {
    .image {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .toolbar,
    .nav-btn,
    .tool-btn,
    .caption {
      border: 1px solid CanvasText;
      forced-color-adjust: auto;
    }
  }
`;
