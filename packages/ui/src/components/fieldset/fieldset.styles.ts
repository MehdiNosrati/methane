import { css } from 'lit';

export const fieldsetStyles = css`
  :host {
    --_fs-fg: var(--mth-color-fg, CanvasText);
    --_fs-fg-muted: var(--mth-color-fg-muted, GrayText);
    --_fs-border: var(--mth-color-border, ButtonBorder);
    --_fs-danger: var(--mth-color-danger, oklch(0.57 0.22 25));
    --_fs-radius: var(--mth-radius-md, 0.375rem);
    --_fs-space-1: var(--mth-space-1, 0.25rem);
    --_fs-space-3: var(--mth-space-3, 0.75rem);
    --_fs-space-4: var(--mth-space-4, 1rem);
    --_fs-font: var(--mth-font-sans, system-ui, sans-serif);
    --_fs-font-sm: var(--mth-font-size-sm, 0.875rem);
    --_fs-font-base: var(--mth-font-size-md, 1rem);
    --_fs-weight-semibold: var(--mth-font-weight-semibold, 600);

    display: block;
    box-sizing: border-box;
    font-family: var(--_fs-font);
    color: var(--_fs-fg);
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.65;
  }

  [part='fieldset'] {
    margin: 0;
    padding-block: var(--_fs-space-3);
    padding-inline: var(--_fs-space-4);
    border: 1px solid var(--_fs-border);
    border-radius: var(--_fs-radius);
    min-inline-size: 0;
  }

  :host(:state(invalid)) [part='fieldset'] {
    border-color: var(--_fs-danger);
  }

  [part='legend'] {
    padding-inline: var(--_fs-space-1);
    font-size: var(--_fs-font-base);
    font-weight: var(--_fs-weight-semibold);
    color: var(--_fs-fg);
  }

  [part='legend'][hidden],
  [part='hint'][hidden],
  [part='error'][hidden] {
    display: none;
  }

  [part='body'] {
    display: flex;
    flex-direction: column;
    gap: var(--_fs-space-3);
  }

  [part='hint'] {
    font-size: var(--_fs-font-sm);
    color: var(--_fs-fg-muted);
    margin-block-start: var(--_fs-space-1);
  }

  [part='error'] {
    font-size: var(--_fs-font-sm);
    color: var(--_fs-danger);
    margin-block-start: var(--_fs-space-1);
  }

  @media (forced-colors: active) {
    [part='fieldset'] {
      border-color: ButtonBorder;
    }

    [part='legend'] {
      color: CanvasText;
    }
  }
`;
