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
  loadWorkspaceManifestAndSpecs,
  normalizeManifest,
  sanitizeTypeText,
} from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

describe('@methane-ui/wrapper-codegen', () => {
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

    const reactIndex = output.reactFiles.find((f) => f.path === 'generated/index.ts')!.content;
    const reactInput = output.reactFiles.find((f) => f.path === 'generated/components/mth-input.ts')!.content;
    const reactLegacy = output.reactFiles.find((f) => f.path === 'generated/legacy.ts')!.content;
    const reactLegacyInput = output.reactFiles.find((f) => f.path === 'generated/legacy/mth-input.ts')!.content;
    expect(reactIndex).toContain("export * from './components/mth-input.js';");
    expect(reactIndex).toContain('MethaneReactTagNameMap');
    expect(reactInput).toContain('interface IntrinsicElements');
    expect(reactInput).toContain('"mth-input": MthInputProps;');
    expect(reactInput).toContain('"onmth-input"');
    expect(reactLegacy).toContain("export { MthInput } from './legacy/mth-input.js';");
    expect(reactLegacyInput).toContain("from '@lit/react'");
    expect(reactLegacyInput).toContain('onMthInput: "mth-input"');

    const vueIndex = output.vueFiles.find((f) => f.path === 'generated/index.ts')!.content;
    const vueRuntime = output.vueFiles.find((f) => f.path === 'generated/runtime.ts')!.content;
    const vueInput = output.vueFiles.find((f) => f.path === 'generated/components/mth-input.ts')!.content;
    expect(vueIndex).toContain("export * from './components/mth-input.js';");
    expect(vueIndex).toContain('METHANE_VUE_COMPILER_OPTIONS');
    expect(vueRuntime).toContain('defineComponent');
    expect(vueInput).toContain("declare module 'vue'");
    expect(vueInput).toContain('interface GlobalComponents');
    expect(vueInput).toContain('modelValue?: string | undefined');

    const angularIndex = output.angularFiles.find((f) => f.path === 'generated/index.ts')!.content;
    const angularButton = output.angularFiles.find((f) => f.path === 'generated/components/mth-button.ts')!.content;
    const angularInput = output.angularFiles.find((f) => f.path === 'generated/components/mth-input.ts')!.content;
    expect(angularIndex).toContain('METHANE_ANGULAR_DIRECTIVES');
    expect(angularButton).toContain("from '@angular/core'");
    expect(angularButton).toContain('standalone: true');
    expect(angularButton).toContain('export class MthButtonDirective {');
    expect(angularInput).toContain("from '@angular/forms'");
    expect(angularInput).toContain('@HostListener');
    expect(angularInput).toContain('implements ControlValueAccessor, OnDestroy');
    expect(angularInput).toContain('NG_VALUE_ACCESSOR');
    expect(angularInput).toContain('export class MthInputDirective implements ControlValueAccessor, OnDestroy');

    const svelteIndex = output.svelteFiles.find((f) => f.path === 'generated/index.ts')!.content;
    const svelteInputTs = output.svelteFiles.find((f) => f.path === 'generated/components/mth-input.ts')!.content;
    const svelteInput = output.svelteFiles.find((f) => f.path === 'generated/svelte/MthInput.svelte')!.content;
    const svelteDialog = output.svelteFiles.find((f) => f.path === 'generated/svelte/MthDialog.svelte')!.content;
    expect(svelteIndex).toContain("export * from './components/mth-input.js';");
    expect(svelteInputTs).toContain("declare module 'svelte/elements'");
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

  it('sanitizes unimported nominal types while preserving standalone TS/DOM types', () => {
    expect(sanitizeTypeText('DatagridColumn[]')).toBe('unknown[]');
    expect(sanitizeTypeText('ReadonlyArray<CitationItem> | null')).toBe('ReadonlyArray<unknown> | null');
    expect(sanitizeTypeText('DataSource<T> | null')).toBe('unknown | null');
    expect(sanitizeTypeText('DotLottieConfig["data"] | undefined')).toBe('unknown | undefined');
    expect(sanitizeTypeText('(item: T, index: number) => unknown')).toBe(
      '(item: unknown, index: number) => unknown',
    );
    expect(sanitizeTypeText('{}')).toBe('Record<string, never>');
    expect(sanitizeTypeText('{ item: MthBreadcrumbPathItem; index: number }')).toBe(
      '{ item: unknown; index: number }',
    );
    expect(
      sanitizeTypeText("Element | { getBoundingClientRect(): DOMRect } | DOMRect | null"),
    ).toBe('Element | { getBoundingClientRect(): DOMRect } | DOMRect | null');
    expect(sanitizeTypeText("'TB' | 'LR' | 'RL' | 'auto'")).toBe("'TB' | 'LR' | 'RL' | 'auto'");
    expect(sanitizeTypeText('File[]')).toBe('File[]');
    expect(sanitizeTypeText('ReadonlyArray<string>')).toBe('ReadonlyArray<string>');
    expect(sanitizeTypeText('Date | FileList | ValidityState | void')).toBe(
      'Date | FileList | ValidityState | void',
    );
  });

  it('discovers workspace CEMs + primitives via CLI and compiles full dom-maps.d.ts; keeps fixture fallback', () => {
    const cliPath = resolve(repoRoot, 'tooling/wrapper-codegen/dist/cli.js');

    // Full workspace discovery
    const workspaceOut = execFileSync(
      process.execPath,
      [cliPath, '--root', repoRoot, '--dry-run'],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    const match = /Generated wrappers for (\d+) components/.exec(workspaceOut);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(230);

    // Fallback to DEFAULT_CEM_FIXTURE in empty root without --cem
    const emptyTmp = mkdtempSync(resolve(tmpdir(), 'mth-codegen-empty-'));
    try {
      const fallbackOut = execFileSync(
        process.execPath,
        [cliPath, '--root', emptyTmp, '--dry-run'],
        { cwd: repoRoot, encoding: 'utf8' },
      );
      expect(fallbackOut).toContain('Generated wrappers for 8 components');
    } finally {
      rmSync(emptyTmp, { recursive: true, force: true });
    }

    // Type-check merged workspace catalog dom-maps.d.ts
    const discovered = loadWorkspaceManifestAndSpecs(repoRoot);
    const tmp = mkdtempSync(resolve(tmpdir(), 'mth-codegen-full-'));
    try {
      const fullResult = generateAllWrappers(discovered, {
        write: true,
        ideDir: resolve(tmp, 'ide'),
      });
      expect(fullResult.models.length).toBeGreaterThanOrEqual(230);
      for (const file of [...fullResult.reactFiles, ...fullResult.vueFiles]) {
        expect(Buffer.byteLength(file.content, 'utf8'), `${file.path} exceeds 15 KB`).toBeLessThanOrEqual(
          15 * 1024,
        );
      }
      const domMapsPath = resolve(tmp, 'ide/dom-maps.d.ts');
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
        { cwd: repoRoot, stdio: 'pipe' },
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
