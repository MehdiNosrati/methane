import { renderLitDsdHtml } from '../shared/ssr-hydrate-test.js';
import { compileSpec } from '@methane-ui/spec-compiler';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { html as litHtml } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MthCsvImporter,
  csvImporterSpec,
  parseCsvMatrix,
  registerMthCsvImporter,
} from './index.js';

describe('<mth-csv-importer>', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('parses quoted CSV, validates mapped columns, and emits mth-import', async () => {
    registerMthCsvImporter();
    const compiled = compileSpec(csvImporterSpec);
    expect(compiled.docs).toContain('`<mth-csv-importer>`');

    expect(parseCsvMatrix('"Last, First",email\n"Lovelace, Ada",ada@example.com')).toEqual([
      ['Last, First', 'email'],
      ['Lovelace, Ada', 'ada@example.com'],
    ]);

    const el = document.createElement('mth-csv-importer') as MthCsvImporter;
    el.fields = [
      { key: 'fullName', label: 'Full Name', required: true },
      {
        key: 'email',
        label: 'Email',
        required: true,
        validate: (val) => (val.includes('@') ? null : 'Invalid email'),
      },
    ];
    document.body.appendChild(el);
    await el.updateComplete;

    el.loadCsv('Customer,Email\nAda Lovelace,ada@example.com\nBroken User,not-an-email');
    await el.updateComplete;

    // Remap column 0 ("Customer") -> "fullName"
    el.setColumnMapping(0, 'fullName');
    await el.updateComplete;

    const validated = el.getValidatedRows();
    expect(validated).toHaveLength(2);
    expect(validated[0]?.errors).toEqual([]);
    expect(validated[1]?.errors).toEqual(['Invalid email']);

    let imported: { rows: ReadonlyArray<Record<string, string>>; invalidCount: number } | undefined;
    el.addEventListener('mth-import', ((e: CustomEvent) => {
      imported = e.detail;
    }) as EventListener);

    el.commitImport();
    expect(imported?.rows).toEqual([{ fullName: 'Ada Lovelace', email: 'ada@example.com' }]);
    expect(imported?.invalidCount).toBe(1);

    const aria = scanSameRootAria(el.shadowRoot!);
    expect(aria.valid).toBe(true);
    expect(aria.issues).toEqual([]);
  });

  it('passes HydrationPuritySuite', async () => {
    const rawSsr = await renderLitDsdHtml(litHtml`<mth-csv-importer></mth-csv-importer>`);
    const ssrHtml = rawSsr
      .replaceAll('mth-csv-importer>', 'hyd-csv-importer>')
      .replaceAll('<mth-csv-importer', '<hyd-csv-importer');

    const hydration = await HydrationPuritySuite.run({
      ssrHtml,
      upgradeElement: async (host) => {
        registerMthCsvImporter('hyd');
        customElements.upgrade(host);
        await (host as MthCsvImporter).updateComplete;
      },
    });
    expect(hydration.failures).toEqual([]);
    expect(hydration.passed).toBe(true);
  });
});
