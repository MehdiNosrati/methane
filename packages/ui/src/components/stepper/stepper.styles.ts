import { css } from 'lit';

export const stepperStyles = css`
  :host {
    display: block;
    --_stp-surface: var(--mth-color-surface, oklch(1 0 0));
    --_stp-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_stp-muted: var(--mth-color-fg-muted, oklch(0.52 0.02 260));
    --_stp-border: var(--mth-color-border, oklch(0.84 0.01 260));
    --_stp-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_stp-success: var(--mth-color-success, oklch(0.55 0.16 145));
    --_stp-danger: var(--mth-color-danger, oklch(0.55 0.2 25));
    --_stp-radius: var(--mth-radius-md, 0.375rem);
    --_stp-font-md: var(--mth-font-size-md, 1rem);
    --_stp-font-sm: var(--mth-font-size-sm, 0.875rem);
  }

  [part='list'] {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.75rem;
  }

  :host([orientation='vertical']) [part='list'] {
    flex-direction: column;
  }

  [part='item'] {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1 1 0;
    min-inline-size: 0;
  }

  [part='trigger'] {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding-inline: 0.375rem;
    padding-block: 0.25rem;
    border: none;
    border-radius: var(--_stp-radius);
    background: transparent;
    color: var(--_stp-text);
    cursor: pointer;
    text-align: start;
  }

  [part='trigger']:focus-visible {
    outline: 2px solid var(--_stp-primary);
    outline-offset: 2px;
  }

  [part='trigger'][aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part='indicator'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    flex-shrink: 0;
    border-radius: 9999px;
    border: 2px solid var(--_stp-border);
    background: var(--_stp-surface);
    font-size: var(--_stp-font-sm);
    font-weight: 600;
  }

  [part='trigger'][data-status='current'] [part='indicator'] {
    border-color: var(--_stp-primary);
    background: var(--_stp-primary);
    color: oklch(1 0 0);
  }

  [part='trigger'][data-status='complete'] [part='indicator'] {
    border-color: var(--_stp-success);
    background: var(--_stp-success);
    color: oklch(1 0 0);
  }

  [part='trigger'][data-status='error'] [part='indicator'] {
    border-color: var(--_stp-danger);
    background: var(--_stp-danger);
    color: oklch(1 0 0);
  }

  [part='label'] {
    display: block;
    font-size: var(--_stp-font-md);
    font-weight: 600;
  }

  [part='description'] {
    display: block;
    font-size: var(--_stp-font-sm);
    color: var(--_stp-muted);
  }

  [part='connector'] {
    flex: 1 1 auto;
    block-size: 2px;
    min-inline-size: 1rem;
    background: var(--_stp-border);
  }

  :host([orientation='vertical']) [part='connector'] {
    display: none;
  }

  .stp-source {
    display: none;
  }

  @media (forced-colors: active) {
    [part='indicator'] {
      border-color: CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    [part='trigger'][data-status='current'] [part='indicator'],
    [part='trigger'][data-status='complete'] [part='indicator'] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
