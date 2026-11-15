import { html, css } from 'lit';

export const styles = css`
  app-button {
    --app-color-accent: oklch(0.6 0.2 250);
  }
`;

export function renderCard(title: string) {
  return html`
    <app-dialog @mth-close=${() => {}}>
      <h2>${title}</h2>
      <div slot="footer">
        <app-button variant="solid">Confirm</app-button>
      </div>
    </app-dialog>
  `;
}
