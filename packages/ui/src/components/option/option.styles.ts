import { css } from 'lit';

export const optionStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
    font-size: var(--mth-font-size-sm, 0.875rem);
    color: var(--mth-color-fg, CanvasText);
    cursor: pointer;
    user-select: none;
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='base'] {
    display: flex;
    align-items: center;
    gap: var(--mth-space-2, 0.5rem);
    padding-block: var(--mth-space-control-block, 0.5rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
    border-radius: var(--mth-radius-sm, 0.25rem);
    background-color: transparent;
  }

  :host(:state(active)) [part='base'],
  :host([active]) [part='base'] {
    background-color: var(--mth-color-bg-subtle, oklch(0.96 0.006 255));
  }

  :host(:state(selected)) [part='base'],
  :host([selected]) [part='base'] {
    font-weight: var(--mth-font-weight-semibold, 600);
    background-color: var(--mth-color-accent-subtle, oklch(0.95 0.03 255));
  }

  [part='check'] {
    inline-size: 1rem;
    flex-shrink: 0;
    text-align: center;
    color: var(--mth-color-accent, Highlight);
  }

  [part='label'] {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  @media (forced-colors: active) {
    :host(:state(disabled)) [part='base'],
    :host([disabled]) [part='base'] {
      color: GrayText;
    }

    :host(:state(active)) [part='base'],
    :host([active]) [part='base'],
    :host(:state(selected)) [part='base'],
    :host([selected]) [part='base'] {
      background-color: Highlight;
      color: HighlightText;
      outline: 1px solid Highlight;
    }

    [part='check'] {
      color: HighlightText;
    }
  }
`;
