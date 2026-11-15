import { css } from 'lit';

export const optionGroupStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    font-family: var(--mth-font-sans, system-ui, sans-serif);
  }

  :host(:state(disabled)),
  :host([disabled]) {
    opacity: 0.5;
    pointer-events: none;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    padding-block: var(--mth-space-1, 0.25rem);
  }

  [part='label'] {
    font-size: var(--mth-font-size-xs, 0.75rem);
    font-weight: var(--mth-font-weight-semibold, 600);
    color: var(--mth-color-fg-muted, GrayText);
    padding-block: var(--mth-space-1, 0.25rem);
    padding-inline: var(--mth-space-control-inline, 0.75rem);
  }

  [part='options'] {
    display: flex;
    flex-direction: column;
  }

  @media (forced-colors: active) {
    [part='label'] {
      color: GrayText;
    }

    :host(:state(disabled)) [part='label'],
    :host([disabled]) [part='label'] {
      color: GrayText;
    }
  }
`;
