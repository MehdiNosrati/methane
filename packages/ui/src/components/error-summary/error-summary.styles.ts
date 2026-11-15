import { css } from 'lit';

export const errorSummaryStyles = css`
  :host {
    --_es-danger: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_es-danger-subtle: var(--mth-color-danger-subtle, oklch(0.95 0.03 25));
    --_es-fg: var(--mth-color-fg, CanvasText);
    --_es-border-focus: var(--mth-color-border-focus, Highlight);
    --_es-radius: var(--mth-radius-md, 0.375rem);
    --_es-space-2: var(--mth-space-2, 0.5rem);
    --_es-space-3: var(--mth-space-3, 0.75rem);
    --_es-space-4: var(--mth-space-4, 1rem);
    --_es-font: var(--mth-font-sans, system-ui, sans-serif);
    --_es-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_es-font-base: var(--mth-font-size-base, 1rem);
    --_es-weight-semibold: var(--mth-font-weight-semibold, 600);

    display: block;
    box-sizing: border-box;
    font-family: var(--_es-font);
    color: var(--_es-fg);
  }

  [part='summary'] {
    border: 2px solid var(--_es-danger);
    border-radius: var(--_es-radius);
    background-color: var(--_es-danger-subtle);
    padding: var(--_es-space-4);
  }

  [part='summary'][hidden] {
    display: none;
  }

  [part='summary']:focus {
    outline: 2px solid var(--_es-border-focus);
    outline-offset: 2px;
  }

  [part='title'] {
    margin: 0;
    margin-block-end: var(--_es-space-2);
    font-size: var(--_es-font-base);
    font-weight: var(--_es-weight-semibold);
    color: var(--_es-danger);
  }

  [part='list'] {
    margin: 0;
    padding-inline-start: var(--_es-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--_es-space-2);
    font-size: var(--_es-font-sm);
  }

  [part='link'] {
    color: var(--_es-danger);
    font-weight: var(--_es-weight-semibold);
    text-decoration: underline;
    cursor: pointer;
  }

  [part='link']:focus {
    outline: 2px solid var(--_es-border-focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    [part='summary'] {
      border-color: ButtonBorder;
      background-color: Canvas;
      color: CanvasText;
    }

    [part='title'],
    [part='link'] {
      color: LinkText;
    }
  }
`;
