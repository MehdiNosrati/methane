import { html, css } from 'lit';

export const styles = css`
  mth-button {
    --mth-color-primary: oklch(0.6 0.2 250);
  }
`;

export function renderCard(title: string) {
  return html`
    <mth-dialog @mth-dismiss=${() => {}}>
      <h2>${title}</h2>
      <div slot="actions">
        <mth-button kind="primary">Confirm</mth-button>
      </div>
    </mth-dialog>
  `;
}
