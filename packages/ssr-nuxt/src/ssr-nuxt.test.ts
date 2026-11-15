import { describe, expect, it } from 'vitest';
import '@methane-ui/ssr/dom-shim';
import { LitElement, css, html } from 'lit';
import {
  METHANE_VUE_COMPILER_OPTIONS,
  createMethaneNitroPlugin,
  createMethaneNuxtConfig,
  type NitroRenderHtmlContext,
} from './index.js';

class MthNuxtAlert extends LitElement {
  static override properties = {
    tone: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      padding-inline: 1rem;
      padding-block: 0.75rem;
    }
  `;

  declare tone: string;

  constructor() {
    super();
    this.tone = 'info';
  }

  override render() {
    return html`<div role="status" part="base" data-tone=${this.tone}><slot></slot></div>`;
  }
}

if (!customElements.get('mth-nuxt-alert')) {
  customElements.define('mth-nuxt-alert', MthNuxtAlert);
}

describe('@methane-ui/ssr-nuxt', () => {
  it('configures Vue compiler isCustomElement for mth-* tags', () => {
    expect(METHANE_VUE_COMPILER_OPTIONS.isCustomElement('mth-button')).toBe(true);
    expect(METHANE_VUE_COMPILER_OPTIONS.isCustomElement('div')).toBe(false);

    const cfg = createMethaneNuxtConfig();
    expect(cfg.vue.compilerOptions.isCustomElement('mth-dialog')).toBe(true);
    expect(cfg.nitro.externals?.inline).toContain('@methane-ui/ssr');
  });

  it('expands DSD inside Nitro render:html hook and hoists preload links into head', async () => {
    let registeredHook: ((html: NitroRenderHtmlContext) => Promise<void> | void) | undefined;
    const plugin = createMethaneNitroPlugin({
      hydrationModuleUrl: '/_nuxt/methane-hydrate.js',
    });

    plugin({
      hooks: {
        hook(name, handler) {
          if (name === 'render:html') {
            registeredHook = handler;
          }
        },
      },
    });

    expect(registeredHook).toBeDefined();

    const ctx: NitroRenderHtmlContext = {
      head: ['<meta charset="utf-8">'],
      body: ['<div id="__nuxt"><mth-nuxt-alert tone="warn">Watch out</mth-nuxt-alert></div>'],
      bodyPrepend: [],
      bodyAppend: [],
      htmlAttrs: [],
      bodyAttrs: [],
    };

    await registeredHook!(ctx);

    expect(ctx.body[0]).toContain('<template shadowroot="open" shadowrootmode="open">');
    expect(ctx.body[0]).toContain('>Watch out</mth-nuxt-alert>');
    expect(ctx.head.some((h) => h.includes('rel="preload" as="style"') && h.includes('mth-nuxt-alert'))).toBe(true);
    expect(ctx.bodyAppend[0]).toContain('/_nuxt/methane-hydrate.js');
  });
});
