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
