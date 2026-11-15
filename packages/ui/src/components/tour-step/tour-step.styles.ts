import { css } from 'lit';

export const tourStepStyles = css`
  :host {
    --_fg: var(--mth-color-fg, oklch(18% 0.01 260));
    display: block;
    color: var(--_fg);
  }

  :host(:not([active])) {
    display: none;
  }

  .heading {
    margin: 0 0 var(--mth-space-2, 0.5rem);
    font-size: var(--mth-font-size-md, 1rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .body {
    font-size: var(--mth-font-size-sm, 0.875rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  @media (forced-colors: active) {
    :host {
      color: CanvasText;
    }
  }
`;
