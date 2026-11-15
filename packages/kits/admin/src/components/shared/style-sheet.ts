export function attachDynamicSheet(renderRoot: DocumentFragment | ShadowRoot): CSSStyleSheet | null {
  if (typeof CSSStyleSheet === 'undefined' || !('adoptedStyleSheets' in renderRoot)) {
    return null;
  }
  const sheet = new CSSStyleSheet();
  renderRoot.adoptedStyleSheets = [...renderRoot.adoptedStyleSheets, sheet];
  return sheet;
}

export function sanitizeCssNumber(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function escapeAttrValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
