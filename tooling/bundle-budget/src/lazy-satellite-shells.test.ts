import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { describe, expect, it } from 'vitest';
import { compressSizes, DEFAULT_SHARED_EXTERNALS } from './index.js';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(THIS_DIR, '../../..');

const LAZY_SATELLITE_ENTRIES = [
  {
    name: '@methane-ui/editor/rich-editor',
    entryPath: resolve(
      REPO_ROOT,
      'packages/satellites/editor/dist/components/rich-editor/index.js',
    ),
  },
  {
    name: '@methane-ui/code/code-editor',
    entryPath: resolve(
      REPO_ROOT,
      'packages/satellites/code/dist/components/code-editor/index.js',
    ),
  },
  {
    name: '@methane-ui/code/json-editor',
    entryPath: resolve(
      REPO_ROOT,
      'packages/satellites/code/dist/components/json-editor/index.js',
    ),
  },
  {
    name: '@methane-ui/charts/chart',
    entryPath: resolve(REPO_ROOT, 'packages/satellites/charts/dist/components/chart/index.js'),
  },
] as const;

const SHELL_ENTRY_MAX_BROTLI_BYTES = 15_000;

describe('Lazy-loaded satellite shell bundle budgets', () => {
  it('keeps initial ESM entry shells below 15 KB brotli and splits heavy engines into async chunks', async () => {
    for (const target of LAZY_SATELLITE_ENTRIES) {
      const result = await esbuild.build({
        entryPoints: [target.entryPath],
        splitting: true,
        format: 'esm',
        bundle: true,
        minify: true,
        treeShaking: true,
        platform: 'browser',
        target: 'es2023',
        outdir: 'out',
        write: false,
        external: [...DEFAULT_SHARED_EXTERNALS],
        define: {
          __DEV__: 'false',
        },
      });

      const outputs = result.outputFiles ?? [];
      expect(
        outputs.length,
        `${target.name} should emit lazy engine chunks (got ${outputs.length} file)`,
      ).toBeGreaterThan(1);

      const entryOutput = outputs.find((file) => file.path.endsWith('/index.js'));
      expect(entryOutput, `${target.name} entry index.js output missing`).toBeDefined();

      const metrics = compressSizes(entryOutput!.contents);
      expect(
        metrics.brotliBytes,
        `${target.name} entry shell brotli (${metrics.brotliBytes} B) exceeded ${SHELL_ENTRY_MAX_BROTLI_BYTES} B`,
      ).toBeLessThan(SHELL_ENTRY_MAX_BROTLI_BYTES);
    }
  });

  it('strips IS_DEV dead code and ./env.js imports from @methane-ui/core production dist via esbuild define', () => {
    const prodRuntime = readFileSync(resolve(REPO_ROOT, 'packages/core/dist/runtime.js'), 'utf8');
    const prodUiElement = readFileSync(
      resolve(REPO_ROOT, 'packages/core/dist/ui-element.js'),
      'utf8',
    );
    const devEnv = readFileSync(
      resolve(REPO_ROOT, 'packages/core/dist/development/env.js'),
      'utf8',
    );

    expect(prodRuntime).not.toContain('env.js');
    expect(prodRuntime).not.toContain('Duplicate @methane-ui/core bundle');
    expect(prodUiElement).not.toContain('env.js');
    expect(prodUiElement).not.toContain('runElementDevDiagnostics');
    expect(devEnv).toContain('IS_DEV = true');
  });
});
