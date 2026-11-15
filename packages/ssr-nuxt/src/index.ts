import {
  escapeHtmlAttribute,
  transformHtmlDsd,
  type TransformHtmlDsdOptions,
  type TransformHtmlDsdResult,
} from '@methane-ui/ssr';

export interface NuxtSsrOptions extends TransformHtmlDsdOptions {
  /** Optional client hydration module URL appended to `html.bodyAppend`. */
  readonly hydrationModuleUrl?: string;
}

export interface NitroRenderHtmlContext {
  head: string[];
  body: string[];
  bodyPrepend: string[];
  bodyAppend: string[];
  htmlAttrs: string[];
  bodyAttrs: string[];
}

export interface NitroAppLike {
  hooks: {
    hook(name: 'render:html', handler: (html: NitroRenderHtmlContext) => Promise<void> | void): void;
  };
}

export interface NuxtMethaneConfig {
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => boolean;
    };
  };
  nitro: {
    externals?: { inline?: string[] };
  };
}

export function isMethaneCustomElement(tag: string): boolean {
  return tag.startsWith('mth-');
}

export const METHANE_VUE_COMPILER_OPTIONS = {
  isCustomElement: isMethaneCustomElement,
} as const;

export function createMethaneNuxtConfig(): NuxtMethaneConfig {
  return {
    vue: {
      compilerOptions: {
        isCustomElement: isMethaneCustomElement,
      },
    },
    nitro: {
      externals: {
        inline: ['@methane-ui/ssr', '@methane-ui/ssr-nuxt'],
      },
    },
  };
}

/**
 * Expands `<mth-*>` custom elements across Nitro's `html.body` sections and hoists
 * deduplicated `<link rel="preload" as="style">` tags into `html.head`.
 */
export async function transformNitroHtml(
  htmlContext: NitroRenderHtmlContext,
  options: NuxtSsrOptions = {},
): Promise<TransformHtmlDsdResult> {
  const seenHrefs = new Set<string>();
  const allLinks = [];
  const expandedTags = new Set<string>();

  for (let i = 0; i < htmlContext.body.length; i += 1) {
    const chunk = htmlContext.body[i];
    if (!chunk) continue;
    const transformed = await transformHtmlDsd(chunk, {
      ...options,
      hoistLinks: false,
    });
    htmlContext.body[i] = transformed.html;
    for (const tag of transformed.expandedTags) {
      expandedTags.add(tag);
    }
    for (const link of transformed.links) {
      if (!seenHrefs.has(link.href)) {
        seenHrefs.add(link.href);
        allLinks.push(link);
      }
    }
  }

  const headMode = options.hoistOptions?.headMode ?? 'preload';
  const nonceAttr = options.hoistOptions?.nonce
    ? ` nonce="${escapeHtmlAttribute(options.hoistOptions.nonce)}"`
    : '';
  const headBlob = htmlContext.head.join('');

  for (const link of allLinks) {
    const safeHref = escapeHtmlAttribute(link.href);
    if (headBlob.includes(safeHref)) continue;
    const tag =
      headMode === 'stylesheet'
        ? `<link rel="stylesheet" href="${safeHref}"${nonceAttr}>`
        : `<link rel="preload" as="style" href="${safeHref}"${nonceAttr}>`;
    htmlContext.head.push(tag);
  }

  if (options.hydrationModuleUrl) {
    htmlContext.bodyAppend.push(
      `<script type="module" src="${escapeHtmlAttribute(options.hydrationModuleUrl)}"></script>`,
    );
  }

  return {
    html: htmlContext.body.join(''),
    expandedTags: [...expandedTags],
    links: allLinks,
  };
}

/**
 * Creates a Nitro server plugin registering the `render:html` DSD expansion and link-hoisting hook.
 */
export function createMethaneNitroPlugin(options: NuxtSsrOptions = {}) {
  return (nitroApp: NitroAppLike): void => {
    nitroApp.hooks.hook('render:html', async (html) => {
      await transformNitroHtml(html, options);
    });
  };
}
