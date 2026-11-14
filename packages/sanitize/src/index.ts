import createDOMPurify, {
  type Config as DomPurifyConfig,
  type DOMPurify,
  type WindowLike,
} from 'dompurify';

export interface TrustedTypePolicyLike {
  createHTML(input: string): unknown;
}

export interface SanitizeOptions {
  /** Force the DOMPurify fallback even when native Element.prototype.setHTML exists. */
  forceFallback?: boolean;
  /** Optional ownerDocument for creating DocumentFragments in non-global DOM environments (e.g. JSDOM). */
  ownerDocument?: Document;
  /** Optional Trusted Types policy forwarded to DOMPurify when Trusted Types are active. */
  trustedTypesPolicy?: TrustedTypePolicyLike | null;
}

export interface MarkdownSanitizeOptions extends SanitizeOptions {
  /** Allow raw HTML blocks/tags inside Markdown or streaming text. Defaults to `false`. */
  allowRawHtml?: boolean;
}

const ALLOWED_URL_PROTOCOLS: ReadonlySet<string> = new Set([
  'https:',
  'http:',
  'mailto:',
  'tel:',
]);

const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  'href',
  'src',
  'action',
  'formaction',
  'poster',
  'cite',
  'data',
  'background',
  'longdesc',
  'codebase',
]);

// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/;

/**
 * Strict URL allowlist per ADR-012:
 * Allows `https:`, `http:`, `mailto:`, `tel:`, and relative `/` (not `//`) or `#` (plus `./`, `../`).
 * Rejects `javascript:`, `data:`, `vbscript:`, protocol-relative `//`, and control characters.
 */
export function isSafeUrl(rawUrl: string): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) return false;
  if (CONTROL_CHAR_REGEX.test(trimmed)) return false;

  // Reject protocol-relative URLs (//evil.com, /\evil.com, \\evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\\\')) {
    return false;
  }

  // Allow fragment-only (#anchor) and relative paths (/path, ./path, ../path)
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_URL_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Returns `url` if it passes `isSafeUrl`, otherwise returns `fallback` (`'#'` by default).
 */
export function sanitizeUrl(url: string, fallback = '#'): string {
  return isSafeUrl(url) ? url.trim() : fallback;
}

/**
 * Escapes HTML special characters so untrusted text cannot be interpreted as markup.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isNativeSetHTMLSupported(): boolean {
  return (
    typeof Element !== 'undefined' &&
    typeof Element.prototype === 'object' &&
    'setHTML' in Element.prototype &&
    typeof (Element.prototype as { setHTML?: unknown }).setHTML === 'function'
  );
}

export function isTrustedTypesActive(win?: { trustedTypes?: unknown }): boolean {
  const scope = win ?? (typeof globalThis !== 'undefined' ? (globalThis as { trustedTypes?: unknown }) : undefined);
  return (
    scope !== undefined &&
    typeof scope.trustedTypes === 'object' &&
    scope.trustedTypes !== null &&
    'createPolicy' in scope.trustedTypes &&
    typeof (scope.trustedTypes as { createPolicy?: unknown }).createPolicy === 'function'
  );
}

const purifyCache = new WeakMap<object, DOMPurify>();

function resolveWindowLike(doc: Document): WindowLike {
  const win = doc.defaultView ?? globalThis;
  return win as unknown as WindowLike;
}

function getPurifyInstance(doc: Document): DOMPurify {
  const win = resolveWindowLike(doc);
  const cacheKey = (doc.defaultView ?? doc) as object;
  const existing = purifyCache.get(cacheKey);
  if (existing) return existing;

  const instance = createDOMPurify(win);
  instance.addHook('uponSanitizeAttribute', (node, event) => {
    const attrName = event.attrName.toLowerCase();
    if (URL_ATTRIBUTES.has(attrName)) {
      if (!isSafeUrl(event.attrValue)) {
        event.keepAttr = false;
        node.removeAttribute(event.attrName);
      }
      return;
    }
    if (attrName === 'srcset') {
      const candidates = event.attrValue
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const allSafe =
        candidates.length > 0 &&
        candidates.every((candidate) => {
          const urlPart = candidate.split(/\s+/)[0] ?? '';
          return isSafeUrl(urlPart);
        });
      if (!allSafe) {
        event.keepAttr = false;
        node.removeAttribute(event.attrName);
      }
    }
  });

  purifyCache.set(cacheKey, instance);
  return instance;
}

function createStrictPurifyConfig(
  doc: Document,
  options?: SanitizeOptions,
): DomPurifyConfig {
  const win = resolveWindowLike(doc);
  const trustedActive = isTrustedTypesActive(win as { trustedTypes?: unknown });
  const config: DomPurifyConfig = {
    USE_PROFILES: { html: true },
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'base', 'meta', 'link'],
    ADD_FORBID_CONTENTS: ['style', 'script'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/(?!\/|\\)|#|\.{1,2}\/)/i,
    RETURN_TRUSTED_TYPE: trustedActive,
  };
  if (options?.trustedTypesPolicy !== undefined) {
    config.TRUSTED_TYPES_POLICY = options.trustedTypesPolicy as DomPurifyConfig['TRUSTED_TYPES_POLICY'];
  }
  return config;
}

function scrubUnsafeUrlsInSubtree(root: ParentNode): void {
  const elements = root.querySelectorAll('*');
  for (const el of elements) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (URL_ATTRIBUTES.has(name) && !isSafeUrl(attr.value)) {
        el.removeAttribute(attr.name);
      } else if (name === 'srcset') {
        const candidates = attr.value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean);
        const allSafe =
          candidates.length > 0 &&
          candidates.every((c) => isSafeUrl(c.split(/\s+/)[0] ?? ''));
        if (!allSafe) {
          el.removeAttribute(attr.name);
        }
      }
    }
  }
}

/**
 * Parses untrusted HTML into a sanitized `DocumentFragment`.
 * Never round-trips sanitized nodes back through string `innerHTML`.
 */
export function parseSafeFragment(html: string, options?: SanitizeOptions): DocumentFragment {
  const doc = options?.ownerDocument ?? document;

  const docWithParse = Document as unknown as {
    parseHTML?: (input: string, opts?: unknown) => Document;
  };
  if (
    !options?.forceFallback &&
    isNativeSetHTMLSupported() &&
    typeof docWithParse.parseHTML === 'function'
  ) {
    const parsedDoc = docWithParse.parseHTML(html);
    const fragment = doc.createDocumentFragment();
    while (parsedDoc.body.firstChild) {
      fragment.appendChild(doc.adoptNode(parsedDoc.body.firstChild));
    }
    scrubUnsafeUrlsInSubtree(fragment);
    return fragment;
  }

  const purify = getPurifyInstance(doc);
  const config = createStrictPurifyConfig(doc, options);
  const rawFragment = purify.sanitize(html, {
    ...config,
    RETURN_DOM_FRAGMENT: true,
  });

  if (rawFragment.ownerDocument !== doc) {
    return doc.importNode(rawFragment, true);
  }
  return rawFragment;
}

/**
 * Returns a sanitized `TrustedHTML` (when Trusted Types are active) or sanitized HTML string
 * via DOMPurify configured for native Sanitizer API parity.
 */
export function sanitizeToTrustedHTML(
  html: string,
  options?: SanitizeOptions,
): string | { toString(): string } {
  const doc = options?.ownerDocument ?? document;
  const purify = getPurifyInstance(doc);
  const config = createStrictPurifyConfig(doc, options);
  if (config.RETURN_TRUSTED_TYPE) {
    return purify.sanitize(html, {
      ...config,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: true,
    });
  }
  return purify.sanitize(html, {
    ...config,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
  });
}

/**
 * Safely populates an Element or ShadowRoot with sanitized HTML.
 * Uses native `Element.prototype.setHTML` when available, otherwise falls back
 * to DOMPurify configured for native parity and transfers nodes directly via
 * `replaceChildren(fragment)` without re-serializing through `innerHTML`.
 */
export function safeSetHTML(
  target: Element | ShadowRoot,
  html: string,
  options?: SanitizeOptions,
): void {
  const targetWithNative = target as (Element | ShadowRoot) & {
    setHTML?: (input: string, opts?: unknown) => void;
  };

  if (
    !options?.forceFallback &&
    isNativeSetHTMLSupported() &&
    typeof targetWithNative.setHTML === 'function'
  ) {
    targetWithNative.setHTML(html);
    scrubUnsafeUrlsInSubtree(target);
    return;
  }

  const ownerDoc =
    options?.ownerDocument ??
    (target instanceof Node && target.ownerDocument ? target.ownerDocument : document);
  const fragment = parseSafeFragment(html, { ...options, ownerDocument: ownerDoc });
  target.replaceChildren(fragment);
}

/**
 * Renders lightweight markdown/streaming text safely.
 * Raw HTML defaults to OFF (`allowRawHtml: false`) per ADR-012: raw HTML tags are escaped
 * unless explicitly opted in, and all resulting HTML still passes through `parseSafeFragment`/`safeSetHTML`.
 */
export function renderMarkdownToSafeHTML(
  markdown: string,
  options?: MarkdownSanitizeOptions,
): string {
  const allowRawHtml = options?.allowRawHtml ?? false;
  const source = allowRawHtml ? markdown : escapeHtml(markdown);

  // Convert basic safe markdown links `[text](url)` and inline code/emphasis without allowing raw HTML injection.
  const withCode = source.replace(/`([^`\n]+)`/g, (_m, code: string) => `<code>${code}</code>`);
  const withLinks = withCode.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, label: string, rawUrl: string) => {
      if (!isSafeUrl(rawUrl)) {
        return label;
      }
      return `<a href="${escapeHtml(rawUrl.trim())}" rel="noopener noreferrer">${label}</a>`;
    },
  );
  const withStrong = withLinks.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  const withEm = withStrong.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  return withEm;
}

export function safeSetMarkdown(
  target: Element | ShadowRoot,
  markdown: string,
  options?: MarkdownSanitizeOptions,
): void {
  const html = renderMarkdownToSafeHTML(markdown, options);
  safeSetHTML(target, html, options);
}

export interface StreamSanitizer {
  readonly allowRawHtml: boolean;
  push(chunk: string): void;
  reset(): void;
  flushTo(target: Element | ShadowRoot, options?: SanitizeOptions): void;
  toFragment(options?: SanitizeOptions): DocumentFragment;
}

/**
 * Incremental stream sanitizer for AI/chat streaming chunks.
 * Raw HTML defaults to OFF (`allowRawHtml: false`).
 */
export function createStreamSanitizer(options?: MarkdownSanitizeOptions): StreamSanitizer {
  const allowRawHtml = options?.allowRawHtml ?? false;
  let buffer = '';

  return {
    allowRawHtml,
    push(chunk: string): void {
      buffer += chunk;
    },
    reset(): void {
      buffer = '';
    },
    flushTo(target: Element | ShadowRoot, flushOptions?: SanitizeOptions): void {
      safeSetMarkdown(target, buffer, { ...options, ...flushOptions, allowRawHtml });
    },
    toFragment(fragOptions?: SanitizeOptions): DocumentFragment {
      const html = renderMarkdownToSafeHTML(buffer, { ...options, allowRawHtml });
      return parseSafeFragment(html, { ...options, ...fragOptions });
    },
  };
}
