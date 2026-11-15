import { registerUtilityElements } from '@methane/primitives';
import {
  createMethaneNitroPlugin,
  type NitroAppLike,
  type NitroRenderHtmlContext,
  type NuxtSsrOptions,
} from '@methane/ssr-nuxt';
import { registerAllComponents } from '@methane/ui';
import {
  MthButton,
  MthCombobox,
  MthDialog,
  MthField,
  MthInput,
  MthOption,
  MthOptionGroup,
} from '@methane/vue';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';

export interface VerifyNuxtRenderOutput {
  readonly htmlContext: NitroRenderHtmlContext;
  readonly fullHtml: string;
}

export async function renderVerifyNuxtSsr(
  options: NuxtSsrOptions = {},
): Promise<VerifyNuxtRenderOutput> {
  registerUtilityElements();
  registerAllComponents();

  const app = createSSRApp({
    render: () =>
      h('div', [
        h('mth-skip-link', { href: '#main' }, 'Skip to Nuxt verification harness'),
        h('main', { id: 'main', class: 'mth-container' }, [
          h('mth-visually-hidden', null, 'Nuxt screen reader landmark'),
          h('mth-error-boundary', { 'fallback-message': 'Nuxt boundary fallback' }, [
            h('section', { 'data-methane-canary-slot': 'true' }, [
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
              h(MthButton, { variant: 'solid' }, { default: () => 'Verify Nuxt' }),
            ]),
          ]),
        ]),
      ]),
  });

  const bodyHtml = await renderToString(app);
  const htmlContext: NitroRenderHtmlContext = {
    head: ['<meta charset="utf-8">', '<title>Methane Nuxt Verification</title>'],
    body: [bodyHtml],
    bodyPrepend: [],
    bodyAppend: [],
    htmlAttrs: ['lang="en"'],
    bodyAttrs: [],
  };

  let registeredHook: ((html: NitroRenderHtmlContext) => Promise<void> | void) | undefined;
  const mockNitroApp: NitroAppLike = {
    hooks: {
      hook(name, handler) {
        if (name === 'render:html') {
          registeredHook = handler;
        }
      },
    },
  };

  const plugin = createMethaneNitroPlugin({
    assetBase: '/methane/styles',
    hydrationModuleUrl: '/_nuxt/methane-hydrate.js',
    ...options,
  });
  plugin(mockNitroApp);
  if (registeredHook) {
    await registeredHook(htmlContext);
  }

  const fullHtml = `<!DOCTYPE html><html ${htmlContext.htmlAttrs.join(' ')}><head>${htmlContext.head.join('')}</head><body>${htmlContext.bodyPrepend.join('')}${htmlContext.body.join('')}${htmlContext.bodyAppend.join('')}</body></html>`;

  return { htmlContext, fullHtml };
}
