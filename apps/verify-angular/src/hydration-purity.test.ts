// @vitest-environment jsdom
import '@methane-ui/ssr-angular/client';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  MthErrorBoundaryElement,
  MthSkipLinkElement,
  MthVisuallyHiddenElement,
} from '@methane-ui/primitives';
import {
  initAngularHydration,
  isAngularHydrationReady,
  upgradeMethaneAngularElements,
} from '@methane-ui/ssr-angular/client';
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

describe('@methane-ui/verify-angular hydration purity', () => {
  it('passes HydrationPuritySuite with 0 shadow-DOM node replacements on Angular client upgrade', async () => {
    const fullHtml = renderAngularSsrHtmlInNode();
    expect(fullHtml).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(fullHtml).toContain('angular-ssr@methane.dev|lit|true|true');

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
      const snippet = extractFirstElementSnippet(fullHtml, tagName);
      const ElementClass = ELEMENT_CLASSES[tagName];
      let upgradedHost: HTMLElement | null = null;
      const report = await HydrationPuritySuite.run({
        ssrHtml: snippet,
        upgradeElement: async (host) => {
          upgradedHost = host;
          materializeDescendantDsd(host);
          initAngularHydration();
          expect(isAngularHydrationReady()).toBe(true);
          if (!customElements.get(tagName)) {
            customElements.define(tagName, ElementClass);
          }
          upgradeMethaneAngularElements(host.parentNode ?? document);
          await (host as { updateComplete?: Promise<boolean> }).updateComplete;
        },
      });
      expect(report.passed, `${tagName}: ${JSON.stringify(report.checks)}`).toBe(true);
      expect(scanSameRootAria(upgradedHost!).issues, tagName).toEqual([]);
    }
  }, 20_000);
});
