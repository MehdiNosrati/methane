// @vitest-environment jsdom
import '@methane-ui/ssr-next/client';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  MthErrorBoundaryElement,
  MthSkipLinkElement,
  MthVisuallyHiddenElement,
} from '@methane-ui/primitives';
import { initNextHydration, isNextHydrationReady } from '@methane-ui/ssr-next/client';
import { HydrationPuritySuite, scanSameRootAria } from '@methane-ui/test-conformance';
import { MthCombobox } from '@methane-ui/ui/combobox/element';
import { MthDialog } from '@methane-ui/ui/dialog/element';
import { MthField } from '@methane-ui/ui/field/element';
import { MthInput } from '@methane-ui/ui/input/element';
import { MthOption } from '@methane-ui/ui/option/element';
import { MthOptionGroup } from '@methane-ui/ui/option-group/element';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const ssrNextUrl = pathToFileURL(resolve(appRoot, '../../packages/ssr-next/dist/index.js')).href;
const primitivesUrl = pathToFileURL(
  resolve(appRoot, '../../packages/primitives/dist/index.js'),
).href;
const uiUrl = pathToFileURL(resolve(appRoot, '../../packages/ui/dist/index.js')).href;

function renderNextSsrHtmlInNode(): string {
  const script = `
    import { registerUtilityElements } from ${JSON.stringify(primitivesUrl)};
    import { registerAllComponents } from ${JSON.stringify(uiUrl)};
    import { renderNextHtml } from ${JSON.stringify(ssrNextUrl)};

    registerUtilityElements();
    registerAllComponents();
    const rawHtml = \`<!DOCTYPE html>
<html lang="en">
  <head><title>Next SSR</title></head>
  <body>
    <mth-skip-link href="#main">Skip to verification harness</mth-skip-link>
    <main id="main">
      <mth-visually-hidden>Screen reader verification landmark</mth-visually-hidden>
      <mth-error-boundary fallback-message="Next.js SSR harness boundary fallback">
        <section data-methane-canary-slot="true">
          <mth-field label="Canary Email Field" hint="Work or personal email" required>
            <mth-input name="canary-input" type="email" label="Canary Input" value="next-rsc@methane.dev"></mth-input>
          </mth-field>
          <mth-combobox name="canary-framework" label="Framework Target" value="lit" clearable>
            <mth-option-group label="Web Standards">
              <mth-option value="lit">Lit 3</mth-option>
              <mth-option value="wc">Custom Elements</mth-option>
            </mth-option-group>
          </mth-combobox>
          <mth-dialog label="Canary Dialog" description="Next.js top-layer modal verification" variant="confirm">Confirm</mth-dialog>
        </section>
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

function materializeDescendantDsd(root: Element): void {
  for (const tpl of Array.from(root.querySelectorAll('template[shadowrootmode]'))) {
    const host = tpl.parentElement;
    if (host && !host.shadowRoot) {
      const sr = host.attachShadow({ mode: 'open' });
      sr.appendChild((tpl as HTMLTemplateElement).content.cloneNode(true));
      tpl.remove();
    }
  }
}

function extractFirstElementSnippet(html: string, tagName: string): string {
  const match = new RegExp(`<${tagName}(?=[\\s>])`).exec(html);
  const start = match ? match.index : -1;
  const endTag = `</${tagName}>`;
  const end = start === -1 ? -1 : html.indexOf(endTag, start);
  if (start === -1 || end === -1) {
    throw new Error(`Could not find <${tagName}> in SSR HTML`);
  }
  return html.slice(start, end + endTag.length);
}

const ELEMENT_CLASSES = {
  'mth-skip-link': MthSkipLinkElement,
  'mth-visually-hidden': MthVisuallyHiddenElement,
  'mth-error-boundary': MthErrorBoundaryElement,
  'mth-field': MthField,
  'mth-input': MthInput,
  'mth-dialog': MthDialog,
  'mth-combobox': MthCombobox,
  'mth-option-group': MthOptionGroup,
  'mth-option': MthOption,
} as const;

describe('@methane-ui/verify-next hydration purity', () => {
  it('passes HydrationPuritySuite with 0 shadow-DOM node replacements on client upgrade', async () => {
    const html = renderNextSsrHtmlInNode();
    expect(html).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);

    for (const tagName of [
      'mth-skip-link',
      'mth-visually-hidden',
      'mth-error-boundary',
      'mth-field',
      'mth-input',
      'mth-dialog',
      'mth-combobox',
      'mth-option-group',
      'mth-option',
    ] as const) {
      const snippet = extractFirstElementSnippet(html, tagName);
      const ElementClass = ELEMENT_CLASSES[tagName];
      let upgradedHost: HTMLElement | null = null;
      const report = await HydrationPuritySuite.run({
        ssrHtml: snippet,
        upgradeElement: async (host) => {
          upgradedHost = host;
          materializeDescendantDsd(host);
          initNextHydration();
          expect(isNextHydrationReady()).toBe(true);
          if (!customElements.get(tagName)) {
            customElements.define(tagName, ElementClass);
          }
          customElements.upgrade(host);
          await (host as { updateComplete?: Promise<boolean> }).updateComplete;
        },
      });
      expect(report.passed, `${tagName}: ${JSON.stringify(report.checks)}`).toBe(true);
      expect(scanSameRootAria(upgradedHost!).issues, tagName).toEqual([]);
    }
  });
});
