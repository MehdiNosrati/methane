import {
  escapeHtmlAttribute,
  transformHtmlDsd,
  type TransformHtmlDsdOptions,
  type TransformHtmlDsdResult,
} from '@methane/ssr';

export interface SvelteKitSsrOptions extends TransformHtmlDsdOptions {
  /** Optional client hydration module URL injected before `</body>`. */
  readonly hydrationModuleUrl?: string;
}

export interface SvelteKitResolveOptions {
  transformPageChunk?: (input: { html: string; done: boolean }) => string | Promise<string>;
}

export interface SvelteKitHandleInput<TEvent = unknown> {
  event: TEvent;
  resolve: (event: TEvent, opts?: SvelteKitResolveOptions) => Promise<Response> | Response;
}

export type SvelteKitHandle<TEvent = unknown> = (
  input: SvelteKitHandleInput<TEvent>,
) => Promise<Response>;

function injectHydrationScript(html: string, moduleUrl: string): string {
  const tag = `<script type="module" src="${escapeHtmlAttribute(moduleUrl)}"></script>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${tag}</body>`);
  }
  return `${html}${tag}`;
}

export async function transformSvelteKitHtml(
  html: string,
  options: SvelteKitSsrOptions = {},
): Promise<TransformHtmlDsdResult> {
  const result = await transformHtmlDsd(html, options);
  const finalHtml = options.hydrationModuleUrl
    ? injectHydrationScript(result.html, options.hydrationModuleUrl)
    : result.html;

  return {
    html: finalHtml,
    expandedTags: result.expandedTags,
    links: result.links,
  };
}

/**
 * Creates a SvelteKit `handle` hook for `src/hooks.server.ts` that buffers streamed
 * page chunks, expands `<mth-*>` Declarative Shadow DOM templates, and hoists
 * deduplicated stylesheet `<link>` preloads into `<head>`.
 */
export function createMethaneHandle<TEvent = unknown>(
  options: SvelteKitSsrOptions = {},
): SvelteKitHandle<TEvent> {
  return async ({ event, resolve }) => {
    let buffered = '';
    return await resolve(event, {
      async transformPageChunk({ html, done }) {
        buffered += html;
        if (!done) {
          return '';
        }
        const transformed = await transformSvelteKitHtml(buffered, options);
        buffered = '';
        return transformed.html;
      },
    });
  };
}
