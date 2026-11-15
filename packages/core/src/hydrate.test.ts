// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(THIS_DIR, '..');

describe('@methane/core/hydrate opt-in SSR hydration', () => {
  it('does not install litElementHydrateSupport when importing @methane/core alone', () => {
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

  it('installs litElementHydrateSupport when importing @methane/core/hydrate before lit', () => {
    const hydrateDistUrl = pathToFileURL(resolve(PKG_ROOT, 'dist/hydrate.js')).href;
    const coreDistUrl = pathToFileURL(resolve(PKG_ROOT, 'dist/index.js')).href;
    const script = `
      import ${JSON.stringify(hydrateDistUrl)};
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
    expect(JSON.parse(stdout)).toEqual({ hasSupport: true });
  });
});
