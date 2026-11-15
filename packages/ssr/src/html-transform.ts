import { renderWithMetadata } from './renderer.js';
import { hoistStylesheetLinks } from './styles.js';
import type { HoistStylesheetLinksOptions, MethaneSsrOptions, StylesheetLink } from './types.js';

export interface TransformHtmlDsdOptions extends MethaneSsrOptions {
  /** Only expand custom elements matching this tag prefix (default: `'mth-'`). Pass `''` for any custom element. */
  readonly tagPrefix?: string;
  /** Whether to hoist deduplicated stylesheet `<link>` preloads into `<head>`. Defaults to `true`. */
  readonly hoistLinks?: boolean;
  /** Options forwarded to `hoistStylesheetLinks` when `hoistLinks` is enabled. */
  readonly hoistOptions?: HoistStylesheetLinksOptions;
}

export interface TransformHtmlDsdResult {
  readonly html: string;
  readonly expandedTags: ReadonlyArray<string>;
  readonly links: ReadonlyArray<StylesheetLink>;
}

const SKIP_BLOCKS_RE =
  /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<textarea\b[^>]*>[\s\S]*?<\/textarea>|<template\b[^>]*>[\s\S]*?<\/template>/gi;

const CUSTOM_ELEMENT_OPEN_RE =
  /<([a-z][a-z0-9._-]*-[a-z0-9._-]*)((?:\s+(?:[^>"'\s/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?))*\s*)(\/?)>/gi;

function makeStaticTemplate(markup: string): {
  readonly _$litType$: 1;
  readonly strings: TemplateStringsArray;
  readonly values: readonly unknown[];
} {
  const strings = Object.assign([markup], { raw: [markup] }) as unknown as TemplateStringsArray;
  return {
    _$litType$: 1,
    strings,
    values: [],
  };
}

function findProtectedRanges(html: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  SKIP_BLOCKS_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SKIP_BLOCKS_RE.exec(html)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function isIndexInRanges(index: number, ranges: ReadonlyArray<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    if (index >= start && index < end) {
      return true;
    }
    if (start > index) {
      break;
    }
  }
  return false;
}

function hasExistingShadowTemplate(afterOpenTag: string): boolean {
  return /^\s*<template\b[^>]*\bshadowrootmode\s*=/i.test(afterOpenTag);
}

/**
 * Expands registered custom-element tags inside framework-rendered HTML (Next.js RSC,
 * Nuxt Nitro, SvelteKit, Astro, Angular SSR) into full Declarative Shadow DOM
 * `<template shadowrootmode="open">` markup using `@methane-ui/ssr`'s ADR-008 renderer,
 * preserving Light DOM children and optionally hoisting stylesheet `<link>` preloads into `<head>`.
 */
export async function transformHtmlDsd(
  html: string,
  options: TransformHtmlDsdOptions = {},
): Promise<TransformHtmlDsdResult> {
  const tagPrefix = options.tagPrefix ?? 'mth-';
  const hoistLinks = options.hoistLinks ?? true;
  const protectedRanges = findProtectedRanges(html);

  const matches: Array<{
    readonly start: number;
    readonly end: number;
    readonly tagName: string;
    readonly attrs: string;
    readonly selfClosing: boolean;
  }> = [];

  CUSTOM_ELEMENT_OPEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CUSTOM_ELEMENT_OPEN_RE.exec(html)) !== null) {
    const start = match.index;
    if (isIndexInRanges(start, protectedRanges)) {
      continue;
    }
    const tagName = (match[1] ?? '').toLowerCase();
    if (!tagName || (tagPrefix && !tagName.startsWith(tagPrefix))) {
      continue;
    }
    if (typeof customElements === 'undefined' || customElements.get(tagName) === undefined) {
      continue;
    }
    const end = start + match[0].length;
    if (hasExistingShadowTemplate(html.slice(end))) {
      continue;
    }
    matches.push({
      start,
      end,
      tagName,
      attrs: match[2] ?? '',
      selfClosing: match[3] === '/',
    });
  }

  if (matches.length === 0) {
    const finalHtml = hoistLinks ? hoistStylesheetLinks(html, options.hoistOptions) : html;
    return {
      html: finalHtml,
      expandedTags: [],
      links: [],
    };
  }

  const expandedTags = new Set<string>();
  const linksByHref = new Map<string, StylesheetLink>();
  let cursor = 0;
  const parts: string[] = [];

  for (const item of matches) {
    parts.push(html.slice(cursor, item.start));
    cursor = item.end;

    const syntheticMarkup = `<${item.tagName}${item.attrs}></${item.tagName}>`;
    const rendered = await renderWithMetadata(makeStaticTemplate(syntheticMarkup), {
      ...options,
      onStylesheetLink: (link) => {
        if (!linksByHref.has(link.href)) {
          linksByHref.set(link.href, link);
        }
        options.onStylesheetLink?.(link);
      },
    });

    for (const link of rendered.links) {
      if (!linksByHref.has(link.href)) {
        linksByHref.set(link.href, link);
      }
    }

    const openIdx = rendered.html.indexOf(`<${item.tagName}`);
    const closeToken = `</${item.tagName}>`;
    const closeIdx = rendered.html.lastIndexOf(closeToken);
    if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
      const openingWithShadow = rendered.html.slice(openIdx, closeIdx);
      parts.push(openingWithShadow);
      if (item.selfClosing) {
        parts.push(closeToken);
      }
      expandedTags.add(item.tagName);
    } else {
      parts.push(html.slice(item.start, item.end));
    }
  }

  parts.push(html.slice(cursor));
  let output = parts.join('');
  if (hoistLinks) {
    output = hoistStylesheetLinks(output, options.hoistOptions);
  }

  return {
    html: output,
    expandedTags: [...expandedTags],
    links: [...linksByHref.values()],
  };
}
