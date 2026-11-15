// @vitest-environment jsdom
import '@methane/ssr-nuxt/client';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  MthErrorBoundaryElement,
  MthSkipLinkElement,
  MthVisuallyHiddenElement,
} from '@methane/primitives';
import { createMethaneNuxtPlugin, initNuxtHydration } from '@methane/ssr-nuxt/client';
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
const ssrNuxtUrl = pathToFileURL(resolve(appRoot, '../../packages/ssr-nuxt/dist/index.js')).href;
const vuePkgUrl = pathToFileURL(resolve(appRoot, '../../packages/vue/dist/index.js')).href;
const primitivesUrl = pathToFileURL(
  resolve(appRoot, '../../packages/primitives/dist/index.js'),
).href;
const uiUrl = pathToFileURL(resolve(appRoot, '../../packages/ui/dist/index.js')).href;

function renderNuxtSsrHtmlInNode(): string {
  const script = `
    import { createSSRApp, h } from 'vue';
    import { renderToString } from 'vue/server-renderer';
    import { registerUtilityElements } from ${JSON.stringify(primitivesUrl)};
    import { registerAllComponents } from ${JSON.stringify(uiUrl)};
    import { createMethaneNitroPlugin } from ${JSON.stringify(ssrNuxtUrl)};
    import {
      MthButton,
      MthCombobox,
      MthDialog,
      MthField,
      MthInput,
      MthOption,
      MthOptionGroup,
    } from ${JSON.stringify(vuePkgUrl)};

    registerUtilityElements();
    registerAllComponents();
    const app = createSSRApp({
      render: () =>
        h('div', [
          h('mth-skip-link', { href: '#main' }, 'Skip to Nuxt verification harness'),
          h('main', { id: 'main' }, [
            h('mth-visually-hidden', null, 'Nuxt landmark'),
            h('mth-error-boundary', { 'fallback-message': 'Nuxt fallback' }, [
              h(
                MthField,
                { label: 'Canary Email Field', hint: 'Work or personal email', required: true },
                {
                  default: () =>
                    h(MthInput, {
                      modelValue: 'nuxt-ssr@methane.dev',
                      name: 'canary-input',
                      type: 'email',
                      label: 'Canary Input',
                    }),
                },
              ),
              h(
                MthCombobox,
                {
                  modelValue: 'lit',
                  name: 'canary-framework',
                  label: 'Framework Target',
                  clearable: true,
                },
                {
                  default: () =>
                    h(
                      MthOptionGroup,
                      { label: 'Web Standards' },
                      {
                        default: () => [
                          h(MthOption, { value: 'lit' }, { default: () => 'Lit 3' }),
                          h(MthOption, { value: 'wc' }, { default: () => 'Custom Elements' }),
                        ],
                      },
                    ),
                },
              ),
              h(
                MthDialog,
                {
                  open: false,
                  label: 'Canary Dialog',
                  description: 'Nuxt top-layer modal verification',
                  variant: 'confirm',
                },
                { default: () => 'Confirm Nuxt verification' },
              ),
              h(MthButton, { variant: 'solid' }, { default: () => 'Verify' }),
            ]),
          ]),
        ]),
    });

    const bodyHtml = await renderToString(app);
    const htmlContext = {
      head: ['<meta charset="utf-8">'],
      body: [bodyHtml],
      bodyPrepend: [],
      bodyAppend: [],
      htmlAttrs: ['lang="en"'],
      bodyAttrs: [],
    };
    let hook;
    const nitroApp = {
      hooks: {
        hook(name, fn) {
          if (name === 'render:html') hook = fn;
        },
      },
    };
    createMethaneNitroPlugin({ assetBase: '/methane/styles' })(nitroApp);
    await hook(htmlContext);
    process.stdout.write(htmlContext.body.join(''));
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
    throw new Error(`Could not find <${tagName}> in Nuxt SSR HTML`);
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

describe('@methane/verify-nuxt hydration purity', () => {
  it('passes HydrationPuritySuite with 0 shadow-DOM node replacements on client upgrade', async () => {
    const html = renderNuxtSsrHtmlInNode();
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
          initNuxtHydration();
          expect(createMethaneNuxtPlugin().setup().hydrationReady).toBe(true);
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
