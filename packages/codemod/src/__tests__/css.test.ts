import { describe, expect, it } from 'vitest';
import { transformCss } from '../transforms/css.js';
import type { MigrationManifest } from '../types.js';

const manifest: MigrationManifest = {
  version: '1.0.0',
  tagPrefix: { fromPrefix: 'mth-', toPrefix: 'acme-' },
  tokenPrefix: { fromPrefix: '--mth-', toPrefix: '--acme-' },
  tokenRenames: [
    { from: '--mth-color-primary', to: '--mth-color-accent' },
  ],
  attributes: [
    { tag: 'mth-button', from: 'kind', to: 'variant', valueMap: { primary: 'solid' } },
  ],
  slots: [
    { from: 'icon-left', to: 'prefix' },
  ],
};

describe('@methane/codemod CSS AST transform', () => {
  it('rewrites custom element type selectors, --mth-* tokens, var(), @property, and attribute/slot selectors while leaving classes and comments intact', () => {
    const input = `/* mth-button and --mth-color-primary in comment stay untouched */
@property --mth-color-primary {
  syntax: "<color>";
  inherits: true;
}

.mth-stack {
  gap: var(--mth-space-4, var(--mth-space-2));
  --mth-color-primary: oklch(0.6 0.2 250);
}

mth-button[kind="primary"]::part(base),
mth-dialog:is(mth-dialog, .mth-panel) [slot="icon-left"] {
  color: var(--mth-color-fg);
  background: var(--mth-color-primary);
}
`;

    const first = transformCss(input, manifest);
    expect(first.changed).toBe(true);
    expect(first.code).toBe(`/* mth-button and --mth-color-primary in comment stay untouched */
@property --acme-color-accent {
  syntax: "<color>";
  inherits: true;
}

.mth-stack {
  gap: var(--acme-space-4, var(--acme-space-2));
  --acme-color-accent: oklch(0.6 0.2 250);
}

acme-button[variant="solid"]::part(base),
acme-dialog:is(acme-dialog, .mth-panel) [slot="prefix"] {
  color: var(--acme-color-fg);
  background: var(--acme-color-accent);
}
`);

    // Strictly idempotent on re-run
    const second = transformCss(first.code, manifest);
    expect(second.changed).toBe(false);
    expect(second.editsCount).toBe(0);
    expect(second.code).toBe(first.code);
  });
});
