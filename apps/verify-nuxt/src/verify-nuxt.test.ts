import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createMethaneNuxtConfig } from '@methane-ui/ssr-nuxt';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const ssrNuxtUrl = pathToFileURL(resolve(appRoot, '../../packages/ssr-nuxt/dist/index.js')).href;
const vuePkgUrl = pathToFileURL(resolve(appRoot, '../../packages/vue/dist/index.js')).href;
const primitivesUrl = pathToFileURL(
  resolve(appRoot, '../../packages/primitives/dist/index.js'),
).href;
const uiUrl = pathToFileURL(resolve(appRoot, '../../packages/ui/dist/index.js')).href;

function runNuxtSsrInNode(): {
  fullHtml: string;
  headTags: string[];
  bodyAppend: string[];
} {
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
    createMethaneNitroPlugin({
      assetBase: '/methane/styles',
      hydrationModuleUrl: '/_nuxt/methane-hydrate.js',
    })(nitroApp);
    await hook(htmlContext);

    const fullHtml = '<!DOCTYPE html><html><head>' + htmlContext.head.join('') + '</head><body>' + htmlContext.body.join('') + htmlContext.bodyAppend.join('') + '</body></html>';
    process.stdout.write(JSON.stringify({
      fullHtml,
      headTags: htmlContext.head,
      bodyAppend: htmlContext.bodyAppend,
    }));
  `;

  const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: appRoot,
    encoding: 'utf8',
  });
  return JSON.parse(out) as {
    fullHtml: string;
    headTags: string[];
    bodyAppend: string[];
  };
}

describe('@methane-ui/verify-nuxt', () => {
  it('provides Nuxt compilerOptions.isCustomElement and Nitro externals config', () => {
    const cfg = createMethaneNuxtConfig();
    expect(cfg.vue.compilerOptions.isCustomElement('mth-input')).toBe(true);
    expect(cfg.vue.compilerOptions.isCustomElement('div')).toBe(false);
    expect(cfg.nitro.externals?.inline).toEqual(['@methane-ui/ssr', '@methane-ui/ssr-nuxt']);
  });

  it('renders Vue SSR custom elements with Nitro DSD expansion and <head> link hoisting', () => {
    const result = runNuxtSsrInNode();
    expect(result.fullHtml).toContain('<mth-field');
    expect(result.fullHtml).toContain('<mth-input');
    expect(result.fullHtml).toContain('value="nuxt-ssr@methane.dev"');
    expect(result.fullHtml).toContain('<mth-dialog');
    expect(result.fullHtml).toContain('<mth-combobox');
    expect(result.fullHtml).toContain('<mth-option-group');
    expect(result.fullHtml).toContain('<mth-option');
    expect(result.fullHtml).toContain('<mth-button');
    expect(result.fullHtml).toMatch(/<template\b[^>]*\bshadowrootmode="open"/);
    expect(result.headTags.some((h) => h.includes('rel="preload" as="style"'))).toBe(true);
    expect(result.bodyAppend.some((s) => s.includes('/_nuxt/methane-hydrate.js'))).toBe(true);
  });
});
