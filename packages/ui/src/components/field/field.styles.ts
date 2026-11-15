import { css } from 'lit';

export const fieldStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    --_field-gap: calc(var(--mth-space-control-gap, 0.375rem) * var(--mth-density, 1));
    --_field-fg: var(--mth-color-fg, CanvasText);
    --_field-muted: var(--mth-color-fg-muted, GrayText);
    --_field-danger: var(--mth-color-danger, crimson);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--_field-gap);
  }

  .field[data-density='compact'] {
    gap: var(--mth-space-1, 0.25rem);
  }

  .field[data-density='comfortable'] {
    gap: var(--mth-space-2, 0.5rem);
  }

  .label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--mth-space-1, 0.25rem);
    color: var(--_field-fg);
    font-size: var(--mth-font-size-sm, 0.875rem);
    font-weight: var(--mth-font-weight-medium, 500);
    line-height: var(--mth-line-height-tight, 1.25);
  }

  .required-mark {
    color: var(--_field-danger);
  }

  .control {
    display: block;
    inline-size: 100%;
  }

  .hint {
    margin-block: 0;
    color: var(--_field-muted);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  .error {
    margin-block: 0;
    color: var(--_field-danger);
    font-size: var(--mth-font-size-xs, 0.75rem);
    line-height: var(--mth-line-height-normal, 1.5);
  }

  @media (forced-colors: active) {
    .label {
      color: CanvasText;
    }

    .hint {
      color: GrayText;
    }

    .error,
    .required-mark {
      color: LinkText;
    }
  }
`;
