import './dom-shim.js';
import {
  LitElementRenderer,
  renderThunked,
  type RenderInfo,
} from '@lit-labs/ssr';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import {
  computeCssHash,
  escapeHtmlAttribute,
  formatStylesheetHref,
  getElementCssText,
  hoistStylesheetLinks,
  resolveCriticalCss,
  utf8ByteLength,
} from './styles.js';
import type {
  CreateSsrTransformOptions,
  MethaneRenderContext,
  MethaneRenderInfo,
  MethaneSsrOptions,
  ResolvedMethaneSsrOptions,
  SsrRenderResult,
  StylesheetLink,
} from './types.js';

function resolveOptions(options: MethaneSsrOptions = {}): ResolvedMethaneSsrOptions {
  return {
    styles: options.styles ?? 'linked',
    assetBase: options.assetBase ?? '/_methane/styles',
    criticalCss: options.criticalCss,
    hashLength: options.hashLength ?? 8,
    deferHydration: options.deferHydration ?? false,
    onStylesheetLink: options.onStylesheetLink,
  };
}

function createRenderContext(options: ResolvedMethaneSsrOptions): MethaneRenderContext {
  return {
    options,
    linksByHref: new Map(),
    criticalBytesByTag: {},
  };
}

/**
 * Custom `LitElementRenderer` implementing ADR-008 hybrid DSD style delivery:
 * - `'linked'` (default): emits `<link rel="stylesheet" href="${assetBase}/${tag}.${hash}.css">`
 *   plus a `< 1 KB` critical layout `<style>` shell inside `<template shadowrootmode="open">`.
 * - `'inline'`: preserves full `<style>` content inside `<template shadowrootmode="open">`.
 */
export class MethaneElementRenderer extends LitElementRenderer {
  static defaultOptions: ResolvedMethaneSsrOptions = resolveOptions();

  override renderShadow(renderInfo: RenderInfo): ThunkedRenderResult | undefined {
    const superResult = super.renderShadow(renderInfo);
    if (superResult === undefined) {
      return undefined;
    }

    const methaneInfo = renderInfo as MethaneRenderInfo;
    const ctx = methaneInfo.methaneSsr;
    const opts = ctx?.options ?? MethaneElementRenderer.defaultOptions;

    if (opts.styles === 'inline') {
      return superResult;
    }

    const templateThunk = superResult[superResult.length - 1];
    const fullCss = getElementCssText(this.element.constructor);
    const result: ThunkedRenderResult = [];

    if (fullCss.length > 0) {
      const hash = computeCssHash(fullCss, opts.hashLength);
      const href = formatStylesheetHref(opts.assetBase, this.tagName, hash);
      const criticalCss = resolveCriticalCss(
        this.element.constructor,
        this.tagName,
        fullCss,
        opts.criticalCss,
      );

      if (ctx) {
        ctx.criticalBytesByTag[this.tagName] = utf8ByteLength(criticalCss);
        if (!ctx.linksByHref.has(href)) {
          const link: StylesheetLink = {
            tagName: this.tagName,
            href,
            hash,
            css: fullCss,
            criticalCss,
          };
          ctx.linksByHref.set(href, link);
          opts.onStylesheetLink?.(link);
        }
      }

      result.push(`<link rel="stylesheet" href="${escapeHtmlAttribute(href)}">`);
      if (criticalCss.length > 0) {
        result.push(`<style>${criticalCss}</style>`);
      }
    }

    if (templateThunk !== undefined) {
      result.push(templateThunk);
    }

    return result;
  }
}

export function createMethaneElementRenderer(
  options: MethaneSsrOptions = {},
): typeof MethaneElementRenderer {
  const resolved = resolveOptions(options);
  return class ConfiguredMethaneElementRenderer extends MethaneElementRenderer {
    static override defaultOptions = resolved;
  };
}

function buildRenderInfo(
  options: MethaneSsrOptions = {},
): { readonly renderInfo: Partial<MethaneRenderInfo>; readonly context: MethaneRenderContext } {
  const resolved = resolveOptions(options);
  const context = createRenderContext(resolved);
  const extraRenderers: ReadonlyArray<ElementRendererConstructor> = options.elementRenderers ?? [];
  const elementRenderers: ElementRendererConstructor[] = [
    ...extraRenderers,
    MethaneElementRenderer,
  ];

  const renderInfo: Partial<MethaneRenderInfo> = {
    elementRenderers,
    deferHydration: resolved.deferHydration,
    methaneSsr: context,
  };

  return { renderInfo, context };
}

/**
 * Consumes a `@lit-labs/ssr` `ThunkedRenderResult` into a standard Web `ReadableStream<string>`
 * with full backpressure support and zero `node:stream` dependency (WinterCG Edge compatible).
 */
export function renderToStringStream(
  template: unknown,
  options: MethaneSsrOptions = {},
): ReadableStream<string> {
  const { renderInfo } = buildRenderInfo(options);
  const thunked = renderThunked(template, renderInfo);
  const iterators: Array<Iterator<ThunkedRenderResult[number]>> = [thunked[Symbol.iterator]()];

  return new ReadableStream<string>({
    async pull(controller) {
      while (iterators.length > 0) {
        const current = iterators[iterators.length - 1]!;
        const next = current.next();
        if (next.done) {
          iterators.pop();
          continue;
        }

        let value: unknown = next.value;
        while (value !== undefined) {
          while (typeof value === 'function') {
            value = (value as () => unknown)();
          }
          if (value === undefined) {
            break;
          }
          if (typeof value === 'string') {
            if (value.length > 0) {
              controller.enqueue(value);
              return;
            }
            break;
          }
          if (
            Array.isArray(value) ||
            (typeof value === 'object' &&
              value !== null &&
              Symbol.iterator in value &&
              typeof (value as Iterable<unknown>)[Symbol.iterator] === 'function')
          ) {
            iterators.push((value as Iterable<ThunkedRenderResult[number]>)[Symbol.iterator]());
            break;
          }
          if (
            typeof value === 'object' &&
            value !== null &&
            'then' in value &&
            typeof (value as PromiseLike<unknown>).then === 'function'
          ) {
            value = await (value as PromiseLike<unknown>);
            continue;
          }
          throw new Error(`Unexpected value in @methane-ui/ssr render stream: ${String(value)}`);
        }
      }
      controller.close();
    },
  });
}

/**
 * Renders a Lit template to a WinterCG-compatible `ReadableStream<Uint8Array>`.
 */
export function renderToStream(
  template: unknown,
  options: MethaneSsrOptions = {},
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const stringStream = renderToStringStream(template, options);
  const reader = stringStream.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(value));
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

/**
 * Renders a Lit template to an HTML string, returning both the HTML and collected
 * ADR-008 stylesheet metadata (for asset emission or `<head>` preload hoisting).
 */
export async function renderWithMetadata(
  template: unknown,
  options: MethaneSsrOptions = {},
): Promise<SsrRenderResult> {
  const { renderInfo, context } = buildRenderInfo(options);
  const thunked = renderThunked(template, renderInfo);
  const chunks: string[] = [];

  async function drain(result: ThunkedRenderResult): Promise<void> {
    for (const entry of result) {
      let value: unknown = entry;
      while (typeof value === 'function') {
        value = (value as () => unknown)();
      }
      if (value === undefined) continue;
      if (typeof value === 'string') {
        chunks.push(value);
        continue;
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        'then' in value &&
        typeof (value as PromiseLike<unknown>).then === 'function'
      ) {
        value = await (value as PromiseLike<unknown>);
        while (typeof value === 'function') {
          value = (value as () => unknown)();
        }
      }
      if (typeof value === 'string') {
        chunks.push(value);
      } else if (Array.isArray(value)) {
        await drain(value as ThunkedRenderResult);
      }
    }
  }

  await drain(thunked);

  return {
    html: chunks.join(''),
    links: [...context.linksByHref.values()],
    criticalBytesByTag: { ...context.criticalBytesByTag },
  };
}

/**
 * Renders a Lit template to an HTML string with Declarative Shadow DOM.
 */
export async function renderToString(
  template: unknown,
  options: MethaneSsrOptions = {},
): Promise<string> {
  const result = await renderWithMetadata(template, options);
  return result.html;
}

/**
 * Creates a WinterCG `TransformStream<Uint8Array, Uint8Array>` pipeline that hoists
 * deduplicated stylesheet `<link>` tags into `<head>` and optionally injects a client
 * hydration module before `</body>`.
 */
export function createSsrTransformStream(
  options: CreateSsrTransformOptions = {},
): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffered = '';

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk) {
      buffered += decoder.decode(chunk, { stream: true });
    },
    flush(controller) {
      buffered += decoder.decode();
      let transformed = hoistStylesheetLinks(buffered, options);
      if (options.hydrationModuleUrl) {
        const scriptTag = `<script type="module" src="${escapeHtmlAttribute(options.hydrationModuleUrl)}"></script>`;
        if (/<\/body>/i.test(transformed)) {
          transformed = transformed.replace(/<\/body>/i, `${scriptTag}</body>`);
        } else {
          transformed += scriptTag;
        }
      }
      controller.enqueue(encoder.encode(transformed));
    },
  });
}
