// @vitest-environment jsdom
import '@methane/ssr-angular/client';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  MthErrorBoundaryElement,
  MthSkipLinkElement,
  MthVisuallyHiddenElement,
} from '@methane/primitives';
import {
  initAngularHydration,
  isAngularHydrationReady,
  upgradeMethaneAngularElements,
} from '@methane/ssr-angular/client';
import { HydrationPuritySuite } from '@methane/test-conformance';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const rootRequire = createRequire(resolve(appRoot, '../../package.json'));
const vitestRequire = createRequire(rootRequire.resolve('vitest'));
const viteModuleUrl = pathToFileURL(vitestRequire.resolve('vite')).href;

function renderAngularSsrHtmlInNode(): string {
  const script = `
    const { createServer } = await import(${JSON.stringify(viteModuleUrl)});
    const vite = await createServer({
      root: ${JSON.stringify(appRoot)},
      appType: 'custom',
      logLevel: 'silent',
      server: { middlewareMode: true, hmr: false },
    });
    try {
      const mod = await vite.ssrLoadModule('/src/server.ts');
      const result = await mod.renderVerifyAngularSsr();
      process.stdout.write(result.html);
    } finally {
      await vite.close();
    }
  `;
  return execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: appRoot,
    encoding: 'utf8',
  });
}

function extractFirstElementSnippet(html: string, tagName: string): string {
  const start = html.indexOf(`<${tagName}`);
  const endTag = `</${tagName}>`;
  const end = html.indexOf(endTag, start);
  if (start === -1 || end === -1) {
    throw new Error(`Could not find <${tagName}> in SSR HTML`);
  }
  return html.slice(start, end + endTag.length);
}

const ELEMENT_CLASSES = {
  'mth-skip-link': MthSkipLinkElement,
  'mth-visually-hidden': MthVisuallyHiddenElement,
  'mth-error-boundary': MthErrorBoundaryElement,
} as const;

describe('@methane/verify-angular hydration purity', () => {
  it('passes HydrationPuritySuite with 0 shadow-DOM node replacements on Angular client upgrade', async () => {
    const fullHtml = renderAngularSsrHtmlInNode();
    expect(fullHtml).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(fullHtml).toContain('angular-ssr@methane.dev|true|true');

    for (const tagName of [
      'mth-skip-link',
      'mth-visually-hidden',
      'mth-error-boundary',
    ] as const) {
      const snippet = extractFirstElementSnippet(fullHtml, tagName);
      const ElementClass = ELEMENT_CLASSES[tagName];
      const report = await HydrationPuritySuite.run({
        ssrHtml: snippet,
        upgradeElement: async (host) => {
          initAngularHydration();
          expect(isAngularHydrationReady()).toBe(true);
          if (!customElements.get(tagName)) {
            customElements.define(tagName, ElementClass);
          }
          upgradeMethaneAngularElements(host.parentNode ?? document);
          await (host as { updateComplete?: Promise<boolean> }).updateComplete;
        },
      });
      expect(report.passed, JSON.stringify(report.checks)).toBe(true);
    }
  });
});
