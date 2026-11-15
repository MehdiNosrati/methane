import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkBundleBudgets } from '../../../tooling/bundle-budget/dist/index.js';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const UI_PKG_DIR = resolve(THIS_DIR, '..');
const REPO_ROOT = resolve(THIS_DIR, '../../..');
const APPS_DOCS_DIR = resolve(REPO_ROOT, 'apps/docs');
const REACT_PKG_DIR = resolve(REPO_ROOT, 'packages/react');
const SANITIZE_PKG_DIR = resolve(REPO_ROOT, 'packages/sanitize');

describe('@methane-ui/ui bundle size budgets', () => {
  it('enforces tree-shaking, CSS/JS minification, and pure-module bundle ceilings', async () => {
    const report = await checkBundleBudgets([
      {
        name: '@methane-ui/ui (1-comp barrel)',
        entryPoint: resolve(UI_PKG_DIR, 'dist/index.js'),
        stdin: {
          contents: "import { MthButton } from '@methane-ui/ui'; console.log(MthButton);",
          resolveDir: APPS_DOCS_DIR,
          loader: 'js',
        },
        maxColdGzipBytes: 18_000,
        maxColdBrotliBytes: 16_000,
      },
      {
        name: '@methane-ui/ui/button (subpath)',
        entryPoint: resolve(UI_PKG_DIR, 'dist/components/button/index.js'),
        stdin: {
          contents: "import '@methane-ui/ui/button';",
          resolveDir: APPS_DOCS_DIR,
          loader: 'js',
        },
        maxColdGzipBytes: 18_000,
        maxColdBrotliBytes: 16_000,
      },
      {
        name: '@methane-ui/ui (5-comp barrel)',
        entryPoint: resolve(UI_PKG_DIR, 'dist/index.js'),
        stdin: {
          contents:
            "import { MthButton, MthInput, MthSelect, MthDialog, MthTabs } from '@methane-ui/ui'; console.log(MthButton, MthInput, MthSelect, MthDialog, MthTabs);",
          resolveDir: APPS_DOCS_DIR,
          loader: 'js',
        },
        maxColdGzipBytes: 45_000,
        maxColdBrotliBytes: 40_000,
      },
      {
        name: '@methane-ui/ui (full barrel)',
        entryPoint: resolve(UI_PKG_DIR, 'dist/index.js'),
        stdin: {
          contents: "export * from '@methane-ui/ui';",
          resolveDir: APPS_DOCS_DIR,
          loader: 'js',
        },
        maxColdRawBytes: 1_650_000,
        maxColdGzipBytes: 340_000,
      },
      {
        name: '@methane-ui/sanitize (isSafeUrl)',
        entryPoint: resolve(SANITIZE_PKG_DIR, 'dist/index.js'),
        stdin: {
          contents:
            "import { isSafeUrl } from '@methane-ui/sanitize'; console.log(isSafeUrl('https://example.com'));",
          resolveDir: SANITIZE_PKG_DIR,
          loader: 'js',
        },
        maxColdRawBytes: 500,
        maxColdGzipBytes: 400,
      },
      {
        name: '@methane-ui/react (root barrel)',
        entryPoint: resolve(REACT_PKG_DIR, 'dist/index.js'),
        sharedExternals: ['react', 'react-dom'],
        stdin: {
          contents: "export * from '@methane-ui/react';",
          resolveDir: REACT_PKG_DIR,
          loader: 'js',
        },
        maxColdRawBytes: 100,
        maxColdGzipBytes: 100,
      },
      {
        name: '@methane-ui/react/legacy (MthButton)',
        entryPoint: resolve(REACT_PKG_DIR, 'dist/legacy.js'),
        sharedExternals: ['react', 'react-dom'],
        stdin: {
          contents: "import { MthButton } from './dist/legacy.js'; console.log(MthButton);",
          resolveDir: REACT_PKG_DIR,
          loader: 'js',
        },
        maxColdRawBytes: 15_000,
        maxColdGzipBytes: 6_000,
        maxMarginalRawBytes: 2_500,
        maxMarginalGzipBytes: 1_500,
      },
    ]);

    expect(report.results.map((r) => ({ name: r.name, violations: r.violations }))).toEqual(
      report.results.map((r) => ({ name: r.name, violations: [] })),
    );
    expect(report.passed).toBe(true);
  }, 30_000);
});
