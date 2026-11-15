import { css } from 'lit';

export const stepStyles = css`
  :host {
    display: block;
    --_step-surface: var(--mth-color-surface, oklch(1 0 0));
    --_step-text: var(--mth-color-fg, oklch(0.2 0.02 260));
    --_step-muted: var(--mth-color-fg-muted, oklch(0.52 0.02 260));
    --_step-border: var(--mth-color-border, oklch(0.84 0.01 260));
    --_step-primary: var(--mth-color-accent, oklch(0.55 0.18 260));
    --_step-success: var(--mth-color-success, oklch(0.55 0.16 145));
    --_step-danger: var(--mth-color-danger, oklch(0.55 0.2 25));
    --_step-font-md: var(--mth-font-size-md, 1rem);
    --_step-font-sm: var(--mth-font-size-sm, 0.875rem);
  }

  :host([disabled]) {
    opacity: 0.55;
  }

  [part='base'] {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    color: var(--_step-text);
  }

  [part='indicator'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    flex-shrink: 0;
    border-radius: 9999px;
    border: 2px solid var(--_step-border);
    background: var(--_step-surface);
    font-size: var(--_step-font-sm);
    font-weight: 600;
  }

  :host(:state(current)) [part='indicator'] {
    border-color: var(--_step-primary);
    background: var(--_step-primary);
    color: oklch(1 0 0);
  }

  :host(:state(complete)) [part='indicator'] {
    border-color: var(--_step-success);
    background: var(--_step-success);
    color: oklch(1 0 0);
  }

  :host(:state(error)) [part='indicator'] {
    border-color: var(--_step-danger);
    background: var(--_step-danger);
    color: oklch(1 0 0);
  }

  [part='body'] {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-inline-size: 0;
  }

  [part='label'] {
    font-size: var(--_step-font-md);
    font-weight: 600;
  }

  [part='description'] {
    font-size: var(--_step-font-sm);
    color: var(--_step-muted);
  }

  @media (forced-colors: active) {
    [part='indicator'] {
      border-color: CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    :host(:state(current)) [part='indicator'],
    :host(:state(complete)) [part='indicator'] {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
  }
`;
