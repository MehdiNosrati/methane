import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { MthButton, MthCheckbox, MthCombobox, MthDialog, MthInput } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('@methane/svelte', () => {
  it('exposes Svelte 5 typed wrappers supporting bind:value, bind:checked, and bind:open', () => {
    expect(MthButton.bindableProps).toEqual([]);
    expect(MthInput.bindableProps).toEqual(['value']);
    expect(MthCheckbox.bindableProps).toEqual(['value', 'checked']);
    expect(MthDialog.bindableProps).toEqual(['open']);
    expect(MthCombobox.bindableProps).toEqual(['value', 'open']);

    const inputSvelte = readFileSync(resolve(__dirname, 'components/MthInput.svelte'), 'utf8');
    expect(inputSvelte).toContain('value = $bindable("")');
    expect(inputSvelte).toContain('onmth-input=');
    expect(inputSvelte).toContain('<mth-input');

    const checkboxSvelte = readFileSync(resolve(__dirname, 'components/MthCheckbox.svelte'), 'utf8');
    expect(checkboxSvelte).toContain('onmth-change=');
    expect(checkboxSvelte).toContain('checked = $bindable(false)');

    const comboboxSvelte = readFileSync(resolve(__dirname, 'components/MthCombobox.svelte'), 'utf8');
    expect(comboboxSvelte).toContain('onmth-select=');
    expect(comboboxSvelte).toContain('onmth-open=');

    const dialogSvelte = readFileSync(resolve(__dirname, 'components/MthDialog.svelte'), 'utf8');
    expect(dialogSvelte).toContain('open = $bindable(false)');
  });

  it('compiles all generated Svelte 5 runes components cleanly via svelte/compiler', () => {
    const componentsDir = resolve(__dirname, 'components');
    const files = readdirSync(componentsDir).filter((f) => f.endsWith('.svelte'));
    expect(files.length).toBeGreaterThanOrEqual(8);

    for (const file of files) {
      const source = readFileSync(resolve(componentsDir, file), 'utf8');
      const result = compile(source, {
        filename: file,
        runes: true,
        generate: 'client',
      });
      expect(result.js.code.length).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
    }
  });
});
