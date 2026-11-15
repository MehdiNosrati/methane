const ALLOWED_URL_PROTOCOLS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'https:',
  'http:',
  'mailto:',
  'tel:',
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
