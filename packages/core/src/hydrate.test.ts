// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(THIS_DIR, '..');

describe('@methane-ui/core/hydrate opt-in SSR hydration', () => {
  it('does not install litElementHydrateSupport when importing @methane-ui/core alone', () => {
    const coreDistUrl = pathToFileURL(resolve(PKG_ROOT, 'dist/index.js')).href;
    const script = `
      import ${JSON.stringify(coreDistUrl)};
      process.stdout.write(JSON.stringify({
        hasSupport: typeof globalThis.litElementHydrateSupport === 'function',
      }));
    `;
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-'], {
      cwd: PKG_ROOT,
      input: script,
      encoding: 'utf8',
    });
    expect(JSON.parse(stdout)).toEqual({ hasSupport: false });
  });

  it('installs litElementHydrateSupport and patches LitElement when importing @methane-ui/core/hydrate before lit', () => {
    const hydrateDistUrl = pathToFileURL(resolve(PKG_ROOT, 'dist/hydrate.js')).href;
    const coreDistUrl = pathToFileURL(resolve(PKG_ROOT, 'dist/index.js')).href;
    const script = `
      import ${JSON.stringify(hydrateDistUrl)};
      import { LitElement } from 'lit';
      import ${JSON.stringify(coreDistUrl)};
      const desc = Object.getOwnPropertyDescriptor(LitElement, 'observedAttributes');
      process.stdout.write(JSON.stringify({
        hasSupport: typeof globalThis.litElementHydrateSupport === 'function',
        patched: Boolean(desc && !desc.configurable),
      }));
    `;
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-'], {
      cwd: PKG_ROOT,
      input: script,
      encoding: 'utf8',
    });
    expect(JSON.parse(stdout)).toEqual({ hasSupport: true, patched: true });
  });

  it('retroactively patches LitElement when @methane-ui/core is imported BEFORE @methane-ui/core/hydrate', () => {
    const hydrateDistUrl = pathToFileURL(resolve(PKG_ROOT, 'dist/hydrate.js')).href;
    const coreDistUrl = pathToFileURL(resolve(PKG_ROOT, 'dist/index.js')).href;
    const script = `
      import { LitElement } from 'lit';
      import ${JSON.stringify(coreDistUrl)};
      const before = Object.getOwnPropertyDescriptor(LitElement, 'observedAttributes');
      await import(${JSON.stringify(hydrateDistUrl)});
      const after = Object.getOwnPropertyDescriptor(LitElement, 'observedAttributes');
      process.stdout.write(JSON.stringify({
        patchedBefore: Boolean(before && !before.configurable),
        patchedAfter: Boolean(after && !after.configurable),
        createRenderRootPatched: String(LitElement.prototype.createRenderRoot).includes('_$AG'),
      }));
    `;
    const stdout = execFileSync(process.execPath, ['--input-type=module', '-'], {
      cwd: PKG_ROOT,
      input: script,
      encoding: 'utf8',
    });
    expect(JSON.parse(stdout)).toEqual({
      patchedBefore: false,
      patchedAfter: true,
      createRenderRootPatched: true,
    });
  });
});
