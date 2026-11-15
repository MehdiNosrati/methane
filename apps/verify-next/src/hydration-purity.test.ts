// @vitest-environment jsdom
import '@methane/ssr-next/client';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  MthErrorBoundaryElement,
  MthSkipLinkElement,
  MthVisuallyHiddenElement,
} from '@methane/primitives';
import { initNextHydration, isNextHydrationReady } from '@methane/ssr-next/client';
import { HydrationPuritySuite } from '@methane/test-conformance';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const ssrNextUrl = pathToFileURL(resolve(appRoot, '../../packages/ssr-next/dist/index.js')).href;
const primitivesUrl = pathToFileURL(
  resolve(appRoot, '../../packages/primitives/dist/index.js'),
).href;

function renderNextSsrHtmlInNode(): string {
  const script = `
    import { registerUtilityElements } from ${JSON.stringify(primitivesUrl)};
    import { renderNextHtml } from ${JSON.stringify(ssrNextUrl)};

    registerUtilityElements();
    const rawHtml = \`<!DOCTYPE html>
<html lang="en">
  <head><title>Next SSR</title></head>
  <body>
    <mth-skip-link href="#main">Skip to verification harness</mth-skip-link>
    <main id="main">
      <mth-visually-hidden>Screen reader verification landmark</mth-visually-hidden>
      <mth-error-boundary fallback-message="Next.js SSR harness boundary fallback">
        <section data-methane-canary-slot="true">Ready</section>
      </mth-error-boundary>
    </main>
  </body>
</html>\`;

    const rendered = await renderNextHtml(rawHtml, {
      assetBase: '/methane/styles',
    });
    process.stdout.write(rendered.html);
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

describe('@methane/verify-next hydration purity', () => {
  it('passes HydrationPuritySuite with 0 shadow-DOM node replacements on client upgrade', async () => {
    const html = renderNextSsrHtmlInNode();
    expect(html).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);

    for (const tagName of [
      'mth-skip-link',
      'mth-visually-hidden',
      'mth-error-boundary',
    ] as const) {
      const snippet = extractFirstElementSnippet(html, tagName);
      const ElementClass = ELEMENT_CLASSES[tagName];
      const report = await HydrationPuritySuite.run({
        ssrHtml: snippet,
        upgradeElement: async (host) => {
          initNextHydration();
          expect(isNextHydrationReady()).toBe(true);
          if (!customElements.get(tagName)) {
            customElements.define(tagName, ElementClass);
          }
          customElements.upgrade(host);
          await (host as { updateComplete?: Promise<boolean> }).updateComplete;
        },
      });
      expect(report.passed, JSON.stringify(report.checks)).toBe(true);
    }
  });
});
