import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BEHAVIOR_SPECS,
  DEFAULT_CEM_FIXTURE,
  generateAllWrappers,
  normalizeManifest,
} from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

describe('@methane/wrapper-codegen', () => {
  it('normalizes CEM declarations enriched with ComponentBehaviorSpec', () => {
    const models = normalizeManifest(DEFAULT_CEM_FIXTURE, DEFAULT_BEHAVIOR_SPECS);
    expect(models.map((m) => m.tagName)).toEqual([
      'mth-button',
      'mth-checkbox',
      'mth-combobox',
      'mth-dialog',
      'mth-field',
      'mth-input',
      'mth-option',
      'mth-switch',
    ]);

    const combobox = models.find((m) => m.tagName === 'mth-combobox')!;
    expect(combobox.formAssociated).toBe(true);
    expect(combobox.bindableProps).toEqual(['value', 'open']);
    expect(combobox.states).toEqual(['open', 'loading', 'user-invalid']);
    expect(combobox.events.map((e) => e.name)).toEqual(['mth-open', 'mth-close', 'mth-select']);
  });

  it('generates React 19/18, Vue, Angular, Svelte 5, and IDE metadata outputs', () => {
    const output = generateAllWrappers(
      { manifest: DEFAULT_CEM_FIXTURE, specs: DEFAULT_BEHAVIOR_SPECS },
      { write: false },
    );

    const reactIndex = output.reactFiles.find((f) => f.path === 'index.ts')!.content;
    const reactLegacy = output.reactFiles.find((f) => f.path === 'legacy.ts')!.content;
    expect(reactIndex).toContain('interface IntrinsicElements');
    expect(reactIndex).toContain('"mth-input": MthInputProps;');
    expect(reactIndex).toContain('"onmth-input"');
    expect(reactLegacy).toContain("from '@lit/react'");
    expect(reactLegacy).toContain('onMthInput: "mth-input"');

    const vueIndex = output.vueFiles.find((f) => f.path === 'index.ts')!.content;
    expect(vueIndex).toContain("declare module 'vue'");
    expect(vueIndex).toContain('defineComponent');
    expect(vueIndex).toContain('interface GlobalComponents');
    expect(vueIndex).toContain('modelValue?: string | undefined');
    expect(vueIndex).toContain('METHANE_VUE_COMPILER_OPTIONS');

    const angularIndex = output.angularFiles.find((f) => f.path === 'index.ts')!.content;
    expect(output.angularFiles.some((f) => f.path === 'runtime.ts')).toBe(false);
    expect(angularIndex).toContain("from '@angular/core'");
    expect(angularIndex).toContain("from '@angular/forms'");
    expect(angularIndex).toContain('standalone: true');
    expect(angularIndex).toContain('@HostListener');
    expect(angularIndex).toContain('implements ControlValueAccessor, OnDestroy');
    expect(angularIndex).toContain('NG_VALUE_ACCESSOR');
    expect(angularIndex).toContain('export class MthButtonDirective {');
    expect(angularIndex).toContain('export class MthInputDirective implements ControlValueAccessor, OnDestroy');

    const svelteIndex = output.svelteFiles.find((f) => f.path === 'index.ts')!.content;
    const svelteInput = output.svelteFiles.find((f) => f.path === 'components/MthInput.svelte')!.content;
    const svelteDialog = output.svelteFiles.find((f) => f.path === 'components/MthDialog.svelte')!.content;
    expect(svelteIndex).toContain("declare module 'svelte/elements'");
    expect(svelteInput).toContain('$bindable');
    expect(svelteInput).toContain('value = $bindable("")');
    expect(svelteInput).toContain('onmth-input=');
    expect(svelteDialog).toContain('open = $bindable(false)');

    const vscodeJson = JSON.parse(
      output.ideFiles.find((f) => f.path === 'vscode.html-custom-data.json')!.content,
    ) as { version: number; tags: Array<{ name: string }> };
    expect(vscodeJson.version).toBe(1.1);
    expect(vscodeJson.tags.some((t) => t.name === 'mth-combobox')).toBe(true);

    const webTypes = JSON.parse(
      output.ideFiles.find((f) => f.path === 'web-types.json')!.content,
    ) as { contributions: { html: { elements: Array<{ name: string }> } } };
    expect(webTypes.contributions.html.elements.some((e) => e.name === 'mth-dialog')).toBe(true);

    const domMaps = output.ideFiles.find((f) => f.path === 'dom-maps.d.ts')!.content;
    expect(domMaps).toContain('interface HTMLElementTagNameMap');
    expect(domMaps).toContain('interface HTMLElementEventMap');
  });

  it('writes files and passes tsc --noEmit on dom-maps.d.ts', () => {
    const tmp = mkdtempSync(resolve(tmpdir(), 'mth-codegen-'));
    try {
      const result = generateAllWrappers(
        { manifest: DEFAULT_CEM_FIXTURE, specs: DEFAULT_BEHAVIOR_SPECS },
        {
          write: true,
          ideDir: resolve(tmp, 'ide'),
        },
      );
      expect(result.writtenPaths).toHaveLength(3);
      const domMapsPath = resolve(tmp, 'ide/dom-maps.d.ts');
      expect(existsSync(domMapsPath)).toBe(true);
      expect(readFileSync(domMapsPath, 'utf8')).toContain('"mth-input": MthInputElement;');

      const tscBin = resolve(repoRoot, 'node_modules/.bin/tsc');
      execFileSync(
        tscBin,
        [
          '--noEmit',
          '--strict',
          '--target',
          'ES2023',
          '--module',
          'NodeNext',
          '--moduleResolution',
          'NodeNext',
          '--lib',
          'ES2023,DOM',
          domMapsPath,
        ],
        {
          cwd: repoRoot,
          stdio: 'pipe',
        },
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
