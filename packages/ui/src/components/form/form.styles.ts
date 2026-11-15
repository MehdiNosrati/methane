import { css } from 'lit';

export const formStyles = css`
  :host {
    --_frm-font: var(--mth-font-sans, system-ui, sans-serif);
    --_frm-fg: var(--mth-color-fg, CanvasText);
    --_frm-gap: var(--mth-space-4, 1rem);

    display: block;
    box-sizing: border-box;
    font-family: var(--_frm-font);
    color: var(--_frm-fg);
  }

  [part='form'] {
    display: flex;
    flex-direction: column;
    gap: var(--_frm-gap);
  }

  :host(:state(submitting)) {
    cursor: progress;
  }

  @media (forced-colors: active) {
    :host {
      color: CanvasText;
    }
  }
`;
