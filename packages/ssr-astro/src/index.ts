import {
  renderWithMetadata,
  transformHtmlDsd,
  type StylesheetLink,
  type TransformHtmlDsdOptions,
} from '@methane-ui/ssr';
import { html as litHtml } from 'lit';

export interface AstroSsrOptions extends TransformHtmlDsdOptions {
  /** Whether to inject `@methane-ui/ssr-astro/client` on Astro pages. Defaults to `true`. */
  readonly injectClientHydration?: boolean;
}

export interface AstroIntegrationSetupContext {
  addRenderer(renderer: {
    name: string;
    clientEntrypoint?: string;
    serverEntrypoint: string;
  }): void;
  injectScript?(stage: 'head-inline' | 'before-hydration' | 'page' | 'page-ssr', content: string): void;
}

export interface AstroIntegration {
  readonly name: string;
  readonly hooks: {
    readonly 'astro:config:setup': (context: AstroIntegrationSetupContext) => void;
  };
}

export interface AstroRendererComponent {
  readonly tagName?: string;
  readonly renderTemplate?: (props: Record<string, unknown>, slotted?: Record<string, string>) => unknown;
}

export interface AstroStaticMarkupResult {
  readonly html: string;
  readonly attrs?: Record<string, string>;
  readonly links: ReadonlyArray<StylesheetLink>;
}

/**
 * Checks whether an Astro component candidate is a Lit/Methane custom element class
 * or descriptor with a `tagName` / `elementStyles`.
 */
export function isMethaneAstroComponent(component: unknown): boolean {
  if (component == null) return false;
  if (typeof component === 'function') {
    const ctor = component as { _$litElement$?: unknown; elementStyles?: unknown };
    return Boolean(ctor._$litElement$ || ctor.elementStyles);
  }
  if (typeof component === 'object') {
    const desc = component as AstroRendererComponent;
    return typeof desc.tagName === 'string' && desc.tagName.includes('-');
  }
  return false;
}

/**
 * Renders a Lit / Methane component descriptor via `@methane-ui/ssr` for Astro SSR islands.
 */
export async function renderAstroStaticMarkup(
  component: AstroRendererComponent | (new () => HTMLElement),
  props: Record<string, unknown> = {},
  slotted: Record<string, string> = {},
  options: AstroSsrOptions = {},
): Promise<AstroStaticMarkupResult> {
  if (typeof component === 'object' && component.renderTemplate) {
    const rendered = await renderWithMetadata(
      component.renderTemplate(props, slotted),
      options,
    );
    return { html: rendered.html, links: rendered.links };
  }

  const tagName =
    typeof component === 'object'
      ? component.tagName
      : (component as { tagName?: string; is?: string }).tagName ??
        (component as { is?: string }).is;

  if (!tagName) {
    return { html: '', links: [] };
  }

  const attrEntries = Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== false && v !== null)
    .map(([k, v]) => (v === true ? k : `${k}="${String(v).replaceAll('"', '&quot;')}"`));

  const attrString = attrEntries.length > 0 ? ` ${attrEntries.join(' ')}` : '';
  const defaultSlot = slotted['default'] ?? '';
  const rawMarkup = `<${tagName}${attrString}>${defaultSlot}</${tagName}>`;
  const expanded = await transformHtmlDsd(rawMarkup, {
    ...options,
    tagPrefix: '',
    hoistLinks: false,
  });

  return {
    html: expanded.html,
    links: expanded.links,
  };
}

export function createMethaneAstroRenderer(options: AstroSsrOptions = {}) {
  return {
    name: '@methane-ui/ssr-astro',
    clientEntrypoint: '@methane-ui/ssr-astro/client',
    serverEntrypoint: '@methane-ui/ssr-astro',
    check: isMethaneAstroComponent,
    renderToStaticMarkup: (
      component: AstroRendererComponent | (new () => HTMLElement),
      props: Record<string, unknown> = {},
      slotted: Record<string, string> = {},
    ) => renderAstroStaticMarkup(component, props, slotted, options),
    renderLitTemplate: (template: ReturnType<typeof litHtml>) => renderWithMetadata(template, options),
  };
}

/**
 * Astro integration registering `@methane-ui/ssr-astro` renderer and client hydration script.
 */
export function createMethaneAstroIntegration(options: AstroSsrOptions = {}): AstroIntegration {
  return {
    name: '@methane-ui/ssr-astro',
    hooks: {
      'astro:config:setup': ({ addRenderer, injectScript }) => {
        addRenderer({
          name: '@methane-ui/ssr-astro',
          clientEntrypoint: '@methane-ui/ssr-astro/client',
          serverEntrypoint: '@methane-ui/ssr-astro',
        });
        if (options.injectClientHydration ?? true) {
          injectScript?.('page', "import '@methane-ui/ssr-astro/client';");
        }
      },
    },
  };
}

/**
 * Astro SSR middleware expanding `<mth-*>` DSD templates and hoisting stylesheet `<link>`
 * preloads into `<head>`.
 */
export function createMethaneAstroMiddleware(options: AstroSsrOptions = {}) {
  return async (
    _context: unknown,
    next: () => Promise<Response>,
  ): Promise<Response> => {
    const response = await next();
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    const rawHtml = await response.text();
    const transformed = await transformHtmlDsd(rawHtml, options);
    const headers = new Headers(response.headers);
    headers.delete('content-length');

    return new Response(transformed.html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
