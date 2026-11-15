import { describe, expect, it } from 'vitest';
import { transformHtml } from '../transforms/html.js';
import type { MigrationManifest } from '../types.js';

const manifest: MigrationManifest = {
  version: '1.0.0',
  tagPrefix: { fromPrefix: 'mth-', toPrefix: 'acme-' },
  tokenPrefix: { fromPrefix: '--mth-', toPrefix: '--acme-' },
  attributes: [
    { tag: 'mth-button', from: 'kind', to: 'variant', valueMap: { primary: 'solid', ghost: 'outline' } },
    { tag: 'mth-button', from: 'legacy-flag', remove: true },
    { tag: 'mth-dialog', from: 'opened', to: 'open' },
  ],
  slots: [
    { tag: 'mth-dialog', from: 'footer-actions', to: 'footer' },
    { from: 'icon-left', to: 'prefix' },
  ],
  events: [
    { tag: 'mth-dialog', from: 'mth-close-request', to: 'mth-close' },
    { tag: 'mth-combobox', from: 'mth-value-change', to: 'change' },
  ],
};

describe('@methane-ui/codemod HTML AST transform', () => {
  it('rewrites tags, deprecated attributes, slots, framework events, and inline styles while preserving comments', () => {
    const input = `<!-- <mth-button kind="primary"></mth-button> -->
<mth-dialog ?opened=\${isOpen} @mth-close-request=\${onClose} style="--mth-color-bg: var(--mth-color-surface)">
  <span slot="icon-left">Icon</span>
  <div slot="footer-actions">
    <mth-button kind="primary" legacy-flag>Save</mth-button>
  </div>
</mth-dialog>
<mth-combobox v-on:mth-value-change.prevent="handleChange"></mth-combobox>
<mth-combobox (mth-value-change)="onChange($event)" on:mth-value-change={svelteChange}></mth-combobox>
`;

    const first = transformHtml(input, manifest);
    expect(first.changed).toBe(true);
    expect(first.code).toBe(`<!-- <mth-button kind="primary"></mth-button> -->
<acme-dialog ?open=\${isOpen} @mth-close=\${onClose} style="--acme-color-bg: var(--acme-color-surface)">
  <span slot="prefix">Icon</span>
  <div slot="footer">
    <acme-button variant="solid">Save</acme-button>
  </div>
</acme-dialog>
<acme-combobox v-on:change.prevent="handleChange"></acme-combobox>
<acme-combobox (change)="onChange($event)" on:change={svelteChange}></acme-combobox>
`);

    const second = transformHtml(first.code, manifest);
    expect(second.changed).toBe(false);
    expect(second.editsCount).toBe(0);
    expect(second.code).toBe(first.code);
  });

  it('transforms embedded <style> blocks and avoids duplicate attributes when target already exists', () => {
    const input = `<style>
  mth-button { color: var(--mth-color-fg); }
</style>
<mth-button kind="ghost" variant="outline">OK</mth-button>`;

    const first = transformHtml(input, manifest);
    expect(first.changed).toBe(true);
    expect(first.code).toBe(`<style>
  acme-button { color: var(--acme-color-fg); }
</style>
<acme-button variant="outline">OK</acme-button>`);

    const second = transformHtml(first.code, manifest);
    expect(second.changed).toBe(false);
  });
});
