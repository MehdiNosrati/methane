import {
  escapeHtmlAttribute,
  transformHtmlDsd,
  type StylesheetLink,
  type TransformHtmlDsdOptions,
  type TransformHtmlDsdResult,
} from '@methane/ssr';

export interface NextSsrOptions extends TransformHtmlDsdOptions {
  /** Optional client hydration script URL injected before `</body>`. */
  readonly hydrationModuleUrl?: string;
  /** Whether to emit HTTP `Link` preload headers on `Response` wrappers. Defaults to `true`. */
  readonly emitLinkHeader?: boolean;
}

export interface NextSsrResult extends TransformHtmlDsdResult {
  readonly linkHeader: string;
}

export interface NextConfigLike {
  transpilePackages?: string[];
  serverExternalPackages?: string[];
  [key: string]: unknown;
}

export function formatPreloadLinkHeader(links: ReadonlyArray<StylesheetLink>): string {
  return links.map((link) => `<${link.href}>; rel=preload; as=style`).join(', ');
}

function injectHydrationModule(html: string, moduleUrl: string): string {
  const tag = `<script type="module" src="${escapeHtmlAttribute(moduleUrl)}"></script>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${tag}</body>`);
  }
  return `${html}${tag}`;
}

/**
 * Expands `<mth-*>` Declarative Shadow DOM templates inside Next.js App Router / RSC HTML
 * and hoists deduplicated `<link rel="preload" as="style">` tags into `<head>`.
 */
export async function renderNextHtml(
  html: string,
  options: NextSsrOptions = {},
): Promise<NextSsrResult> {
  const result = await transformHtmlDsd(html, options);
  const transformedHtml = options.hydrationModuleUrl
    ? injectHydrationModule(result.html, options.hydrationModuleUrl)
    : result.html;

  return {
    html: transformedHtml,
    expandedTags: result.expandedTags,
    links: result.links,
    linkHeader: formatPreloadLinkHeader(result.links),
  };
}

/**
 * Creates a WinterCG `TransformStream<Uint8Array, Uint8Array>` suitable for Next.js
 * Route Handlers, Middleware, or custom App Router SSR streaming pipelines.
 */
export function createNextSsrTransformStream(
  options: NextSsrOptions = {},
): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffered = '';

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk) {
      buffered += decoder.decode(chunk, { stream: true });
    },
    async flush(controller) {
      buffered += decoder.decode();
      const result = await renderNextHtml(buffered, options);
      controller.enqueue(encoder.encode(result.html));
    },
  });
}

/**
 * Transforms a Next.js / Fetch `Response` HTML stream with DSD expansion, `<head>` link
 * hoisting, and optional `Link: <...>; rel=preload; as=style` HTTP header emission.
 */
export async function transformNextResponse(
  response: Response,
  options: NextSsrOptions = {},
): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType && !contentType.includes('text/html')) {
    return response;
  }

  const rawHtml = await response.text();
  const rendered = await renderNextHtml(rawHtml, options);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  if (!headers.has('content-type')) {
    headers.set('content-type', 'text/html; charset=utf-8');
  }
  if ((options.emitLinkHeader ?? true) && rendered.linkHeader) {
    const existing = headers.get('link');
    headers.set('link', existing ? `${existing}, ${rendered.linkHeader}` : rendered.linkHeader);
  }

  return new Response(rendered.html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const METHANE_TRANSPILE_PACKAGES = ['@methane/ui', '@methane/core', '@methane/primitives'] as const;
const METHANE_SERVER_EXTERNALS = ['@lit-labs/ssr', '@methane/ssr'] as const;

/**
 * Merges Methane SSR and React 19 custom-element settings into `next.config.*`.
 */
export function withMethaneNextConfig<T extends NextConfigLike>(config: T = {} as T): T {
  const existingTranspile = Array.isArray(config.transpilePackages) ? config.transpilePackages : [];
  const existingExternals = Array.isArray(config.serverExternalPackages)
    ? config.serverExternalPackages
    : [];

  return {
    ...config,
    transpilePackages: Array.from(new Set([...existingTranspile, ...METHANE_TRANSPILE_PACKAGES])),
    serverExternalPackages: Array.from(
      new Set([...existingExternals, ...METHANE_SERVER_EXTERNALS]),
    ),
  };
}
