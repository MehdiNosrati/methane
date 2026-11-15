import { registerUtilityElements } from '@methane/primitives';
import {
  createMethaneNitroPlugin,
  type NitroAppLike,
  type NitroRenderHtmlContext,
  type NuxtSsrOptions,
} from '@methane/ssr-nuxt';
import { MthButton, MthInput } from '@methane/vue';
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

  const app = createSSRApp({
    render: () =>
      h('div', [
        h('mth-skip-link', { href: '#main' }, 'Skip to Nuxt verification harness'),
        h('main', { id: 'main', class: 'mth-container' }, [
          h('mth-visually-hidden', null, 'Nuxt screen reader landmark'),
          h('mth-error-boundary', { 'fallback-message': 'Nuxt boundary fallback' }, [
            h('section', { 'data-methane-canary-slot': 'true' }, [
              h(MthInput, { modelValue: 'nuxt-ssr', name: 'canary-input', label: 'Canary Input' }),
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
