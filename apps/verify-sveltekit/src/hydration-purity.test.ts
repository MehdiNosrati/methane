// @vitest-environment jsdom
import '@methane/ssr-sveltekit/client';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  MthErrorBoundaryElement,
  MthSkipLinkElement,
  MthVisuallyHiddenElement,
} from '@methane/primitives';
import { initSvelteKitHydration, isSvelteKitHydrationReady } from '@methane/ssr-sveltekit/client';
import { HydrationPuritySuite, scanSameRootAria } from '@methane/test-conformance';
import { MthCombobox } from '@methane/ui/combobox/element';
import { MthDialog } from '@methane/ui/dialog/element';
import { MthField } from '@methane/ui/field/element';
import { MthInput } from '@methane/ui/input/element';
import { MthOption } from '@methane/ui/option/element';
import { MthOptionGroup } from '@methane/ui/option-group/element';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const rootRequire = createRequire(resolve(appRoot, '../../package.json'));
const vitestRequire = createRequire(rootRequire.resolve('vitest'));
const viteModuleUrl = pathToFileURL(vitestRequire.resolve('vite')).href;
const sveltePluginUrl = pathToFileURL(
  createRequire(resolve(appRoot, 'package.json')).resolve('@sveltejs/vite-plugin-svelte'),
).href;

function renderSvelteKitSsrHtmlInNode(): string {
  const script = `
    const { createServer } = await import(${JSON.stringify(viteModuleUrl)});
    const { svelte } = await import(${JSON.stringify(sveltePluginUrl)});
    const vite = await createServer({
      root: ${JSON.stringify(appRoot)},
      appType: 'custom',
      logLevel: 'silent',
      configFile: false,
      plugins: [svelte()],
      server: { middlewareMode: true, hmr: false },
    });
    try {
      const mod = await vite.ssrLoadModule('/src/lib/ssr-harness.ts');
      const result = await mod.renderVerifySvelteKitSsr();
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

function materializeDescendantDsd(root: Element): void {
  const templates = Array.from(root.querySelectorAll('template[shadowrootmode]'));
  for (const template of templates) {
    const host = template.parentElement;
    if (!host || host === root || host.shadowRoot) continue;
    const mode = template.getAttribute('shadowrootmode') === 'closed' ? 'closed' : 'open';
    const shadow = host.attachShadow({ mode });
    shadow.appendChild((template as HTMLTemplateElement).content.cloneNode(true));
    template.remove();
  }
}

describe('@methane/verify-sveltekit hydration purity', () => {
  it('passes HydrationPuritySuite with 0 shadow-DOM node replacements on SvelteKit client upgrade', async () => {
    const fullHtml = renderSvelteKitSsrHtmlInNode();
    expect(fullHtml).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(fullHtml).toContain('sveltekit-ssr@methane.dev|lit|true|false');

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
      const report = await HydrationPuritySuite.run({
        ssrHtml: snippet,
        upgradeElement: async (host) => {
          materializeDescendantDsd(host);
          initSvelteKitHydration();
          expect(isSvelteKitHydrationReady()).toBe(true);
          if (!customElements.get(tagName)) {
            customElements.define(tagName, ElementClass);
          }
          customElements.upgrade(host);
          await (host as { updateComplete?: Promise<boolean> }).updateComplete;
          expect(scanSameRootAria(host).issues).toEqual([]);
        },
      });
      expect(report.passed, `${tagName}: ${JSON.stringify(report.checks)}`).toBe(true);
    }
  }, 20_000);
});
