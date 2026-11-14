import type {
  CollectedStylesheetLink,
  CriticalCssResolver,
  HoistStylesheetLinksOptions,
} from './types.js';

export const CRITICAL_SHELL_MAX_BYTES = 1024;
export const DEFAULT_CRITICAL_HOST_SHELL = ':host{display:block;box-sizing:border-box;}';

const CRITICAL_LAYOUT_PROPS = new Set([
  'display',
  'box-sizing',
  'contain',
  'position',
  'inline-size',
  'block-size',
  'min-inline-size',
  'min-block-size',
  'max-inline-size',
  'max-block-size',
  'vertical-align',
  'overflow',
  'overflow-inline',
  'overflow-block',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
]);

const textEncoder = new TextEncoder();

export function utf8ByteLength(value: string): number {
  return textEncoder.encode(value).byteLength;
}

/**
 * Deterministic, synchronous, WinterCG-safe 64-bit FNV-1a + Murmur-mixed hex digest
 * for content-hashed CSS asset URLs (`${assetBase}/${tag}.${hash}.css`).
 */
export function computeCssHash(css: string, length = 8): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < css.length; i += 1) {
    const code = css.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const combined = `${part1}${part2}`;
  return combined.slice(0, Math.max(4, Math.min(16, length)));
}

function readStyleEntryText(entry: unknown): string {
  if (entry == null) return '';
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) {
    return entry.map(readStyleEntryText).filter(Boolean).join('\n');
  }
  if (typeof entry === 'object' && 'cssText' in entry) {
    const text = (entry as { cssText?: unknown }).cssText;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

export function getElementCssText(ctor: unknown): string {
  if (ctor == null || typeof ctor !== 'function') return '';
  const record = ctor as { elementStyles?: unknown };
  return readStyleEntryText(record.elementStyles).trim();
}

function getExplicitCriticalStyles(ctor: unknown): string | null {
  if (ctor == null || typeof ctor !== 'function') return null;
  const record = ctor as { criticalStyles?: unknown };
  const text = readStyleEntryText(record.criticalStyles).trim();
  return text.length > 0 ? text : null;
}

/**
 * Extracts `< 1 KB` critical layout declarations from `:host` rules so
 * linked-mode DSD shadow roots paint with zero FOUC and zero CLS before the
 * external stylesheet finishes downloading.
 */
export function extractCriticalShell(fullCss: string): string {
  const trimmed = fullCss.trim();
  if (!trimmed) {
    return '';
  }

  const hostRules: string[] = [];
  const hostPattern = /(?:^|\})\s*(:host(?:\([^)]*\))?)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = hostPattern.exec(trimmed)) !== null) {
    const selector = match[1]?.trim();
    const body = match[2] ?? '';
    if (!selector) continue;

    const keptDecls: string[] = [];
    for (const rawDecl of body.split(';')) {
      const colonIdx = rawDecl.indexOf(':');
      if (colonIdx === -1) continue;
      const prop = rawDecl.slice(0, colonIdx).trim().toLowerCase();
      const val = rawDecl.slice(colonIdx + 1).trim();
      if (!val) continue;
      if (CRITICAL_LAYOUT_PROPS.has(prop)) {
        keptDecls.push(`${prop}:${val}`);
      }
    }

    if (selector === ':host' && !keptDecls.some((d) => d.startsWith('box-sizing:'))) {
      keptDecls.push('box-sizing:border-box');
    }

    if (keptDecls.length > 0) {
      const rule = `${selector}{${keptDecls.join(';')};}`;
      const candidate = [...hostRules, rule].join('');
      if (utf8ByteLength(candidate) < CRITICAL_SHELL_MAX_BYTES) {
        hostRules.push(rule);
      }
    }
  }

  if (hostRules.length > 0) {
    return hostRules.join('');
  }

  return DEFAULT_CRITICAL_HOST_SHELL;
}

export function capCriticalShell(css: string): string {
  const compact = css.replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  if (utf8ByteLength(compact) < CRITICAL_SHELL_MAX_BYTES) {
    return compact;
  }
  const fallback = extractCriticalShell(compact);
  if (utf8ByteLength(fallback) < CRITICAL_SHELL_MAX_BYTES) {
    return fallback;
  }
  return DEFAULT_CRITICAL_HOST_SHELL;
}

export function resolveCriticalCss(
  ctor: unknown,
  tagName: string,
  fullCss: string,
  override?: string | CriticalCssResolver,
): string {
  if (typeof override === 'function') {
    return capCriticalShell(override(tagName, fullCss));
  }
  if (typeof override === 'string') {
    return capCriticalShell(override);
  }
  const explicit = getExplicitCriticalStyles(ctor);
  if (explicit !== null) {
    return capCriticalShell(explicit);
  }
  return capCriticalShell(extractCriticalShell(fullCss));
}

export function formatStylesheetHref(assetBase: string, tagName: string, hash: string): string {
  const normalizedBase = assetBase.endsWith('/') ? assetBase.slice(0, -1) : assetBase;
  const safeTag = tagName.toLowerCase();
  return `${normalizedBase}/${safeTag}.${hash}.css`;
}

export function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const LINK_TAG_RE = /<link\b([^>]*?)>/gi;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
const HASHED_ASSET_RE = /\/([a-z0-9-]+)\.([a-f0-9]+)\.css(?:[?#].*)?$/i;

function parseTagAttributes(rawAttrs: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(rawAttrs)) !== null) {
    const name = m[1]?.toLowerCase();
    const val = m[2] ?? m[3] ?? m[4] ?? '';
    if (name) {
      attrs[name] = val;
    }
  }
  return attrs;
}

/**
 * Collects unique stylesheet `<link rel="stylesheet" href="...">` entries from rendered HTML
 * in document order.
 */
export function collectStylesheetLinks(html: string): CollectedStylesheetLink[] {
  const seen = new Set<string>();
  const links: CollectedStylesheetLink[] = [];
  LINK_TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = LINK_TAG_RE.exec(html)) !== null) {
    const rawAttrs = m[1] ?? '';
    const attrs = parseTagAttributes(rawAttrs);
    const rel = attrs['rel']?.toLowerCase();
    const href = attrs['href'];
    if (rel !== 'stylesheet' || !href || seen.has(href)) {
      continue;
    }
    seen.add(href);
    const assetMatch = HASHED_ASSET_RE.exec(href);
    links.push({
      tagName: assetMatch?.[1]?.toLowerCase() ?? '',
      href,
      hash: assetMatch?.[2] ?? null,
      rel,
    });
  }

  return links;
}

/**
 * Hoists deduplicated stylesheet links into `<head>` (as `rel="preload" as="style"` by default
 * so Shadow DOM `<link rel="stylesheet">` tags stay intact while browser fetches start immediately).
 */
export function hoistStylesheetLinks(
  html: string,
  options: HoistStylesheetLinksOptions = {},
): string {
  const links = collectStylesheetLinks(html);
  if (links.length === 0) {
    return html;
  }

  const headMode = options.headMode ?? 'preload';
  const nonceAttr = options.nonce ? ` nonce="${escapeHtmlAttribute(options.nonce)}"` : '';

  const headTags: string[] = [];
  for (const link of links) {
    const safeHref = escapeHtmlAttribute(link.href);
    // Skip if already hoisted into <head>
    const headCloseIdx = html.search(/<\/head>/i);
    const headSlice = headCloseIdx >= 0 ? html.slice(0, headCloseIdx) : '';
    if (headSlice.includes(safeHref)) {
      continue;
    }
    if (headMode === 'stylesheet') {
      headTags.push(`<link rel="stylesheet" href="${safeHref}"${nonceAttr}>`);
    } else {
      headTags.push(`<link rel="preload" as="style" href="${safeHref}"${nonceAttr}>`);
    }
  }

  let output = html;
  if (options.stripShadowLinks) {
    output = output.replace(LINK_TAG_RE, (full, rawAttrs: string) => {
      const attrs = parseTagAttributes(rawAttrs);
      return attrs['rel']?.toLowerCase() === 'stylesheet' ? '' : full;
    });
  }

  if (headTags.length === 0) {
    return output;
  }

  const block = headTags.join('');
  if (/<\/head>/i.test(output)) {
    return output.replace(/<\/head>/i, `${block}</head>`);
  }
  return `${block}${output}`;
}
