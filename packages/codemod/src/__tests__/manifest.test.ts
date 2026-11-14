import { describe, expect, it } from 'vitest';
import {
  compileManifest,
  createPrefixManifest,
  parseMigrationManifest,
  toReactEventPropName,
  validateMigrationManifest,
} from '../manifest.js';

describe('@methane/codemod manifest', () => {
  it('validates declarative migration manifests and rejects malformed fields', () => {
    expect(
      validateMigrationManifest({
        version: '1.0.0',
        tagPrefix: { fromPrefix: 'mth-', toPrefix: 'acme-' },
        tokenPrefix: { fromPrefix: '--mth-', toPrefix: '--acme-' },
        attributes: [{ tag: 'mth-button', from: 'kind', to: 'variant', valueMap: { primary: 'solid' } }],
        slots: [{ tag: 'mth-dialog', from: 'footer-actions', to: 'footer' }],
        events: [{ tag: 'mth-combobox', from: 'mth-old-select', to: 'mth-select' }],
      }),
    ).toEqual([]);

    const issues = validateMigrationManifest({
      version: '',
      tagPrefix: { fromPrefix: 'mth', toPrefix: 'acme' },
      tokenRenames: [{ from: 'bad-token', to: '--good' }],
      attributes: [{ from: 'kind' }],
      slots: [{ from: '', to: 'footer' }],
      events: [{ from: 'a', to: '' }],
    });
    expect(issues.length).toBeGreaterThanOrEqual(6);
  });

  it('parses JSON manifest and handles nested prefix rewrites idempotently', () => {
    const manifest = parseMigrationManifest(
      JSON.stringify({
        version: '1.0.0',
        tagPrefix: { fromPrefix: 'mth-', toPrefix: 'mth-v2-' },
        tokenPrefix: { fromPrefix: '--mth-', toPrefix: '--mth-v2-' },
      }),
    );

    const compiled = compileManifest(manifest);
    const onceTag = compiled.rewriteTag('mth-button');
    expect(onceTag).toBe('mth-v2-button');
    expect(compiled.rewriteTag(onceTag)).toBe('mth-v2-button');

    const onceToken = compiled.rewriteToken('--mth-color-accent');
    expect(onceToken).toBe('--mth-v2-color-accent');
    expect(compiled.rewriteToken(onceToken)).toBe('--mth-v2-color-accent');
  });

  it('supports tag allowlists, exact tag/token renames, and React event prop mapping', () => {
    const manifest = createPrefixManifest({
      toTagPrefix: 'ds-',
      tags: ['button', 'mth-dialog'],
      toTokenPrefix: '--ds-',
    });
    const compiled = compileManifest(manifest);

    expect(compiled.rewriteTag('mth-button')).toBe('ds-button');
    expect(compiled.rewriteTag('mth-dialog')).toBe('ds-dialog');
    expect(compiled.rewriteTag('mth-input')).toBe('mth-input');
    expect(compiled.rewriteToken('--mth-space-4')).toBe('--ds-space-4');
    expect(toReactEventPropName('mth-after-close')).toBe('onMthAfterClose');
  });
});
