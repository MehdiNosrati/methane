import { describe, expect, it } from 'vitest';
import { transformTypeScript } from '../transforms/typescript.js';
import type { MigrationManifest } from '../types.js';

const manifest: MigrationManifest = {
  version: '1.0.0',
  tagPrefix: { fromPrefix: 'mth-', toPrefix: 'acme-' },
  tokenPrefix: { fromPrefix: '--mth-', toPrefix: '--acme-' },
  attributes: [
    { tag: 'mth-button', from: 'kind', to: 'variant', valueMap: { primary: 'solid' } },
    { tag: 'mth-button', from: 'deprecated-prop', remove: true },
  ],
  slots: [
    { tag: 'mth-dialog', from: 'footer-actions', to: 'footer' },
    { from: 'icon-left', to: 'prefix' },
  ],
  events: [
    { from: 'mth-old-change', to: 'mth-change' },
  ],
};

describe('@methane/codemod TypeScript / TSX / Lit AST transform', () => {
  it('rewrites Lit html/css templates, JSX elements, React event props, DOM APIs, and TS tag maps idempotently', () => {
    const input = `// Comment mentioning <mth-button> and --mth-color-bg must stay unchanged
import { html, css } from 'lit';

@customElement('mth-button')
export class MyButton {
  static styles = css\`
    :host { color: var(--mth-color-fg); }
    mth-button[kind="primary"] { --mth-color-accent: red; }
  \`;

  render() {
    const label = 'Save';
    return html\`
      <mth-dialog @mth-old-change=\${this.onChange}>
        <div slot="footer-actions">
          <mth-button kind="primary" deprecated-prop>\${label}</mth-button>
        </div>
      </mth-dialog>
    \`;
  }
}

export function ReactView({ onSave }: { onSave: () => void }) {
  return (
    <mth-dialog onMthOldChange={onSave} style={{ '--mth-color-bg': 'var(--mth-color-surface)' }}>
      <div slot="footer-actions">
        <mth-button kind="primary" deprecated-prop>Submit</mth-button>
      </div>
    </mth-dialog>
  );
}

export function imperativeSetup(root: Document) {
  const btn = root.createElement('mth-button');
  btn.setAttribute('kind', 'primary');
  btn.setAttribute('slot', 'icon-left');
  btn.addEventListener('mth-old-change', () => {});
  btn.style.setProperty('--mth-color-accent', 'var(--mth-color-bg)');
  const found = root.querySelector('mth-button[kind="primary"]');
  const ev = new CustomEvent('mth-old-change');
  return { btn, found, ev };
}

declare global {
  interface HTMLElementTagNameMap {
    'mth-button': MyButton;
  }
  interface HTMLElementEventMap {
    'mth-old-change': CustomEvent<void>;
  }
}
`;

    const first = transformTypeScript(input, manifest, 'component.tsx');
    expect(first.changed).toBe(true);
    expect(first.code).toBe(`// Comment mentioning <mth-button> and --mth-color-bg must stay unchanged
import { html, css } from 'lit';

@customElement('acme-button')
export class MyButton {
  static styles = css\`
    :host { color: var(--acme-color-fg); }
    acme-button[variant="solid"] { --acme-color-accent: red; }
  \`;

  render() {
    const label = 'Save';
    return html\`
      <acme-dialog @mth-change=\${this.onChange}>
        <div slot="footer">
          <acme-button variant="solid">\${label}</acme-button>
        </div>
      </acme-dialog>
    \`;
  }
}

export function ReactView({ onSave }: { onSave: () => void }) {
  return (
    <acme-dialog onMthChange={onSave} style={{ '--acme-color-bg': 'var(--acme-color-surface)' }}>
      <div slot="footer">
        <acme-button variant="solid">Submit</acme-button>
      </div>
    </acme-dialog>
  );
}

export function imperativeSetup(root: Document) {
  const btn = root.createElement('acme-button');
  btn.setAttribute('variant', 'solid');
  btn.setAttribute('slot', 'prefix');
  btn.addEventListener('mth-change', () => {});
  btn.style.setProperty('--acme-color-accent', 'var(--acme-color-bg)');
  const found = root.querySelector('acme-button[variant="solid"]');
  const ev = new CustomEvent('mth-change');
  return { btn, found, ev };
}

declare global {
  interface HTMLElementTagNameMap {
    'acme-button': MyButton;
  }
  interface HTMLElementEventMap {
    'mth-change': CustomEvent<void>;
  }
}
`);

    const second = transformTypeScript(first.code, manifest, 'component.tsx');
    expect(second.changed).toBe(false);
    expect(second.editsCount).toBe(0);
    expect(second.code).toBe(first.code);
  });
});
