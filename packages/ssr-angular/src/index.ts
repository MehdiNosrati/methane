import {
  escapeHtmlAttribute,
  transformHtmlDsd,
  type TransformHtmlDsdOptions,
  type TransformHtmlDsdResult,
} from '@methane-ui/ssr';

export interface AngularSsrOptions extends TransformHtmlDsdOptions {
  /** Optional client hydration script URL injected before `</body>`. */
  readonly hydrationModuleUrl?: string;
}

export interface AngularSsrResult extends TransformHtmlDsdResult {
  readonly preservedAngularMarkers: boolean;
}

function injectHydrationModule(html: string, moduleUrl: string): string {
  const tag = `<script type="module" src="${escapeHtmlAttribute(moduleUrl)}"></script>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${tag}</body>`);
  }
  return `${html}${tag}`;
}

/**
 * Post-processes Angular SSR (`CommonEngine` / `renderApplication`) HTML output to expand
 * `<mth-*>` elements into Declarative Shadow DOM and hoist stylesheet `<link>` preloads into
 * `<head>`, while preserving Angular hydration markers (`ngh`, `ng-version`, `ng-server-context`).
 */
export async function serializeAngularSsrHtml(
  html: string,
  options: AngularSsrOptions = {},
): Promise<AngularSsrResult> {
  const transformed = await transformHtmlDsd(html, options);
  const finalHtml = options.hydrationModuleUrl
    ? injectHydrationModule(transformed.html, options.hydrationModuleUrl)
    : transformed.html;

  const preservedAngularMarkers =
    /\b(?:ng-version|ngh|ng-server-context)\b/.test(finalHtml);

  return {
    html: finalHtml,
    expandedTags: transformed.expandedTags,
    links: transformed.links,
    preservedAngularMarkers,
  };
}

/**
 * Creates a WinterCG `TransformStream<Uint8Array, Uint8Array>` for Angular SSR streaming servers.
 */
export function createAngularSsrTransformStream(
  options: AngularSsrOptions = {},
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
      const result = await serializeAngularSsrHtml(buffered, options);
      controller.enqueue(encoder.encode(result.html));
    },
  });
}

/**
 * Transforms an Angular SSR `Response` into a DSD-expanded response with `<head>` preload links.
 */
export async function transformAngularSsrResponse(
  response: Response,
  options: AngularSsrOptions = {},
): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType && !contentType.includes('text/html')) {
    return response;
  }

  const rawHtml = await response.text();
  const serialized = await serializeAngularSsrHtml(rawHtml, options);
  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(serialized.html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
